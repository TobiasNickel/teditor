/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/widget", "vs/base/common/color", "vs/base/common/objects", "vs/base/browser/ui/selectBox/selectBoxNative", "vs/base/browser/ui/selectBox/selectBoxCustom", "vs/base/common/platform", "vs/css!./selectBox"], function (require, exports, widget_1, color_1, objects_1, selectBoxNative_1, selectBoxCustom_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectBox = exports.defaultStyles = void 0;
    exports.defaultStyles = {
        selectBackground: color_1.Color.fromHex('#3C3C3C'),
        selectForeground: color_1.Color.fromHex('#F0F0F0'),
        selectBorder: color_1.Color.fromHex('#3C3C3C')
    };
    class SelectBox extends widget_1.Widget {
        constructor(options, selected, contextViewProvider, styles = objects_1.deepClone(exports.defaultStyles), selectBoxOptions) {
            super();
            // Default to native SelectBox for OSX unless overridden
            if (platform_1.isMacintosh && !(selectBoxOptions === null || selectBoxOptions === void 0 ? void 0 : selectBoxOptions.useCustomDrawn)) {
                this.selectBoxDelegate = new selectBoxNative_1.SelectBoxNative(options, selected, styles, selectBoxOptions);
            }
            else {
                this.selectBoxDelegate = new selectBoxCustom_1.SelectBoxList(options, selected, contextViewProvider, styles, selectBoxOptions);
            }
            this._register(this.selectBoxDelegate);
        }
        // Public SelectBox Methods - routed through delegate interface
        get onDidSelect() {
            return this.selectBoxDelegate.onDidSelect;
        }
        setOptions(options, selected) {
            this.selectBoxDelegate.setOptions(options, selected);
        }
        select(index) {
            this.selectBoxDelegate.select(index);
        }
        setAriaLabel(label) {
            this.selectBoxDelegate.setAriaLabel(label);
        }
        focus() {
            this.selectBoxDelegate.focus();
        }
        blur() {
            this.selectBoxDelegate.blur();
        }
        // Public Widget Methods - routed through delegate interface
        render(container) {
            this.selectBoxDelegate.render(container);
        }
        style(styles) {
            this.selectBoxDelegate.style(styles);
        }
        applyStyles() {
            this.selectBoxDelegate.applyStyles();
        }
    }
    exports.SelectBox = SelectBox;
});
//# __sourceMappingURL=selectBox.js.map