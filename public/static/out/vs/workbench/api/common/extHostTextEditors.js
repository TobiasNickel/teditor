/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/arrays", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTextEditor", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, event_1, arrays, extHost_protocol_1, extHostTextEditor_1, TypeConverters, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostEditors = void 0;
    class ExtHostEditors {
        constructor(mainContext, extHostDocumentsAndEditors) {
            this._onDidChangeTextEditorSelection = new event_1.Emitter();
            this._onDidChangeTextEditorOptions = new event_1.Emitter();
            this._onDidChangeTextEditorVisibleRanges = new event_1.Emitter();
            this._onDidChangeTextEditorViewColumn = new event_1.Emitter();
            this._onDidChangeActiveTextEditor = new event_1.Emitter();
            this._onDidChangeVisibleTextEditors = new event_1.Emitter();
            this.onDidChangeTextEditorSelection = this._onDidChangeTextEditorSelection.event;
            this.onDidChangeTextEditorOptions = this._onDidChangeTextEditorOptions.event;
            this.onDidChangeTextEditorVisibleRanges = this._onDidChangeTextEditorVisibleRanges.event;
            this.onDidChangeTextEditorViewColumn = this._onDidChangeTextEditorViewColumn.event;
            this.onDidChangeActiveTextEditor = this._onDidChangeActiveTextEditor.event;
            this.onDidChangeVisibleTextEditors = this._onDidChangeVisibleTextEditors.event;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadTextEditors);
            this._extHostDocumentsAndEditors = extHostDocumentsAndEditors;
            this._extHostDocumentsAndEditors.onDidChangeVisibleTextEditors(e => this._onDidChangeVisibleTextEditors.fire(e));
            this._extHostDocumentsAndEditors.onDidChangeActiveTextEditor(e => this._onDidChangeActiveTextEditor.fire(e));
        }
        getActiveTextEditor() {
            return this._extHostDocumentsAndEditors.activeEditor();
        }
        getVisibleTextEditors() {
            return this._extHostDocumentsAndEditors.allEditors();
        }
        async showTextDocument(document, columnOrOptions, preserveFocus) {
            let options;
            if (typeof columnOrOptions === 'number') {
                options = {
                    position: TypeConverters.ViewColumn.from(columnOrOptions),
                    preserveFocus
                };
            }
            else if (typeof columnOrOptions === 'object') {
                options = {
                    position: TypeConverters.ViewColumn.from(columnOrOptions.viewColumn),
                    preserveFocus: columnOrOptions.preserveFocus,
                    selection: typeof columnOrOptions.selection === 'object' ? TypeConverters.Range.from(columnOrOptions.selection) : undefined,
                    pinned: typeof columnOrOptions.preview === 'boolean' ? !columnOrOptions.preview : undefined
                };
            }
            else {
                options = {
                    preserveFocus: false
                };
            }
            const editorId = await this._proxy.$tryShowTextDocument(document.uri, options);
            const editor = editorId && this._extHostDocumentsAndEditors.getEditor(editorId);
            if (editor) {
                return editor;
            }
            // we have no editor... having an id means that we had an editor
            // on the main side and that it isn't the current editor anymore...
            if (editorId) {
                throw new Error(`Could NOT open editor for "${document.uri.toString()}" because another editor opened in the meantime.`);
            }
            else {
                throw new Error(`Could NOT open editor for "${document.uri.toString()}".`);
            }
        }
        createTextEditorDecorationType(options) {
            return new extHostTextEditor_1.TextEditorDecorationType(this._proxy, options);
        }
        applyWorkspaceEdit(edit) {
            const dto = TypeConverters.WorkspaceEdit.from(edit, this._extHostDocumentsAndEditors);
            return this._proxy.$tryApplyWorkspaceEdit(dto);
        }
        // --- called from main thread
        $acceptEditorPropertiesChanged(id, data) {
            const textEditor = this._extHostDocumentsAndEditors.getEditor(id);
            if (!textEditor) {
                throw new Error('unknown text editor');
            }
            // (1) set all properties
            if (data.options) {
                textEditor._acceptOptions(data.options);
            }
            if (data.selections) {
                const selections = data.selections.selections.map(TypeConverters.Selection.to);
                textEditor._acceptSelections(selections);
            }
            if (data.visibleRanges) {
                const visibleRanges = arrays.coalesce(data.visibleRanges.map(TypeConverters.Range.to));
                textEditor._acceptVisibleRanges(visibleRanges);
            }
            // (2) fire change events
            if (data.options) {
                this._onDidChangeTextEditorOptions.fire({
                    textEditor: textEditor,
                    options: Object.assign(Object.assign({}, data.options), { lineNumbers: TypeConverters.TextEditorLineNumbersStyle.to(data.options.lineNumbers) })
                });
            }
            if (data.selections) {
                const kind = extHostTypes_1.TextEditorSelectionChangeKind.fromValue(data.selections.source);
                const selections = data.selections.selections.map(TypeConverters.Selection.to);
                this._onDidChangeTextEditorSelection.fire({
                    textEditor,
                    selections,
                    kind
                });
            }
            if (data.visibleRanges) {
                const visibleRanges = arrays.coalesce(data.visibleRanges.map(TypeConverters.Range.to));
                this._onDidChangeTextEditorVisibleRanges.fire({
                    textEditor,
                    visibleRanges
                });
            }
        }
        $acceptEditorPositionData(data) {
            for (const id in data) {
                const textEditor = this._extHostDocumentsAndEditors.getEditor(id);
                if (!textEditor) {
                    throw new Error('Unknown text editor');
                }
                const viewColumn = TypeConverters.ViewColumn.to(data[id]);
                if (textEditor.viewColumn !== viewColumn) {
                    textEditor._acceptViewColumn(viewColumn);
                    this._onDidChangeTextEditorViewColumn.fire({ textEditor, viewColumn });
                }
            }
        }
        getDiffInformation(id) {
            return Promise.resolve(this._proxy.$getDiffInformation(id));
        }
    }
    exports.ExtHostEditors = ExtHostEditors;
});
//# __sourceMappingURL=extHostTextEditors.js.map