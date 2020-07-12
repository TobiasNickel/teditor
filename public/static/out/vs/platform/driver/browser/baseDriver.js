/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays"], function (require, exports, dom_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseWindowDriver = void 0;
    function serializeElement(element, recursive) {
        const attributes = Object.create(null);
        for (let j = 0; j < element.attributes.length; j++) {
            const attr = element.attributes.item(j);
            if (attr) {
                attributes[attr.name] = attr.value;
            }
        }
        const children = [];
        if (recursive) {
            for (let i = 0; i < element.children.length; i++) {
                const child = element.children.item(i);
                if (child) {
                    children.push(serializeElement(child, true));
                }
            }
        }
        const { left, top } = dom_1.getTopLeftOffset(element);
        return {
            tagName: element.tagName,
            className: element.className,
            textContent: element.textContent || '',
            attributes,
            children,
            left,
            top
        };
    }
    class BaseWindowDriver {
        async setValue(selector, text) {
            const element = document.querySelector(selector);
            if (!element) {
                return Promise.reject(new Error(`Element not found: ${selector}`));
            }
            const inputElement = element;
            inputElement.value = text;
            const event = new Event('input', { bubbles: true, cancelable: true });
            inputElement.dispatchEvent(event);
        }
        async getTitle() {
            return document.title;
        }
        async isActiveElement(selector) {
            const element = document.querySelector(selector);
            if (element !== document.activeElement) {
                const chain = [];
                let el = document.activeElement;
                while (el) {
                    const tagName = el.tagName;
                    const id = el.id ? `#${el.id}` : '';
                    const classes = arrays_1.coalesce(el.className.split(/\s+/g).map(c => c.trim())).map(c => `.${c}`).join('');
                    chain.unshift(`${tagName}${id}${classes}`);
                    el = el.parentElement;
                }
                throw new Error(`Active element not found. Current active element is '${chain.join(' > ')}'. Looking for ${selector}`);
            }
            return true;
        }
        async getElements(selector, recursive) {
            const query = document.querySelectorAll(selector);
            const result = [];
            for (let i = 0; i < query.length; i++) {
                const element = query.item(i);
                result.push(serializeElement(element, recursive));
            }
            return result;
        }
        async getElementXY(selector, xoffset, yoffset) {
            const offset = typeof xoffset === 'number' && typeof yoffset === 'number' ? { x: xoffset, y: yoffset } : undefined;
            return this._getElementXY(selector, offset);
        }
        async typeInEditor(selector, text) {
            const element = document.querySelector(selector);
            if (!element) {
                throw new Error(`Editor not found: ${selector}`);
            }
            const textarea = element;
            const start = textarea.selectionStart;
            const newStart = start + text.length;
            const value = textarea.value;
            const newValue = value.substr(0, start) + text + value.substr(start);
            textarea.value = newValue;
            textarea.setSelectionRange(newStart, newStart);
            const event = new Event('input', { 'bubbles': true, 'cancelable': true });
            textarea.dispatchEvent(event);
        }
        async getTerminalBuffer(selector) {
            const element = document.querySelector(selector);
            if (!element) {
                throw new Error(`Terminal not found: ${selector}`);
            }
            const xterm = element.xterm;
            if (!xterm) {
                throw new Error(`Xterm not found: ${selector}`);
            }
            const lines = [];
            for (let i = 0; i < xterm.buffer.length; i++) {
                lines.push(xterm.buffer.getLine(i).translateToString(true));
            }
            return lines;
        }
        async writeInTerminal(selector, text) {
            const element = document.querySelector(selector);
            if (!element) {
                throw new Error(`Element not found: ${selector}`);
            }
            const xterm = element.xterm;
            if (!xterm) {
                throw new Error(`Xterm not found: ${selector}`);
            }
            xterm._core._coreService.triggerDataEvent(text);
        }
        async _getElementXY(selector, offset) {
            const element = document.querySelector(selector);
            if (!element) {
                return Promise.reject(new Error(`Element not found: ${selector}`));
            }
            const { left, top } = dom_1.getTopLeftOffset(element);
            const { width, height } = dom_1.getClientArea(element);
            let x, y;
            if (offset) {
                x = left + offset.x;
                y = top + offset.y;
            }
            else {
                x = left + (width / 2);
                y = top + (height / 2);
            }
            x = Math.round(x);
            y = Math.round(y);
            return { x, y };
        }
    }
    exports.BaseWindowDriver = BaseWindowDriver;
});
//# __sourceMappingURL=baseDriver.js.map