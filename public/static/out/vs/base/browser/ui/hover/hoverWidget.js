/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/css!./hover"], function (require, exports, dom, lifecycle_1, scrollableElement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.renderHoverAction = exports.HoverWidget = void 0;
    const $ = dom.$;
    class HoverWidget extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.containerDomNode = document.createElement('div');
            this.containerDomNode.className = 'monaco-hover';
            this.containerDomNode.tabIndex = 0;
            this.containerDomNode.setAttribute('role', 'tooltip');
            this.contentsDomNode = document.createElement('div');
            this.contentsDomNode.className = 'monaco-hover-content';
            this._scrollbar = this._register(new scrollableElement_1.DomScrollableElement(this.contentsDomNode, {}));
            this.containerDomNode.appendChild(this._scrollbar.getDomNode());
        }
        onContentsChanged() {
            this._scrollbar.scanDomNode();
        }
    }
    exports.HoverWidget = HoverWidget;
    function renderHoverAction(parent, actionOptions, keybindingLabel) {
        const actionContainer = dom.append(parent, $('div.action-container'));
        const action = dom.append(actionContainer, $('a.action'));
        action.setAttribute('href', '#');
        action.setAttribute('role', 'button');
        if (actionOptions.iconClass) {
            dom.append(action, $(`span.icon.${actionOptions.iconClass}`));
        }
        const label = dom.append(action, $('span'));
        label.textContent = keybindingLabel ? `${actionOptions.label} (${keybindingLabel})` : actionOptions.label;
        return dom.addDisposableListener(actionContainer, dom.EventType.CLICK, e => {
            e.stopPropagation();
            e.preventDefault();
            actionOptions.run(actionContainer);
        });
    }
    exports.renderHoverAction = renderHoverAction;
});
//# __sourceMappingURL=hoverWidget.js.map