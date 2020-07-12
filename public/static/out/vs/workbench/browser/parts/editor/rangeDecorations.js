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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/services/editor/common/editorService", "vs/editor/common/model/textModel", "vs/editor/browser/editorBrowser"], function (require, exports, lifecycle_1, event_1, editorService_1, textModel_1, editorBrowser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RangeHighlightDecorations = void 0;
    let RangeHighlightDecorations = class RangeHighlightDecorations extends lifecycle_1.Disposable {
        constructor(editorService) {
            super();
            this.editorService = editorService;
            this.rangeHighlightDecorationId = null;
            this.editor = null;
            this.editorDisposables = this._register(new lifecycle_1.DisposableStore());
            this._onHighlightRemoved = this._register(new event_1.Emitter());
            this.onHighlightRemoved = this._onHighlightRemoved.event;
        }
        removeHighlightRange() {
            if (this.editor && this.editor.getModel() && this.rangeHighlightDecorationId) {
                this.editor.deltaDecorations([this.rangeHighlightDecorationId], []);
                this._onHighlightRemoved.fire();
            }
            this.rangeHighlightDecorationId = null;
        }
        highlightRange(range, editor) {
            editor = editor ? editor : this.getEditor(range);
            if (editorBrowser_1.isCodeEditor(editor)) {
                this.doHighlightRange(editor, range);
            }
        }
        doHighlightRange(editor, selectionRange) {
            this.removeHighlightRange();
            editor.changeDecorations((changeAccessor) => {
                this.rangeHighlightDecorationId = changeAccessor.addDecoration(selectionRange.range, this.createRangeHighlightDecoration(selectionRange.isWholeLine));
            });
            this.setEditor(editor);
        }
        getEditor(resourceRange) {
            const activeEditor = this.editorService.activeEditor;
            const resource = activeEditor && activeEditor.resource;
            if (resource) {
                if (resource.toString() === resourceRange.resource.toString()) {
                    return this.editorService.activeTextEditorControl;
                }
            }
            return undefined;
        }
        setEditor(editor) {
            if (this.editor !== editor) {
                this.editorDisposables.clear();
                this.editor = editor;
                this.editorDisposables.add(this.editor.onDidChangeCursorPosition((e) => {
                    if (e.reason === 0 /* NotSet */
                        || e.reason === 3 /* Explicit */
                        || e.reason === 5 /* Undo */
                        || e.reason === 6 /* Redo */) {
                        this.removeHighlightRange();
                    }
                }));
                this.editorDisposables.add(this.editor.onDidChangeModel(() => { this.removeHighlightRange(); }));
                this.editorDisposables.add(this.editor.onDidDispose(() => {
                    this.removeHighlightRange();
                    this.editor = null;
                }));
            }
        }
        createRangeHighlightDecoration(isWholeLine = true) {
            return (isWholeLine ? RangeHighlightDecorations._WHOLE_LINE_RANGE_HIGHLIGHT : RangeHighlightDecorations._RANGE_HIGHLIGHT);
        }
        dispose() {
            super.dispose();
            if (this.editor && this.editor.getModel()) {
                this.removeHighlightRange();
                this.editor = null;
            }
        }
    };
    RangeHighlightDecorations._WHOLE_LINE_RANGE_HIGHLIGHT = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        className: 'rangeHighlight',
        isWholeLine: true
    });
    RangeHighlightDecorations._RANGE_HIGHLIGHT = textModel_1.ModelDecorationOptions.register({
        stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
        className: 'rangeHighlight'
    });
    RangeHighlightDecorations = __decorate([
        __param(0, editorService_1.IEditorService)
    ], RangeHighlightDecorations);
    exports.RangeHighlightDecorations = RangeHighlightDecorations;
});
//# __sourceMappingURL=rangeDecorations.js.map