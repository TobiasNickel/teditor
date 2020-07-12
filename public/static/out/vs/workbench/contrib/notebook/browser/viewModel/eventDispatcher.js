/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEventDispatcher = exports.NotebookCellStateChangedEvent = exports.NotebookMetadataChangedEvent = exports.NotebookLayoutChangedEvent = exports.NotebookViewEventType = void 0;
    var NotebookViewEventType;
    (function (NotebookViewEventType) {
        NotebookViewEventType[NotebookViewEventType["LayoutChanged"] = 1] = "LayoutChanged";
        NotebookViewEventType[NotebookViewEventType["MetadataChanged"] = 2] = "MetadataChanged";
        NotebookViewEventType[NotebookViewEventType["CellStateChanged"] = 3] = "CellStateChanged";
    })(NotebookViewEventType = exports.NotebookViewEventType || (exports.NotebookViewEventType = {}));
    class NotebookLayoutChangedEvent {
        constructor(source, value) {
            this.source = source;
            this.value = value;
            this.type = NotebookViewEventType.LayoutChanged;
        }
    }
    exports.NotebookLayoutChangedEvent = NotebookLayoutChangedEvent;
    class NotebookMetadataChangedEvent {
        constructor(source) {
            this.source = source;
            this.type = NotebookViewEventType.MetadataChanged;
        }
    }
    exports.NotebookMetadataChangedEvent = NotebookMetadataChangedEvent;
    class NotebookCellStateChangedEvent {
        constructor(source, cell) {
            this.source = source;
            this.cell = cell;
            this.type = NotebookViewEventType.CellStateChanged;
        }
    }
    exports.NotebookCellStateChangedEvent = NotebookCellStateChangedEvent;
    class NotebookEventDispatcher {
        constructor() {
            this._onDidChangeLayout = new event_1.Emitter();
            this.onDidChangeLayout = this._onDidChangeLayout.event;
            this._onDidChangeMetadata = new event_1.Emitter();
            this.onDidChangeMetadata = this._onDidChangeMetadata.event;
            this._onDidChangeCellState = new event_1.Emitter();
            this.onDidChangeCellState = this._onDidChangeCellState.event;
        }
        emit(events) {
            for (let i = 0, len = events.length; i < len; i++) {
                let e = events[i];
                switch (e.type) {
                    case NotebookViewEventType.LayoutChanged:
                        this._onDidChangeLayout.fire(e);
                        break;
                    case NotebookViewEventType.MetadataChanged:
                        this._onDidChangeMetadata.fire(e);
                        break;
                    case NotebookViewEventType.CellStateChanged:
                        this._onDidChangeCellState.fire(e);
                        break;
                }
            }
        }
    }
    exports.NotebookEventDispatcher = NotebookEventDispatcher;
});
//# __sourceMappingURL=eventDispatcher.js.map