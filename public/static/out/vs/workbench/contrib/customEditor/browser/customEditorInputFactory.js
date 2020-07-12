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
define(["require", "exports", "vs/base/common/lazy", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/customEditor/browser/customEditorInput", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewEditorInputFactory", "vs/workbench/contrib/webview/browser/webviewWorkbenchService", "vs/workbench/services/backup/common/backup"], function (require, exports, lazy_1, uri_1, instantiation_1, customEditorInput_1, webview_1, webviewEditorInputFactory_1, webviewWorkbenchService_1, backup_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEditorInputFactory = void 0;
    let CustomEditorInputFactory = class CustomEditorInputFactory extends webviewEditorInputFactory_1.WebviewEditorInputFactory {
        constructor(webviewWorkbenchService, _instantiationService, _webviewService) {
            super(webviewWorkbenchService);
            this._instantiationService = _instantiationService;
            this._webviewService = _webviewService;
        }
        serialize(input) {
            const dirty = input.isDirty();
            const data = Object.assign(Object.assign({}, this.toJson(input)), { editorResource: input.resource.toJSON(), dirty, backupId: dirty ? input.backupId : undefined });
            try {
                return JSON.stringify(data);
            }
            catch (_a) {
                return undefined;
            }
        }
        fromJson(data) {
            return Object.assign(Object.assign({}, super.fromJson(data)), { editorResource: uri_1.URI.from(data.editorResource), dirty: data.dirty });
        }
        deserialize(_instantiationService, serializedEditorInput) {
            const data = this.fromJson(JSON.parse(serializedEditorInput));
            const webview = CustomEditorInputFactory.reviveWebview(data, this._webviewService);
            const customInput = this._instantiationService.createInstance(customEditorInput_1.CustomEditorInput, data.editorResource, data.viewType, data.id, webview, { startsDirty: data.dirty, backupId: data.backupId });
            if (typeof data.group === 'number') {
                customInput.updateGroup(data.group);
            }
            return customInput;
        }
        static reviveWebview(data, webviewService) {
            return new lazy_1.Lazy(() => {
                const webview = webviewService.createWebviewOverlay(data.id, {
                    enableFindWidget: data.options.enableFindWidget,
                    retainContextWhenHidden: data.options.retainContextWhenHidden
                }, data.options, data.extension);
                webview.state = data.state;
                return webview;
            });
        }
        static createCustomEditorInput(resource, instantiationService) {
            return instantiationService.invokeFunction(async (accessor) => {
                var _a, _b;
                const webviewService = accessor.get(webview_1.IWebviewService);
                const backupFileService = accessor.get(backup_1.IBackupFileService);
                const backup = await backupFileService.resolve(resource);
                if (!(backup === null || backup === void 0 ? void 0 : backup.meta)) {
                    throw new Error(`No backup found for custom editor: ${resource}`);
                }
                const backupData = backup.meta;
                const id = backupData.webview.id;
                const extension = webviewEditorInputFactory_1.reviveWebviewExtensionDescription((_a = backupData.extension) === null || _a === void 0 ? void 0 : _a.id, (_b = backupData.extension) === null || _b === void 0 ? void 0 : _b.location);
                const webview = CustomEditorInputFactory.reviveWebview({ id, options: backupData.webview.options, state: backupData.webview.state, extension, }, webviewService);
                const editor = instantiationService.createInstance(customEditorInput_1.CustomEditorInput, uri_1.URI.revive(backupData.editorResource), backupData.viewType, id, webview, { backupId: backupData.backupId });
                editor.updateGroup(0);
                return editor;
            });
        }
        static canResolveBackup(editorInput, backupResource) {
            if (editorInput instanceof customEditorInput_1.CustomEditorInput) {
                if (editorInput.resource.path === backupResource.path && backupResource.authority === editorInput.viewType) {
                    return true;
                }
            }
            return false;
        }
    };
    CustomEditorInputFactory.ID = customEditorInput_1.CustomEditorInput.typeId;
    CustomEditorInputFactory = __decorate([
        __param(0, webviewWorkbenchService_1.IWebviewWorkbenchService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, webview_1.IWebviewService)
    ], CustomEditorInputFactory);
    exports.CustomEditorInputFactory = CustomEditorInputFactory;
});
//# __sourceMappingURL=customEditorInputFactory.js.map