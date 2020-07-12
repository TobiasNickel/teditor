/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom"], function (require, exports, dom_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RowCache = void 0;
    function removeFromParent(element) {
        try {
            if (element.parentElement) {
                element.parentElement.removeChild(element);
            }
        }
        catch (e) {
            // this will throw if this happens due to a blur event, nasty business
        }
    }
    class RowCache {
        constructor(renderers) {
            this.renderers = renderers;
            this.cache = new Map();
        }
        /**
         * Returns a row either by creating a new one or reusing
         * a previously released row which shares the same templateId.
         */
        alloc(templateId) {
            let result = this.getTemplateCache(templateId).pop();
            if (!result) {
                const domNode = dom_1.$('.monaco-list-row');
                const renderer = this.getRenderer(templateId);
                const templateData = renderer.renderTemplate(domNode);
                result = { domNode, templateId, templateData };
            }
            return result;
        }
        /**
         * Releases the row for eventual reuse.
         */
        release(row) {
            if (!row) {
                return;
            }
            this.releaseRow(row);
        }
        releaseRow(row) {
            const { domNode, templateId } = row;
            if (domNode) {
                dom_1.removeClass(domNode, 'scrolling');
                removeFromParent(domNode);
            }
            const cache = this.getTemplateCache(templateId);
            cache.push(row);
        }
        getTemplateCache(templateId) {
            let result = this.cache.get(templateId);
            if (!result) {
                result = [];
                this.cache.set(templateId, result);
            }
            return result;
        }
        dispose() {
            this.cache.forEach((cachedRows, templateId) => {
                for (const cachedRow of cachedRows) {
                    const renderer = this.getRenderer(templateId);
                    renderer.disposeTemplate(cachedRow.templateData);
                    cachedRow.domNode = null;
                    cachedRow.templateData = null;
                }
            });
            this.cache.clear();
        }
        getRenderer(templateId) {
            const renderer = this.renderers.get(templateId);
            if (!renderer) {
                throw new Error(`No renderer found for ${templateId}`);
            }
            return renderer;
        }
    }
    exports.RowCache = RowCache;
});
//# __sourceMappingURL=rowCache.js.map