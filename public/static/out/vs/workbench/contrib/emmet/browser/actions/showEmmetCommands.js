/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/platform/actions/common/actions", "vs/platform/quickinput/common/quickInput"], function (require, exports, nls, editorExtensions_1, editorContextKeys_1, actions_1, quickInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const EMMET_COMMANDS_PREFIX = '>Emmet: ';
    class ShowEmmetCommandsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'workbench.action.showEmmetCommands',
                label: nls.localize('showEmmetCommands', "Show Emmet Commands"),
                alias: 'Show Emmet Commands',
                precondition: editorContextKeys_1.EditorContextKeys.writable,
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarEditMenu,
                    group: '5_insert',
                    title: nls.localize({ key: 'miShowEmmetCommands', comment: ['&& denotes a mnemonic'] }, "E&&mmet..."),
                    order: 4
                }
            });
        }
        async run(accessor, editor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.quickAccess.show(EMMET_COMMANDS_PREFIX);
        }
    }
    editorExtensions_1.registerEditorAction(ShowEmmetCommandsAction);
});
//# __sourceMappingURL=showEmmetCommands.js.map