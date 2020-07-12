/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/common/editor/textEditorModel", "vs/workbench/common/editor/diffEditorModel", "vs/workbench/common/editor/textDiffEditorModel", "vs/nls"], function (require, exports, editor_1, textEditorModel_1, diffEditorModel_1, textDiffEditorModel_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorInput = void 0;
    /**
     * The base editor input for the diff editor. It is made up of two editor inputs, the original version
     * and the modified version.
     */
    class DiffEditorInput extends editor_1.SideBySideEditorInput {
        constructor(name, description, originalInput, modifiedInput, forceOpenAsBinary) {
            super(name, description, originalInput, modifiedInput);
            this.name = name;
            this.originalInput = originalInput;
            this.modifiedInput = modifiedInput;
            this.forceOpenAsBinary = forceOpenAsBinary;
            this.cachedModel = undefined;
        }
        getTypeId() {
            return DiffEditorInput.ID;
        }
        getName() {
            if (!this.name) {
                return nls_1.localize('sideBySideLabels', "{0} ↔ {1}", this.originalInput.getName(), this.modifiedInput.getName());
            }
            return this.name;
        }
        async resolve() {
            // Create Model - we never reuse our cached model if refresh is true because we cannot
            // decide for the inputs within if the cached model can be reused or not. There may be
            // inputs that need to be loaded again and thus we always recreate the model and dispose
            // the previous one - if any.
            const resolvedModel = await this.createModel();
            if (this.cachedModel) {
                this.cachedModel.dispose();
            }
            this.cachedModel = resolvedModel;
            return this.cachedModel;
        }
        getPreferredEditorId(candidates) {
            return this.forceOpenAsBinary ? editor_1.BINARY_DIFF_EDITOR_ID : editor_1.TEXT_DIFF_EDITOR_ID;
        }
        async createModel() {
            // Join resolve call over two inputs and build diff editor model
            const models = await Promise.all([
                this.originalInput.resolve(),
                this.modifiedInput.resolve()
            ]);
            const originalEditorModel = models[0];
            const modifiedEditorModel = models[1];
            // If both are text models, return textdiffeditor model
            if (modifiedEditorModel instanceof textEditorModel_1.BaseTextEditorModel && originalEditorModel instanceof textEditorModel_1.BaseTextEditorModel) {
                return new textDiffEditorModel_1.TextDiffEditorModel(originalEditorModel, modifiedEditorModel);
            }
            // Otherwise return normal diff model
            return new diffEditorModel_1.DiffEditorModel(originalEditorModel, modifiedEditorModel);
        }
        matches(otherInput) {
            if (!super.matches(otherInput)) {
                return false;
            }
            return otherInput instanceof DiffEditorInput && otherInput.forceOpenAsBinary === this.forceOpenAsBinary;
        }
        dispose() {
            // Free the diff editor model but do not propagate the dispose() call to the two inputs
            // We never created the two inputs (original and modified) so we can not dispose
            // them without sideeffects.
            if (this.cachedModel) {
                this.cachedModel.dispose();
                this.cachedModel = undefined;
            }
            super.dispose();
        }
    }
    exports.DiffEditorInput = DiffEditorInput;
    DiffEditorInput.ID = 'workbench.editors.diffEditorInput';
});
//# __sourceMappingURL=diffEditorInput.js.map