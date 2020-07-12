/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/editor/browser/editorExtensions", "vs/base/common/stopwatch"], function (require, exports, nls, editorExtensions_1, stopwatch_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ForceRetokenizeAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.forceRetokenize',
                label: nls.localize('forceRetokenize', "Developer: Force Retokenize"),
                alias: 'Developer: Force Retokenize',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const model = editor.getModel();
            model.resetTokenization();
            const sw = new stopwatch_1.StopWatch(true);
            model.forceTokenization(model.getLineCount());
            sw.stop();
            console.log(`tokenization took ${sw.elapsed()}`);
        }
    }
    editorExtensions_1.registerEditorAction(ForceRetokenizeAction);
});
//# __sourceMappingURL=tokenization.js.map