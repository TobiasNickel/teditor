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
define(["require", "exports", "vs/nls", "vs/base/common/mime", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/editor/common/services/resolverService", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugSource", "vs/editor/common/services/editorWorkerService", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/base/common/cancellation"], function (require, exports, nls_1, mime_1, modelService_1, modeService_1, resolverService_1, debug_1, debugSource_1, editorWorkerService_1, editOperation_1, range_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugContentProvider = void 0;
    /**
     * Debug URI format
     *
     * a debug URI represents a Source object and the debug session where the Source comes from.
     *
     *       debug:arbitrary_path?session=123e4567-e89b-12d3-a456-426655440000&ref=1016
     *       \___/ \____________/ \__________________________________________/ \______/
     *         |          |                             |                          |
     *      scheme   source.path                    session id            source.reference
     *
     * the arbitrary_path and the session id are encoded with 'encodeURIComponent'
     *
     */
    let DebugContentProvider = class DebugContentProvider {
        constructor(textModelResolverService, debugService, modelService, modeService, editorWorkerService) {
            this.debugService = debugService;
            this.modelService = modelService;
            this.modeService = modeService;
            this.editorWorkerService = editorWorkerService;
            this.pendingUpdates = new Map();
            textModelResolverService.registerTextModelContentProvider(debug_1.DEBUG_SCHEME, this);
            DebugContentProvider.INSTANCE = this;
        }
        dispose() {
            this.pendingUpdates.forEach(cancellationSource => cancellationSource.dispose());
        }
        provideTextContent(resource) {
            return this.createOrUpdateContentModel(resource, true);
        }
        /**
         * Reload the model content of the given resource.
         * If there is no model for the given resource, this method does nothing.
         */
        static refreshDebugContent(resource) {
            if (DebugContentProvider.INSTANCE) {
                DebugContentProvider.INSTANCE.createOrUpdateContentModel(resource, false);
            }
        }
        /**
         * Create or reload the model content of the given resource.
         */
        createOrUpdateContentModel(resource, createIfNotExists) {
            const model = this.modelService.getModel(resource);
            if (!model && !createIfNotExists) {
                // nothing to do
                return null;
            }
            let session;
            if (resource.query) {
                const data = debugSource_1.Source.getEncodedDebugData(resource);
                session = this.debugService.getModel().getSession(data.sessionId);
            }
            if (!session) {
                // fallback: use focused session
                session = this.debugService.getViewModel().focusedSession;
            }
            if (!session) {
                return Promise.reject(new Error(nls_1.localize('unable', "Unable to resolve the resource without a debug session")));
            }
            const createErrModel = (errMsg) => {
                this.debugService.sourceIsNotAvailable(resource);
                const languageSelection = this.modeService.create(mime_1.MIME_TEXT);
                const message = errMsg
                    ? nls_1.localize('canNotResolveSourceWithError', "Could not load source '{0}': {1}.", resource.path, errMsg)
                    : nls_1.localize('canNotResolveSource', "Could not load source '{0}'.", resource.path);
                return this.modelService.createModel(message, languageSelection, resource);
            };
            return session.loadSource(resource).then(response => {
                if (response && response.body) {
                    if (model) {
                        const newContent = response.body.content;
                        // cancel and dispose an existing update
                        const cancellationSource = this.pendingUpdates.get(model.id);
                        if (cancellationSource) {
                            cancellationSource.cancel();
                        }
                        // create and keep update token
                        const myToken = new cancellation_1.CancellationTokenSource();
                        this.pendingUpdates.set(model.id, myToken);
                        // update text model
                        return this.editorWorkerService.computeMoreMinimalEdits(model.uri, [{ text: newContent, range: model.getFullModelRange() }]).then(edits => {
                            // remove token
                            this.pendingUpdates.delete(model.id);
                            if (!myToken.token.isCancellationRequested && edits && edits.length > 0) {
                                // use the evil-edit as these models show in readonly-editor only
                                model.applyEdits(edits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text)));
                            }
                            return model;
                        });
                    }
                    else {
                        // create text model
                        const mime = response.body.mimeType || mime_1.guessMimeTypes(resource)[0];
                        const languageSelection = this.modeService.create(mime);
                        return this.modelService.createModel(response.body.content, languageSelection, resource);
                    }
                }
                return createErrModel();
            }, (err) => createErrModel(err.message));
        }
    };
    DebugContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, debug_1.IDebugService),
        __param(2, modelService_1.IModelService),
        __param(3, modeService_1.IModeService),
        __param(4, editorWorkerService_1.IEditorWorkerService)
    ], DebugContentProvider);
    exports.DebugContentProvider = DebugContentProvider;
});
//# __sourceMappingURL=debugContentProvider.js.map