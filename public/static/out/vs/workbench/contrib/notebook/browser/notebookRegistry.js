/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookRegistry = void 0;
    exports.NotebookRegistry = new class NotebookRegistryImpl {
        constructor() {
            this.outputTransforms = [];
        }
        registerOutputTransform(id, kind, ctor) {
            this.outputTransforms.push({ id: id, kind: kind, ctor: ctor });
        }
        getOutputTransformContributions() {
            return this.outputTransforms.slice(0);
        }
    };
});
//# __sourceMappingURL=notebookRegistry.js.map