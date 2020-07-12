/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/theme/common/colorRegistry"], function (require, exports, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getExtraColor = void 0;
    function getExtraColor(theme, colorId, defaults) {
        const color = theme.getColor(colorId);
        if (color) {
            return color;
        }
        if (theme.type === 'dark') {
            const background = theme.getColor(colorRegistry_1.editorBackground);
            if (background && background.getRelativeLuminance() < 0.004) {
                return defaults.extra_dark;
            }
        }
        return defaults[theme.type];
    }
    exports.getExtraColor = getExtraColor;
});
//# __sourceMappingURL=walkThroughUtils.js.map