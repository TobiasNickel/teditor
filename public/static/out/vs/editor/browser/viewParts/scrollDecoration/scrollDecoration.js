/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/browser/view/viewPart", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./scrollDecoration"], function (require, exports, fastDomNode_1, viewPart_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScrollDecorationViewPart = void 0;
    class ScrollDecorationViewPart extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            this._scrollTop = 0;
            this._width = 0;
            this._updateWidth();
            this._shouldShow = false;
            const options = this._context.configuration.options;
            const scrollbar = options.get(84 /* scrollbar */);
            this._useShadows = scrollbar.useShadows;
            this._domNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._domNode.setAttribute('role', 'presentation');
            this._domNode.setAttribute('aria-hidden', 'true');
        }
        dispose() {
            super.dispose();
        }
        _updateShouldShow() {
            const newShouldShow = (this._useShadows && this._scrollTop > 0);
            if (this._shouldShow !== newShouldShow) {
                this._shouldShow = newShouldShow;
                return true;
            }
            return false;
        }
        getDomNode() {
            return this._domNode;
        }
        _updateWidth() {
            const options = this._context.configuration.options;
            const layoutInfo = options.get(115 /* layoutInfo */);
            if (layoutInfo.minimap.renderMinimap === 0 || (layoutInfo.minimap.minimapWidth > 0 && layoutInfo.minimap.minimapLeft === 0)) {
                this._width = layoutInfo.width;
            }
            else {
                this._width = layoutInfo.width - layoutInfo.minimap.minimapWidth - layoutInfo.verticalScrollbarWidth;
            }
        }
        // --- begin event handlers
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const scrollbar = options.get(84 /* scrollbar */);
            this._useShadows = scrollbar.useShadows;
            this._updateWidth();
            this._updateShouldShow();
            return true;
        }
        onScrollChanged(e) {
            this._scrollTop = e.scrollTop;
            return this._updateShouldShow();
        }
        // --- end event handlers
        prepareRender(ctx) {
            // Nothing to read
        }
        render(ctx) {
            this._domNode.setWidth(this._width);
            this._domNode.setClassName(this._shouldShow ? 'scroll-decoration' : '');
        }
    }
    exports.ScrollDecorationViewPart = ScrollDecorationViewPart;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const shadow = theme.getColor(colorRegistry_1.scrollbarShadow);
        if (shadow) {
            collector.addRule(`.monaco-editor .scroll-decoration { box-shadow: ${shadow} 0 6px 6px -6px inset; }`);
        }
    });
});
//# __sourceMappingURL=scrollDecoration.js.map