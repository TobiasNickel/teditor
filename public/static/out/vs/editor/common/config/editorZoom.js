/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorZoom = void 0;
    exports.EditorZoom = new class {
        constructor() {
            this._zoomLevel = 0;
            this._onDidChangeZoomLevel = new event_1.Emitter();
            this.onDidChangeZoomLevel = this._onDidChangeZoomLevel.event;
        }
        getZoomLevel() {
            return this._zoomLevel;
        }
        setZoomLevel(zoomLevel) {
            zoomLevel = Math.min(Math.max(-5, zoomLevel), 20);
            if (this._zoomLevel === zoomLevel) {
                return;
            }
            this._zoomLevel = zoomLevel;
            this._onDidChangeZoomLevel.fire(this._zoomLevel);
        }
    };
});
//# __sourceMappingURL=editorZoom.js.map