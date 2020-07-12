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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/resources", "vs/editor/contrib/find/findModel", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/platform/registry/common/platform", "vs/workbench/browser/quickaccess", "vs/workbench/common/actions", "vs/workbench/common/contributions", "vs/workbench/common/views", "vs/workbench/contrib/files/browser/files", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/search/browser/replaceContributions", "vs/workbench/contrib/search/browser/searchActions", "vs/workbench/contrib/search/browser/searchView", "vs/workbench/contrib/search/browser/searchWidget", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/searchEditor/browser/constants", "vs/workbench/contrib/search/common/search", "vs/workbench/contrib/search/common/searchHistoryService", "vs/workbench/contrib/search/common/searchModel", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/search/common/search", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/workspace/common/workspace", "vs/base/common/types", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/quickinput/common/quickAccess", "vs/workbench/contrib/search/browser/symbolsQuickAccess", "vs/workbench/contrib/search/browser/anythingQuickAccess", "vs/platform/quickinput/common/quickInput", "vs/editor/contrib/quickAccess/gotoLineQuickAccess", "vs/workbench/contrib/codeEditor/browser/quickaccess/gotoSymbolQuickAccess", "vs/workbench/contrib/search/browser/searchIcons"], function (require, exports, actions_1, arrays_1, errors_1, objects, platform, resources_1, findModel_1, nls, actions_2, commands_1, configuration_1, configurationRegistry_1, contextkey_1, files_1, extensions_1, instantiation_1, keybindingsRegistry_1, listService_1, platform_1, quickaccess_1, actions_3, contributions_1, views_1, files_2, files_3, replaceContributions_1, searchActions_1, searchView_1, searchWidget_1, Constants, SearchEditorConstants, search_1, searchHistoryService_1, searchModel_1, editorService_1, search_2, viewlet_1, workspace_1, types_1, descriptors_1, viewPaneContainer_1, quickAccess_1, symbolsQuickAccess_1, anythingQuickAccess_1, quickInput_1, gotoLineQuickAccess_1, gotoSymbolQuickAccess_1, searchIcons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    extensions_1.registerSingleton(searchModel_1.ISearchWorkbenchService, searchModel_1.SearchWorkbenchService, true);
    extensions_1.registerSingleton(searchHistoryService_1.ISearchHistoryService, searchHistoryService_1.SearchHistoryService, true);
    replaceContributions_1.registerContributions();
    searchWidget_1.registerContributions();
    const category = nls.localize('search', "Search");
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.search.toggleQueryDetails',
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.or(Constants.SearchViewFocusedKey, SearchEditorConstants.InSearchEditor),
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 40 /* KEY_J */,
        handler: accessor => {
            const contextService = accessor.get(contextkey_1.IContextKeyService).getContext(document.activeElement);
            if (contextService.getValue(SearchEditorConstants.InSearchEditor.serialize())) {
                accessor.get(editorService_1.IEditorService).activeEditorPane.toggleQueryDetails();
            }
            else if (contextService.getValue(Constants.SearchViewFocusedKey.serialize())) {
                const searchView = searchActions_1.getSearchView(accessor.get(views_1.IViewsService));
                types_1.assertIsDefined(searchView).toggleQueryDetails();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.searchEditor.deleteResultBlock',
        weight: 200 /* WorkbenchContrib */,
        when: SearchEditorConstants.InSearchEditor,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 1 /* Backspace */,
        handler: accessor => {
            const contextService = accessor.get(contextkey_1.IContextKeyService).getContext(document.activeElement);
            if (contextService.getValue(SearchEditorConstants.InSearchEditor.serialize())) {
                accessor.get(editorService_1.IEditorService).activeEditorPane.deleteResultBlock();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.FocusSearchFromResults,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.FirstMatchFocusKey),
        primary: 2048 /* CtrlCmd */ | 16 /* UpArrow */,
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(views_1.IViewsService));
            if (searchView) {
                searchView.focusPreviousInputBox();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.OpenMatchToSide,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.FileMatchOrMatchFocusKey),
        primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
        mac: {
            primary: 256 /* WinCtrl */ | 3 /* Enter */
        },
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(views_1.IViewsService));
            if (searchView) {
                const tree = searchView.getControl();
                searchView.open(tree.getFocus()[0], false, true, true);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.CancelActionId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, listService_1.WorkbenchListFocusContextKey),
        primary: 9 /* Escape */,
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(views_1.IViewsService));
            if (searchView) {
                searchView.cancelSearch();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.RemoveActionId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.FileMatchOrMatchFocusKey),
        primary: 20 /* Delete */,
        mac: {
            primary: 2048 /* CtrlCmd */ | 1 /* Backspace */,
        },
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(views_1.IViewsService));
            if (searchView) {
                const tree = searchView.getControl();
                accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.RemoveAction, tree, tree.getFocus()[0]).run();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.ReplaceActionId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.ReplaceActiveKey, Constants.MatchFocusKey),
        primary: 1024 /* Shift */ | 2048 /* CtrlCmd */ | 22 /* KEY_1 */,
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(views_1.IViewsService));
            if (searchView) {
                const tree = searchView.getControl();
                accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.ReplaceAction, tree, tree.getFocus()[0], searchView).run();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.ReplaceAllInFileActionId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.ReplaceActiveKey, Constants.FileFocusKey),
        primary: 1024 /* Shift */ | 2048 /* CtrlCmd */ | 22 /* KEY_1 */,
        secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 3 /* Enter */],
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(views_1.IViewsService));
            if (searchView) {
                const tree = searchView.getControl();
                accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.ReplaceAllAction, searchView, tree.getFocus()[0]).run();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.ReplaceAllInFolderActionId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.ReplaceActiveKey, Constants.FolderFocusKey),
        primary: 1024 /* Shift */ | 2048 /* CtrlCmd */ | 22 /* KEY_1 */,
        secondary: [2048 /* CtrlCmd */ | 1024 /* Shift */ | 3 /* Enter */],
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(views_1.IViewsService));
            if (searchView) {
                const tree = searchView.getControl();
                accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.ReplaceAllInFolderAction, tree, tree.getFocus()[0]).run();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.CloseReplaceWidgetActionId,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.ReplaceInputBoxFocusedKey),
        primary: 9 /* Escape */,
        handler: (accessor, args) => {
            accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.CloseReplaceAction, Constants.CloseReplaceWidgetActionId, '').run();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: searchActions_1.FocusNextInputAction.ID,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor, Constants.InputBoxFocusedKey), contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.InputBoxFocusedKey)),
        primary: 2048 /* CtrlCmd */ | 18 /* DownArrow */,
        handler: (accessor, args) => {
            accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.FocusNextInputAction, searchActions_1.FocusNextInputAction.ID, '').run();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: searchActions_1.FocusPreviousInputAction.ID,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(SearchEditorConstants.InSearchEditor, Constants.InputBoxFocusedKey), contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.InputBoxFocusedKey, Constants.SearchInputBoxFocusedKey.toNegated())),
        primary: 2048 /* CtrlCmd */ | 16 /* UpArrow */,
        handler: (accessor, args) => {
            accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.FocusPreviousInputAction, searchActions_1.FocusPreviousInputAction.ID, '').run();
        }
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.SearchContext, {
        command: {
            id: Constants.ReplaceActionId,
            title: searchActions_1.ReplaceAction.LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(Constants.ReplaceActiveKey, Constants.MatchFocusKey),
        group: 'search',
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.SearchContext, {
        command: {
            id: Constants.ReplaceAllInFolderActionId,
            title: searchActions_1.ReplaceAllInFolderAction.LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(Constants.ReplaceActiveKey, Constants.FolderFocusKey),
        group: 'search',
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.SearchContext, {
        command: {
            id: Constants.ReplaceAllInFileActionId,
            title: searchActions_1.ReplaceAllAction.LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(Constants.ReplaceActiveKey, Constants.FileFocusKey),
        group: 'search',
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.SearchContext, {
        command: {
            id: Constants.RemoveActionId,
            title: searchActions_1.RemoveAction.LABEL
        },
        when: Constants.FileMatchOrMatchFocusKey,
        group: 'search',
        order: 2
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.CopyMatchCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: Constants.FileMatchOrMatchFocusKey,
        primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
        handler: searchActions_1.copyMatchCommand
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.SearchContext, {
        command: {
            id: Constants.CopyMatchCommandId,
            title: nls.localize('copyMatchLabel', "Copy")
        },
        when: Constants.FileMatchOrMatchFocusKey,
        group: 'search_2',
        order: 1
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.CopyPathCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: Constants.FileMatchOrFolderMatchWithResourceFocusKey,
        primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 33 /* KEY_C */,
        win: {
            primary: 1024 /* Shift */ | 512 /* Alt */ | 33 /* KEY_C */
        },
        handler: searchActions_1.copyPathCommand
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.SearchContext, {
        command: {
            id: Constants.CopyPathCommandId,
            title: nls.localize('copyPathLabel', "Copy Path")
        },
        when: Constants.FileMatchOrFolderMatchWithResourceFocusKey,
        group: 'search_2',
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.SearchContext, {
        command: {
            id: Constants.CopyAllCommandId,
            title: nls.localize('copyAllLabel', "Copy All")
        },
        when: Constants.HasSearchResults,
        group: 'search_2',
        order: 3
    });
    commands_1.CommandsRegistry.registerCommand({
        id: Constants.CopyAllCommandId,
        handler: searchActions_1.copyAllCommand
    });
    commands_1.CommandsRegistry.registerCommand({
        id: Constants.ClearSearchHistoryCommandId,
        handler: searchActions_1.clearHistoryCommand
    });
    commands_1.CommandsRegistry.registerCommand({
        id: Constants.RevealInSideBarForSearchResults,
        handler: (accessor, args) => {
            const viewletService = accessor.get(viewlet_1.IViewletService);
            const explorerService = accessor.get(files_3.IExplorerService);
            const contextService = accessor.get(workspace_1.IWorkspaceContextService);
            const searchView = searchActions_1.getSearchView(accessor.get(views_1.IViewsService));
            if (!searchView) {
                return;
            }
            let fileMatch;
            if (!(args instanceof searchModel_1.FileMatch)) {
                args = searchView.getControl().getFocus()[0];
            }
            if (args instanceof searchModel_1.FileMatch) {
                fileMatch = args;
            }
            else {
                return;
            }
            viewletService.openViewlet(files_3.VIEWLET_ID, false).then((viewlet) => {
                if (!viewlet) {
                    return;
                }
                const explorerViewContainer = viewlet.getViewPaneContainer();
                const uri = fileMatch.resource;
                if (uri && contextService.isInsideWorkspace(uri)) {
                    const explorerView = explorerViewContainer.getExplorerView();
                    explorerView.setExpanded(true);
                    explorerService.select(uri, true).then(() => explorerView.focus(), errors_1.onUnexpectedError);
                }
            });
        }
    });
    const RevealInSideBarForSearchResultsCommand = {
        id: Constants.RevealInSideBarForSearchResults,
        title: nls.localize('revealInSideBar', "Reveal in Side Bar")
    };
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.SearchContext, {
        command: RevealInSideBarForSearchResultsCommand,
        when: contextkey_1.ContextKeyExpr.and(Constants.FileFocusKey, Constants.HasSearchResults),
        group: 'search_3',
        order: 1
    });
    const clearSearchHistoryLabel = nls.localize('clearSearchHistoryLabel', "Clear Search History");
    const ClearSearchHistoryCommand = {
        id: Constants.ClearSearchHistoryCommandId,
        title: clearSearchHistoryLabel,
        category
    };
    actions_2.MenuRegistry.addCommand(ClearSearchHistoryCommand);
    commands_1.CommandsRegistry.registerCommand({
        id: Constants.FocusSearchListCommandID,
        handler: searchActions_1.focusSearchListCommand
    });
    const focusSearchListCommandLabel = nls.localize('focusSearchListCommandLabel', "Focus List");
    const FocusSearchListCommand = {
        id: Constants.FocusSearchListCommandID,
        title: focusSearchListCommandLabel,
        category
    };
    actions_2.MenuRegistry.addCommand(FocusSearchListCommand);
    const searchInFolderCommand = (accessor, resource) => {
        const listService = accessor.get(listService_1.IListService);
        const fileService = accessor.get(files_1.IFileService);
        const viewsService = accessor.get(views_1.IViewsService);
        const resources = files_2.getMultiSelectedResources(resource, listService, accessor.get(editorService_1.IEditorService), accessor.get(files_3.IExplorerService));
        return searchActions_1.openSearchView(viewsService, true).then(searchView => {
            if (resources && resources.length && searchView) {
                return fileService.resolveAll(resources.map(resource => ({ resource }))).then(results => {
                    const folders = [];
                    results.forEach(result => {
                        if (result.success && result.stat) {
                            folders.push(result.stat.isDirectory ? result.stat.resource : resources_1.dirname(result.stat.resource));
                        }
                    });
                    searchView.searchInFolders(arrays_1.distinct(folders, folder => folder.toString()));
                });
            }
            return undefined;
        });
    };
    const FIND_IN_FOLDER_ID = 'filesExplorer.findInFolder';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: FIND_IN_FOLDER_ID,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(files_3.FilesExplorerFocusCondition, files_3.ExplorerFolderContext),
        primary: 1024 /* Shift */ | 512 /* Alt */ | 36 /* KEY_F */,
        handler: searchInFolderCommand
    });
    commands_1.CommandsRegistry.registerCommand({
        id: searchActions_1.ClearSearchResultsAction.ID,
        handler: (accessor, args) => {
            accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.ClearSearchResultsAction, searchActions_1.ClearSearchResultsAction.ID, '').run();
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: searchActions_1.RefreshAction.ID,
        handler: (accessor, args) => {
            accessor.get(instantiation_1.IInstantiationService).createInstance(searchActions_1.RefreshAction, searchActions_1.RefreshAction.ID, '').run();
        }
    });
    const FIND_IN_WORKSPACE_ID = 'filesExplorer.findInWorkspace';
    commands_1.CommandsRegistry.registerCommand({
        id: FIND_IN_WORKSPACE_ID,
        handler: (accessor) => {
            return searchActions_1.openSearchView(accessor.get(views_1.IViewsService), true).then(searchView => {
                if (searchView) {
                    searchView.searchInFolders();
                }
            });
        }
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.ExplorerContext, {
        group: '4_search',
        order: 10,
        command: {
            id: FIND_IN_FOLDER_ID,
            title: nls.localize('findInFolder', "Find in Folder...")
        },
        when: contextkey_1.ContextKeyExpr.and(files_3.ExplorerFolderContext)
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.ExplorerContext, {
        group: '4_search',
        order: 10,
        command: {
            id: FIND_IN_WORKSPACE_ID,
            title: nls.localize('findInWorkspace', "Find in Workspace...")
        },
        when: contextkey_1.ContextKeyExpr.and(files_3.ExplorerRootContext, files_3.ExplorerFolderContext.toNegated())
    });
    let ShowAllSymbolsAction = class ShowAllSymbolsAction extends actions_1.Action {
        constructor(actionId, actionLabel, quickInputService) {
            super(actionId, actionLabel);
            this.quickInputService = quickInputService;
        }
        async run() {
            this.quickInputService.quickAccess.show(ShowAllSymbolsAction.ALL_SYMBOLS_PREFIX);
        }
    };
    ShowAllSymbolsAction.ID = 'workbench.action.showAllSymbols';
    ShowAllSymbolsAction.LABEL = nls.localize('showTriggerActions', "Go to Symbol in Workspace...");
    ShowAllSymbolsAction.ALL_SYMBOLS_PREFIX = '#';
    ShowAllSymbolsAction = __decorate([
        __param(2, quickInput_1.IQuickInputService)
    ], ShowAllSymbolsAction);
    const viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: search_2.VIEWLET_ID,
        name: nls.localize('name', "Search"),
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [search_2.VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true, donotShowContainerTitleWhenMergedWithContainer: true }]),
        hideIfEmpty: true,
        icon: searchIcons_1.searchViewIcon.classNames,
        order: 1
    }, views_1.ViewContainerLocation.Sidebar);
    const viewDescriptor = { id: search_2.VIEW_ID, containerIcon: 'codicon-search', name: nls.localize('search', "Search"), ctorDescriptor: new descriptors_1.SyncDescriptor(searchView_1.SearchView), canToggleVisibility: false, canMoveView: true };
    // Register search default location to sidebar
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([viewDescriptor], viewContainer);
    // Migrate search location setting to new model
    let RegisterSearchViewContribution = class RegisterSearchViewContribution {
        constructor(configurationService, viewDescriptorService) {
            const data = configurationService.inspect('search.location');
            if (data.value === 'panel') {
                viewDescriptorService.moveViewToLocation(viewDescriptor, views_1.ViewContainerLocation.Panel);
            }
            if (data.userValue) {
                configurationService.updateValue('search.location', undefined, 1 /* USER */);
            }
            if (data.userLocalValue) {
                configurationService.updateValue('search.location', undefined, 2 /* USER_LOCAL */);
            }
            if (data.userRemoteValue) {
                configurationService.updateValue('search.location', undefined, 3 /* USER_REMOTE */);
            }
            if (data.workspaceFolderValue) {
                configurationService.updateValue('search.location', undefined, 5 /* WORKSPACE_FOLDER */);
            }
            if (data.workspaceValue) {
                configurationService.updateValue('search.location', undefined, 4 /* WORKSPACE */);
            }
        }
    };
    RegisterSearchViewContribution = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, views_1.IViewDescriptorService)
    ], RegisterSearchViewContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(RegisterSearchViewContribution, 1 /* Starting */);
    // Actions
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    // Show Search and Find in Files are redundant, but we can't break keybindings by removing one. So it's the same action, same keybinding, registered to different IDs.
    // Show Search 'when' is redundant but if the two conflict with exactly the same keybinding and 'when' clause, then they can show up as "unbound" - #51780
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(searchActions_1.OpenSearchViewletAction, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 36 /* KEY_F */ }, Constants.SearchViewVisibleKey.toNegated()), 'View: Show Search', nls.localize('view', "View"));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        description: {
            description: nls.localize('findInFiles.description', "Open the search viewlet"),
            args: [
                {
                    name: nls.localize('findInFiles.args', "A set of options for the search viewlet"),
                    schema: {
                        type: 'object',
                        properties: {
                            query: { 'type': 'string' },
                            replace: { 'type': 'string' },
                            triggerSearch: { 'type': 'boolean' },
                            filesToInclude: { 'type': 'string' },
                            filesToExclude: { 'type': 'string' },
                            isRegex: { 'type': 'boolean' },
                            isCaseSensitive: { 'type': 'boolean' },
                            matchWholeWord: { 'type': 'boolean' },
                        }
                    }
                },
            ]
        },
        id: Constants.FindInFilesActionId,
        weight: 200 /* WorkbenchContrib */,
        when: null,
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 36 /* KEY_F */,
        handler: searchActions_1.FindInFilesCommand
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: Constants.FindInFilesActionId, title: { value: nls.localize('findInFiles', "Find in Files"), original: 'Find in Files' }, category } });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarEditMenu, {
        group: '4_find_global',
        command: {
            id: Constants.FindInFilesActionId,
            title: nls.localize({ key: 'miFindInFiles', comment: ['&& denotes a mnemonic'] }, "Find &&in Files")
        },
        order: 1
    });
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(searchActions_1.FocusNextSearchResultAction, { primary: 62 /* F4 */ }), 'Focus Next Search Result', category, contextkey_1.ContextKeyExpr.or(Constants.HasSearchResults, SearchEditorConstants.InSearchEditor));
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(searchActions_1.FocusPreviousSearchResultAction, { primary: 1024 /* Shift */ | 62 /* F4 */ }), 'Focus Previous Search Result', category, contextkey_1.ContextKeyExpr.or(Constants.HasSearchResults, SearchEditorConstants.InSearchEditor));
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(searchActions_1.ReplaceInFilesAction, { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 38 /* KEY_H */ }), 'Replace in Files', category);
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarEditMenu, {
        group: '4_find_global',
        command: {
            id: searchActions_1.ReplaceInFilesAction.ID,
            title: nls.localize({ key: 'miReplaceInFiles', comment: ['&& denotes a mnemonic'] }, "Replace &&in Files")
        },
        order: 2
    });
    if (platform.isMacintosh) {
        // Register this with a more restrictive `when` on mac to avoid conflict with "copy path"
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(objects.assign({
            id: Constants.ToggleCaseSensitiveCommandId,
            weight: 200 /* WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewFocusedKey, Constants.FileMatchOrFolderMatchFocusKey.toNegated()),
            handler: searchActions_1.toggleCaseSensitiveCommand
        }, findModel_1.ToggleCaseSensitiveKeybinding));
    }
    else {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(objects.assign({
            id: Constants.ToggleCaseSensitiveCommandId,
            weight: 200 /* WorkbenchContrib */,
            when: Constants.SearchViewFocusedKey,
            handler: searchActions_1.toggleCaseSensitiveCommand
        }, findModel_1.ToggleCaseSensitiveKeybinding));
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(objects.assign({
        id: Constants.ToggleWholeWordCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: Constants.SearchViewFocusedKey,
        handler: searchActions_1.toggleWholeWordCommand
    }, findModel_1.ToggleWholeWordKeybinding));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule(objects.assign({
        id: Constants.ToggleRegexCommandId,
        weight: 200 /* WorkbenchContrib */,
        when: Constants.SearchViewFocusedKey,
        handler: searchActions_1.toggleRegexCommand
    }, findModel_1.ToggleRegexKeybinding));
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: Constants.AddCursorsAtSearchResults,
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(Constants.SearchViewVisibleKey, Constants.FileMatchOrMatchFocusKey),
        primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 42 /* KEY_L */,
        handler: (accessor, args) => {
            const searchView = searchActions_1.getSearchView(accessor.get(views_1.IViewsService));
            if (searchView) {
                const tree = searchView.getControl();
                searchView.openEditorWithMultiCursor(tree.getFocus()[0]);
            }
        }
    });
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(searchActions_1.CollapseDeepestExpandedLevelAction), 'Search: Collapse All', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(searchActions_1.ExpandAllAction), 'Search: Expand All', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ShowAllSymbolsAction, { primary: 2048 /* CtrlCmd */ | 50 /* KEY_T */ }), 'Go to Symbol in Workspace...');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(searchActions_1.ToggleSearchOnTypeAction), 'Search: Toggle Search on Type', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(searchActions_1.RefreshAction), 'Search: Refresh', category);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(searchActions_1.ClearSearchResultsAction), 'Search: Clear Search Results', category);
    // Register Quick Access Handler
    const quickAccessRegistry = platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess);
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: anythingQuickAccess_1.AnythingQuickAccessProvider,
        prefix: anythingQuickAccess_1.AnythingQuickAccessProvider.PREFIX,
        placeholder: nls.localize('anythingQuickAccessPlaceholder', "Search files by name (append {0} to go to line or {1} to go to symbol)", gotoLineQuickAccess_1.AbstractGotoLineQuickAccessProvider.PREFIX, gotoSymbolQuickAccess_1.GotoSymbolQuickAccessProvider.PREFIX),
        contextKey: quickaccess_1.defaultQuickAccessContextKeyValue,
        helpEntries: [{ description: nls.localize('anythingQuickAccess', "Go to File"), needsEditor: false }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: symbolsQuickAccess_1.SymbolsQuickAccessProvider,
        prefix: symbolsQuickAccess_1.SymbolsQuickAccessProvider.PREFIX,
        placeholder: nls.localize('symbolsQuickAccessPlaceholder', "Type the name of a symbol to open."),
        contextKey: 'inWorkspaceSymbolsPicker',
        helpEntries: [{ description: nls.localize('symbolsQuickAccess', "Go to Symbol in Workspace"), needsEditor: false }]
    });
    // Configuration
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'search',
        order: 13,
        title: nls.localize('searchConfigurationTitle', "Search"),
        type: 'object',
        properties: {
            [search_2.SEARCH_EXCLUDE_CONFIG]: {
                type: 'object',
                markdownDescription: nls.localize('exclude', "Configure glob patterns for excluding files and folders in fulltext searches and quick open. Inherits all glob patterns from the `#files.exclude#` setting. Read more about glob patterns [here](https://code.visualstudio.com/docs/editor/codebasics#_advanced-search-options)."),
                default: { '**/node_modules': true, '**/bower_components': true, '**/*.code-search': true },
                additionalProperties: {
                    anyOf: [
                        {
                            type: 'boolean',
                            description: nls.localize('exclude.boolean', "The glob pattern to match file paths against. Set to true or false to enable or disable the pattern."),
                        },
                        {
                            type: 'object',
                            properties: {
                                when: {
                                    type: 'string',
                                    pattern: '\\w*\\$\\(basename\\)\\w*',
                                    default: '$(basename).ext',
                                    description: nls.localize('exclude.when', 'Additional check on the siblings of a matching file. Use $(basename) as variable for the matching file name.')
                                }
                            }
                        }
                    ]
                },
                scope: 4 /* RESOURCE */
            },
            'search.useRipgrep': {
                type: 'boolean',
                description: nls.localize('useRipgrep', "This setting is deprecated and now falls back on \"search.usePCRE2\"."),
                deprecationMessage: nls.localize('useRipgrepDeprecated', "Deprecated. Consider \"search.usePCRE2\" for advanced regex feature support."),
                default: true
            },
            'search.maintainFileSearchCache': {
                type: 'boolean',
                description: nls.localize('search.maintainFileSearchCache', "When enabled, the searchService process will be kept alive instead of being shut down after an hour of inactivity. This will keep the file search cache in memory."),
                default: false
            },
            'search.useIgnoreFiles': {
                type: 'boolean',
                markdownDescription: nls.localize('useIgnoreFiles', "Controls whether to use `.gitignore` and `.ignore` files when searching for files."),
                default: true,
                scope: 4 /* RESOURCE */
            },
            'search.useGlobalIgnoreFiles': {
                type: 'boolean',
                markdownDescription: nls.localize('useGlobalIgnoreFiles', "Controls whether to use global `.gitignore` and `.ignore` files when searching for files."),
                default: false,
                scope: 4 /* RESOURCE */
            },
            'search.quickOpen.includeSymbols': {
                type: 'boolean',
                description: nls.localize('search.quickOpen.includeSymbols', "Whether to include results from a global symbol search in the file results for Quick Open."),
                default: false
            },
            'search.quickOpen.includeHistory': {
                type: 'boolean',
                description: nls.localize('search.quickOpen.includeHistory', "Whether to include results from recently opened files in the file results for Quick Open."),
                default: true
            },
            'search.quickOpen.history.filterSortOrder': {
                'type': 'string',
                'enum': ['default', 'recency'],
                'default': 'default',
                'enumDescriptions': [
                    nls.localize('filterSortOrder.default', 'History entries are sorted by relevance based on the filter value used. More relevant entries appear first.'),
                    nls.localize('filterSortOrder.recency', 'History entries are sorted by recency. More recently opened entries appear first.')
                ],
                'description': nls.localize('filterSortOrder', "Controls sorting order of editor history in quick open when filtering.")
            },
            'search.followSymlinks': {
                type: 'boolean',
                description: nls.localize('search.followSymlinks', "Controls whether to follow symlinks while searching."),
                default: true
            },
            'search.smartCase': {
                type: 'boolean',
                description: nls.localize('search.smartCase', "Search case-insensitively if the pattern is all lowercase, otherwise, search case-sensitively."),
                default: false
            },
            'search.globalFindClipboard': {
                type: 'boolean',
                default: false,
                description: nls.localize('search.globalFindClipboard', "Controls whether the search view should read or modify the shared find clipboard on macOS."),
                included: platform.isMacintosh
            },
            'search.location': {
                type: 'string',
                enum: ['sidebar', 'panel'],
                default: 'sidebar',
                description: nls.localize('search.location', "Controls whether the search will be shown as a view in the sidebar or as a panel in the panel area for more horizontal space."),
                deprecationMessage: nls.localize('search.location.deprecationMessage', "This setting is deprecated. Please use drag and drop instead by dragging the search icon.")
            },
            'search.collapseResults': {
                type: 'string',
                enum: ['auto', 'alwaysCollapse', 'alwaysExpand'],
                enumDescriptions: [
                    nls.localize('search.collapseResults.auto', "Files with less than 10 results are expanded. Others are collapsed."),
                    '',
                    ''
                ],
                default: 'alwaysExpand',
                description: nls.localize('search.collapseAllResults', "Controls whether the search results will be collapsed or expanded."),
            },
            'search.useReplacePreview': {
                type: 'boolean',
                default: true,
                description: nls.localize('search.useReplacePreview', "Controls whether to open Replace Preview when selecting or replacing a match."),
            },
            'search.showLineNumbers': {
                type: 'boolean',
                default: false,
                description: nls.localize('search.showLineNumbers', "Controls whether to show line numbers for search results."),
            },
            'search.usePCRE2': {
                type: 'boolean',
                default: false,
                description: nls.localize('search.usePCRE2', "Whether to use the PCRE2 regex engine in text search. This enables using some advanced regex features like lookahead and backreferences. However, not all PCRE2 features are supported - only features that are also supported by JavaScript."),
                deprecationMessage: nls.localize('usePCRE2Deprecated', "Deprecated. PCRE2 will be used automatically when using regex features that are only supported by PCRE2."),
            },
            'search.actionsPosition': {
                type: 'string',
                enum: ['auto', 'right'],
                enumDescriptions: [
                    nls.localize('search.actionsPositionAuto', "Position the actionbar to the right when the search view is narrow, and immediately after the content when the search view is wide."),
                    nls.localize('search.actionsPositionRight', "Always position the actionbar to the right."),
                ],
                default: 'auto',
                description: nls.localize('search.actionsPosition', "Controls the positioning of the actionbar on rows in the search view.")
            },
            'search.searchOnType': {
                type: 'boolean',
                default: true,
                description: nls.localize('search.searchOnType', "Search all files as you type.")
            },
            'search.seedWithNearestWord': {
                type: 'boolean',
                default: false,
                description: nls.localize('search.seedWithNearestWord', "Enable seeding search from the word nearest the cursor when the active editor has no selection.")
            },
            'search.seedOnFocus': {
                type: 'boolean',
                default: false,
                description: nls.localize('search.seedOnFocus', "Update workspace search query to the editor's selected text when focusing the search view. This happens either on click or when triggering the `workbench.views.search.focus` command.")
            },
            'search.searchOnTypeDebouncePeriod': {
                type: 'number',
                default: 300,
                markdownDescription: nls.localize('search.searchOnTypeDebouncePeriod', "When `#search.searchOnType#` is enabled, controls the timeout in milliseconds between a character being typed and the search starting. Has no effect when `search.searchOnType` is disabled.")
            },
            'search.searchEditor.doubleClickBehaviour': {
                type: 'string',
                enum: ['selectWord', 'goToLocation', 'openLocationToSide'],
                default: 'goToLocation',
                enumDescriptions: [
                    nls.localize('search.searchEditor.doubleClickBehaviour.selectWord', "Double clicking selects the word under the cursor."),
                    nls.localize('search.searchEditor.doubleClickBehaviour.goToLocation', "Double clicking opens the result in the active editor group."),
                    nls.localize('search.searchEditor.doubleClickBehaviour.openLocationToSide', "Double clicking opens the result in the editor group to the side, creating one if it does not yet exist."),
                ],
                markdownDescription: nls.localize('search.searchEditor.doubleClickBehaviour', "Configure effect of double clicking a result in a search editor.")
            },
            'search.searchEditor.reusePriorSearchConfiguration': {
                type: 'boolean',
                default: false,
                markdownDescription: nls.localize('search.searchEditor.reusePriorSearchConfiguration', "When enabled, new Search Editors will reuse the includes, excludes, and flags of the previously opened Search Editor")
            },
            'search.searchEditor.defaultNumberOfContextLines': {
                type: ['number', 'null'],
                default: 1,
                markdownDescription: nls.localize('search.searchEditor.defaultNumberOfContextLines', "The default number of surrounding context lines to use when creating new Search Editors. If using `#search.searchEditor.reusePriorSearchConfiguration#`, this can be set to `null` (empty) to use the prior Search Editor's configuration.")
            },
            'search.sortOrder': {
                'type': 'string',
                'enum': ["default" /* Default */, "fileNames" /* FileNames */, "type" /* Type */, "modified" /* Modified */, "countDescending" /* CountDescending */, "countAscending" /* CountAscending */],
                'default': "default" /* Default */,
                'enumDescriptions': [
                    nls.localize('searchSortOrder.default', "Results are sorted by folder and file names, in alphabetical order."),
                    nls.localize('searchSortOrder.filesOnly', "Results are sorted by file names ignoring folder order, in alphabetical order."),
                    nls.localize('searchSortOrder.type', "Results are sorted by file extensions, in alphabetical order."),
                    nls.localize('searchSortOrder.modified', "Results are sorted by file last modified date, in descending order."),
                    nls.localize('searchSortOrder.countDescending', "Results are sorted by count per file, in descending order."),
                    nls.localize('searchSortOrder.countAscending', "Results are sorted by count per file, in ascending order.")
                ],
                'description': nls.localize('search.sortOrder', "Controls sorting order of search results.")
            },
        }
    });
    commands_1.CommandsRegistry.registerCommand('_executeWorkspaceSymbolProvider', function (accessor, ...args) {
        const [query] = args;
        types_1.assertType(typeof query === 'string');
        return search_1.getWorkspaceSymbols(query);
    });
    // View menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarViewMenu, {
        group: '3_views',
        command: {
            id: search_2.VIEWLET_ID,
            title: nls.localize({ key: 'miViewSearch', comment: ['&& denotes a mnemonic'] }, "&&Search")
        },
        order: 2
    });
    // Go to menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '3_global_nav',
        command: {
            id: 'workbench.action.showAllSymbols',
            title: nls.localize({ key: 'miGotoSymbolInWorkspace', comment: ['&& denotes a mnemonic'] }, "Go to Symbol in &&Workspace...")
        },
        order: 2
    });
});
//# __sourceMappingURL=search.contribution.js.map