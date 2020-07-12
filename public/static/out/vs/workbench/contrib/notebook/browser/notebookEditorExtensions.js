/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorExtensionsRegistry = exports.registerNotebookContribution = void 0;
    class EditorContributionRegistry {
        constructor() {
            this.editorContributions = [];
        }
        registerEditorContribution(id, ctor) {
            this.editorContributions.push({ id, ctor: ctor });
        }
        getEditorContributions() {
            return this.editorContributions.slice(0);
        }
    }
    EditorContributionRegistry.INSTANCE = new EditorContributionRegistry();
    function registerNotebookContribution(id, ctor) {
        EditorContributionRegistry.INSTANCE.registerEditorContribution(id, ctor);
    }
    exports.registerNotebookContribution = registerNotebookContribution;
    var NotebookEditorExtensionsRegistry;
    (function (NotebookEditorExtensionsRegistry) {
        function getEditorContributions() {
            return EditorContributionRegistry.INSTANCE.getEditorContributions();
        }
        NotebookEditorExtensionsRegistry.getEditorContributions = getEditorContributions;
    })(NotebookEditorExtensionsRegistry = exports.NotebookEditorExtensionsRegistry || (exports.NotebookEditorExtensionsRegistry = {}));
});
//# __sourceMappingURL=notebookEditorExtensions.js.map