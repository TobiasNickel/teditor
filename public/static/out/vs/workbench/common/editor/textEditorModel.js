/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/workbench/common/editor", "vs/editor/common/services/modeService", "vs/editor/common/services/modelService", "vs/base/common/lifecycle", "vs/editor/common/modes/modesRegistry", "vs/base/common/types"], function (require, exports, editor_1, modeService_1, modelService_1, lifecycle_1, modesRegistry_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseTextEditorModel = void 0;
    /**
     * The base text editor model leverages the code editor model. This class is only intended to be subclassed and not instantiated.
     */
    let BaseTextEditorModel = class BaseTextEditorModel extends editor_1.EditorModel {
        constructor(modelService, modeService, textEditorModelHandle) {
            super();
            this.modelService = modelService;
            this.modeService = modeService;
            this.textEditorModelHandle = null;
            this.modelDisposeListener = this._register(new lifecycle_1.MutableDisposable());
            if (textEditorModelHandle) {
                this.handleExistingModel(textEditorModelHandle);
            }
        }
        handleExistingModel(textEditorModelHandle) {
            // We need the resource to point to an existing model
            const model = this.modelService.getModel(textEditorModelHandle);
            if (!model) {
                throw new Error(`Document with resource ${textEditorModelHandle.toString(true)} does not exist`);
            }
            this.textEditorModelHandle = textEditorModelHandle;
            // Make sure we clean up when this model gets disposed
            this.registerModelDisposeListener(model);
        }
        registerModelDisposeListener(model) {
            this.modelDisposeListener.value = model.onWillDispose(() => {
                this.textEditorModelHandle = null; // make sure we do not dispose code editor model again
                this.dispose();
            });
        }
        get textEditorModel() {
            return this.textEditorModelHandle ? this.modelService.getModel(this.textEditorModelHandle) : null;
        }
        isReadonly() {
            return true;
        }
        setMode(mode) {
            if (!this.isResolved()) {
                return;
            }
            if (!mode || mode === this.textEditorModel.getModeId()) {
                return;
            }
            this.modelService.setMode(this.textEditorModel, this.modeService.create(mode));
        }
        getMode() {
            var _a;
            return (_a = this.textEditorModel) === null || _a === void 0 ? void 0 : _a.getModeId();
        }
        /**
         * Creates the text editor model with the provided value, optional preferred mode
         * (can be comma separated for multiple values) and optional resource URL.
         */
        createTextEditorModel(value, resource, preferredMode) {
            const firstLineText = this.getFirstLineText(value);
            const languageSelection = this.getOrCreateMode(resource, this.modeService, preferredMode, firstLineText);
            return this.doCreateTextEditorModel(value, languageSelection, resource);
        }
        doCreateTextEditorModel(value, languageSelection, resource) {
            let model = resource && this.modelService.getModel(resource);
            if (!model) {
                model = this.modelService.createModel(value, languageSelection, resource);
                this.createdEditorModel = true;
                // Make sure we clean up when this model gets disposed
                this.registerModelDisposeListener(model);
            }
            else {
                this.updateTextEditorModel(value, languageSelection.languageIdentifier.language);
            }
            this.textEditorModelHandle = model.uri;
            return model;
        }
        getFirstLineText(value) {
            // text buffer factory
            const textBufferFactory = value;
            if (typeof textBufferFactory.getFirstLineText === 'function') {
                return textBufferFactory.getFirstLineText(1000 /* FIRST_LINE_DETECTION_LENGTH_LIMIT */);
            }
            // text model
            const textSnapshot = value;
            return textSnapshot.getLineContent(1).substr(0, 1000 /* FIRST_LINE_DETECTION_LENGTH_LIMIT */);
        }
        /**
         * Gets the mode for the given identifier. Subclasses can override to provide their own implementation of this lookup.
         *
         * @param firstLineText optional first line of the text buffer to set the mode on. This can be used to guess a mode from content.
         */
        getOrCreateMode(resource, modeService, preferredMode, firstLineText) {
            // lookup mode via resource path if the provided mode is unspecific
            if (!preferredMode || preferredMode === modesRegistry_1.PLAINTEXT_MODE_ID) {
                return modeService.createByFilepathOrFirstLine(types_1.withUndefinedAsNull(resource), firstLineText);
            }
            // otherwise take the preferred mode for granted
            return modeService.create(preferredMode);
        }
        /**
         * Updates the text editor model with the provided value. If the value is the same as the model has, this is a no-op.
         */
        updateTextEditorModel(newValue, preferredMode) {
            if (!this.isResolved()) {
                return;
            }
            // contents
            if (newValue) {
                this.modelService.updateModel(this.textEditorModel, newValue);
            }
            // mode (only if specific and changed)
            if (preferredMode && preferredMode !== modesRegistry_1.PLAINTEXT_MODE_ID && this.textEditorModel.getModeId() !== preferredMode) {
                this.modelService.setMode(this.textEditorModel, this.modeService.create(preferredMode));
            }
        }
        createSnapshot() {
            if (!this.textEditorModel) {
                return null;
            }
            return this.textEditorModel.createSnapshot(true /* preserve BOM */);
        }
        isResolved() {
            return !!this.textEditorModelHandle;
        }
        dispose() {
            this.modelDisposeListener.dispose(); // dispose this first because it will trigger another dispose() otherwise
            if (this.textEditorModelHandle && this.createdEditorModel) {
                this.modelService.destroyModel(this.textEditorModelHandle);
            }
            this.textEditorModelHandle = null;
            this.createdEditorModel = false;
            super.dispose();
        }
    };
    BaseTextEditorModel = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, modeService_1.IModeService)
    ], BaseTextEditorModel);
    exports.BaseTextEditorModel = BaseTextEditorModel;
});
//# __sourceMappingURL=textEditorModel.js.map