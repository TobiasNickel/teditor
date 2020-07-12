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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/services/editorWorkerService", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/editor/common/services/resolverService", "vs/workbench/api/common/extHostCustomers", "../common/extHost.protocol", "vs/base/common/cancellation"], function (require, exports, errors_1, lifecycle_1, uri_1, editOperation_1, range_1, editorWorkerService_1, modelService_1, modeService_1, resolverService_1, extHostCustomers_1, extHost_protocol_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDocumentContentProviders = void 0;
    let MainThreadDocumentContentProviders = class MainThreadDocumentContentProviders {
        constructor(extHostContext, _textModelResolverService, _modeService, _modelService, _editorWorkerService) {
            this._textModelResolverService = _textModelResolverService;
            this._modeService = _modeService;
            this._modelService = _modelService;
            this._editorWorkerService = _editorWorkerService;
            this._resourceContentProvider = new Map();
            this._pendingUpdate = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDocumentContentProviders);
        }
        dispose() {
            lifecycle_1.dispose(this._resourceContentProvider.values());
            lifecycle_1.dispose(this._pendingUpdate.values());
        }
        $registerTextContentProvider(handle, scheme) {
            const registration = this._textModelResolverService.registerTextModelContentProvider(scheme, {
                provideTextContent: (uri) => {
                    return this._proxy.$provideTextDocumentContent(handle, uri).then(value => {
                        if (typeof value === 'string') {
                            const firstLineText = value.substr(0, 1 + value.search(/\r?\n/));
                            const languageSelection = this._modeService.createByFilepathOrFirstLine(uri, firstLineText);
                            return this._modelService.createModel(value, languageSelection, uri);
                        }
                        return null;
                    });
                }
            });
            this._resourceContentProvider.set(handle, registration);
        }
        $unregisterTextContentProvider(handle) {
            const registration = this._resourceContentProvider.get(handle);
            if (registration) {
                registration.dispose();
                this._resourceContentProvider.delete(handle);
            }
        }
        $onVirtualDocumentChange(uri, value) {
            const model = this._modelService.getModel(uri_1.URI.revive(uri));
            if (!model) {
                return;
            }
            // cancel and dispose an existing update
            const pending = this._pendingUpdate.get(model.id);
            if (pending) {
                pending.cancel();
            }
            // create and keep update token
            const myToken = new cancellation_1.CancellationTokenSource();
            this._pendingUpdate.set(model.id, myToken);
            this._editorWorkerService.computeMoreMinimalEdits(model.uri, [{ text: value, range: model.getFullModelRange() }]).then(edits => {
                // remove token
                this._pendingUpdate.delete(model.id);
                if (myToken.token.isCancellationRequested) {
                    // ignore this
                    return;
                }
                if (edits && edits.length > 0) {
                    // use the evil-edit as these models show in readonly-editor only
                    model.applyEdits(edits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text)));
                }
            }).catch(errors_1.onUnexpectedError);
        }
    };
    MainThreadDocumentContentProviders = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadDocumentContentProviders),
        __param(1, resolverService_1.ITextModelService),
        __param(2, modeService_1.IModeService),
        __param(3, modelService_1.IModelService),
        __param(4, editorWorkerService_1.IEditorWorkerService)
    ], MainThreadDocumentContentProviders);
    exports.MainThreadDocumentContentProviders = MainThreadDocumentContentProviders;
});
//# __sourceMappingURL=mainThreadDocumentContentProviders.js.map