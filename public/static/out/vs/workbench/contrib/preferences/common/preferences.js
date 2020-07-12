/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey"], function (require, exports, instantiation_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KEYBOARD_LAYOUT_OPEN_PICKER = exports.EXTENSION_SETTING_TAG = exports.MODIFIED_SETTING_TAG = exports.KEYBINDINGS_EDITOR_SHOW_USER_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_SHOW_DEFAULT_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_COMMAND_FOCUS_KEYBINDINGS = exports.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR = exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND = exports.KEYBINDINGS_EDITOR_COMMAND_COPY = exports.KEYBINDINGS_EDITOR_COMMAND_RESET = exports.KEYBINDINGS_EDITOR_COMMAND_REMOVE = exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN = exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE = exports.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE = exports.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS = exports.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = exports.KEYBINDINGS_EDITOR_COMMAND_SEARCH = exports.CONTEXT_KEYBINDING_FOCUS = exports.CONTEXT_KEYBINDINGS_SEARCH_FOCUS = exports.CONTEXT_KEYBINDINGS_EDITOR = exports.CONTEXT_TOC_ROW_FOCUS = exports.CONTEXT_SETTINGS_SEARCH_FOCUS = exports.CONTEXT_SETTINGS_JSON_EDITOR = exports.CONTEXT_SETTINGS_EDITOR = exports.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU = exports.SETTINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = exports.IPreferencesSearchService = void 0;
    exports.IPreferencesSearchService = instantiation_1.createDecorator('preferencesSearchService');
    exports.SETTINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = 'settings.action.clearSearchResults';
    exports.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU = 'settings.action.showContextMenu';
    exports.CONTEXT_SETTINGS_EDITOR = new contextkey_1.RawContextKey('inSettingsEditor', false);
    exports.CONTEXT_SETTINGS_JSON_EDITOR = new contextkey_1.RawContextKey('inSettingsJSONEditor', false);
    exports.CONTEXT_SETTINGS_SEARCH_FOCUS = new contextkey_1.RawContextKey('inSettingsSearch', false);
    exports.CONTEXT_TOC_ROW_FOCUS = new contextkey_1.RawContextKey('settingsTocRowFocus', false);
    exports.CONTEXT_KEYBINDINGS_EDITOR = new contextkey_1.RawContextKey('inKeybindings', false);
    exports.CONTEXT_KEYBINDINGS_SEARCH_FOCUS = new contextkey_1.RawContextKey('inKeybindingsSearch', false);
    exports.CONTEXT_KEYBINDING_FOCUS = new contextkey_1.RawContextKey('keybindingFocus', false);
    exports.KEYBINDINGS_EDITOR_COMMAND_SEARCH = 'keybindings.editor.searchKeybindings';
    exports.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS = 'keybindings.editor.clearSearchResults';
    exports.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS = 'keybindings.editor.recordSearchKeys';
    exports.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE = 'keybindings.editor.toggleSortByPrecedence';
    exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE = 'keybindings.editor.defineKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN = 'keybindings.editor.defineWhenExpression';
    exports.KEYBINDINGS_EDITOR_COMMAND_REMOVE = 'keybindings.editor.removeKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_RESET = 'keybindings.editor.resetKeybinding';
    exports.KEYBINDINGS_EDITOR_COMMAND_COPY = 'keybindings.editor.copyKeybindingEntry';
    exports.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND = 'keybindings.editor.copyCommandKeybindingEntry';
    exports.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR = 'keybindings.editor.showConflicts';
    exports.KEYBINDINGS_EDITOR_COMMAND_FOCUS_KEYBINDINGS = 'keybindings.editor.focusKeybindings';
    exports.KEYBINDINGS_EDITOR_SHOW_DEFAULT_KEYBINDINGS = 'keybindings.editor.showDefaultKeybindings';
    exports.KEYBINDINGS_EDITOR_SHOW_USER_KEYBINDINGS = 'keybindings.editor.showUserKeybindings';
    exports.MODIFIED_SETTING_TAG = 'modified';
    exports.EXTENSION_SETTING_TAG = 'ext:';
    exports.KEYBOARD_LAYOUT_OPEN_PICKER = 'workbench.action.openKeyboardLayoutPicker';
});
//# __sourceMappingURL=preferences.js.map