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
define(["require", "exports", "vs/base/common/uri", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService", "../common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/editor/common/core/range"], function (require, exports, uri_1, modeService_1, modelService_1, extHost_protocol_1, extHostCustomers_1, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadLanguages = void 0;
    let MainThreadLanguages = class MainThreadLanguages {
        constructor(_extHostContext, _modeService, _modelService) {
            this._modeService = _modeService;
            this._modelService = _modelService;
        }
        dispose() {
            // nothing
        }
        $getLanguages() {
            return Promise.resolve(this._modeService.getRegisteredModes());
        }
        $changeLanguage(resource, languageId) {
            const uri = uri_1.URI.revive(resource);
            const model = this._modelService.getModel(uri);
            if (!model) {
                return Promise.reject(new Error('Invalid uri'));
            }
            const languageIdentifier = this._modeService.getLanguageIdentifier(languageId);
            if (!languageIdentifier || languageIdentifier.language !== languageId) {
                return Promise.reject(new Error(`Unknown language id: ${languageId}`));
            }
            this._modelService.setMode(model, this._modeService.create(languageId));
            return Promise.resolve(undefined);
        }
        async $tokensAtPosition(resource, position) {
            const uri = uri_1.URI.revive(resource);
            const model = this._modelService.getModel(uri);
            if (!model) {
                return undefined;
            }
            model.tokenizeIfCheap(position.lineNumber);
            const tokens = model.getLineTokens(position.lineNumber);
            const idx = tokens.findTokenIndexAtOffset(position.column - 1);
            return {
                type: tokens.getStandardTokenType(idx),
                range: new range_1.Range(position.lineNumber, 1 + tokens.getStartOffset(idx), position.lineNumber, 1 + tokens.getEndOffset(idx))
            };
        }
    };
    MainThreadLanguages = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadLanguages),
        __param(1, modeService_1.IModeService),
        __param(2, modelService_1.IModelService)
    ], MainThreadLanguages);
    exports.MainThreadLanguages = MainThreadLanguages;
});
//# __sourceMappingURL=mainThreadLanguages.js.map