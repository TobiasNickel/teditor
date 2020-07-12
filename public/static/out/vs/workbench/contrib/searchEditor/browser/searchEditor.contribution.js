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
define(["require", "exports", "vs/base/common/objects", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/contrib/find/findModel", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/common/views", "vs/workbench/contrib/search/browser/searchActions", "vs/workbench/contrib/search/browser/searchIcons", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/searchEditor/browser/constants", "vs/workbench/contrib/searchEditor/browser/searchEditor", "vs/workbench/contrib/searchEditor/browser/searchEditorActions", "vs/workbench/contrib/searchEditor/browser/searchEditorInput", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/services/editor/common/editorService"], function (require, exports, objects, resources_1, uri_1, findModel_1, nls_1, actions_1, commands_1, contextkey_1, descriptors_1, instantiation_1, keybindingsRegistry_1, platform_1, telemetry_1, editor_1, contributions_1, editor_2, views_1, searchActions_1, searchIcons_1, SearchConstants, SearchEditorConstants, searchEditor_1, searchEditorActions_1, searchEditorInput_1, searchEditorSerialization_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const OpenInEditorCommandId = 'search.action.openInEditor';
    const OpenNewEditorToSideCommandId = 'search.action.openNewEditorToSide';
    const FocusQueryEditorWidgetCommandId = 'search.action.focusQueryEditorWidget';
    const ToggleSearchEditorCaseSensitiveCommandId = 'toggleSearchEditorCaseSensitive';
    const ToggleSearchEditorWholeWordCommandId = 'toggleSearchEditorWholeWord';
    const ToggleSearchEditorRegexCommandId = 'toggleSearchEditorRegex';
    const ToggleSearchEditorContextLinesCommandId = 'toggleSearchEditorContextLines';
    const IncreaseSearchEditorContextLinesCommandId = 'increaseSearchEditorContextLines';
    const DecreaseSearchEditorContextLinesCommandId = 'decreaseSearchEditorContextLines';
    const RerunSearchEditorSearchCommandId = 'rerunSearchEditorSearch';
    const CleanSearchEditorStateCommandId = 'cleanSearchEditorState';
    const SelectAllSearchEditorMatchesCommandId = 'selectAllSearchEditorMatches';
    //#region Editor Descriptior
    platform_1.Registry.as(editor_1.Extensions.Editors).registerEditor(editor_1.EditorDescriptor.create(searchEditor_1.SearchEditor, searchEditor_1.SearchEditor.ID, nls_1.localize('searchEditor', "Search Editor")), [
        new descriptors_1.SyncDescriptor(searchEditorInput_1.SearchEditorInput)
    ]);
    //#endregion
    //#region Startup Contribution
    let SearchEditorContribution = class SearchEditorContribution {
        constructor(editorService, instantiationService, telemetryService, contextKeyService) {
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.telemetryService = telemetryService;
            this.contextKeyService = contextKeyService;
            this.editorService.overrideOpenEditor({
                open: (editor, options, group) => {
                    const resource = editor.resource;
                    if (!resource) {
                        return undefined;
                    }
                    if (resources_1.extname(resource) !== searchEditorInput_1.SEARCH_EDITOR_EXT) {
                        return undefined;
                    }
                    if (editor instanceof searchEditorInput_1.SearchEditorInput && group.isOpened(editor)) {
                        return undefined;
                    }
                    this.telemetryService.publicLog2('searchEditor/openSavedSearchEditor');
                    return {
                        override: (async () => {
                            const { config } = await instantiationService.invokeFunction(searchEditorSerialization_1.parseSavedSearchEditor, resource);
                            const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { backingUri: resource, config });
                            return editorService.openEditor(input, Object.assign(Object.assign({}, options), { override: false }), group);
                        })()
                    };
                }
            });
        }
    };
    SearchEditorContribution = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, contextkey_1.IContextKeyService)
    ], SearchEditorContribution);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(SearchEditorContribution, 1 /* Starting */);
    class SearchEditorInputFactory {
        canSerialize(input) {
            return !input.isDisposed();
        }
        serialize(input) {
            let modelUri = undefined;
            if (input.modelUri.path || input.modelUri.fragment) {
                modelUri = input.modelUri.toString();
            }
            if (!modelUri) {
                return undefined;
            }
            const config = input.config;
            const dirty = input.isDirty();
            const matchRanges = input.getMatchRanges();
            const backingUri = input.backingUri;
            return JSON.stringify({ modelUri: modelUri.toString(), dirty, config, name: input.getName(), matchRanges, backingUri: backingUri === null || backingUri === void 0 ? void 0 : backingUri.toString() });
        }
        deserialize(instantiationService, serializedEditorInput) {
            const { modelUri, dirty, config, matchRanges, backingUri } = JSON.parse(serializedEditorInput);
            if (config && (config.query !== undefined) && (modelUri !== undefined)) {
                const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { config, modelUri: uri_1.URI.parse(modelUri), backingUri: backingUri ? uri_1.URI.parse(backingUri) : undefined });
                input.setDirty(dirty);
                input.setMatchRanges(matchRanges);
                return input;
            }
            return undefined;
        }
    }
    platform_1.Registry.as(editor_2.Extensions.EditorInputFactories).registerEditorInputFactory(searchEditorInput_1.SearchEditorInput.ID, SearchEditorInputFactory);
    //#endregion
    //#region Commands
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(objects.assign({
        id: ToggleSearchEditorCaseSensitiveCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor, SearchConstants.SearchInputBoxFocusedKey),
        handler: searchEditorActions_1.toggleSearchEditorCaseSensitiveCommand
    }, findModel_1.ToggleCaseSensitiveKeybinding));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(objects.assign({
        id: ToggleSearchEditorWholeWordCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor, SearchConstants.SearchInputBoxFocusedKey),
        handler: searchEditorActions_1.toggleSearchEditorWholeWordCommand
    }, findModel_1.ToggleWholeWordKeybinding));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(objects.assign({
        id: ToggleSearchEditorRegexCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor, SearchConstants.SearchInputBoxFocusedKey),
        handler: searchEditorActions_1.toggleSearchEditorRegexCommand
    }, findModel_1.ToggleRegexKeybinding));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: ToggleSearchEditorContextLinesCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor),
        handler: searchEditorActions_1.toggleSearchEditorContextLinesCommand,
        primary: 512 /* Alt */ | 42 /* KEY_L */,
        mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 42 /* KEY_L */ }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: IncreaseSearchEditorContextLinesCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor),
        handler: (accessor) => searchEditorActions_1.modifySearchEditorContextLinesCommand(accessor, true),
        primary: 512 /* Alt */ | 81 /* US_EQUAL */
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: DecreaseSearchEditorContextLinesCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor),
        handler: (accessor) => searchEditorActions_1.modifySearchEditorContextLinesCommand(accessor, false),
        primary: 512 /* Alt */ | 83 /* US_MINUS */
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: SelectAllSearchEditorMatchesCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor),
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 42 /* KEY_L */,
        handler: searchEditorActions_1.selectAllSearchEditorMatchesCommand
    });
    commands_1.CommandsRegistry.registerCommand(CleanSearchEditorStateCommandId, (accessor) => {
        const activeEditorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
        if (activeEditorPane instanceof searchEditor_1.SearchEditor) {
            activeEditorPane.cleanState();
        }
    });
    //#endregion
    //#region Actions
    const category = nls_1.localize('search', "Search Editor");
    const openArgDescription = {
        description: 'Open a new search editor. Arguments passed can include variables like ${relativeFileDirname}.',
        args: [{
                name: 'Open new Search Editor args',
                schema: {
                    properties: {
                        query: { type: 'string' },
                        includes: { type: 'string' },
                        excludes: { type: 'string' },
                        contextLines: { type: 'number' },
                        wholeWord: { type: 'boolean' },
                        caseSensitive: { type: 'boolean' },
                        regexp: { type: 'boolean' },
                        useIgnores: { type: 'boolean' },
                        showIncludesExcludes: { type: 'boolean' },
                        triggerSearch: { type: 'boolean' },
                        focusResults: { type: 'boolean' },
                    }
                }
            }]
    };
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SearchEditorConstants.OpenNewEditorCommandId,
                title: nls_1.localize('search.openNewSearchEditor', "Open new Search Editor"),
                category,
                f1: true,
                description: openArgDescription
            });
        }
        async run(accessor, args) {
            await accessor.get(instantiation_1.IInstantiationService).invokeFunction(searchEditorActions_1.openNewSearchEditor, args);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenNewEditorToSideCommandId,
                title: nls_1.localize('search.openNewEditorToSide', "Open new Search Editor to the Side"),
                category,
                f1: true,
                description: openArgDescription
            });
        }
        async run(accessor, args) {
            await accessor.get(instantiation_1.IInstantiationService).invokeFunction(searchEditorActions_1.openNewSearchEditor, args, true);
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenInEditorCommandId,
                title: nls_1.localize('search.openResultsInEditor', "Open Results in Editor"),
                category,
                f1: true,
                keybinding: {
                    primary: 512 /* Alt */ | 3 /* Enter */,
                    when: contextkey_1.ContextKeyExpr.and(SearchConstants.HasSearchResults, SearchConstants.SearchViewFocusedKey),
                    weight: 200 /* WorkbenchContrib */,
                    mac: {
                        primary: 2048 /* CtrlCmd */ | 3 /* Enter */
                    }
                },
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const searchView = searchActions_1.getSearchView(viewsService);
            if (searchView) {
                await instantiationService.invokeFunction(searchEditorActions_1.createEditorFromSearchResult, searchView.searchResult, searchView.searchIncludePattern.getValue(), searchView.searchExcludePattern.getValue());
            }
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: RerunSearchEditorSearchCommandId,
                title: nls_1.localize('search.rerunSearchInEditor', "Search Again"),
                category,
                keybinding: {
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 48 /* KEY_R */,
                    when: SearchEditorConstants.InSearchEditor,
                    weight: 100 /* EditorContrib */
                },
                icon: searchIcons_1.searchRefreshIcon,
                menu: [{
                        id: actions_1.MenuId.EditorTitle,
                        group: 'navigation',
                        when: editor_2.ActiveEditorContext.isEqualTo(SearchEditorConstants.SearchEditorID)
                    },
                    {
                        id: actions_1.MenuId.CommandPalette,
                        when: editor_2.ActiveEditorContext.isEqualTo(SearchEditorConstants.SearchEditorID)
                    }]
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const input = editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                editorService.activeEditorPane.triggerSearch({ resetCursor: false });
            }
        }
    });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: FocusQueryEditorWidgetCommandId,
                title: nls_1.localize('search.action.focusQueryEditorWidget', "Focus Search Editor Input"),
                category,
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: editor_2.ActiveEditorContext.isEqualTo(SearchEditorConstants.SearchEditorID)
                },
                keybinding: {
                    primary: 9 /* Escape */,
                    when: SearchEditorConstants.InSearchEditor,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const input = editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                editorService.activeEditorPane.focusSearchInput();
            }
        }
    });
});
//#endregion
//# __sourceMappingURL=searchEditor.contribution.js.map