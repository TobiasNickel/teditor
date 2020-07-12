/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom"], function (require, exports, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserClipboardService = void 0;
    class BrowserClipboardService {
        constructor() {
            this.mapTextToType = new Map(); // unsupported in web (only in-memory)
            this.findText = ''; // unsupported in web (only in-memory)
            this.resources = []; // unsupported in web (only in-memory)
        }
        async writeText(text, type) {
            // With type: only in-memory is supported
            if (type) {
                this.mapTextToType.set(type, text);
                return;
            }
            // Guard access to navigator.clipboard with try/catch
            // as we have seen DOMExceptions in certain browsers
            // due to security policies.
            try {
                return await navigator.clipboard.writeText(text);
            }
            catch (error) {
                console.error(error);
            }
            // Fallback to textarea and execCommand solution
            const activeElement = document.activeElement;
            const textArea = document.body.appendChild(dom_1.$('textarea', { 'aria-hidden': true }));
            textArea.style.height = '1px';
            textArea.style.width = '1px';
            textArea.style.position = 'absolute';
            textArea.value = text;
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            if (activeElement instanceof HTMLElement) {
                activeElement.focus();
            }
            document.body.removeChild(textArea);
            return;
        }
        async readText(type) {
            // With type: only in-memory is supported
            if (type) {
                return this.mapTextToType.get(type) || '';
            }
            // Guard access to navigator.clipboard with try/catch
            // as we have seen DOMExceptions in certain browsers
            // due to security policies.
            try {
                return await navigator.clipboard.readText();
            }
            catch (error) {
                console.error(error);
                return '';
            }
        }
        async readFindText() {
            return this.findText;
        }
        async writeFindText(text) {
            this.findText = text;
        }
        async writeResources(resources) {
            this.resources = resources;
        }
        async readResources() {
            return this.resources;
        }
        async hasResources() {
            return this.resources.length > 0;
        }
    }
    exports.BrowserClipboardService = BrowserClipboardService;
});
//# __sourceMappingURL=clipboardService.js.map