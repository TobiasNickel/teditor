/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/platform/contextkey/common/contextkey", "vs/base/common/cancellation", "vs/base/common/linkedList", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions"], function (require, exports, editorExtensions_1, contextkey_1, cancellation_1, linkedList_1, instantiation_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorKeybindingCancellationTokenSource = void 0;
    const IEditorCancellationTokens = instantiation_1.createDecorator('IEditorCancelService');
    const ctxCancellableOperation = new contextkey_1.RawContextKey('cancellableOperation', false);
    extensions_1.registerSingleton(IEditorCancellationTokens, class {
        constructor() {
            this._tokens = new WeakMap();
        }
        add(editor, cts) {
            let data = this._tokens.get(editor);
            if (!data) {
                data = editor.invokeWithinContext(accessor => {
                    const key = ctxCancellableOperation.bindTo(accessor.get(contextkey_1.IContextKeyService));
                    const tokens = new linkedList_1.LinkedList();
                    return { key, tokens };
                });
                this._tokens.set(editor, data);
            }
            let removeFn;
            data.key.set(true);
            removeFn = data.tokens.push(cts);
            return () => {
                // remove w/o cancellation
                if (removeFn) {
                    removeFn();
                    data.key.set(!data.tokens.isEmpty());
                    removeFn = undefined;
                }
            };
        }
        cancel(editor) {
            const data = this._tokens.get(editor);
            if (!data) {
                return;
            }
            // remove with cancellation
            const cts = data.tokens.pop();
            if (cts) {
                cts.cancel();
                data.key.set(!data.tokens.isEmpty());
            }
        }
    }, true);
    class EditorKeybindingCancellationTokenSource extends cancellation_1.CancellationTokenSource {
        constructor(editor, parent) {
            super(parent);
            this.editor = editor;
            this._unregister = editor.invokeWithinContext(accessor => accessor.get(IEditorCancellationTokens).add(editor, this));
        }
        dispose() {
            this._unregister();
            super.dispose();
        }
    }
    exports.EditorKeybindingCancellationTokenSource = EditorKeybindingCancellationTokenSource;
    editorExtensions_1.registerEditorCommand(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: 'editor.cancelOperation',
                kbOpts: {
                    weight: 100 /* EditorContrib */,
                    primary: 9 /* Escape */
                },
                precondition: ctxCancellableOperation
            });
        }
        runEditorCommand(accessor, editor) {
            accessor.get(IEditorCancellationTokens).cancel(editor);
        }
    });
});
//# __sourceMappingURL=keybindingCancellation.js.map