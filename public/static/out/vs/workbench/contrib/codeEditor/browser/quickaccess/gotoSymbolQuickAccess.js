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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/editor/common/editorService", "vs/platform/registry/common/platform", "vs/platform/quickinput/common/quickAccess", "vs/editor/contrib/quickAccess/gotoSymbolQuickAccess", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/actions/common/actions", "vs/base/common/fuzzyScorer", "vs/base/common/filters", "vs/base/common/errors"], function (require, exports, nls_1, quickInput_1, editorService_1, platform_1, quickAccess_1, gotoSymbolQuickAccess_1, configuration_1, lifecycle_1, async_1, cancellation_1, actions_1, fuzzyScorer_1, filters_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TableOfContentsProviderRegistry = exports.GotoSymbolQuickAccessProvider = void 0;
    let GotoSymbolQuickAccessProvider = class GotoSymbolQuickAccessProvider extends gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider {
        constructor(editorService, configurationService) {
            super({
                openSideBySideDirection: () => this.configuration.openSideBySideDirection
            });
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.onDidActiveTextEditorControlChange = this.editorService.onDidActiveEditorChange;
        }
        //#region DocumentSymbols (text editor required)
        provideWithTextEditor(editor, picker, token) {
            if (this.canPickFromTableOfContents()) {
                return this.doGetTableOfContentsPicks(picker);
            }
            return super.provideWithTextEditor(editor, picker, token);
        }
        get configuration() {
            const editorConfig = this.configurationService.getValue().workbench.editor;
            return {
                openEditorPinned: !editorConfig.enablePreviewFromQuickOpen,
                openSideBySideDirection: editorConfig.openSideBySideDirection
            };
        }
        get activeTextEditorControl() {
            return this.editorService.activeTextEditorControl;
        }
        gotoLocation(editor, options) {
            // Check for sideBySide use
            if ((options.keyMods.ctrlCmd || options.forceSideBySide) && this.editorService.activeEditor) {
                this.editorService.openEditor(this.editorService.activeEditor, {
                    selection: options.range,
                    pinned: options.keyMods.alt || this.configuration.openEditorPinned,
                    preserveFocus: options.preserveFocus
                }, editorService_1.SIDE_GROUP);
            }
            // Otherwise let parent handle it
            else {
                super.gotoLocation(editor, options);
            }
        }
        async getSymbolPicks(model, filter, options, disposables, token) {
            // If the registry does not know the model, we wait for as long as
            // the registry knows it. This helps in cases where a language
            // registry was not activated yet for providing any symbols.
            // To not wait forever, we eventually timeout though.
            const result = await Promise.race([
                this.waitForLanguageSymbolRegistry(model, disposables),
                async_1.timeout(GotoSymbolQuickAccessProvider.SYMBOL_PICKS_TIMEOUT)
            ]);
            if (!result || token.isCancellationRequested) {
                return [];
            }
            return this.doGetSymbolPicks(this.getDocumentSymbols(model, true, token), fuzzyScorer_1.prepareQuery(filter), options, token);
        }
        addDecorations(editor, range) {
            super.addDecorations(editor, range);
        }
        clearDecorations(editor) {
            super.clearDecorations(editor);
        }
        //#endregion
        provideWithoutTextEditor(picker) {
            if (this.canPickFromTableOfContents()) {
                return this.doGetTableOfContentsPicks(picker);
            }
            return super.provideWithoutTextEditor(picker);
        }
        canPickFromTableOfContents() {
            return this.editorService.activeEditorPane ? exports.TableOfContentsProviderRegistry.has(this.editorService.activeEditorPane.getId()) : false;
        }
        doGetTableOfContentsPicks(picker) {
            const pane = this.editorService.activeEditorPane;
            if (!pane) {
                return lifecycle_1.Disposable.None;
            }
            const provider = exports.TableOfContentsProviderRegistry.get(pane.getId());
            const cts = new cancellation_1.CancellationTokenSource();
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(lifecycle_1.toDisposable(() => cts.dispose(true)));
            picker.busy = true;
            provider.provideTableOfContents(pane, cts.token).then(entries => {
                picker.busy = false;
                if (cts.token.isCancellationRequested || !entries || entries.length === 0) {
                    return;
                }
                const items = entries.map((entry, idx) => {
                    return {
                        kind: 0 /* File */,
                        index: idx,
                        score: 0,
                        label: entry.icon ? `$(${entry.icon.id}) ${entry.label}` : entry.label,
                        ariaLabel: entry.detail ? `${entry.label}, ${entry.detail}` : entry.label,
                        detail: entry.detail,
                        description: entry.description,
                    };
                });
                disposables.add(picker.onDidAccept(() => {
                    var _a;
                    picker.hide();
                    const [entry] = picker.selectedItems;
                    (_a = entries[entry.index]) === null || _a === void 0 ? void 0 : _a.pick();
                }));
                const updatePickerItems = () => {
                    const filteredItems = items.filter(item => {
                        if (picker.value === '@') {
                            // default, no filtering, scoring...
                            item.score = 0;
                            item.highlights = undefined;
                            return true;
                        }
                        const score = filters_1.fuzzyScore(picker.value, picker.value.toLowerCase(), 1 /*@-character*/, item.label, item.label.toLowerCase(), 0, true);
                        if (!score) {
                            return false;
                        }
                        item.score = score[1];
                        item.highlights = { label: filters_1.createMatches(score) };
                        return true;
                    });
                    if (filteredItems.length === 0) {
                        const label = nls_1.localize('empty', 'No matching entries');
                        picker.items = [{ label, index: -1, kind: 14 /* String */ }];
                        picker.ariaLabel = label;
                    }
                    else {
                        picker.items = filteredItems;
                    }
                };
                updatePickerItems();
                disposables.add(picker.onDidChangeValue(updatePickerItems));
                let ignoreFirstActiveEvent = true;
                disposables.add(picker.onDidChangeActive(() => {
                    var _a;
                    const [entry] = picker.activeItems;
                    if (entry && entries[entry.index]) {
                        if (!ignoreFirstActiveEvent) {
                            (_a = entries[entry.index]) === null || _a === void 0 ? void 0 : _a.preview();
                        }
                        ignoreFirstActiveEvent = false;
                    }
                }));
            }).catch(err => {
                errors_1.onUnexpectedError(err);
                picker.hide();
            });
            return disposables;
        }
    };
    //#endregion
    //#region public methods to use this picker from other pickers
    GotoSymbolQuickAccessProvider.SYMBOL_PICKS_TIMEOUT = 8000;
    GotoSymbolQuickAccessProvider = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, configuration_1.IConfigurationService)
    ], GotoSymbolQuickAccessProvider);
    exports.GotoSymbolQuickAccessProvider = GotoSymbolQuickAccessProvider;
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: GotoSymbolQuickAccessProvider,
        prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX,
        contextKey: 'inFileSymbolsPicker',
        placeholder: nls_1.localize('gotoSymbolQuickAccessPlaceholder', "Type the name of a symbol to go to."),
        helpEntries: [
            { description: nls_1.localize('gotoSymbolQuickAccess', "Go to Symbol in Editor"), prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX, needsEditor: true },
            { description: nls_1.localize('gotoSymbolByCategoryQuickAccess', "Go to Symbol in Editor by Category"), prefix: gotoSymbolQuickAccess_1.AbstractGotoSymbolQuickAccessProvider.PREFIX_BY_CATEGORY, needsEditor: true }
        ]
    });
    actions_1.registerAction2(class GotoSymbolAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.gotoSymbol',
                title: {
                    value: nls_1.localize('gotoSymbol', "Go to Symbol in Editor..."),
                    original: 'Go to Symbol in Editor...'
                },
                f1: true,
                keybinding: {
                    when: undefined,
                    weight: 200 /* WorkbenchContrib */,
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 45 /* KEY_O */
                }
            });
        }
        run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(GotoSymbolQuickAccessProvider.PREFIX);
        }
    });
    class ProviderRegistry {
        constructor() {
            this._provider = new Map();
        }
        register(type, provider) {
            this._provider.set(type, provider);
            return lifecycle_1.toDisposable(() => {
                if (this._provider.get(type) === provider) {
                    this._provider.delete(type);
                }
            });
        }
        get(type) {
            return this._provider.get(type);
        }
        has(type) {
            return this._provider.has(type);
        }
    }
    exports.TableOfContentsProviderRegistry = new ProviderRegistry();
});
//#endregion
//# __sourceMappingURL=gotoSymbolQuickAccess.js.map