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
define(["require", "exports", "vs/base/common/actions", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/searchEditor/browser/searchEditorInput", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/search/browser/searchIcons", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/platform/workspace/common/workspace", "vs/workbench/services/history/common/history", "vs/base/common/network", "vs/base/common/types", "vs/workbench/contrib/searchEditor/browser/constants", "vs/css!./media/searchEditor"], function (require, exports, actions_1, editorBrowser_1, nls_1, configuration_1, instantiation_1, label_1, telemetry_1, searchEditorInput_1, searchEditorSerialization_1, editorService_1, searchIcons_1, configurationResolver_1, workspace_1, history_1, network_1, types_1, constants_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createEditorFromSearchResult = exports.openNewSearchEditor = exports.OpenSearchEditorAction = exports.selectAllSearchEditorMatchesCommand = exports.modifySearchEditorContextLinesCommand = exports.toggleSearchEditorContextLinesCommand = exports.toggleSearchEditorRegexCommand = exports.toggleSearchEditorWholeWordCommand = exports.toggleSearchEditorCaseSensitiveCommand = void 0;
    exports.toggleSearchEditorCaseSensitiveCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleCaseSensitive();
        }
    };
    exports.toggleSearchEditorWholeWordCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleWholeWords();
        }
    };
    exports.toggleSearchEditorRegexCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleRegex();
        }
    };
    exports.toggleSearchEditorContextLinesCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleContextLines();
        }
    };
    exports.modifySearchEditorContextLinesCommand = (accessor, increase) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.modifyContextLines(increase);
        }
    };
    exports.selectAllSearchEditorMatchesCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.focusAllResults();
        }
    };
    let OpenSearchEditorAction = class OpenSearchEditorAction extends actions_1.Action {
        constructor(id, label, instantiationService) {
            super(id, label, searchIcons_1.searchNewEditorIcon.classNames);
            this.instantiationService = instantiationService;
        }
        update() {
            // pass
        }
        get enabled() {
            return true;
        }
        async run() {
            await this.instantiationService.invokeFunction(exports.openNewSearchEditor);
        }
    };
    OpenSearchEditorAction.ID = constants_1.OpenNewEditorCommandId;
    OpenSearchEditorAction.LABEL = nls_1.localize('search.openNewEditor', "Open New Search Editor");
    OpenSearchEditorAction = __decorate([
        __param(2, instantiation_1.IInstantiationService)
    ], OpenSearchEditorAction);
    exports.OpenSearchEditorAction = OpenSearchEditorAction;
    exports.openNewSearchEditor = async (accessor, _args = {}, toSide = false) => {
        var _a, _b;
        const editorService = accessor.get(editorService_1.IEditorService);
        const telemetryService = accessor.get(telemetry_1.ITelemetryService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const configurationResolverService = accessor.get(configurationResolver_1.IConfigurationResolverService);
        const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
        const historyService = accessor.get(history_1.IHistoryService);
        const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
        const lastActiveWorkspaceRoot = activeWorkspaceRootUri ? types_1.withNullAsUndefined(workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri)) : undefined;
        const activeEditorControl = editorService.activeTextEditorControl;
        let activeModel;
        let selected = '';
        if (activeEditorControl) {
            if (editorBrowser_1.isDiffEditor(activeEditorControl)) {
                if (activeEditorControl.getOriginalEditor().hasTextFocus()) {
                    activeModel = activeEditorControl.getOriginalEditor();
                }
                else {
                    activeModel = activeEditorControl.getModifiedEditor();
                }
            }
            else {
                activeModel = activeEditorControl;
            }
            const selection = activeModel === null || activeModel === void 0 ? void 0 : activeModel.getSelection();
            selected = (_b = (selection && ((_a = activeModel === null || activeModel === void 0 ? void 0 : activeModel.getModel()) === null || _a === void 0 ? void 0 : _a.getValueInRange(selection)))) !== null && _b !== void 0 ? _b : '';
        }
        else {
            if (editorService.activeEditor instanceof searchEditorInput_1.SearchEditorInput) {
                const active = editorService.activeEditorPane;
                selected = active.getSelected();
            }
        }
        telemetryService.publicLog2('searchEditor/openNewSearchEditor');
        const args = { query: selected };
        Object.entries(_args).forEach(([name, value]) => {
            args[name] = (typeof value === 'string') ? configurationResolverService.resolve(lastActiveWorkspaceRoot, value) : value;
        });
        const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { config: args, text: '' });
        const editor = await editorService.openEditor(input, { pinned: true }, toSide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
        const searchOnType = configurationService.getValue('search').searchOnType;
        if (args.triggerSearch === true ||
            args.triggerSearch !== false && searchOnType && args.query) {
            editor.triggerSearch({ focusResults: args.focusResults !== false });
        }
    };
    exports.createEditorFromSearchResult = async (accessor, searchResult, rawIncludePattern, rawExcludePattern) => {
        if (!searchResult.query) {
            console.error('Expected searchResult.query to be defined. Got', searchResult);
            return;
        }
        const editorService = accessor.get(editorService_1.IEditorService);
        const telemetryService = accessor.get(telemetry_1.ITelemetryService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const labelService = accessor.get(label_1.ILabelService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        telemetryService.publicLog2('searchEditor/createEditorFromSearchResult');
        const labelFormatter = (uri) => labelService.getUriLabel(uri, { relative: true });
        const { text, matchRanges, config } = searchEditorSerialization_1.serializeSearchResultForEditor(searchResult, rawIncludePattern, rawExcludePattern, 0, labelFormatter);
        const contextLines = configurationService.getValue('search').searchEditor.defaultNumberOfContextLines;
        if (searchResult.isDirty || contextLines === 0 || contextLines === null) {
            const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { text, config });
            await editorService.openEditor(input, { pinned: true });
            input.setMatchRanges(matchRanges);
        }
        else {
            const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { text: '', config: Object.assign(Object.assign({}, config), { contextLines }) });
            const editor = await editorService.openEditor(input, { pinned: true });
            editor.triggerSearch({ focusResults: true });
        }
    };
});
//# __sourceMappingURL=searchEditorActions.js.map