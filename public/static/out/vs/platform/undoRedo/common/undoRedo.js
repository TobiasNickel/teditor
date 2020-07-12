/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UndoRedoElementType = exports.IUndoRedoService = void 0;
    exports.IUndoRedoService = instantiation_1.createDecorator('undoRedoService');
    var UndoRedoElementType;
    (function (UndoRedoElementType) {
        UndoRedoElementType[UndoRedoElementType["Resource"] = 0] = "Resource";
        UndoRedoElementType[UndoRedoElementType["Workspace"] = 1] = "Workspace";
    })(UndoRedoElementType = exports.UndoRedoElementType || (exports.UndoRedoElementType = {}));
});
//# __sourceMappingURL=undoRedo.js.map