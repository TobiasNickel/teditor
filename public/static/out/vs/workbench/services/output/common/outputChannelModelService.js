/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/output/common/outputChannelModel", "vs/platform/instantiation/common/extensions"], function (require, exports, outputChannelModel_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputChannelModelService = void 0;
    class OutputChannelModelService extends outputChannelModel_1.AsbtractOutputChannelModelService {
    }
    exports.OutputChannelModelService = OutputChannelModelService;
    extensions_1.registerSingleton(outputChannelModel_1.IOutputChannelModelService, OutputChannelModelService);
});
//# __sourceMappingURL=outputChannelModelService.js.map