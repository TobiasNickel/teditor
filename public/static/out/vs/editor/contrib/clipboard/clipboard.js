/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/browser", "vs/base/common/platform", "vs/editor/browser/controller/textAreaInput", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/editorContextKeys", "vs/platform/actions/common/actions"], function (require, exports, nls, browser, platform, textAreaInput_1, editorExtensions_1, codeEditorService_1, editorContextKeys_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PasteAction = exports.CopyAction = exports.CutAction = void 0;
    const CLIPBOARD_CONTEXT_MENU_GROUP = '9_cutcopypaste';
    const supportsCut = (platform.isNative || document.queryCommandSupported('cut'));
    const supportsCopy = (platform.isNative || document.queryCommandSupported('copy'));
    // IE and Edge have trouble with setting html content in clipboard
    const supportsCopyWithSyntaxHighlighting = (supportsCopy && !browser.isEdge);
    // Chrome incorrectly returns true for document.queryCommandSupported('paste')
    // when the paste feature is available but the calling script has insufficient
    // privileges to actually perform the action
    const supportsPaste = (platform.isNative || (!browser.isChrome && document.queryCommandSupported('paste')));
    function registerCommand(command) {
        command.register();
        return command;
    }
    exports.CutAction = supportsCut ? registerCommand(new editorExtensions_1.MultiCommand({
        id: 'editor.action.clipboardCutAction',
        precondition: undefined,
        kbOpts: (
        // Do not bind cut keybindings in the browser,
        // since browsers do that for us and it avoids security prompts
        platform.isNative ? {
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2048 /* CtrlCmd */ | 54 /* KEY_X */,
            win: { primary: 2048 /* CtrlCmd */ | 54 /* KEY_X */, secondary: [1024 /* Shift */ | 20 /* Delete */] },
            weight: 100 /* EditorContrib */
        } : undefined),
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarEditMenu,
                group: '2_ccp',
                title: nls.localize({ key: 'miCut', comment: ['&& denotes a mnemonic'] }, "Cu&&t"),
                order: 1
            }, {
                menuId: actions_1.MenuId.EditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.cutLabel', "Cut"),
                when: editorContextKeys_1.EditorContextKeys.writable,
                order: 1,
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('actions.clipboard.cutLabel', "Cut"),
                order: 1
            }]
    })) : undefined;
    exports.CopyAction = supportsCopy ? registerCommand(new editorExtensions_1.MultiCommand({
        id: 'editor.action.clipboardCopyAction',
        precondition: undefined,
        kbOpts: (
        // Do not bind copy keybindings in the browser,
        // since browsers do that for us and it avoids security prompts
        platform.isNative ? {
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */,
            win: { primary: 2048 /* CtrlCmd */ | 33 /* KEY_C */, secondary: [2048 /* CtrlCmd */ | 19 /* Insert */] },
            weight: 100 /* EditorContrib */
        } : undefined),
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarEditMenu,
                group: '2_ccp',
                title: nls.localize({ key: 'miCopy', comment: ['&& denotes a mnemonic'] }, "&&Copy"),
                order: 2
            }, {
                menuId: actions_1.MenuId.EditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.copyLabel', "Copy"),
                order: 2,
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('actions.clipboard.copyLabel', "Copy"),
                order: 1
            }]
    })) : undefined;
    exports.PasteAction = supportsPaste ? registerCommand(new editorExtensions_1.MultiCommand({
        id: 'editor.action.clipboardPasteAction',
        precondition: undefined,
        kbOpts: (
        // Do not bind paste keybindings in the browser,
        // since browsers do that for us and it avoids security prompts
        platform.isNative ? {
            kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
            primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */,
            win: { primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */, secondary: [1024 /* Shift */ | 19 /* Insert */] },
            linux: { primary: 2048 /* CtrlCmd */ | 52 /* KEY_V */, secondary: [1024 /* Shift */ | 19 /* Insert */] },
            weight: 100 /* EditorContrib */
        } : undefined),
        menuOpts: [{
                menuId: actions_1.MenuId.MenubarEditMenu,
                group: '2_ccp',
                title: nls.localize({ key: 'miPaste', comment: ['&& denotes a mnemonic'] }, "&&Paste"),
                order: 3
            }, {
                menuId: actions_1.MenuId.EditorContext,
                group: CLIPBOARD_CONTEXT_MENU_GROUP,
                title: nls.localize('actions.clipboard.pasteLabel', "Paste"),
                when: editorContextKeys_1.EditorContextKeys.writable,
                order: 3,
            }, {
                menuId: actions_1.MenuId.CommandPalette,
                group: '',
                title: nls.localize('actions.clipboard.pasteLabel', "Paste"),
                order: 1
            }]
    })) : undefined;
    class ExecCommandCopyWithSyntaxHighlightingAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.clipboardCopyWithSyntaxHighlightingAction',
                label: nls.localize('actions.clipboard.copyWithSyntaxHighlightingLabel', "Copy With Syntax Highlighting"),
                alias: 'Copy With Syntax Highlighting',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 0,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const emptySelectionClipboard = editor.getOption(26 /* emptySelectionClipboard */);
            if (!emptySelectionClipboard && editor.getSelection().isEmpty()) {
                return;
            }
            textAreaInput_1.CopyOptions.forceCopyWithSyntaxHighlighting = true;
            editor.focus();
            document.execCommand('copy');
            textAreaInput_1.CopyOptions.forceCopyWithSyntaxHighlighting = false;
        }
    }
    function registerExecCommandImpl(target, browserCommand) {
        if (!target) {
            return;
        }
        // 1. handle case when focus is in editor.
        target.addImplementation(10000, (accessor, args) => {
            // Only if editor text focus (i.e. not if editor has widget focus).
            const focusedEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (focusedEditor && focusedEditor.hasTextFocus()) {
                if (browserCommand === 'cut' || browserCommand === 'copy') {
                    // Do not execute if there is no selection and empty selection clipboard is off
                    const emptySelectionClipboard = focusedEditor.getOption(26 /* emptySelectionClipboard */);
                    const selection = focusedEditor.getSelection();
                    if (selection && selection.isEmpty() && !emptySelectionClipboard) {
                        return true;
                    }
                }
                document.execCommand(browserCommand);
                return true;
            }
            return false;
        });
        // 2. (default) handle case when focus is somewhere else.
        target.addImplementation(0, (accessor, args) => {
            // Only if editor text focus (i.e. not if editor has widget focus).
            document.execCommand(browserCommand);
            return true;
        });
    }
    registerExecCommandImpl(exports.CutAction, 'cut');
    registerExecCommandImpl(exports.CopyAction, 'copy');
    registerExecCommandImpl(exports.PasteAction, 'paste');
    if (supportsCopyWithSyntaxHighlighting) {
        editorExtensions_1.registerEditorAction(ExecCommandCopyWithSyntaxHighlightingAction);
    }
});
//# __sourceMappingURL=clipboard.js.map