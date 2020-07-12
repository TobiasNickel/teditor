/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/editor/common/core/rgba", "vs/editor/common/modes"], function (require, exports, event_1, rgba_1, modes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MinimapTokensColorTracker = void 0;
    class MinimapTokensColorTracker {
        constructor() {
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._updateColorMap();
            modes_1.TokenizationRegistry.onDidChange(e => {
                if (e.changedColorMap) {
                    this._updateColorMap();
                }
            });
        }
        static getInstance() {
            if (!this._INSTANCE) {
                this._INSTANCE = new MinimapTokensColorTracker();
            }
            return this._INSTANCE;
        }
        _updateColorMap() {
            const colorMap = modes_1.TokenizationRegistry.getColorMap();
            if (!colorMap) {
                this._colors = [rgba_1.RGBA8.Empty];
                this._backgroundIsLight = true;
                return;
            }
            this._colors = [rgba_1.RGBA8.Empty];
            for (let colorId = 1; colorId < colorMap.length; colorId++) {
                const source = colorMap[colorId].rgba;
                // Use a VM friendly data-type
                this._colors[colorId] = new rgba_1.RGBA8(source.r, source.g, source.b, Math.round(source.a * 255));
            }
            let backgroundLuminosity = colorMap[2 /* DefaultBackground */].getRelativeLuminance();
            this._backgroundIsLight = backgroundLuminosity >= 0.5;
            this._onDidChange.fire(undefined);
        }
        getColor(colorId) {
            if (colorId < 1 || colorId >= this._colors.length) {
                // background color (basically invisible)
                colorId = 2 /* DefaultBackground */;
            }
            return this._colors[colorId];
        }
        backgroundIsLight() {
            return this._backgroundIsLight;
        }
    }
    exports.MinimapTokensColorTracker = MinimapTokensColorTracker;
    MinimapTokensColorTracker._INSTANCE = null;
});
//# __sourceMappingURL=minimapTokensColorTracker.js.map