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
define(["require", "exports", "vs/editor/common/services/modelService", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostCustomers", "vs/workbench/services/textfile/common/textfiles", "../common/extHost.protocol", "vs/base/common/errors"], function (require, exports, modelService_1, nls_1, instantiation_1, extHostCustomers_1, textfiles_1, extHost_protocol_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SaveParticipant = void 0;
    class ExtHostSaveParticipant {
        constructor(extHostContext) {
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDocumentSaveParticipant);
        }
        async participate(editorModel, env, _progress, token) {
            if (!editorModel.textEditorModel || !modelService_1.shouldSynchronizeModel(editorModel.textEditorModel)) {
                // the model never made it to the extension
                // host meaning we cannot participate in its save
                return undefined;
            }
            return new Promise((resolve, reject) => {
                token.onCancellationRequested(() => reject(errors_1.canceled()));
                setTimeout(() => reject(new Error(nls_1.localize('timeout.onWillSave', "Aborted onWillSaveTextDocument-event after 1750ms"))), 1750);
                this._proxy.$participateInSave(editorModel.resource, env.reason).then(values => {
                    if (!values.every(success => success)) {
                        return Promise.reject(new Error('listener failed'));
                    }
                    return undefined;
                }).then(resolve, reject);
            });
        }
    }
    // The save participant can change a model before its saved to support various scenarios like trimming trailing whitespace
    let SaveParticipant = class SaveParticipant {
        constructor(extHostContext, instantiationService, _textFileService) {
            this._textFileService = _textFileService;
            this._saveParticipantDisposable = this._textFileService.files.addSaveParticipant(instantiationService.createInstance(ExtHostSaveParticipant, extHostContext));
        }
        dispose() {
            this._saveParticipantDisposable.dispose();
        }
    };
    SaveParticipant = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, instantiation_1.IInstantiationService),
        __param(2, textfiles_1.ITextFileService)
    ], SaveParticipant);
    exports.SaveParticipant = SaveParticipant;
});
//# __sourceMappingURL=mainThreadSaveParticipant.js.map