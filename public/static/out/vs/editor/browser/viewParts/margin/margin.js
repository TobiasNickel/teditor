/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/browser/view/viewPart"], function (require, exports, fastDomNode_1, viewPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Margin = void 0;
    class Margin extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            const options = this._context.configuration.options;
            const layoutInfo = options.get(115 /* layoutInfo */);
            this._canUseLayerHinting = !options.get(23 /* disableLayerHinting */);
            this._contentLeft = layoutInfo.contentLeft;
            this._glyphMarginLeft = layoutInfo.glyphMarginLeft;
            this._glyphMarginWidth = layoutInfo.glyphMarginWidth;
            this._domNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._domNode.setClassName(Margin.OUTER_CLASS_NAME);
            this._domNode.setPosition('absolute');
            this._domNode.setAttribute('role', 'presentation');
            this._domNode.setAttribute('aria-hidden', 'true');
            this._glyphMarginBackgroundDomNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._glyphMarginBackgroundDomNode.setClassName(Margin.CLASS_NAME);
            this._domNode.appendChild(this._glyphMarginBackgroundDomNode);
        }
        dispose() {
            super.dispose();
        }
        getDomNode() {
            return this._domNode;
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(115 /* layoutInfo */);
            this._canUseLayerHinting = !options.get(23 /* disableLayerHinting */);
            this._contentLeft = layoutInfo.contentLeft;
            this._glyphMarginLeft = layoutInfo.glyphMarginLeft;
            this._glyphMarginWidth = layoutInfo.glyphMarginWidth;
            return true;
        }
        onScrollChanged(e) {
            return super.onScrollChanged(e) || e.scrollTopChanged;
        }
        // --- end event handlers
        prepareRender(ctx) {
            // Nothing to read
        }
        render(ctx) {
            this._domNode.setLayerHinting(this._canUseLayerHinting);
            this._domNode.setContain('strict');
            const adjustedScrollTop = ctx.scrollTop - ctx.bigNumbersDelta;
            this._domNode.setTop(-adjustedScrollTop);
            const height = Math.min(ctx.scrollHeight, 1000000);
            this._domNode.setHeight(height);
            this._domNode.setWidth(this._contentLeft);
            this._glyphMarginBackgroundDomNode.setLeft(this._glyphMarginLeft);
            this._glyphMarginBackgroundDomNode.setWidth(this._glyphMarginWidth);
            this._glyphMarginBackgroundDomNode.setHeight(height);
        }
    }
    exports.Margin = Margin;
    Margin.CLASS_NAME = 'glyph-margin';
    Margin.OUTER_CLASS_NAME = 'margin';
});
//# __sourceMappingURL=margin.js.map