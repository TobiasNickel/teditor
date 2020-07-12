/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/notebookRegistry"], function (require, exports, DOM, notebookCommon_1, notebookRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class StreamRenderer {
        constructor(editor) {
        }
        render(output, container) {
            const contentNode = DOM.$('.output-stream');
            contentNode.innerText = output.text;
            container.appendChild(contentNode);
            return {
                hasDynamicHeight: false
            };
        }
        dispose() {
        }
    }
    notebookRegistry_1.NotebookRegistry.registerOutputTransform('notebook.output.stream', notebookCommon_1.CellOutputKind.Text, StreamRenderer);
});
//# __sourceMappingURL=streamTransform.js.map