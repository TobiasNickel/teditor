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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/platform/userDataSync/common/storageKeys"], function (require, exports, nls, path, lifecycle_1, editorExtensions_1, configuration_1, notification_1, storageKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LargeFileOptimizationsWarner = void 0;
    /**
     * Shows a message when opening a large file which has been memory optimized (and features disabled).
     */
    let LargeFileOptimizationsWarner = class LargeFileOptimizationsWarner extends lifecycle_1.Disposable {
        constructor(_editor, _notificationService, _configurationService, storageKeysSyncRegistryService) {
            super();
            this._editor = _editor;
            this._notificationService = _notificationService;
            this._configurationService = _configurationService;
            // opt-in to syncing
            const neverShowAgainId = 'editor.contrib.largeFileOptimizationsWarner';
            storageKeysSyncRegistryService.registerStorageKey({ key: neverShowAgainId, version: 1 });
            this._register(this._editor.onDidChangeModel((e) => {
                const model = this._editor.getModel();
                if (!model) {
                    return;
                }
                if (model.isTooLargeForTokenization()) {
                    const message = nls.localize({
                        key: 'largeFile',
                        comment: [
                            'Variable 0 will be a file name.'
                        ]
                    }, "{0}: tokenization, wrapping and folding have been turned off for this large file in order to reduce memory usage and avoid freezing or crashing.", path.basename(model.uri.path));
                    this._notificationService.prompt(notification_1.Severity.Info, message, [
                        {
                            label: nls.localize('removeOptimizations', "Forcefully enable features"),
                            run: () => {
                                this._configurationService.updateValue(`editor.largeFileOptimizations`, false).then(() => {
                                    this._notificationService.info(nls.localize('reopenFilePrompt', "Please reopen file in order for this setting to take effect."));
                                }, (err) => {
                                    this._notificationService.error(err);
                                });
                            }
                        }
                    ], { neverShowAgain: { id: neverShowAgainId } });
                }
            }));
        }
    };
    LargeFileOptimizationsWarner.ID = 'editor.contrib.largeFileOptimizationsWarner';
    LargeFileOptimizationsWarner = __decorate([
        __param(1, notification_1.INotificationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, storageKeys_1.IStorageKeysSyncRegistryService)
    ], LargeFileOptimizationsWarner);
    exports.LargeFileOptimizationsWarner = LargeFileOptimizationsWarner;
    editorExtensions_1.registerEditorContribution(LargeFileOptimizationsWarner.ID, LargeFileOptimizationsWarner);
});
//# __sourceMappingURL=largeFileOptimizations.js.map