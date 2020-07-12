/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/selection"], function (require, exports, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InPlaceReplaceCommand = void 0;
    class InPlaceReplaceCommand {
        constructor(editRange, originalSelection, text) {
            this._editRange = editRange;
            this._originalSelection = originalSelection;
            this._text = text;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(this._editRange, this._text);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            const srcRange = inverseEditOperations[0].range;
            if (!this._originalSelection.isEmpty()) {
                // Preserve selection and extends to typed text
                return new selection_1.Selection(srcRange.endLineNumber, srcRange.endColumn - this._text.length, srcRange.endLineNumber, srcRange.endColumn);
            }
            return new selection_1.Selection(srcRange.endLineNumber, Math.min(this._originalSelection.positionColumn, srcRange.endColumn), srcRange.endLineNumber, Math.min(this._originalSelection.positionColumn, srcRange.endColumn));
        }
    }
    exports.InPlaceReplaceCommand = InPlaceReplaceCommand;
});
//# __sourceMappingURL=inPlaceReplaceCommand.js.map