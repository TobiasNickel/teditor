/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/browser/view/viewPart", "vs/editor/common/view/editorColorRegistry", "vs/platform/theme/common/themeService", "vs/css!./rulers"], function (require, exports, fastDomNode_1, viewPart_1, editorColorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Rulers = void 0;
    class Rulers extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this.domNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this.domNode.setAttribute('role', 'presentation');
            this.domNode.setAttribute('aria-hidden', 'true');
            this.domNode.setClassName('view-rulers');
            this._renderedRulers = [];
            const options = this._context.configuration.options;
            this._rulers = options.get(83 /* rulers */);
            this._typicalHalfwidthCharacterWidth = options.get(36 /* fontInfo */).typicalHalfwidthCharacterWidth;
        }
        dispose() {
            super.dispose();
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            this._rulers = options.get(83 /* rulers */);
            this._typicalHalfwidthCharacterWidth = options.get(36 /* fontInfo */).typicalHalfwidthCharacterWidth;
            return true;
        }
        onScrollChanged(e) {
            return e.scrollHeightChanged;
        }
        // --- end event handlers
        prepareRender(ctx) {
            // Nothing to read
        }
        _ensureRulersCount() {
            const currentCount = this._renderedRulers.length;
            const desiredCount = this._rulers.length;
            if (currentCount === desiredCount) {
                // Nothing to do
                return;
            }
            if (currentCount < desiredCount) {
                const { tabSize } = this._context.model.getTextModelOptions();
                const rulerWidth = tabSize;
                let addCount = desiredCount - currentCount;
                while (addCount > 0) {
                    const node = fastDomNode_1.createFastDomNode(document.createElement('div'));
                    node.setClassName('view-ruler');
                    node.setWidth(rulerWidth);
                    this.domNode.appendChild(node);
                    this._renderedRulers.push(node);
                    addCount--;
                }
                return;
            }
            let removeCount = currentCount - desiredCount;
            while (removeCount > 0) {
                const node = this._renderedRulers.pop();
                this.domNode.removeChild(node);
                removeCount--;
            }
        }
        render(ctx) {
            this._ensureRulersCount();
            for (let i = 0, len = this._rulers.length; i < len; i++) {
                const node = this._renderedRulers[i];
                const ruler = this._rulers[i];
                node.setBoxShadow(ruler.color ? `1px 0 0 0 ${ruler.color} inset` : ``);
                node.setHeight(Math.min(ctx.scrollHeight, 1000000));
                node.setLeft(ruler.column * this._typicalHalfwidthCharacterWidth);
            }
        }
    }
    exports.Rulers = Rulers;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const rulerColor = theme.getColor(editorColorRegistry_1.editorRuler);
        if (rulerColor) {
            collector.addRule(`.monaco-editor .view-ruler { box-shadow: 1px 0 0 0 ${rulerColor} inset; }`);
        }
    });
});
//# __sourceMappingURL=rulers.js.map