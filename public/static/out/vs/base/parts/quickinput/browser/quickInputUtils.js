/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/idGenerator", "vs/css!./media/quickInput"], function (require, exports, dom, idGenerator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getIconClass = void 0;
    const iconPathToClass = {};
    const iconClassGenerator = new idGenerator_1.IdGenerator('quick-input-button-icon-');
    function getIconClass(iconPath) {
        if (!iconPath) {
            return undefined;
        }
        let iconClass;
        const key = iconPath.dark.toString();
        if (iconPathToClass[key]) {
            iconClass = iconPathToClass[key];
        }
        else {
            iconClass = iconClassGenerator.nextId();
            dom.createCSSRule(`.${iconClass}`, `background-image: ${dom.asCSSUrl(iconPath.light || iconPath.dark)}`);
            dom.createCSSRule(`.vs-dark .${iconClass}, .hc-black .${iconClass}`, `background-image: ${dom.asCSSUrl(iconPath.dark)}`);
            iconPathToClass[key] = iconClass;
        }
        return iconClass;
    }
    exports.getIconClass = getIconClass;
});
//# __sourceMappingURL=quickInputUtils.js.map