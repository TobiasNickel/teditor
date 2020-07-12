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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/keyCodes", "vs/base/common/platform", "vs/base/common/strings", "vs/nls", "vs/platform/clipboard/common/clipboardService", "vs/platform/label/common/label", "vs/platform/configuration/common/configuration", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/search/common/replace", "vs/workbench/contrib/search/common/searchModel", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/search/common/search", "vs/workbench/contrib/search/common/searchHistoryService", "vs/workbench/common/views", "vs/workbench/contrib/searchEditor/browser/searchEditorInput", "vs/workbench/contrib/search/browser/searchIcons"], function (require, exports, DOM, actions_1, keyCodes_1, platform_1, strings_1, nls, clipboardService_1, label_1, configuration_1, keybinding_1, listService_1, Constants, replace_1, searchModel_1, editorGroupsService_1, editorService_1, search_1, searchHistoryService_1, views_1, searchEditorInput_1, searchIcons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.focusSearchListCommand = exports.clearHistoryCommand = exports.copyAllCommand = exports.copyMatchCommand = exports.copyPathCommand = exports.ReplaceAction = exports.ReplaceAllInFolderAction = exports.ReplaceAllAction = exports.RemoveAction = exports.AbstractSearchAndReplaceAction = exports.FocusPreviousSearchResultAction = exports.FocusNextSearchResultAction = exports.CancelSearchAction = exports.ClearSearchResultsAction = exports.ToggleCollapseAndExpandAction = exports.ExpandAllAction = exports.CollapseDeepestExpandedLevelAction = exports.RefreshAction = exports.ToggleSearchOnTypeAction = exports.CloseReplaceAction = exports.ReplaceInFilesAction = exports.OpenSearchViewletAction = exports.FindInFilesCommand = exports.FindOrReplaceInFilesAction = exports.FocusPreviousInputAction = exports.FocusNextInputAction = exports.toggleRegexCommand = exports.toggleWholeWordCommand = exports.toggleCaseSensitiveCommand = exports.getSearchView = exports.openSearchView = exports.appendKeyBindingLabel = exports.isSearchViewFocused = void 0;
    function isSearchViewFocused(viewsService) {
        const searchView = getSearchView(viewsService);
        const activeElement = document.activeElement;
        return !!(searchView && activeElement && DOM.isAncestor(activeElement, searchView.getContainer()));
    }
    exports.isSearchViewFocused = isSearchViewFocused;
    function appendKeyBindingLabel(label, inputKeyBinding, keyBindingService2) {
        if (typeof inputKeyBinding === 'number') {
            const keybinding = keyCodes_1.createKeybinding(inputKeyBinding, platform_1.OS);
            if (keybinding) {
                const resolvedKeybindings = keyBindingService2.resolveKeybinding(keybinding);
                return doAppendKeyBindingLabel(label, resolvedKeybindings.length > 0 ? resolvedKeybindings[0] : undefined);
            }
            return doAppendKeyBindingLabel(label, undefined);
        }
        else {
            return doAppendKeyBindingLabel(label, inputKeyBinding);
        }
    }
    exports.appendKeyBindingLabel = appendKeyBindingLabel;
    function openSearchView(viewsService, focus) {
        return viewsService.openView(search_1.VIEW_ID, focus).then(view => { var _a; return ((_a = view) !== null && _a !== void 0 ? _a : undefined); });
    }
    exports.openSearchView = openSearchView;
    function getSearchView(viewsService) {
        var _a;
        return (_a = viewsService.getActiveViewWithId(search_1.VIEW_ID)) !== null && _a !== void 0 ? _a : undefined;
    }
    exports.getSearchView = getSearchView;
    function doAppendKeyBindingLabel(label, keyBinding) {
        return keyBinding ? label + ' (' + keyBinding.getLabel() + ')' : label;
    }
    exports.toggleCaseSensitiveCommand = (accessor) => {
        const searchView = getSearchView(accessor.get(views_1.IViewsService));
        if (searchView) {
            searchView.toggleCaseSensitive();
        }
    };
    exports.toggleWholeWordCommand = (accessor) => {
        const searchView = getSearchView(accessor.get(views_1.IViewsService));
        if (searchView) {
            searchView.toggleWholeWords();
        }
    };
    exports.toggleRegexCommand = (accessor) => {
        const searchView = getSearchView(accessor.get(views_1.IViewsService));
        if (searchView) {
            searchView.toggleRegex();
        }
    };
    let FocusNextInputAction = class FocusNextInputAction extends actions_1.Action {
        constructor(id, label, viewsService, editorService) {
            super(id, label);
            this.viewsService = viewsService;
            this.editorService = editorService;
        }
        async run() {
            const input = this.editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                // cast as we cannot import SearchEditor as a value b/c cyclic dependency.
                this.editorService.activeEditorPane.focusNextInput();
            }
            const searchView = getSearchView(this.viewsService);
            if (searchView) {
                searchView.focusNextInputBox();
            }
        }
    };
    FocusNextInputAction.ID = 'search.focus.nextInputBox';
    FocusNextInputAction = __decorate([
        __param(2, views_1.IViewsService),
        __param(3, editorService_1.IEditorService)
    ], FocusNextInputAction);
    exports.FocusNextInputAction = FocusNextInputAction;
    let FocusPreviousInputAction = class FocusPreviousInputAction extends actions_1.Action {
        constructor(id, label, viewsService, editorService) {
            super(id, label);
            this.viewsService = viewsService;
            this.editorService = editorService;
        }
        async run() {
            const input = this.editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                // cast as we cannot import SearchEditor as a value b/c cyclic dependency.
                this.editorService.activeEditorPane.focusPrevInput();
            }
            const searchView = getSearchView(this.viewsService);
            if (searchView) {
                searchView.focusPreviousInputBox();
            }
        }
    };
    FocusPreviousInputAction.ID = 'search.focus.previousInputBox';
    FocusPreviousInputAction = __decorate([
        __param(2, views_1.IViewsService),
        __param(3, editorService_1.IEditorService)
    ], FocusPreviousInputAction);
    exports.FocusPreviousInputAction = FocusPreviousInputAction;
    class FindOrReplaceInFilesAction extends actions_1.Action {
        constructor(id, label, viewsService, expandSearchReplaceWidget) {
            super(id, label);
            this.viewsService = viewsService;
            this.expandSearchReplaceWidget = expandSearchReplaceWidget;
        }
        run() {
            return openSearchView(this.viewsService, false).then(openedView => {
                if (openedView) {
                    const searchAndReplaceWidget = openedView.searchAndReplaceWidget;
                    searchAndReplaceWidget.toggleReplace(this.expandSearchReplaceWidget);
                    const updatedText = openedView.updateTextFromSelection({ allowUnselectedWord: !this.expandSearchReplaceWidget });
                    openedView.searchAndReplaceWidget.focus(undefined, updatedText, updatedText);
                }
            });
        }
    }
    exports.FindOrReplaceInFilesAction = FindOrReplaceInFilesAction;
    exports.FindInFilesCommand = (accessor, args = {}) => {
        const viewsService = accessor.get(views_1.IViewsService);
        openSearchView(viewsService, false).then(openedView => {
            if (openedView) {
                const searchAndReplaceWidget = openedView.searchAndReplaceWidget;
                searchAndReplaceWidget.toggleReplace(typeof args.replace === 'string');
                let updatedText = false;
                if (typeof args.query === 'string') {
                    openedView.setSearchParameters(args);
                }
                else {
                    updatedText = openedView.updateTextFromSelection({ allowUnselectedWord: typeof args.replace !== 'string' });
                }
                openedView.searchAndReplaceWidget.focus(undefined, updatedText, updatedText);
            }
        });
    };
    let OpenSearchViewletAction = class OpenSearchViewletAction extends FindOrReplaceInFilesAction {
        constructor(id, label, viewsService, editorGroupService) {
            super(id, label, viewsService, /*expandSearchReplaceWidget=*/ false);
            this.editorGroupService = editorGroupService;
        }
        run() {
            // Pass focus to viewlet if not open or focused
            if (this.otherViewletShowing() || !isSearchViewFocused(this.viewsService)) {
                return super.run();
            }
            // Otherwise pass focus to editor group
            this.editorGroupService.activeGroup.focus();
            return Promise.resolve(true);
        }
        otherViewletShowing() {
            return !getSearchView(this.viewsService);
        }
    };
    OpenSearchViewletAction.ID = search_1.VIEWLET_ID;
    OpenSearchViewletAction.LABEL = nls.localize('showSearch', "Show Search");
    OpenSearchViewletAction = __decorate([
        __param(2, views_1.IViewsService),
        __param(3, editorGroupsService_1.IEditorGroupsService)
    ], OpenSearchViewletAction);
    exports.OpenSearchViewletAction = OpenSearchViewletAction;
    let ReplaceInFilesAction = class ReplaceInFilesAction extends FindOrReplaceInFilesAction {
        constructor(id, label, viewsService) {
            super(id, label, viewsService, /*expandSearchReplaceWidget=*/ true);
        }
    };
    ReplaceInFilesAction.ID = 'workbench.action.replaceInFiles';
    ReplaceInFilesAction.LABEL = nls.localize('replaceInFiles', "Replace in Files");
    ReplaceInFilesAction = __decorate([
        __param(2, views_1.IViewsService)
    ], ReplaceInFilesAction);
    exports.ReplaceInFilesAction = ReplaceInFilesAction;
    let CloseReplaceAction = class CloseReplaceAction extends actions_1.Action {
        constructor(id, label, viewsService) {
            super(id, label);
            this.viewsService = viewsService;
        }
        run() {
            const searchView = getSearchView(this.viewsService);
            if (searchView) {
                searchView.searchAndReplaceWidget.toggleReplace(false);
                searchView.searchAndReplaceWidget.focus();
            }
            return Promise.resolve(null);
        }
    };
    CloseReplaceAction = __decorate([
        __param(2, views_1.IViewsService)
    ], CloseReplaceAction);
    exports.CloseReplaceAction = CloseReplaceAction;
    // --- Toggle Search On Type
    let ToggleSearchOnTypeAction = class ToggleSearchOnTypeAction extends actions_1.Action {
        constructor(id, label, configurationService) {
            super(id, label);
            this.configurationService = configurationService;
        }
        run() {
            const searchOnType = this.configurationService.getValue(ToggleSearchOnTypeAction.searchOnTypeKey);
            return this.configurationService.updateValue(ToggleSearchOnTypeAction.searchOnTypeKey, !searchOnType);
        }
    };
    ToggleSearchOnTypeAction.ID = 'workbench.action.toggleSearchOnType';
    ToggleSearchOnTypeAction.LABEL = nls.localize('toggleTabs', "Toggle Search on Type");
    ToggleSearchOnTypeAction.searchOnTypeKey = 'search.searchOnType';
    ToggleSearchOnTypeAction = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], ToggleSearchOnTypeAction);
    exports.ToggleSearchOnTypeAction = ToggleSearchOnTypeAction;
    let RefreshAction = class RefreshAction extends actions_1.Action {
        constructor(id, label, viewsService) {
            super(id, label, 'search-action ' + searchIcons_1.searchRefreshIcon.classNames);
            this.viewsService = viewsService;
        }
        get enabled() {
            const searchView = getSearchView(this.viewsService);
            return !!searchView && searchView.hasSearchPattern();
        }
        update() {
            this._setEnabled(this.enabled);
        }
        run() {
            const searchView = getSearchView(this.viewsService);
            if (searchView) {
                searchView.triggerQueryChange({ preserveFocus: false });
            }
            return Promise.resolve();
        }
    };
    RefreshAction.ID = 'search.action.refreshSearchResults';
    RefreshAction.LABEL = nls.localize('RefreshAction.label', "Refresh");
    RefreshAction = __decorate([
        __param(2, views_1.IViewsService)
    ], RefreshAction);
    exports.RefreshAction = RefreshAction;
    let CollapseDeepestExpandedLevelAction = class CollapseDeepestExpandedLevelAction extends actions_1.Action {
        constructor(id, label, viewsService) {
            super(id, label, 'search-action ' + searchIcons_1.searchCollapseAllIcon.classNames);
            this.viewsService = viewsService;
            this.update();
        }
        update() {
            const searchView = getSearchView(this.viewsService);
            this.enabled = !!searchView && searchView.hasSearchResults();
        }
        run() {
            const searchView = getSearchView(this.viewsService);
            if (searchView) {
                const viewer = searchView.getControl();
                /**
                 * one level to collapse so collapse everything. If FolderMatch, check if there are visible grandchildren,
                 * i.e. if Matches are returned by the navigator, and if so, collapse to them, otherwise collapse all levels.
                 */
                const navigator = viewer.navigate();
                let node = navigator.first();
                let collapseFileMatchLevel = false;
                if (node instanceof searchModel_1.FolderMatch) {
                    while (node = navigator.next()) {
                        if (node instanceof searchModel_1.Match) {
                            collapseFileMatchLevel = true;
                            break;
                        }
                    }
                }
                if (collapseFileMatchLevel) {
                    node = navigator.first();
                    do {
                        if (node instanceof searchModel_1.FileMatch) {
                            viewer.collapse(node);
                        }
                    } while (node = navigator.next());
                }
                else {
                    viewer.collapseAll();
                }
                viewer.domFocus();
                viewer.focusFirst();
            }
            return Promise.resolve(undefined);
        }
    };
    CollapseDeepestExpandedLevelAction.ID = 'search.action.collapseSearchResults';
    CollapseDeepestExpandedLevelAction.LABEL = nls.localize('CollapseDeepestExpandedLevelAction.label', "Collapse All");
    CollapseDeepestExpandedLevelAction = __decorate([
        __param(2, views_1.IViewsService)
    ], CollapseDeepestExpandedLevelAction);
    exports.CollapseDeepestExpandedLevelAction = CollapseDeepestExpandedLevelAction;
    let ExpandAllAction = class ExpandAllAction extends actions_1.Action {
        constructor(id, label, viewsService) {
            super(id, label, 'search-action ' + searchIcons_1.searchExpandAllIcon.classNames);
            this.viewsService = viewsService;
            this.update();
        }
        update() {
            const searchView = getSearchView(this.viewsService);
            this.enabled = !!searchView && searchView.hasSearchResults();
        }
        run() {
            const searchView = getSearchView(this.viewsService);
            if (searchView) {
                const viewer = searchView.getControl();
                viewer.expandAll();
                viewer.domFocus();
                viewer.focusFirst();
            }
            return Promise.resolve(undefined);
        }
    };
    ExpandAllAction.ID = 'search.action.expandSearchResults';
    ExpandAllAction.LABEL = nls.localize('ExpandAllAction.label', "Expand All");
    ExpandAllAction = __decorate([
        __param(2, views_1.IViewsService)
    ], ExpandAllAction);
    exports.ExpandAllAction = ExpandAllAction;
    let ToggleCollapseAndExpandAction = class ToggleCollapseAndExpandAction extends actions_1.Action {
        constructor(id, label, collapseAction, expandAction, viewsService) {
            super(id, label, collapseAction.class);
            this.collapseAction = collapseAction;
            this.expandAction = expandAction;
            this.viewsService = viewsService;
            this.update();
        }
        update() {
            const searchView = getSearchView(this.viewsService);
            this.enabled = !!searchView && searchView.hasSearchResults();
            this.onTreeCollapseStateChange();
        }
        onTreeCollapseStateChange() {
            this.action = undefined;
            this.determineAction();
        }
        determineAction() {
            if (this.action !== undefined) {
                return this.action;
            }
            this.action = this.isSomeCollapsible() ? this.collapseAction : this.expandAction;
            this.class = this.action.class;
            return this.action;
        }
        isSomeCollapsible() {
            const searchView = getSearchView(this.viewsService);
            if (searchView) {
                const viewer = searchView.getControl();
                const navigator = viewer.navigate();
                let node = navigator.first();
                do {
                    if (!viewer.isCollapsed(node)) {
                        return true;
                    }
                } while (node = navigator.next());
            }
            return false;
        }
        async run() {
            await this.determineAction().run();
        }
    };
    ToggleCollapseAndExpandAction.ID = 'search.action.collapseOrExpandSearchResults';
    ToggleCollapseAndExpandAction.LABEL = nls.localize('ToggleCollapseAndExpandAction.label', "Toggle Collapse and Expand");
    ToggleCollapseAndExpandAction = __decorate([
        __param(4, views_1.IViewsService)
    ], ToggleCollapseAndExpandAction);
    exports.ToggleCollapseAndExpandAction = ToggleCollapseAndExpandAction;
    let ClearSearchResultsAction = class ClearSearchResultsAction extends actions_1.Action {
        constructor(id, label, viewsService) {
            super(id, label, 'search-action ' + searchIcons_1.searchClearIcon.classNames);
            this.viewsService = viewsService;
            this.update();
        }
        update() {
            const searchView = getSearchView(this.viewsService);
            this.enabled = !!searchView && (!searchView.allSearchFieldsClear() || searchView.hasSearchResults());
        }
        run() {
            const searchView = getSearchView(this.viewsService);
            if (searchView) {
                searchView.clearSearchResults();
            }
            return Promise.resolve();
        }
    };
    ClearSearchResultsAction.ID = 'search.action.clearSearchResults';
    ClearSearchResultsAction.LABEL = nls.localize('ClearSearchResultsAction.label', "Clear Search Results");
    ClearSearchResultsAction = __decorate([
        __param(2, views_1.IViewsService)
    ], ClearSearchResultsAction);
    exports.ClearSearchResultsAction = ClearSearchResultsAction;
    let CancelSearchAction = class CancelSearchAction extends actions_1.Action {
        constructor(id, label, viewsService) {
            super(id, label, 'search-action ' + searchIcons_1.searchStopIcon.classNames);
            this.viewsService = viewsService;
            this.update();
        }
        update() {
            const searchView = getSearchView(this.viewsService);
            this.enabled = !!searchView && searchView.isSlowSearch();
        }
        run() {
            const searchView = getSearchView(this.viewsService);
            if (searchView) {
                searchView.cancelSearch();
            }
            return Promise.resolve(undefined);
        }
    };
    CancelSearchAction.ID = 'search.action.cancelSearch';
    CancelSearchAction.LABEL = nls.localize('CancelSearchAction.label', "Cancel Search");
    CancelSearchAction = __decorate([
        __param(2, views_1.IViewsService)
    ], CancelSearchAction);
    exports.CancelSearchAction = CancelSearchAction;
    let FocusNextSearchResultAction = class FocusNextSearchResultAction extends actions_1.Action {
        constructor(id, label, viewsService, editorService) {
            super(id, label);
            this.viewsService = viewsService;
            this.editorService = editorService;
        }
        async run() {
            const input = this.editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                // cast as we cannot import SearchEditor as a value b/c cyclic dependency.
                return this.editorService.activeEditorPane.focusNextResult();
            }
            return openSearchView(this.viewsService).then(searchView => {
                if (searchView) {
                    searchView.selectNextMatch();
                }
            });
        }
    };
    FocusNextSearchResultAction.ID = 'search.action.focusNextSearchResult';
    FocusNextSearchResultAction.LABEL = nls.localize('FocusNextSearchResult.label', "Focus Next Search Result");
    FocusNextSearchResultAction = __decorate([
        __param(2, views_1.IViewsService),
        __param(3, editorService_1.IEditorService)
    ], FocusNextSearchResultAction);
    exports.FocusNextSearchResultAction = FocusNextSearchResultAction;
    let FocusPreviousSearchResultAction = class FocusPreviousSearchResultAction extends actions_1.Action {
        constructor(id, label, viewsService, editorService) {
            super(id, label);
            this.viewsService = viewsService;
            this.editorService = editorService;
        }
        async run() {
            const input = this.editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                // cast as we cannot import SearchEditor as a value b/c cyclic dependency.
                return this.editorService.activeEditorPane.focusPreviousResult();
            }
            return openSearchView(this.viewsService).then(searchView => {
                if (searchView) {
                    searchView.selectPreviousMatch();
                }
            });
        }
    };
    FocusPreviousSearchResultAction.ID = 'search.action.focusPreviousSearchResult';
    FocusPreviousSearchResultAction.LABEL = nls.localize('FocusPreviousSearchResult.label', "Focus Previous Search Result");
    FocusPreviousSearchResultAction = __decorate([
        __param(2, views_1.IViewsService),
        __param(3, editorService_1.IEditorService)
    ], FocusPreviousSearchResultAction);
    exports.FocusPreviousSearchResultAction = FocusPreviousSearchResultAction;
    class AbstractSearchAndReplaceAction extends actions_1.Action {
        /**
         * Returns element to focus after removing the given element
         */
        getElementToFocusAfterRemoved(viewer, elementToBeRemoved) {
            const elementToFocus = this.getNextElementAfterRemoved(viewer, elementToBeRemoved);
            return elementToFocus || this.getPreviousElementAfterRemoved(viewer, elementToBeRemoved);
        }
        getNextElementAfterRemoved(viewer, element) {
            const navigator = viewer.navigate(element);
            if (element instanceof searchModel_1.FolderMatch) {
                while (!!navigator.next() && !(navigator.current() instanceof searchModel_1.FolderMatch)) { }
            }
            else if (element instanceof searchModel_1.FileMatch) {
                while (!!navigator.next() && !(navigator.current() instanceof searchModel_1.FileMatch)) { }
            }
            else {
                while (navigator.next() && !(navigator.current() instanceof searchModel_1.Match)) {
                    viewer.expand(navigator.current());
                }
            }
            return navigator.current();
        }
        getPreviousElementAfterRemoved(viewer, element) {
            const navigator = viewer.navigate(element);
            let previousElement = navigator.previous();
            // Hence take the previous element.
            const parent = element.parent();
            if (parent === previousElement) {
                previousElement = navigator.previous();
            }
            if (parent instanceof searchModel_1.FileMatch && parent.parent() === previousElement) {
                previousElement = navigator.previous();
            }
            // If the previous element is a File or Folder, expand it and go to its last child.
            // Spell out the two cases, would be too easy to create an infinite loop, like by adding another level...
            if (element instanceof searchModel_1.Match && previousElement && previousElement instanceof searchModel_1.FolderMatch) {
                navigator.next();
                viewer.expand(previousElement);
                previousElement = navigator.previous();
            }
            if (element instanceof searchModel_1.Match && previousElement && previousElement instanceof searchModel_1.FileMatch) {
                navigator.next();
                viewer.expand(previousElement);
                previousElement = navigator.previous();
            }
            return previousElement;
        }
    }
    exports.AbstractSearchAndReplaceAction = AbstractSearchAndReplaceAction;
    class RemoveAction extends AbstractSearchAndReplaceAction {
        constructor(viewer, element) {
            super('remove', RemoveAction.LABEL, searchIcons_1.searchRemoveIcon.classNames);
            this.viewer = viewer;
            this.element = element;
        }
        run() {
            const currentFocusElement = this.viewer.getFocus()[0];
            const nextFocusElement = !currentFocusElement || currentFocusElement instanceof searchModel_1.SearchResult || elementIsEqualOrParent(currentFocusElement, this.element) ?
                this.getElementToFocusAfterRemoved(this.viewer, this.element) :
                null;
            if (nextFocusElement) {
                this.viewer.reveal(nextFocusElement);
                this.viewer.setFocus([nextFocusElement], listService_1.getSelectionKeyboardEvent());
            }
            this.element.parent().remove(this.element);
            this.viewer.domFocus();
            return Promise.resolve();
        }
    }
    exports.RemoveAction = RemoveAction;
    RemoveAction.LABEL = nls.localize('RemoveAction.label', "Dismiss");
    function elementIsEqualOrParent(element, testParent) {
        do {
            if (element === testParent) {
                return true;
            }
        } while (!(element.parent() instanceof searchModel_1.SearchResult) && (element = element.parent()));
        return false;
    }
    let ReplaceAllAction = class ReplaceAllAction extends AbstractSearchAndReplaceAction {
        constructor(viewlet, fileMatch, keyBindingService) {
            super(Constants.ReplaceAllInFileActionId, appendKeyBindingLabel(ReplaceAllAction.LABEL, keyBindingService.lookupKeybinding(Constants.ReplaceAllInFileActionId), keyBindingService), searchIcons_1.searchReplaceAllIcon.classNames);
            this.viewlet = viewlet;
            this.fileMatch = fileMatch;
        }
        run() {
            const tree = this.viewlet.getControl();
            const nextFocusElement = this.getElementToFocusAfterRemoved(tree, this.fileMatch);
            return this.fileMatch.parent().replace(this.fileMatch).then(() => {
                if (nextFocusElement) {
                    tree.setFocus([nextFocusElement], listService_1.getSelectionKeyboardEvent());
                }
                tree.domFocus();
                this.viewlet.open(this.fileMatch, true);
            });
        }
    };
    ReplaceAllAction.LABEL = nls.localize('file.replaceAll.label', "Replace All");
    ReplaceAllAction = __decorate([
        __param(2, keybinding_1.IKeybindingService)
    ], ReplaceAllAction);
    exports.ReplaceAllAction = ReplaceAllAction;
    let ReplaceAllInFolderAction = class ReplaceAllInFolderAction extends AbstractSearchAndReplaceAction {
        constructor(viewer, folderMatch, keyBindingService) {
            super(Constants.ReplaceAllInFolderActionId, appendKeyBindingLabel(ReplaceAllInFolderAction.LABEL, keyBindingService.lookupKeybinding(Constants.ReplaceAllInFolderActionId), keyBindingService), searchIcons_1.searchReplaceAllIcon.classNames);
            this.viewer = viewer;
            this.folderMatch = folderMatch;
        }
        run() {
            const nextFocusElement = this.getElementToFocusAfterRemoved(this.viewer, this.folderMatch);
            return this.folderMatch.replaceAll().then(() => {
                if (nextFocusElement) {
                    this.viewer.setFocus([nextFocusElement], listService_1.getSelectionKeyboardEvent());
                }
                this.viewer.domFocus();
            });
        }
    };
    ReplaceAllInFolderAction.LABEL = nls.localize('file.replaceAll.label', "Replace All");
    ReplaceAllInFolderAction = __decorate([
        __param(2, keybinding_1.IKeybindingService)
    ], ReplaceAllInFolderAction);
    exports.ReplaceAllInFolderAction = ReplaceAllInFolderAction;
    let ReplaceAction = class ReplaceAction extends AbstractSearchAndReplaceAction {
        constructor(viewer, element, viewlet, replaceService, keyBindingService, editorService, configurationService) {
            super(Constants.ReplaceActionId, appendKeyBindingLabel(ReplaceAction.LABEL, keyBindingService.lookupKeybinding(Constants.ReplaceActionId), keyBindingService), searchIcons_1.searchReplaceIcon.classNames);
            this.viewer = viewer;
            this.element = element;
            this.viewlet = viewlet;
            this.replaceService = replaceService;
            this.editorService = editorService;
            this.configurationService = configurationService;
        }
        run() {
            this.enabled = false;
            return this.element.parent().replace(this.element).then(() => {
                const elementToFocus = this.getElementToFocusAfterReplace();
                if (elementToFocus) {
                    this.viewer.setFocus([elementToFocus], listService_1.getSelectionKeyboardEvent());
                }
                return this.getElementToShowReplacePreview(elementToFocus);
            }).then(elementToShowReplacePreview => {
                this.viewer.domFocus();
                const useReplacePreview = this.configurationService.getValue().search.useReplacePreview;
                if (!useReplacePreview || !elementToShowReplacePreview || this.hasToOpenFile()) {
                    this.viewlet.open(this.element, true);
                }
                else {
                    this.replaceService.openReplacePreview(elementToShowReplacePreview, true);
                }
            });
        }
        getElementToFocusAfterReplace() {
            const navigator = this.viewer.navigate();
            let fileMatched = false;
            let elementToFocus = null;
            do {
                elementToFocus = navigator.current();
                if (elementToFocus instanceof searchModel_1.Match) {
                    if (elementToFocus.parent().id() === this.element.parent().id()) {
                        fileMatched = true;
                        if (this.element.range().getStartPosition().isBeforeOrEqual(elementToFocus.range().getStartPosition())) {
                            // Closest next match in the same file
                            break;
                        }
                    }
                    else if (fileMatched) {
                        // First match in the next file (if expanded)
                        break;
                    }
                }
                else if (fileMatched) {
                    if (this.viewer.isCollapsed(elementToFocus)) {
                        // Next file match (if collapsed)
                        break;
                    }
                }
            } while (!!navigator.next());
            return elementToFocus;
        }
        async getElementToShowReplacePreview(elementToFocus) {
            if (this.hasSameParent(elementToFocus)) {
                return elementToFocus;
            }
            const previousElement = await this.getPreviousElementAfterRemoved(this.viewer, this.element);
            if (this.hasSameParent(previousElement)) {
                return previousElement;
            }
            return null;
        }
        hasSameParent(element) {
            return element && element instanceof searchModel_1.Match && element.parent().resource === this.element.parent().resource;
        }
        hasToOpenFile() {
            const activeEditor = this.editorService.activeEditor;
            const file = activeEditor ? activeEditor.resource : undefined;
            if (file) {
                return file.toString() === this.element.parent().resource.toString();
            }
            return false;
        }
    };
    ReplaceAction.LABEL = nls.localize('match.replace.label', "Replace");
    ReplaceAction = __decorate([
        __param(3, replace_1.IReplaceService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, editorService_1.IEditorService),
        __param(6, configuration_1.IConfigurationService)
    ], ReplaceAction);
    exports.ReplaceAction = ReplaceAction;
    exports.copyPathCommand = async (accessor, fileMatch) => {
        if (!fileMatch) {
            const selection = getSelectedRow(accessor);
            if (!(selection instanceof searchModel_1.FileMatch || selection instanceof searchModel_1.FolderMatchWithResource)) {
                return;
            }
            fileMatch = selection;
        }
        const clipboardService = accessor.get(clipboardService_1.IClipboardService);
        const labelService = accessor.get(label_1.ILabelService);
        const text = labelService.getUriLabel(fileMatch.resource, { noPrefix: true });
        await clipboardService.writeText(text);
    };
    function matchToString(match, indent = 0) {
        const getFirstLinePrefix = () => `${match.range().startLineNumber},${match.range().startColumn}`;
        const getOtherLinePrefix = (i) => match.range().startLineNumber + i + '';
        const fullMatchLines = match.fullPreviewLines();
        const largestPrefixSize = fullMatchLines.reduce((largest, _, i) => {
            const thisSize = i === 0 ?
                getFirstLinePrefix().length :
                getOtherLinePrefix(i).length;
            return Math.max(thisSize, largest);
        }, 0);
        const formattedLines = fullMatchLines
            .map((line, i) => {
            const prefix = i === 0 ?
                getFirstLinePrefix() :
                getOtherLinePrefix(i);
            const paddingStr = strings_1.repeat(' ', largestPrefixSize - prefix.length);
            const indentStr = strings_1.repeat(' ', indent);
            return `${indentStr}${prefix}: ${paddingStr}${line}`;
        });
        return formattedLines.join('\n');
    }
    const lineDelimiter = platform_1.isWindows ? '\r\n' : '\n';
    function fileMatchToString(fileMatch, maxMatches, labelService) {
        const matchTextRows = fileMatch.matches()
            .sort(searchModel_1.searchMatchComparer)
            .slice(0, maxMatches)
            .map(match => matchToString(match, 2));
        const uriString = labelService.getUriLabel(fileMatch.resource, { noPrefix: true });
        return {
            text: `${uriString}${lineDelimiter}${matchTextRows.join(lineDelimiter)}`,
            count: matchTextRows.length
        };
    }
    function folderMatchToString(folderMatch, maxMatches, labelService) {
        const fileResults = [];
        let numMatches = 0;
        const matches = folderMatch.matches().sort(searchModel_1.searchMatchComparer);
        for (let i = 0; i < folderMatch.fileCount() && numMatches < maxMatches; i++) {
            const fileResult = fileMatchToString(matches[i], maxMatches - numMatches, labelService);
            numMatches += fileResult.count;
            fileResults.push(fileResult.text);
        }
        return {
            text: fileResults.join(lineDelimiter + lineDelimiter),
            count: numMatches
        };
    }
    const maxClipboardMatches = 1e4;
    exports.copyMatchCommand = async (accessor, match) => {
        if (!match) {
            const selection = getSelectedRow(accessor);
            if (!selection) {
                return;
            }
            match = selection;
        }
        const clipboardService = accessor.get(clipboardService_1.IClipboardService);
        const labelService = accessor.get(label_1.ILabelService);
        let text;
        if (match instanceof searchModel_1.Match) {
            text = matchToString(match);
        }
        else if (match instanceof searchModel_1.FileMatch) {
            text = fileMatchToString(match, maxClipboardMatches, labelService).text;
        }
        else if (match instanceof searchModel_1.FolderMatch) {
            text = folderMatchToString(match, maxClipboardMatches, labelService).text;
        }
        if (text) {
            await clipboardService.writeText(text);
        }
    };
    function allFolderMatchesToString(folderMatches, maxMatches, labelService) {
        const folderResults = [];
        let numMatches = 0;
        folderMatches = folderMatches.sort(searchModel_1.searchMatchComparer);
        for (let i = 0; i < folderMatches.length && numMatches < maxMatches; i++) {
            const folderResult = folderMatchToString(folderMatches[i], maxMatches - numMatches, labelService);
            if (folderResult.count) {
                numMatches += folderResult.count;
                folderResults.push(folderResult.text);
            }
        }
        return folderResults.join(lineDelimiter + lineDelimiter);
    }
    function getSelectedRow(accessor) {
        const viewsService = accessor.get(views_1.IViewsService);
        const searchView = getSearchView(viewsService);
        return searchView === null || searchView === void 0 ? void 0 : searchView.getControl().getSelection()[0];
    }
    exports.copyAllCommand = async (accessor) => {
        const viewsService = accessor.get(views_1.IViewsService);
        const clipboardService = accessor.get(clipboardService_1.IClipboardService);
        const labelService = accessor.get(label_1.ILabelService);
        const searchView = getSearchView(viewsService);
        if (searchView) {
            const root = searchView.searchResult;
            const text = allFolderMatchesToString(root.folderMatches(), maxClipboardMatches, labelService);
            await clipboardService.writeText(text);
        }
    };
    exports.clearHistoryCommand = accessor => {
        const searchHistoryService = accessor.get(searchHistoryService_1.ISearchHistoryService);
        searchHistoryService.clearHistory();
    };
    exports.focusSearchListCommand = accessor => {
        const viewsService = accessor.get(views_1.IViewsService);
        openSearchView(viewsService).then(searchView => {
            if (searchView) {
                searchView.moveFocusToResults();
            }
        });
    };
});
//# __sourceMappingURL=searchActions.js.map