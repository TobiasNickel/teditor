/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/model", "vs/platform/theme/common/themeService", "vs/editor/common/view/editorColorRegistry", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/base/common/types", "vs/base/common/functional"], function (require, exports, model_1, themeService_1, editorColorRegistry_1, lifecycle_1, editorBrowser_1, types_1, functional_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractEditorNavigationQuickAccessProvider = void 0;
    /**
     * A reusable quick access provider for the editor with support
     * for adding decorations for navigating in the currently active file
     * (for example "Go to line", "Go to symbol").
     */
    class AbstractEditorNavigationQuickAccessProvider {
        constructor(options) {
            this.options = options;
            //#endregion
            //#region Decorations Utils
            this.rangeHighlightDecorationId = undefined;
        }
        //#region Provider methods
        provide(picker, token) {
            var _a;
            const disposables = new lifecycle_1.DisposableStore();
            // Apply options if any
            picker.canAcceptInBackground = !!((_a = this.options) === null || _a === void 0 ? void 0 : _a.canAcceptInBackground);
            // Disable filtering & sorting, we control the results
            picker.matchOnLabel = picker.matchOnDescription = picker.matchOnDetail = picker.sortByLabel = false;
            // Provide based on current active editor
            const pickerDisposable = disposables.add(new lifecycle_1.MutableDisposable());
            pickerDisposable.value = this.doProvide(picker, token);
            // Re-create whenever the active editor changes
            disposables.add(this.onDidActiveTextEditorControlChange(() => {
                // Clear old
                pickerDisposable.value = undefined;
                // Add new
                pickerDisposable.value = this.doProvide(picker, token);
            }));
            return disposables;
        }
        doProvide(picker, token) {
            const disposables = new lifecycle_1.DisposableStore();
            // With text control
            const editor = this.activeTextEditorControl;
            if (editor && this.canProvideWithTextEditor(editor)) {
                // Restore any view state if this picker was closed
                // without actually going to a line
                const codeEditor = editorBrowser_1.getCodeEditor(editor);
                if (codeEditor) {
                    // Remember view state and update it when the cursor position
                    // changes even later because it could be that the user has
                    // configured quick access to remain open when focus is lost and
                    // we always want to restore the current location.
                    let lastKnownEditorViewState = types_1.withNullAsUndefined(editor.saveViewState());
                    disposables.add(codeEditor.onDidChangeCursorPosition(() => {
                        lastKnownEditorViewState = types_1.withNullAsUndefined(editor.saveViewState());
                    }));
                    disposables.add(functional_1.once(token.onCancellationRequested)(() => {
                        if (lastKnownEditorViewState && editor === this.activeTextEditorControl) {
                            editor.restoreViewState(lastKnownEditorViewState);
                        }
                    }));
                }
                // Clean up decorations on dispose
                disposables.add(lifecycle_1.toDisposable(() => this.clearDecorations(editor)));
                // Ask subclass for entries
                disposables.add(this.provideWithTextEditor(editor, picker, token));
            }
            // Without text control
            else {
                disposables.add(this.provideWithoutTextEditor(picker, token));
            }
            return disposables;
        }
        /**
         * Subclasses to implement if they can operate on the text editor.
         */
        canProvideWithTextEditor(editor) {
            return true;
        }
        gotoLocation(editor, options) {
            editor.setSelection(options.range);
            editor.revealRangeInCenter(options.range, 0 /* Smooth */);
            if (!options.preserveFocus) {
                editor.focus();
            }
        }
        getModel(editor) {
            var _a;
            return editorBrowser_1.isDiffEditor(editor) ? (_a = editor.getModel()) === null || _a === void 0 ? void 0 : _a.modified :
                editor.getModel();
        }
        addDecorations(editor, range) {
            editor.changeDecorations(changeAccessor => {
                // Reset old decorations if any
                const deleteDecorations = [];
                if (this.rangeHighlightDecorationId) {
                    deleteDecorations.push(this.rangeHighlightDecorationId.overviewRulerDecorationId);
                    deleteDecorations.push(this.rangeHighlightDecorationId.rangeHighlightId);
                    this.rangeHighlightDecorationId = undefined;
                }
                // Add new decorations for the range
                const newDecorations = [
                    // highlight the entire line on the range
                    {
                        range,
                        options: {
                            className: 'rangeHighlight',
                            isWholeLine: true
                        }
                    },
                    // also add overview ruler highlight
                    {
                        range,
                        options: {
                            overviewRuler: {
                                color: themeService_1.themeColorFromId(editorColorRegistry_1.overviewRulerRangeHighlight),
                                position: model_1.OverviewRulerLane.Full
                            }
                        }
                    }
                ];
                const [rangeHighlightId, overviewRulerDecorationId] = changeAccessor.deltaDecorations(deleteDecorations, newDecorations);
                this.rangeHighlightDecorationId = { rangeHighlightId, overviewRulerDecorationId };
            });
        }
        clearDecorations(editor) {
            const rangeHighlightDecorationId = this.rangeHighlightDecorationId;
            if (rangeHighlightDecorationId) {
                editor.changeDecorations(changeAccessor => {
                    changeAccessor.deltaDecorations([
                        rangeHighlightDecorationId.overviewRulerDecorationId,
                        rangeHighlightDecorationId.rangeHighlightId
                    ], []);
                });
                this.rangeHighlightDecorationId = undefined;
            }
        }
    }
    exports.AbstractEditorNavigationQuickAccessProvider = AbstractEditorNavigationQuickAccessProvider;
});
//# __sourceMappingURL=editorNavigationQuickAccess.js.map