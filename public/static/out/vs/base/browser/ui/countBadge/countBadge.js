/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/strings", "vs/base/common/color", "vs/base/common/objects", "vs/css!./countBadge"], function (require, exports, dom_1, strings_1, color_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CountBadge = void 0;
    const defaultOpts = {
        badgeBackground: color_1.Color.fromHex('#4D4D4D'),
        badgeForeground: color_1.Color.fromHex('#FFFFFF')
    };
    class CountBadge {
        constructor(container, options) {
            this.count = 0;
            this.options = options || Object.create(null);
            objects_1.mixin(this.options, defaultOpts, false);
            this.badgeBackground = this.options.badgeBackground;
            this.badgeForeground = this.options.badgeForeground;
            this.badgeBorder = this.options.badgeBorder;
            this.element = dom_1.append(container, dom_1.$('.monaco-count-badge'));
            this.countFormat = this.options.countFormat || '{0}';
            this.titleFormat = this.options.titleFormat || '';
            this.setCount(this.options.count || 0);
        }
        setCount(count) {
            this.count = count;
            this.render();
        }
        setCountFormat(countFormat) {
            this.countFormat = countFormat;
            this.render();
        }
        setTitleFormat(titleFormat) {
            this.titleFormat = titleFormat;
            this.render();
        }
        render() {
            this.element.textContent = strings_1.format(this.countFormat, this.count);
            this.element.title = strings_1.format(this.titleFormat, this.count);
            this.applyStyles();
        }
        style(styles) {
            this.badgeBackground = styles.badgeBackground;
            this.badgeForeground = styles.badgeForeground;
            this.badgeBorder = styles.badgeBorder;
            this.applyStyles();
        }
        applyStyles() {
            if (this.element) {
                const background = this.badgeBackground ? this.badgeBackground.toString() : '';
                const foreground = this.badgeForeground ? this.badgeForeground.toString() : '';
                const border = this.badgeBorder ? this.badgeBorder.toString() : '';
                this.element.style.backgroundColor = background;
                this.element.style.color = foreground;
                this.element.style.borderWidth = border ? '1px' : '';
                this.element.style.borderStyle = border ? 'solid' : '';
                this.element.style.borderColor = border;
            }
        }
    }
    exports.CountBadge = CountBadge;
});
//# __sourceMappingURL=countBadge.js.map