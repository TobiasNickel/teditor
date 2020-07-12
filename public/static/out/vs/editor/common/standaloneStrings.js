/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleServicesNLS = exports.ToggleHighContrastNLS = exports.StandaloneCodeEditorNLS = exports.QuickOutlineNLS = exports.QuickCommandNLS = exports.QuickHelpNLS = exports.GoToLineNLS = exports.InspectTokensNLS = exports.AccessibilityHelpNLS = void 0;
    var AccessibilityHelpNLS;
    (function (AccessibilityHelpNLS) {
        AccessibilityHelpNLS.noSelection = nls.localize("noSelection", "No selection");
        AccessibilityHelpNLS.singleSelectionRange = nls.localize("singleSelectionRange", "Line {0}, Column {1} ({2} selected)");
        AccessibilityHelpNLS.singleSelection = nls.localize("singleSelection", "Line {0}, Column {1}");
        AccessibilityHelpNLS.multiSelectionRange = nls.localize("multiSelectionRange", "{0} selections ({1} characters selected)");
        AccessibilityHelpNLS.multiSelection = nls.localize("multiSelection", "{0} selections");
        AccessibilityHelpNLS.emergencyConfOn = nls.localize("emergencyConfOn", "Now changing the setting `accessibilitySupport` to 'on'.");
        AccessibilityHelpNLS.openingDocs = nls.localize("openingDocs", "Now opening the Editor Accessibility documentation page.");
        AccessibilityHelpNLS.readonlyDiffEditor = nls.localize("readonlyDiffEditor", " in a read-only pane of a diff editor.");
        AccessibilityHelpNLS.editableDiffEditor = nls.localize("editableDiffEditor", " in a pane of a diff editor.");
        AccessibilityHelpNLS.readonlyEditor = nls.localize("readonlyEditor", " in a read-only code editor");
        AccessibilityHelpNLS.editableEditor = nls.localize("editableEditor", " in a code editor");
        AccessibilityHelpNLS.changeConfigToOnMac = nls.localize("changeConfigToOnMac", "To configure the editor to be optimized for usage with a Screen Reader press Command+E now.");
        AccessibilityHelpNLS.changeConfigToOnWinLinux = nls.localize("changeConfigToOnWinLinux", "To configure the editor to be optimized for usage with a Screen Reader press Control+E now.");
        AccessibilityHelpNLS.auto_on = nls.localize("auto_on", "The editor is configured to be optimized for usage with a Screen Reader.");
        AccessibilityHelpNLS.auto_off = nls.localize("auto_off", "The editor is configured to never be optimized for usage with a Screen Reader, which is not the case at this time.");
        AccessibilityHelpNLS.tabFocusModeOnMsg = nls.localize("tabFocusModeOnMsg", "Pressing Tab in the current editor will move focus to the next focusable element. Toggle this behavior by pressing {0}.");
        AccessibilityHelpNLS.tabFocusModeOnMsgNoKb = nls.localize("tabFocusModeOnMsgNoKb", "Pressing Tab in the current editor will move focus to the next focusable element. The command {0} is currently not triggerable by a keybinding.");
        AccessibilityHelpNLS.tabFocusModeOffMsg = nls.localize("tabFocusModeOffMsg", "Pressing Tab in the current editor will insert the tab character. Toggle this behavior by pressing {0}.");
        AccessibilityHelpNLS.tabFocusModeOffMsgNoKb = nls.localize("tabFocusModeOffMsgNoKb", "Pressing Tab in the current editor will insert the tab character. The command {0} is currently not triggerable by a keybinding.");
        AccessibilityHelpNLS.openDocMac = nls.localize("openDocMac", "Press Command+H now to open a browser window with more information related to editor accessibility.");
        AccessibilityHelpNLS.openDocWinLinux = nls.localize("openDocWinLinux", "Press Control+H now to open a browser window with more information related to editor accessibility.");
        AccessibilityHelpNLS.outroMsg = nls.localize("outroMsg", "You can dismiss this tooltip and return to the editor by pressing Escape or Shift+Escape.");
        AccessibilityHelpNLS.showAccessibilityHelpAction = nls.localize("showAccessibilityHelpAction", "Show Accessibility Help");
    })(AccessibilityHelpNLS = exports.AccessibilityHelpNLS || (exports.AccessibilityHelpNLS = {}));
    var InspectTokensNLS;
    (function (InspectTokensNLS) {
        InspectTokensNLS.inspectTokensAction = nls.localize('inspectTokens', "Developer: Inspect Tokens");
    })(InspectTokensNLS = exports.InspectTokensNLS || (exports.InspectTokensNLS = {}));
    var GoToLineNLS;
    (function (GoToLineNLS) {
        GoToLineNLS.gotoLineActionLabel = nls.localize('gotoLineActionLabel', "Go to Line/Column...");
    })(GoToLineNLS = exports.GoToLineNLS || (exports.GoToLineNLS = {}));
    var QuickHelpNLS;
    (function (QuickHelpNLS) {
        QuickHelpNLS.helpQuickAccessActionLabel = nls.localize('helpQuickAccess', "Show all Quick Access Providers");
    })(QuickHelpNLS = exports.QuickHelpNLS || (exports.QuickHelpNLS = {}));
    var QuickCommandNLS;
    (function (QuickCommandNLS) {
        QuickCommandNLS.quickCommandActionLabel = nls.localize('quickCommandActionLabel', "Command Palette");
        QuickCommandNLS.quickCommandHelp = nls.localize('quickCommandActionHelp', "Show And Run Commands");
    })(QuickCommandNLS = exports.QuickCommandNLS || (exports.QuickCommandNLS = {}));
    var QuickOutlineNLS;
    (function (QuickOutlineNLS) {
        QuickOutlineNLS.quickOutlineActionLabel = nls.localize('quickOutlineActionLabel', "Go to Symbol...");
        QuickOutlineNLS.quickOutlineByCategoryActionLabel = nls.localize('quickOutlineByCategoryActionLabel', "Go to Symbol by Category...");
    })(QuickOutlineNLS = exports.QuickOutlineNLS || (exports.QuickOutlineNLS = {}));
    var StandaloneCodeEditorNLS;
    (function (StandaloneCodeEditorNLS) {
        StandaloneCodeEditorNLS.editorViewAccessibleLabel = nls.localize('editorViewAccessibleLabel', "Editor content");
        StandaloneCodeEditorNLS.accessibilityHelpMessage = nls.localize('accessibilityHelpMessage', "Press Alt+F1 for Accessibility Options.");
    })(StandaloneCodeEditorNLS = exports.StandaloneCodeEditorNLS || (exports.StandaloneCodeEditorNLS = {}));
    var ToggleHighContrastNLS;
    (function (ToggleHighContrastNLS) {
        ToggleHighContrastNLS.toggleHighContrast = nls.localize('toggleHighContrast', "Toggle High Contrast Theme");
    })(ToggleHighContrastNLS = exports.ToggleHighContrastNLS || (exports.ToggleHighContrastNLS = {}));
    var SimpleServicesNLS;
    (function (SimpleServicesNLS) {
        SimpleServicesNLS.bulkEditServiceSummary = nls.localize('bulkEditServiceSummary', "Made {0} edits in {1} files");
    })(SimpleServicesNLS = exports.SimpleServicesNLS || (exports.SimpleServicesNLS = {}));
});
//# __sourceMappingURL=standaloneStrings.js.map