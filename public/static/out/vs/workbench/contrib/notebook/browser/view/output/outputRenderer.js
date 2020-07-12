/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/browser/notebookRegistry", "vs/base/common/errors"], function (require, exports, notebookRegistry_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputRenderer = void 0;
    class OutputRenderer {
        constructor(notebookEditor, instantiationService) {
            this.instantiationService = instantiationService;
            this._contributions = {};
            this._mimeTypeMapping = {};
            let contributions = notebookRegistry_1.NotebookRegistry.getOutputTransformContributions();
            for (const desc of contributions) {
                try {
                    const contribution = this.instantiationService.createInstance(desc.ctor, notebookEditor);
                    this._contributions[desc.id] = contribution;
                    this._mimeTypeMapping[desc.kind] = contribution;
                }
                catch (err) {
                    errors_1.onUnexpectedError(err);
                }
            }
        }
        renderNoop(output, container) {
            const contentNode = document.createElement('p');
            contentNode.innerText = `No renderer could be found for output. It has the following output type: ${output.outputKind}`;
            container.appendChild(contentNode);
            return {
                hasDynamicHeight: false
            };
        }
        render(output, container, preferredMimeType) {
            let transform = this._mimeTypeMapping[output.outputKind];
            if (transform) {
                return transform.render(output, container, preferredMimeType);
            }
            else {
                return this.renderNoop(output, container);
            }
        }
    }
    exports.OutputRenderer = OutputRenderer;
});
//# __sourceMappingURL=outputRenderer.js.map