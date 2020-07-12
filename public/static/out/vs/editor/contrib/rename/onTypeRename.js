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
define(["require", "exports", "vs/nls", "vs/editor/browser/editorExtensions", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/base/common/cancellation", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/base/common/async", "vs/editor/common/model/textModel", "vs/platform/contextkey/common/contextkey", "vs/editor/common/editorContextKeys", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/base/common/errors", "vs/base/common/strings", "vs/css!./media/onTypeRename"], function (require, exports, nls, editorExtensions_1, arrays, lifecycle_1, position_1, cancellation_1, range_1, modes_1, async_1, textModel_1, contextkey_1, editorContextKeys_1, uri_1, codeEditorService_1, errors_1, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getOnTypeRenameRanges = exports.OnTypeRenameAction = exports.OnTypeRenameContribution = exports.CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE = void 0;
    exports.CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE = new contextkey_1.RawContextKey('onTypeRenameInputVisible', false);
    let OnTypeRenameContribution = class OnTypeRenameContribution extends lifecycle_1.Disposable {
        constructor(editor, contextKeyService) {
            super();
            this._editor = editor;
            this._enabled = this._editor.getOption(73 /* renameOnType */);
            this._visibleContextKey = exports.CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE.bindTo(contextKeyService);
            this._currentRequest = null;
            this._currentDecorations = [];
            this._stopPattern = /^\s/;
            this._ignoreChangeEvent = false;
            this._updateMirrors = this._register(new async_1.RunOnceScheduler(() => this._doUpdateMirrors(), 0));
            this._register(this._editor.onDidChangeModel((e) => {
                this.stopAll();
                this.run();
            }));
            this._register(this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(73 /* renameOnType */)) {
                    this._enabled = this._editor.getOption(73 /* renameOnType */);
                    this.stopAll();
                    this.run();
                }
            }));
            this._register(this._editor.onDidChangeCursorPosition((e) => {
                // no regions, run
                if (this._currentDecorations.length === 0) {
                    this.run(e.position);
                }
                // has cached regions, don't run
                if (!this._editor.hasModel()) {
                    return;
                }
                if (this._currentDecorations.length === 0) {
                    return;
                }
                const model = this._editor.getModel();
                const currentRanges = this._currentDecorations.map(decId => model.getDecorationRange(decId));
                // just moving cursor around, don't run again
                if (range_1.Range.containsPosition(currentRanges[0], e.position)) {
                    return;
                }
                // moving cursor out of primary region, run
                this.run(e.position);
            }));
            this._register(modes_1.OnTypeRenameProviderRegistry.onDidChange(() => {
                this.run();
            }));
            this._register(this._editor.onDidChangeModelContent((e) => {
                if (this._ignoreChangeEvent) {
                    return;
                }
                if (!this._editor.hasModel()) {
                    return;
                }
                if (this._currentDecorations.length === 0) {
                    // nothing to do
                    return;
                }
                if (e.isUndoing || e.isRedoing) {
                    return;
                }
                if (e.changes[0] && this._stopPattern.test(e.changes[0].text)) {
                    this.stopAll();
                    return;
                }
                this._updateMirrors.schedule();
            }));
        }
        static get(editor) {
            return editor.getContribution(OnTypeRenameContribution.ID);
        }
        _doUpdateMirrors() {
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._currentDecorations.length === 0) {
                // nothing to do
                return;
            }
            const model = this._editor.getModel();
            const currentRanges = this._currentDecorations.map(decId => model.getDecorationRange(decId));
            const referenceRange = currentRanges[0];
            if (referenceRange.startLineNumber !== referenceRange.endLineNumber) {
                return this.stopAll();
            }
            const referenceValue = model.getValueInRange(referenceRange);
            if (this._stopPattern.test(referenceValue)) {
                return this.stopAll();
            }
            let edits = [];
            for (let i = 1, len = currentRanges.length; i < len; i++) {
                const mirrorRange = currentRanges[i];
                if (mirrorRange.startLineNumber !== mirrorRange.endLineNumber) {
                    edits.push({
                        range: mirrorRange,
                        text: referenceValue
                    });
                }
                else {
                    let oldValue = model.getValueInRange(mirrorRange);
                    let newValue = referenceValue;
                    let rangeStartColumn = mirrorRange.startColumn;
                    let rangeEndColumn = mirrorRange.endColumn;
                    const commonPrefixLength = strings.commonPrefixLength(oldValue, newValue);
                    rangeStartColumn += commonPrefixLength;
                    oldValue = oldValue.substr(commonPrefixLength);
                    newValue = newValue.substr(commonPrefixLength);
                    const commonSuffixLength = strings.commonSuffixLength(oldValue, newValue);
                    rangeEndColumn -= commonSuffixLength;
                    oldValue = oldValue.substr(0, oldValue.length - commonSuffixLength);
                    newValue = newValue.substr(0, newValue.length - commonSuffixLength);
                    if (rangeStartColumn !== rangeEndColumn || newValue.length !== 0) {
                        edits.push({
                            range: new range_1.Range(mirrorRange.startLineNumber, rangeStartColumn, mirrorRange.endLineNumber, rangeEndColumn),
                            text: newValue
                        });
                    }
                }
            }
            if (edits.length === 0) {
                return;
            }
            try {
                this._ignoreChangeEvent = true;
                const prevEditOperationType = this._editor._getViewModel().getPrevEditOperationType();
                this._editor.executeEdits('onTypeRename', edits);
                this._editor._getViewModel().setPrevEditOperationType(prevEditOperationType);
            }
            finally {
                this._ignoreChangeEvent = false;
            }
        }
        dispose() {
            super.dispose();
            this.stopAll();
        }
        stopAll() {
            this._visibleContextKey.set(false);
            this._currentDecorations = this._editor.deltaDecorations(this._currentDecorations, []);
        }
        async run(position = this._editor.getPosition(), force = false) {
            if (!position) {
                return;
            }
            if (!this._enabled && !force) {
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            if (this._currentRequest) {
                this._currentRequest.cancel();
                this._currentRequest = null;
            }
            const model = this._editor.getModel();
            this._currentRequest = async_1.createCancelablePromise(token => getOnTypeRenameRanges(model, position, token));
            try {
                const response = await this._currentRequest;
                let ranges = [];
                if (response === null || response === void 0 ? void 0 : response.ranges) {
                    ranges = response.ranges;
                }
                if (response === null || response === void 0 ? void 0 : response.stopPattern) {
                    this._stopPattern = response.stopPattern;
                }
                let foundReferenceRange = false;
                for (let i = 0, len = ranges.length; i < len; i++) {
                    if (range_1.Range.containsPosition(ranges[i], position)) {
                        foundReferenceRange = true;
                        if (i !== 0) {
                            const referenceRange = ranges[i];
                            ranges.splice(i, 1);
                            ranges.unshift(referenceRange);
                        }
                        break;
                    }
                }
                if (!foundReferenceRange) {
                    // Cannot do on type rename if the ranges are not where the cursor is...
                    this.stopAll();
                    return;
                }
                const decorations = ranges.map(range => ({ range: range, options: OnTypeRenameContribution.DECORATION }));
                this._visibleContextKey.set(true);
                this._currentDecorations = this._editor.deltaDecorations(this._currentDecorations, decorations);
            }
            catch (err) {
                errors_1.onUnexpectedError(err);
                this.stopAll();
            }
        }
    };
    OnTypeRenameContribution.ID = 'editor.contrib.onTypeRename';
    OnTypeRenameContribution.DECORATION = textModel_1.ModelDecorationOptions.register({
        stickiness: 0 /* AlwaysGrowsWhenTypingAtEdges */,
        className: 'on-type-rename-decoration'
    });
    OnTypeRenameContribution = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], OnTypeRenameContribution);
    exports.OnTypeRenameContribution = OnTypeRenameContribution;
    class OnTypeRenameAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.onTypeRename',
                label: nls.localize('onTypeRename.label', "On Type Rename Symbol"),
                alias: 'On Type Rename Symbol',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasRenameProvider),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 60 /* F2 */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        runCommand(accessor, args) {
            const editorService = accessor.get(codeEditorService_1.ICodeEditorService);
            const [uri, pos] = Array.isArray(args) && args || [undefined, undefined];
            if (uri_1.URI.isUri(uri) && position_1.Position.isIPosition(pos)) {
                return editorService.openCodeEditor({ resource: uri }, editorService.getActiveCodeEditor()).then(editor => {
                    if (!editor) {
                        return;
                    }
                    editor.setPosition(pos);
                    editor.invokeWithinContext(accessor => {
                        this.reportTelemetry(accessor, editor);
                        return this.run(accessor, editor);
                    });
                }, errors_1.onUnexpectedError);
            }
            return super.runCommand(accessor, args);
        }
        run(accessor, editor) {
            const controller = OnTypeRenameContribution.get(editor);
            if (controller) {
                return Promise.resolve(controller.run(editor.getPosition(), true));
            }
            return Promise.resolve();
        }
    }
    exports.OnTypeRenameAction = OnTypeRenameAction;
    const OnTypeRenameCommand = editorExtensions_1.EditorCommand.bindToContribution(OnTypeRenameContribution.get);
    editorExtensions_1.registerEditorCommand(new OnTypeRenameCommand({
        id: 'cancelOnTypeRenameInput',
        precondition: exports.CONTEXT_ONTYPE_RENAME_INPUT_VISIBLE,
        handler: x => x.stopAll(),
        kbOpts: {
            kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            weight: 100 /* EditorContrib */ + 99,
            primary: 9 /* Escape */,
            secondary: [1024 /* Shift */ | 9 /* Escape */]
        }
    }));
    function getOnTypeRenameRanges(model, position, token) {
        const orderedByScore = modes_1.OnTypeRenameProviderRegistry.ordered(model);
        // in order of score ask the occurrences provider
        // until someone response with a good result
        // (good = none empty array)
        return async_1.first(orderedByScore.map(provider => () => {
            return Promise.resolve(provider.provideOnTypeRenameRanges(model, position, token)).then((ranges) => {
                if (!ranges) {
                    return undefined;
                }
                return {
                    ranges,
                    stopPattern: provider.stopPattern
                };
            }, (err) => {
                errors_1.onUnexpectedExternalError(err);
                return undefined;
            });
        }), result => !!result && arrays.isNonEmptyArray(result === null || result === void 0 ? void 0 : result.ranges));
    }
    exports.getOnTypeRenameRanges = getOnTypeRenameRanges;
    editorExtensions_1.registerModelAndPositionCommand('_executeRenameOnTypeProvider', (model, position) => getOnTypeRenameRanges(model, position, cancellation_1.CancellationToken.None));
    editorExtensions_1.registerEditorContribution(OnTypeRenameContribution.ID, OnTypeRenameContribution);
    editorExtensions_1.registerEditorAction(OnTypeRenameAction);
});
//# __sourceMappingURL=onTypeRename.js.map