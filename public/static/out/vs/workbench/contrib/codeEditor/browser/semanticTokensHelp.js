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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/services/editor/common/editorService", "vs/platform/userDataSync/common/storageKeys", "vs/platform/storage/common/storage"], function (require, exports, nls, path, lifecycle_1, editorBrowser_1, editorExtensions_1, notification_1, opener_1, uri_1, workbenchThemeService_1, editorService_1, storageKeys_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SemanticTokensHelp = void 0;
    /**
     * Shows a message when semantic tokens are shown the first time.
     */
    let SemanticTokensHelp = class SemanticTokensHelp extends lifecycle_1.Disposable {
        constructor(_editor, _notificationService, _openerService, _themeService, _editorService, _storageService, storageKeysSyncRegistryService) {
            super();
            // opt-in to syncing
            const neverShowAgainId = 'editor.contrib.semanticTokensHelp';
            if (_storageService.getBoolean(neverShowAgainId, 0 /* GLOBAL */)) {
                return;
            }
            storageKeysSyncRegistryService.registerStorageKey({ key: neverShowAgainId, version: 1 });
            const toDispose = this._register(new lifecycle_1.DisposableStore());
            const localToDispose = toDispose.add(new lifecycle_1.DisposableStore());
            const installChangeTokenListener = (model) => {
                localToDispose.add(model.onDidChangeTokens((e) => {
                    if (!e.semanticTokensApplied) {
                        return;
                    }
                    if (_storageService.getBoolean(neverShowAgainId, 0 /* GLOBAL */)) {
                        toDispose.dispose();
                        return;
                    }
                    const activeEditorControl = _editorService.activeTextEditorControl;
                    if (!editorBrowser_1.isCodeEditor(activeEditorControl) || activeEditorControl.getModel() !== model) {
                        return; // only show if model is in the active code editor
                    }
                    toDispose.dispose(); // uninstall all listeners, make sure the notification is only shown once per window
                    _storageService.store(neverShowAgainId, true, 0 /* GLOBAL */); // never show again
                    const message = nls.localize({
                        key: 'semanticTokensHelp',
                        comment: [
                            'Variable 0 will be a file name.',
                            'Variable 1 will be a theme name.'
                        ]
                    }, "Code coloring of '{0}' has been updated as the theme '{1}' has [semantic highlighting](https://go.microsoft.com/fwlink/?linkid=2122588) enabled.", path.basename(model.uri.path), _themeService.getColorTheme().label);
                    _notificationService.prompt(notification_1.Severity.Info, message, [
                        {
                            label: nls.localize('learnMoreButton', "Learn More"),
                            run: () => {
                                const url = 'https://go.microsoft.com/fwlink/?linkid=2122588';
                                _openerService.open(uri_1.URI.parse(url));
                            }
                        }
                    ]);
                }));
            };
            const model = _editor.getModel();
            if (model !== null) {
                installChangeTokenListener(model);
            }
            toDispose.add(_editor.onDidChangeModel((e) => {
                localToDispose.clear();
                const model = _editor.getModel();
                if (!model) {
                    return;
                }
                installChangeTokenListener(model);
            }));
        }
    };
    SemanticTokensHelp.ID = 'editor.contrib.semanticHighlightHelp';
    SemanticTokensHelp = __decorate([
        __param(1, notification_1.INotificationService),
        __param(2, opener_1.IOpenerService),
        __param(3, workbenchThemeService_1.IWorkbenchThemeService),
        __param(4, editorService_1.IEditorService),
        __param(5, storage_1.IStorageService),
        __param(6, storageKeys_1.IStorageKeysSyncRegistryService)
    ], SemanticTokensHelp);
    exports.SemanticTokensHelp = SemanticTokensHelp;
    editorExtensions_1.registerEditorContribution(SemanticTokensHelp.ID, SemanticTokensHelp);
});
//# __sourceMappingURL=semanticTokensHelp.js.map