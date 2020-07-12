/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/services/editor/common/editorService", "vs/platform/quickinput/common/quickInput", "vs/workbench/contrib/notebook/common/notebookService", "vs/nls", "vs/platform/actions/common/actions", "vs/workbench/contrib/notebook/browser/contrib/coreActions", "vs/platform/contextkey/common/contextkey"], function (require, exports, notebookBrowser_1, editorService_1, quickInput_1, notebookService_1, nls, actions_1, coreActions_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    actions_1.registerAction2(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.selectKernel',
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                title: nls.localize('notebookActions.selectKernel', "Select Notebook Kernel"),
                precondition: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_IS_ACTIVE_EDITOR, notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED),
                icon: { id: 'codicon/server-environment' },
                menu: {
                    id: actions_1.MenuId.EditorTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookBrowser_1.NOTEBOOK_EDITOR_FOCUSED, notebookBrowser_1.NOTEBOOK_HAS_MULTIPLE_KERNELS),
                    group: 'navigation',
                    order: -2,
                },
                f1: true
            });
        }
        async run(accessor, context) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const notebookService = accessor.get(notebookService_1.INotebookService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const activeEditorPane = editorService.activeEditorPane;
            if (!(activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.isNotebookEditor)) {
                return;
            }
            const editor = activeEditorPane.getControl();
            const activeKernel = editor.activeKernel;
            const availableKernels = notebookService.getContributedNotebookKernels(editor.viewModel.viewType, editor.viewModel.uri);
            const picks = availableKernels.map((a) => {
                return {
                    id: a.id,
                    label: a.label,
                    picked: a.id === (activeKernel === null || activeKernel === void 0 ? void 0 : activeKernel.id),
                    description: a.extension.value + (a.id === (activeKernel === null || activeKernel === void 0 ? void 0 : activeKernel.id)
                        ? nls.localize('currentActiveKernel', " (Currently Active)")
                        : ''),
                    run: () => {
                        editor.activeKernel = a;
                    }
                };
            });
            const provider = notebookService.getContributedNotebookProviders(editor.viewModel.uri)[0];
            if (provider.kernel) {
                picks.unshift({
                    id: provider.id,
                    label: provider.displayName,
                    picked: !activeKernel,
                    description: activeKernel === undefined
                        ? nls.localize('currentActiveBuiltinKernel', " (Currently Active)")
                        : '',
                    run: () => {
                        editor.activeKernel = undefined;
                    }
                });
            }
            const action = await quickInputService.pick(picks, { placeHolder: nls.localize('pickAction', "Select Action"), matchOnDetail: true });
            return action === null || action === void 0 ? void 0 : action.run();
        }
    });
});
//# __sourceMappingURL=editorStatus.js.map