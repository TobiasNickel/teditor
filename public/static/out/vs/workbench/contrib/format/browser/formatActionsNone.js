/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/common/modes", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/notification/common/notification", "vs/workbench/contrib/format/browser/showExtensionQuery"], function (require, exports, editorExtensions_1, editorContextKeys_1, modes_1, nls, contextkey_1, commands_1, viewlet_1, notification_1, showExtensionQuery_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    editorExtensions_1.registerEditorAction(class FormatDocumentMultipleAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatDocument.none',
                label: nls.localize('formatDocument.label.multiple', "Format Document"),
                alias: 'Format Document',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider.toNegated()),
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.editorTextFocus, editorContextKeys_1.EditorContextKeys.hasDocumentFormattingProvider.toNegated()),
                    primary: 1024 /* Shift */ | 512 /* Alt */ | 36 /* KEY_F */,
                    linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 39 /* KEY_I */ },
                    weight: 100 /* EditorContrib */,
                }
            });
        }
        async run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const commandService = accessor.get(commands_1.ICommandService);
            const viewletService = accessor.get(viewlet_1.IViewletService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const model = editor.getModel();
            const formatterCount = modes_1.DocumentFormattingEditProviderRegistry.all(model).length;
            if (formatterCount > 1) {
                return commandService.executeCommand('editor.action.formatDocument.multiple');
            }
            else if (formatterCount === 1) {
                return commandService.executeCommand('editor.action.formatDocument');
            }
            else {
                const langName = model.getLanguageIdentifier().language;
                const message = nls.localize('no.provider', "There is no formatter for '{0}' files installed.", langName);
                const choice = {
                    label: nls.localize('install.formatter', "Install Formatter..."),
                    run: () => showExtensionQuery_1.showExtensionQuery(viewletService, `category:formatters ${langName}`)
                };
                notificationService.prompt(notification_1.Severity.Info, message, [choice]);
            }
        }
    });
});
//# __sourceMappingURL=formatActionsNone.js.map