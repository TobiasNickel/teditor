/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SIDE_GROUP = exports.ACTIVE_GROUP = exports.IEditorService = void 0;
    exports.IEditorService = instantiation_1.createDecorator('editorService');
    exports.ACTIVE_GROUP = -1;
    exports.SIDE_GROUP = -2;
});
//# __sourceMappingURL=editorService.js.map