/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range"], function (require, exports, range_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditOperation = void 0;
    class EditOperation {
        static insert(position, text) {
            return {
                range: new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: text,
                forceMoveMarkers: true
            };
        }
        static delete(range) {
            return {
                range: range,
                text: null
            };
        }
        static replace(range, text) {
            return {
                range: range,
                text: text
            };
        }
        static replaceMove(range, text) {
            return {
                range: range,
                text: text,
                forceMoveMarkers: true
            };
        }
    }
    exports.EditOperation = EditOperation;
});
//# __sourceMappingURL=editOperation.js.map