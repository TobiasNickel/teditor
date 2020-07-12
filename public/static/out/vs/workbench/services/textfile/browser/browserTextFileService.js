/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/textfile/browser/textFileService", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/extensions"], function (require, exports, textFileService_1, textfiles_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserTextFileService = void 0;
    class BrowserTextFileService extends textFileService_1.AbstractTextFileService {
        get encoding() {
            if (!this._browserEncoding) {
                this._browserEncoding = this._register(this.instantiationService.createInstance(BrowserEncodingOracle));
            }
            return this._browserEncoding;
        }
        registerListeners() { 
            super.registerListeners();
            // Lifecycle
            this.lifecycleService.onBeforeShutdown(event => event.veto(this.onBeforeShutdown(event.reason)));
        }
        onBeforeShutdown(reason) {
            if (this.files.models.some(model => model.hasState(2 /* PENDING_SAVE */))) {
                console.warn('Unload prevented: pending file saves');
                return true; // files are pending to be saved: veto
            }
            return false;
        }
    }
    exports.BrowserTextFileService = BrowserTextFileService;
    class BrowserEncodingOracle extends textFileService_1.EncodingOracle {
        async getPreferredWriteEncoding() {
            return { encoding: 'utf8', hasBOM: false };
        }
        async getWriteEncoding() {
            return { encoding: 'utf8', addBOM: false };
        }
        async getReadEncoding() {
            return 'utf8';
        }
    }
    extensions_1.registerSingleton(textfiles_1.ITextFileService, BrowserTextFileService);
});
//# __sourceMappingURL=browserTextFileService.js.map