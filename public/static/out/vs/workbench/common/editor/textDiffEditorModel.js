/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor/diffEditorModel"], function (require, exports, diffEditorModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextDiffEditorModel = void 0;
    /**
     * The base text editor model for the diff editor. It is made up of two text editor models, the original version
     * and the modified version.
     */
    class TextDiffEditorModel extends diffEditorModel_1.DiffEditorModel {
        constructor(originalModel, modifiedModel) {
            super(originalModel, modifiedModel);
            this._textDiffEditorModel = null;
            this._originalModel = originalModel;
            this._modifiedModel = modifiedModel;
            this.updateTextDiffEditorModel();
        }
        get originalModel() { return this._originalModel; }
        get modifiedModel() { return this._modifiedModel; }
        get textDiffEditorModel() { return this._textDiffEditorModel; }
        async load() {
            await super.load();
            this.updateTextDiffEditorModel();
            return this;
        }
        updateTextDiffEditorModel() {
            var _a, _b;
            if (((_a = this.originalModel) === null || _a === void 0 ? void 0 : _a.isResolved()) && ((_b = this.modifiedModel) === null || _b === void 0 ? void 0 : _b.isResolved())) {
                // Create new
                if (!this._textDiffEditorModel) {
                    this._textDiffEditorModel = {
                        original: this.originalModel.textEditorModel,
                        modified: this.modifiedModel.textEditorModel
                    };
                }
                // Update existing
                else {
                    this._textDiffEditorModel.original = this.originalModel.textEditorModel;
                    this._textDiffEditorModel.modified = this.modifiedModel.textEditorModel;
                }
            }
        }
        isResolved() {
            return !!this._textDiffEditorModel;
        }
        isReadonly() {
            return !!this.modifiedModel && this.modifiedModel.isReadonly();
        }
        dispose() {
            // Free the diff editor model but do not propagate the dispose() call to the two models
            // inside. We never created the two models (original and modified) so we can not dispose
            // them without sideeffects. Rather rely on the models getting disposed when their related
            // inputs get disposed from the diffEditorInput.
            this._textDiffEditorModel = null;
            super.dispose();
        }
    }
    exports.TextDiffEditorModel = TextDiffEditorModel;
});
//# __sourceMappingURL=textDiffEditorModel.js.map