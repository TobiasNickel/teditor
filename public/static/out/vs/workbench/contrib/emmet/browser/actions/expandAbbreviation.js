define(["require", "exports", "vs/nls", "vs/workbench/contrib/emmet/browser/emmetActions", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions"], function (require, exports, nls, emmetActions_1, editorExtensions_1, editorContextKeys_1, contextkey_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ExpandAbbreviationAction extends emmetActions_1.EmmetEditorAction {
        constructor() {
            super({
                id: 'editor.emmet.action.expandAbbreviation',
                label: nls.localize('expandAbbreviationAction', "Emmet: Expand Abbreviation"),
                alias: 'Emmet: Expand Abbreviation',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                actionName: 'expand_abbreviation',
                kbOpts: {
                    primary: 2 /* Tab */,
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus, editorContextKeys_1.EditorContextKeys.tabDoesNotMoveFocus, contextkey_1.ContextKeyExpr.has('config.emmet.triggerExpansionOnTab')),
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarEditMenu,
                    group: '5_insert',
                    title: nls.localize({ key: 'miEmmetExpandAbbreviation', comment: ['&& denotes a mnemonic'] }, "Emmet: E&&xpand Abbreviation"),
                    order: 3
                }
            });
        }
    }
    editorExtensions_1.registerEditorAction(ExpandAbbreviationAction);
});
//# __sourceMappingURL=expandAbbreviation.js.map