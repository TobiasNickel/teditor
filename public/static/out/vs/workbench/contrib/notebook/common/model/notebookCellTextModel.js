/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/editor/common/model/pieceTreeTextBuffer/pieceTreeTextBufferBuilder", "vs/editor/common/core/range", "vs/base/common/lifecycle"], function (require, exports, event_1, pieceTreeTextBufferBuilder_1, range_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellTextModel = void 0;
    class NotebookCellTextModel extends lifecycle_1.Disposable {
        constructor(uri, handle, _source, _language, cellKind, outputs, metadata) {
            super();
            this.uri = uri;
            this.handle = handle;
            this._source = _source;
            this._language = _language;
            this.cellKind = cellKind;
            this._onDidChangeOutputs = new event_1.Emitter();
            this.onDidChangeOutputs = this._onDidChangeOutputs.event;
            this._onDidChangeContent = new event_1.Emitter();
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeMetadata = new event_1.Emitter();
            this.onDidChangeMetadata = this._onDidChangeMetadata.event;
            this._onDidChangeLanguage = new event_1.Emitter();
            this.onDidChangeLanguage = this._onDidChangeLanguage.event;
            this._outputs = outputs;
            this._metadata = metadata;
        }
        get outputs() {
            return this._outputs;
        }
        get metadata() {
            return this._metadata;
        }
        set metadata(newMetadata) {
            this._metadata = newMetadata;
            this._onDidChangeMetadata.fire();
        }
        get language() {
            return this._language;
        }
        set language(newLanguage) {
            this._language = newLanguage;
            this._onDidChangeLanguage.fire(newLanguage);
        }
        get textBuffer() {
            if (this._textBuffer) {
                return this._textBuffer;
            }
            let builder = new pieceTreeTextBufferBuilder_1.PieceTreeTextBufferBuilder();
            builder.acceptChunk(Array.isArray(this._source) ? this._source.join('\n') : this._source);
            const bufferFactory = builder.finish(true);
            this._textBuffer = bufferFactory.create(1 /* LF */);
            this._register(this._textBuffer.onDidChangeContent(() => {
                this._onDidChangeContent.fire();
            }));
            return this._textBuffer;
        }
        getValue() {
            const fullRange = this.getFullModelRange();
            const eol = this.textBuffer.getEOL();
            if (eol === '\n') {
                return this.textBuffer.getValueInRange(fullRange, 1 /* LF */);
            }
            else {
                return this.textBuffer.getValueInRange(fullRange, 2 /* CRLF */);
            }
        }
        getTextLength() {
            return this.textBuffer.getLength();
        }
        getFullModelRange() {
            const lineCount = this.textBuffer.getLineCount();
            return new range_1.Range(1, 1, lineCount, this.textBuffer.getLineLength(lineCount) + 1);
        }
        spliceNotebookCellOutputs(splices) {
            splices.reverse().forEach(splice => {
                this.outputs.splice(splice[0], splice[1], ...splice[2]);
            });
            this._onDidChangeOutputs.fire(splices);
        }
    }
    exports.NotebookCellTextModel = NotebookCellTextModel;
});
//# __sourceMappingURL=notebookCellTextModel.js.map