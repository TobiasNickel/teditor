/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shouldSynchronizeModel = exports.IModelService = void 0;
    exports.IModelService = instantiation_1.createDecorator('modelService');
    function shouldSynchronizeModel(model) {
        return (!model.isTooLargeForSyncing() && !model.isForSimpleWidget);
    }
    exports.shouldSynchronizeModel = shouldSynchronizeModel;
});
//# __sourceMappingURL=modelService.js.map