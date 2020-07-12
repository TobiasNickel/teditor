/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/hover/browser/hover", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/hover/browser/hoverWidget", "vs/css!./media/hover"], function (require, exports, extensions_1, themeService_1, colorRegistry_1, hover_1, contextView_1, instantiation_1, hoverWidget_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverService = void 0;
    let HoverService = class HoverService {
        constructor(_instantiationService, _contextViewService) {
            this._instantiationService = _instantiationService;
            this._contextViewService = _contextViewService;
        }
        showHover(options, focus) {
            if (this._currentHoverOptions === options) {
                return;
            }
            this._currentHoverOptions = options;
            const hover = this._instantiationService.createInstance(hoverWidget_1.HoverWidget, options);
            hover.onDispose(() => this._currentHoverOptions = undefined);
            const provider = this._contextViewService;
            provider.showContextView(new HoverContextViewDelegate(hover, focus));
            hover.onRequestLayout(() => provider.layout());
        }
        hideHover() {
            if (!this._currentHoverOptions) {
                return;
            }
            this._currentHoverOptions = undefined;
            this._contextViewService.hideContextView();
        }
    };
    HoverService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextView_1.IContextViewService)
    ], HoverService);
    exports.HoverService = HoverService;
    class HoverContextViewDelegate {
        constructor(_hover, _focus = false) {
            this._hover = _hover;
            this._focus = _focus;
        }
        get anchorPosition() {
            return this._hover.anchor;
        }
        render(container) {
            this._hover.render(container);
            if (this._focus) {
                this._hover.focus();
            }
            return this._hover;
        }
        getAnchor() {
            return {
                x: this._hover.x,
                y: this._hover.y
            };
        }
        layout() {
            this._hover.layout();
        }
    }
    extensions_1.registerSingleton(hover_1.IHoverService, HoverService, true);
    themeService_1.registerThemingParticipant((theme, collector) => {
        const hoverBackground = theme.getColor(colorRegistry_1.editorHoverBackground);
        if (hoverBackground) {
            collector.addRule(`.monaco-workbench .workbench-hover { background-color: ${hoverBackground}; }`);
        }
        const hoverBorder = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (hoverBorder) {
            collector.addRule(`.monaco-workbench .workbench-hover { border: 1px solid ${hoverBorder}; }`);
            collector.addRule(`.monaco-workbench .workbench-hover .hover-row:not(:first-child):not(:empty) { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-workbench .workbench-hover hr { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-workbench .workbench-hover hr { border-bottom: 0px solid ${hoverBorder.transparent(0.5)}; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.monaco-workbench .workbench-hover a { color: ${link}; }`);
        }
        const hoverForeground = theme.getColor(colorRegistry_1.editorHoverForeground);
        if (hoverForeground) {
            collector.addRule(`.monaco-workbench .workbench-hover { color: ${hoverForeground}; }`);
        }
        const actionsBackground = theme.getColor(colorRegistry_1.editorHoverStatusBarBackground);
        if (actionsBackground) {
            collector.addRule(`.monaco-workbench .workbench-hover .hover-row .actions { background-color: ${actionsBackground}; }`);
        }
        const codeBackground = theme.getColor(colorRegistry_1.textCodeBlockBackground);
        if (codeBackground) {
            collector.addRule(`.monaco-workbench .workbench-hover code { background-color: ${codeBackground}; }`);
        }
    });
});
//# __sourceMappingURL=hoverService.js.map