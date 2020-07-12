/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/browser/core/editorState", "vs/editor/browser/editorExtensions", "vs/editor/common/modes", "vs/editor/contrib/codelens/codelens", "vs/editor/contrib/codelens/codelensWidget", "vs/platform/commands/common/commands", "vs/platform/notification/common/notification", "vs/editor/contrib/codelens/codeLensCache", "vs/base/browser/dom", "vs/base/common/hash", "vs/platform/quickinput/common/quickInput", "vs/nls", "vs/editor/common/editorContextKeys"], function (require, exports, async_1, errors_1, lifecycle_1, editorState_1, editorExtensions_1, modes_1, codelens_1, codelensWidget_1, commands_1, notification_1, codeLensCache_1, dom, hash_1, quickInput_1, nls_1, editorContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeLensContribution = void 0;
    let CodeLensContribution = class CodeLensContribution {
        constructor(_editor, _commandService, _notificationService, _codeLensCache) {
            this._editor = _editor;
            this._commandService = _commandService;
            this._notificationService = _notificationService;
            this._codeLensCache = _codeLensCache;
            this._globalToDispose = new lifecycle_1.DisposableStore();
            this._localToDispose = new lifecycle_1.DisposableStore();
            this._lenses = [];
            this._oldCodeLensModels = new lifecycle_1.DisposableStore();
            this._modelChangeCounter = 0;
            this._isEnabled = this._editor.getOption(11 /* codeLens */);
            this._globalToDispose.add(this._editor.onDidChangeModel(() => this._onModelChange()));
            this._globalToDispose.add(this._editor.onDidChangeModelLanguage(() => this._onModelChange()));
            this._globalToDispose.add(this._editor.onDidChangeConfiguration(() => {
                const prevIsEnabled = this._isEnabled;
                this._isEnabled = this._editor.getOption(11 /* codeLens */);
                if (prevIsEnabled !== this._isEnabled) {
                    this._onModelChange();
                }
            }));
            this._globalToDispose.add(modes_1.CodeLensProviderRegistry.onDidChange(this._onModelChange, this));
            this._globalToDispose.add(this._editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(36 /* fontInfo */)) {
                    this._updateLensStyle();
                }
            }));
            this._onModelChange();
            this._styleClassName = '_' + hash_1.hash(this._editor.getId()).toString(16);
            this._styleElement = dom.createStyleSheet(dom.isInShadowDOM(this._editor.getContainerDomNode())
                ? this._editor.getContainerDomNode()
                : undefined);
            this._updateLensStyle();
        }
        dispose() {
            this._localDispose();
            this._globalToDispose.dispose();
            this._oldCodeLensModels.dispose();
            lifecycle_1.dispose(this._currentCodeLensModel);
        }
        _updateLensStyle() {
            const options = this._editor.getOptions();
            const fontInfo = options.get(36 /* fontInfo */);
            const lineHeight = options.get(51 /* lineHeight */);
            const height = Math.round(lineHeight * 1.1);
            const fontSize = Math.round(fontInfo.fontSize * 0.9);
            const newStyle = `
		.monaco-editor .codelens-decoration.${this._styleClassName} { height: ${height}px; line-height: ${lineHeight}px; font-size: ${fontSize}px; padding-right: ${Math.round(fontInfo.fontSize * 0.45)}px;}
		.monaco-editor .codelens-decoration.${this._styleClassName} > a > .codicon { line-height: ${lineHeight}px; font-size: ${fontSize}px; }
		`;
            this._styleElement.innerHTML = newStyle;
        }
        _localDispose() {
            if (this._currentFindCodeLensSymbolsPromise) {
                this._currentFindCodeLensSymbolsPromise.cancel();
                this._currentFindCodeLensSymbolsPromise = undefined;
                this._modelChangeCounter++;
            }
            if (this._currentResolveCodeLensSymbolsPromise) {
                this._currentResolveCodeLensSymbolsPromise.cancel();
                this._currentResolveCodeLensSymbolsPromise = undefined;
            }
            this._localToDispose.clear();
            this._oldCodeLensModels.clear();
            lifecycle_1.dispose(this._currentCodeLensModel);
        }
        _onModelChange() {
            this._localDispose();
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            if (!this._isEnabled) {
                return;
            }
            const cachedLenses = this._codeLensCache.get(model);
            if (cachedLenses) {
                this._renderCodeLensSymbols(cachedLenses);
            }
            if (!modes_1.CodeLensProviderRegistry.has(model)) {
                // no provider -> return but check with
                // cached lenses. they expire after 30 seconds
                if (cachedLenses) {
                    this._localToDispose.add(async_1.disposableTimeout(() => {
                        const cachedLensesNow = this._codeLensCache.get(model);
                        if (cachedLenses === cachedLensesNow) {
                            this._codeLensCache.delete(model);
                            this._onModelChange();
                        }
                    }, 30 * 1000));
                }
                return;
            }
            for (const provider of modes_1.CodeLensProviderRegistry.all(model)) {
                if (typeof provider.onDidChange === 'function') {
                    let registration = provider.onDidChange(() => scheduler.schedule());
                    this._localToDispose.add(registration);
                }
            }
            const detectVisibleLenses = this._detectVisibleLenses = new async_1.RunOnceScheduler(() => this._onViewportChanged(), 250);
            const scheduler = new async_1.RunOnceScheduler(() => {
                const counterValue = ++this._modelChangeCounter;
                if (this._currentFindCodeLensSymbolsPromise) {
                    this._currentFindCodeLensSymbolsPromise.cancel();
                }
                this._currentFindCodeLensSymbolsPromise = async_1.createCancelablePromise(token => codelens_1.getCodeLensData(model, token));
                this._currentFindCodeLensSymbolsPromise.then(result => {
                    if (counterValue === this._modelChangeCounter) { // only the last one wins
                        if (this._currentCodeLensModel) {
                            this._oldCodeLensModels.add(this._currentCodeLensModel);
                        }
                        this._currentCodeLensModel = result;
                        // cache model to reduce flicker
                        this._codeLensCache.put(model, result);
                        // render lenses
                        this._renderCodeLensSymbols(result);
                        detectVisibleLenses.schedule();
                    }
                }, errors_1.onUnexpectedError);
            }, 250);
            this._localToDispose.add(scheduler);
            this._localToDispose.add(detectVisibleLenses);
            this._localToDispose.add(this._editor.onDidChangeModelContent(() => {
                this._editor.changeDecorations(decorationsAccessor => {
                    this._editor.changeViewZones(viewZonesAccessor => {
                        let toDispose = [];
                        let lastLensLineNumber = -1;
                        this._lenses.forEach((lens) => {
                            if (!lens.isValid() || lastLensLineNumber === lens.getLineNumber()) {
                                // invalid -> lens collapsed, attach range doesn't exist anymore
                                // line_number -> lenses should never be on the same line
                                toDispose.push(lens);
                            }
                            else {
                                lens.update(viewZonesAccessor);
                                lastLensLineNumber = lens.getLineNumber();
                            }
                        });
                        let helper = new codelensWidget_1.CodeLensHelper();
                        toDispose.forEach((l) => {
                            l.dispose(helper, viewZonesAccessor);
                            this._lenses.splice(this._lenses.indexOf(l), 1);
                        });
                        helper.commit(decorationsAccessor);
                    });
                });
                // Compute new `visible` code lenses
                detectVisibleLenses.schedule();
                // Ask for all references again
                scheduler.schedule();
            }));
            this._localToDispose.add(this._editor.onDidScrollChange(e => {
                if (e.scrollTopChanged && this._lenses.length > 0) {
                    detectVisibleLenses.schedule();
                }
            }));
            this._localToDispose.add(this._editor.onDidLayoutChange(() => {
                detectVisibleLenses.schedule();
            }));
            this._localToDispose.add(lifecycle_1.toDisposable(() => {
                if (this._editor.getModel()) {
                    const scrollState = editorState_1.StableEditorScrollState.capture(this._editor);
                    this._editor.changeDecorations(decorationsAccessor => {
                        this._editor.changeViewZones(viewZonesAccessor => {
                            this._disposeAllLenses(decorationsAccessor, viewZonesAccessor);
                        });
                    });
                    scrollState.restore(this._editor);
                }
                else {
                    // No accessors available
                    this._disposeAllLenses(undefined, undefined);
                }
            }));
            this._localToDispose.add(this._editor.onMouseUp(e => {
                if (e.target.type !== 9 /* CONTENT_WIDGET */) {
                    return;
                }
                let target = e.target.element;
                if ((target === null || target === void 0 ? void 0 : target.tagName) === 'SPAN') {
                    target = target.parentElement;
                }
                if ((target === null || target === void 0 ? void 0 : target.tagName) === 'A') {
                    for (const lens of this._lenses) {
                        let command = lens.getCommand(target);
                        if (command) {
                            this._commandService.executeCommand(command.id, ...(command.arguments || [])).catch(err => this._notificationService.error(err));
                            break;
                        }
                    }
                }
            }));
            scheduler.schedule();
        }
        _disposeAllLenses(decChangeAccessor, viewZoneChangeAccessor) {
            const helper = new codelensWidget_1.CodeLensHelper();
            for (const lens of this._lenses) {
                lens.dispose(helper, viewZoneChangeAccessor);
            }
            if (decChangeAccessor) {
                helper.commit(decChangeAccessor);
            }
            this._lenses = [];
        }
        _renderCodeLensSymbols(symbols) {
            if (!this._editor.hasModel()) {
                return;
            }
            let maxLineNumber = this._editor.getModel().getLineCount();
            let groups = [];
            let lastGroup;
            for (let symbol of symbols.lenses) {
                let line = symbol.symbol.range.startLineNumber;
                if (line < 1 || line > maxLineNumber) {
                    // invalid code lens
                    continue;
                }
                else if (lastGroup && lastGroup[lastGroup.length - 1].symbol.range.startLineNumber === line) {
                    // on same line as previous
                    lastGroup.push(symbol);
                }
                else {
                    // on later line as previous
                    lastGroup = [symbol];
                    groups.push(lastGroup);
                }
            }
            const scrollState = editorState_1.StableEditorScrollState.capture(this._editor);
            this._editor.changeDecorations(decorationsAccessor => {
                this._editor.changeViewZones(viewZoneAccessor => {
                    const helper = new codelensWidget_1.CodeLensHelper();
                    let codeLensIndex = 0;
                    let groupsIndex = 0;
                    while (groupsIndex < groups.length && codeLensIndex < this._lenses.length) {
                        let symbolsLineNumber = groups[groupsIndex][0].symbol.range.startLineNumber;
                        let codeLensLineNumber = this._lenses[codeLensIndex].getLineNumber();
                        if (codeLensLineNumber < symbolsLineNumber) {
                            this._lenses[codeLensIndex].dispose(helper, viewZoneAccessor);
                            this._lenses.splice(codeLensIndex, 1);
                        }
                        else if (codeLensLineNumber === symbolsLineNumber) {
                            this._lenses[codeLensIndex].updateCodeLensSymbols(groups[groupsIndex], helper);
                            groupsIndex++;
                            codeLensIndex++;
                        }
                        else {
                            this._lenses.splice(codeLensIndex, 0, new codelensWidget_1.CodeLensWidget(groups[groupsIndex], this._editor, this._styleClassName, helper, viewZoneAccessor, () => this._detectVisibleLenses && this._detectVisibleLenses.schedule()));
                            codeLensIndex++;
                            groupsIndex++;
                        }
                    }
                    // Delete extra code lenses
                    while (codeLensIndex < this._lenses.length) {
                        this._lenses[codeLensIndex].dispose(helper, viewZoneAccessor);
                        this._lenses.splice(codeLensIndex, 1);
                    }
                    // Create extra symbols
                    while (groupsIndex < groups.length) {
                        this._lenses.push(new codelensWidget_1.CodeLensWidget(groups[groupsIndex], this._editor, this._styleClassName, helper, viewZoneAccessor, () => this._detectVisibleLenses && this._detectVisibleLenses.schedule()));
                        groupsIndex++;
                    }
                    helper.commit(decorationsAccessor);
                });
            });
            scrollState.restore(this._editor);
        }
        _onViewportChanged() {
            if (this._currentResolveCodeLensSymbolsPromise) {
                this._currentResolveCodeLensSymbolsPromise.cancel();
                this._currentResolveCodeLensSymbolsPromise = undefined;
            }
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            const toResolve = [];
            const lenses = [];
            this._lenses.forEach((lens) => {
                const request = lens.computeIfNecessary(model);
                if (request) {
                    toResolve.push(request);
                    lenses.push(lens);
                }
            });
            if (toResolve.length === 0) {
                return;
            }
            const resolvePromise = async_1.createCancelablePromise(token => {
                const promises = toResolve.map((request, i) => {
                    const resolvedSymbols = new Array(request.length);
                    const promises = request.map((request, i) => {
                        if (!request.symbol.command && typeof request.provider.resolveCodeLens === 'function') {
                            return Promise.resolve(request.provider.resolveCodeLens(model, request.symbol, token)).then(symbol => {
                                resolvedSymbols[i] = symbol;
                            }, errors_1.onUnexpectedExternalError);
                        }
                        else {
                            resolvedSymbols[i] = request.symbol;
                            return Promise.resolve(undefined);
                        }
                    });
                    return Promise.all(promises).then(() => {
                        if (!token.isCancellationRequested && !lenses[i].isDisposed()) {
                            lenses[i].updateCommands(resolvedSymbols);
                        }
                    });
                });
                return Promise.all(promises);
            });
            this._currentResolveCodeLensSymbolsPromise = resolvePromise;
            this._currentResolveCodeLensSymbolsPromise.then(() => {
                if (this._currentCodeLensModel) { // update the cached state with new resolved items
                    this._codeLensCache.put(model, this._currentCodeLensModel);
                }
                this._oldCodeLensModels.clear(); // dispose old models once we have updated the UI with the current model
                if (resolvePromise === this._currentResolveCodeLensSymbolsPromise) {
                    this._currentResolveCodeLensSymbolsPromise = undefined;
                }
            }, err => {
                errors_1.onUnexpectedError(err); // can also be cancellation!
                if (resolvePromise === this._currentResolveCodeLensSymbolsPromise) {
                    this._currentResolveCodeLensSymbolsPromise = undefined;
                }
            });
        }
        getLenses() {
            return this._lenses;
        }
    };
    CodeLensContribution.ID = 'css.editor.codeLens';
    CodeLensContribution = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, notification_1.INotificationService),
        __param(3, codeLensCache_1.ICodeLensCache)
    ], CodeLensContribution);
    exports.CodeLensContribution = CodeLensContribution;
    editorExtensions_1.registerEditorContribution(CodeLensContribution.ID, CodeLensContribution);
    editorExtensions_1.registerEditorAction(class ShowLensesInCurrentLine extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'codelens.showLensesInCurrentLine',
                precondition: editorContextKeys_1.EditorContextKeys.hasCodeLensProvider,
                label: nls_1.localize('showLensOnLine', "Show CodeLens Commands For Current Line"),
                alias: 'Show CodeLens Commands For Current Line',
            });
        }
        async run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const commandService = accessor.get(commands_1.ICommandService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const lineNumber = editor.getSelection().positionLineNumber;
            const codelensController = editor.getContribution(CodeLensContribution.ID);
            const items = [];
            for (let lens of codelensController.getLenses()) {
                if (lens.getLineNumber() === lineNumber) {
                    for (let item of lens.getItems()) {
                        const { command } = item.symbol;
                        if (command) {
                            items.push({
                                label: command.title,
                                command: command
                            });
                        }
                    }
                }
            }
            if (items.length === 0) {
                // We dont want an empty picker
                return;
            }
            const item = await quickInputService.pick(items, { canPickMany: false });
            if (!item) {
                // Nothing picked
                return;
            }
            try {
                await commandService.executeCommand(item.command.id, ...(item.command.arguments || []));
            }
            catch (err) {
                notificationService.error(err);
            }
        }
    });
});
//# __sourceMappingURL=codelensController.js.map