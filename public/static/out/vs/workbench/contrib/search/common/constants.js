/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MatchFocusKey = exports.FolderFocusKey = exports.FileFocusKey = exports.FileMatchOrFolderMatchWithResourceFocusKey = exports.FileMatchOrFolderMatchFocusKey = exports.FileMatchOrMatchFocusKey = exports.FirstMatchFocusKey = exports.HasSearchResults = exports.ReplaceActiveKey = exports.PatternExcludesFocusedKey = exports.PatternIncludesFocusedKey = exports.ReplaceInputBoxFocusedKey = exports.SearchInputBoxFocusedKey = exports.InputBoxFocusedKey = exports.SearchViewFocusedKey = exports.SearchViewVisibleKey = exports.RevealInSideBarForSearchResults = exports.AddCursorsAtSearchResults = exports.ToggleRegexCommandId = exports.ToggleWholeWordCommandId = exports.ToggleCaseSensitiveCommandId = exports.CloseReplaceWidgetActionId = exports.ReplaceAllInFolderActionId = exports.ReplaceAllInFileActionId = exports.ReplaceActionId = exports.FocusSearchListCommandID = exports.ClearSearchHistoryCommandId = exports.OpenInEditorCommandId = exports.CopyAllCommandId = exports.CopyMatchCommandId = exports.CopyPathCommandId = exports.RemoveActionId = exports.CancelActionId = exports.OpenMatchToSide = exports.FocusSearchFromResults = exports.FocusActiveEditorCommandId = exports.FindInFilesActionId = void 0;
    exports.FindInFilesActionId = 'workbench.action.findInFiles';
    exports.FocusActiveEditorCommandId = 'search.action.focusActiveEditor';
    exports.FocusSearchFromResults = 'search.action.focusSearchFromResults';
    exports.OpenMatchToSide = 'search.action.openResultToSide';
    exports.CancelActionId = 'search.action.cancel';
    exports.RemoveActionId = 'search.action.remove';
    exports.CopyPathCommandId = 'search.action.copyPath';
    exports.CopyMatchCommandId = 'search.action.copyMatch';
    exports.CopyAllCommandId = 'search.action.copyAll';
    exports.OpenInEditorCommandId = 'search.action.openInEditor';
    exports.ClearSearchHistoryCommandId = 'search.action.clearHistory';
    exports.FocusSearchListCommandID = 'search.action.focusSearchList';
    exports.ReplaceActionId = 'search.action.replace';
    exports.ReplaceAllInFileActionId = 'search.action.replaceAllInFile';
    exports.ReplaceAllInFolderActionId = 'search.action.replaceAllInFolder';
    exports.CloseReplaceWidgetActionId = 'closeReplaceInFilesWidget';
    exports.ToggleCaseSensitiveCommandId = 'toggleSearchCaseSensitive';
    exports.ToggleWholeWordCommandId = 'toggleSearchWholeWord';
    exports.ToggleRegexCommandId = 'toggleSearchRegex';
    exports.AddCursorsAtSearchResults = 'addCursorsAtSearchResults';
    exports.RevealInSideBarForSearchResults = 'search.action.revealInSideBar';
    exports.SearchViewVisibleKey = new contextkey_1.RawContextKey('searchViewletVisible', true);
    exports.SearchViewFocusedKey = new contextkey_1.RawContextKey('searchViewletFocus', false);
    exports.InputBoxFocusedKey = new contextkey_1.RawContextKey('inputBoxFocus', false);
    exports.SearchInputBoxFocusedKey = new contextkey_1.RawContextKey('searchInputBoxFocus', false);
    exports.ReplaceInputBoxFocusedKey = new contextkey_1.RawContextKey('replaceInputBoxFocus', false);
    exports.PatternIncludesFocusedKey = new contextkey_1.RawContextKey('patternIncludesInputBoxFocus', false);
    exports.PatternExcludesFocusedKey = new contextkey_1.RawContextKey('patternExcludesInputBoxFocus', false);
    exports.ReplaceActiveKey = new contextkey_1.RawContextKey('replaceActive', false);
    exports.HasSearchResults = new contextkey_1.RawContextKey('hasSearchResult', false);
    exports.FirstMatchFocusKey = new contextkey_1.RawContextKey('firstMatchFocus', false);
    exports.FileMatchOrMatchFocusKey = new contextkey_1.RawContextKey('fileMatchOrMatchFocus', false); // This is actually, Match or File or Folder
    exports.FileMatchOrFolderMatchFocusKey = new contextkey_1.RawContextKey('fileMatchOrFolderMatchFocus', false);
    exports.FileMatchOrFolderMatchWithResourceFocusKey = new contextkey_1.RawContextKey('fileMatchOrFolderMatchWithResourceFocus', false); // Excludes "Other files"
    exports.FileFocusKey = new contextkey_1.RawContextKey('fileMatchFocus', false);
    exports.FolderFocusKey = new contextkey_1.RawContextKey('folderMatchFocus', false);
    exports.MatchFocusKey = new contextkey_1.RawContextKey('matchFocus', false);
});
//# __sourceMappingURL=constants.js.map