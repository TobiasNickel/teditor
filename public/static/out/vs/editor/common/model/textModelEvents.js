/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InternalModelContentChangeEvent = exports.ModelRawContentChangedEvent = exports.ModelRawEOLChanged = exports.ModelRawLinesInserted = exports.ModelRawLinesDeleted = exports.ModelRawLineChanged = exports.ModelRawFlush = exports.RawContentChangedType = void 0;
    /**
     * @internal
     */
    var RawContentChangedType;
    (function (RawContentChangedType) {
        RawContentChangedType[RawContentChangedType["Flush"] = 1] = "Flush";
        RawContentChangedType[RawContentChangedType["LineChanged"] = 2] = "LineChanged";
        RawContentChangedType[RawContentChangedType["LinesDeleted"] = 3] = "LinesDeleted";
        RawContentChangedType[RawContentChangedType["LinesInserted"] = 4] = "LinesInserted";
        RawContentChangedType[RawContentChangedType["EOLChanged"] = 5] = "EOLChanged";
    })(RawContentChangedType = exports.RawContentChangedType || (exports.RawContentChangedType = {}));
    /**
     * An event describing that a model has been reset to a new value.
     * @internal
     */
    class ModelRawFlush {
        constructor() {
            this.changeType = 1 /* Flush */;
        }
    }
    exports.ModelRawFlush = ModelRawFlush;
    /**
     * An event describing that a line has changed in a model.
     * @internal
     */
    class ModelRawLineChanged {
        constructor(lineNumber, detail) {
            this.changeType = 2 /* LineChanged */;
            this.lineNumber = lineNumber;
            this.detail = detail;
        }
    }
    exports.ModelRawLineChanged = ModelRawLineChanged;
    /**
     * An event describing that line(s) have been deleted in a model.
     * @internal
     */
    class ModelRawLinesDeleted {
        constructor(fromLineNumber, toLineNumber) {
            this.changeType = 3 /* LinesDeleted */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ModelRawLinesDeleted = ModelRawLinesDeleted;
    /**
     * An event describing that line(s) have been inserted in a model.
     * @internal
     */
    class ModelRawLinesInserted {
        constructor(fromLineNumber, toLineNumber, detail) {
            this.changeType = 4 /* LinesInserted */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
            this.detail = detail;
        }
    }
    exports.ModelRawLinesInserted = ModelRawLinesInserted;
    /**
     * An event describing that a model has had its EOL changed.
     * @internal
     */
    class ModelRawEOLChanged {
        constructor() {
            this.changeType = 5 /* EOLChanged */;
        }
    }
    exports.ModelRawEOLChanged = ModelRawEOLChanged;
    /**
     * An event describing a change in the text of a model.
     * @internal
     */
    class ModelRawContentChangedEvent {
        constructor(changes, versionId, isUndoing, isRedoing) {
            this.changes = changes;
            this.versionId = versionId;
            this.isUndoing = isUndoing;
            this.isRedoing = isRedoing;
            this.resultingSelection = null;
        }
        containsEvent(type) {
            for (let i = 0, len = this.changes.length; i < len; i++) {
                const change = this.changes[i];
                if (change.changeType === type) {
                    return true;
                }
            }
            return false;
        }
        static merge(a, b) {
            const changes = [].concat(a.changes).concat(b.changes);
            const versionId = b.versionId;
            const isUndoing = (a.isUndoing || b.isUndoing);
            const isRedoing = (a.isRedoing || b.isRedoing);
            return new ModelRawContentChangedEvent(changes, versionId, isUndoing, isRedoing);
        }
    }
    exports.ModelRawContentChangedEvent = ModelRawContentChangedEvent;
    /**
     * @internal
     */
    class InternalModelContentChangeEvent {
        constructor(rawContentChangedEvent, contentChangedEvent) {
            this.rawContentChangedEvent = rawContentChangedEvent;
            this.contentChangedEvent = contentChangedEvent;
        }
        merge(other) {
            const rawContentChangedEvent = ModelRawContentChangedEvent.merge(this.rawContentChangedEvent, other.rawContentChangedEvent);
            const contentChangedEvent = InternalModelContentChangeEvent._mergeChangeEvents(this.contentChangedEvent, other.contentChangedEvent);
            return new InternalModelContentChangeEvent(rawContentChangedEvent, contentChangedEvent);
        }
        static _mergeChangeEvents(a, b) {
            const changes = [].concat(a.changes).concat(b.changes);
            const eol = b.eol;
            const versionId = b.versionId;
            const isUndoing = (a.isUndoing || b.isUndoing);
            const isRedoing = (a.isRedoing || b.isRedoing);
            const isFlush = (a.isFlush || b.isFlush);
            return {
                changes: changes,
                eol: eol,
                versionId: versionId,
                isUndoing: isUndoing,
                isRedoing: isRedoing,
                isFlush: isFlush
            };
        }
    }
    exports.InternalModelContentChangeEvent = InternalModelContentChangeEvent;
});
//# __sourceMappingURL=textModelEvents.js.map