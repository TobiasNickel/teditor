/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor"], function (require, exports, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorModel = void 0;
    /**
     * The base editor model for the diff editor. It is made up of two editor models, the original version
     * and the modified version.
     */
    class DiffEditorModel extends editor_1.EditorModel {
        constructor(originalModel, modifiedModel) {
            super();
            this._originalModel = originalModel;
            this._modifiedModel = modifiedModel;
        }
        get originalModel() { return this._originalModel; }
        get modifiedModel() { return this._modifiedModel; }
        async load() {
            var _a, _b;
            await Promise.all([
                (_a = this._originalModel) === null || _a === void 0 ? void 0 : _a.load(),
                (_b = this._modifiedModel) === null || _b === void 0 ? void 0 : _b.load(),
            ]);
            return this;
        }
        isResolved() {
            return this.originalModel instanceof editor_1.EditorModel && this.originalModel.isResolved() && this.modifiedModel instanceof editor_1.EditorModel && this.modifiedModel.isResolved();
        }
        dispose() {
            // Do not propagate the dispose() call to the two models inside. We never created the two models
            // (original and modified) so we can not dispose them without sideeffects. Rather rely on the
            // models getting disposed when their related inputs get disposed from the diffEditorInput.
            super.dispose();
        }
    }
    exports.DiffEditorModel = DiffEditorModel;
});
//# __sourceMappingURL=diffEditorModel.js.map