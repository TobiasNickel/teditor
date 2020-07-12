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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/markdownRenderer", "vs/base/common/event", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding", "vs/platform/configuration/common/configuration", "vs/editor/common/config/editorOptions", "vs/base/browser/ui/hover/hoverWidget", "vs/base/browser/ui/widget", "vs/platform/opener/common/opener"], function (require, exports, lifecycle_1, markdownRenderer_1, event_1, dom, keybinding_1, configuration_1, editorOptions_1, hoverWidget_1, widget_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HoverWidget = void 0;
    const $ = dom.$;
    let HoverWidget = class HoverWidget extends widget_1.Widget {
        constructor(options, _keybindingService, _configurationService, _openerService) {
            super();
            this._keybindingService = _keybindingService;
            this._configurationService = _configurationService;
            this._openerService = _openerService;
            this._messageListeners = new lifecycle_1.DisposableStore();
            this._isDisposed = false;
            this._anchor = 1 /* ABOVE */;
            this._x = 0;
            this._y = 0;
            this._onDispose = this._register(new event_1.Emitter());
            this._onRequestLayout = this._register(new event_1.Emitter());
            this._linkHandler = options.linkHandler || this._openerService.open;
            this._target = 'targetElements' in options.target ? options.target : new ElementHoverTarget(options.target);
            this._hover = this._register(new hoverWidget_1.HoverWidget());
            this._hover.containerDomNode.classList.add('workbench-hover', 'fadeIn');
            if (options.additionalClasses) {
                this._hover.containerDomNode.classList.add(...options.additionalClasses);
            }
            // Don't allow mousedown out of the widget, otherwise preventDefault will call and text will
            // not be selected.
            this.onmousedown(this._hover.containerDomNode, e => e.stopPropagation());
            // Hide hover on escape
            this.onkeydown(this._hover.containerDomNode, e => {
                if (e.equals(9 /* Escape */)) {
                    this.dispose();
                }
            });
            const rowElement = $('div.hover-row.markdown-hover');
            const contentsElement = $('div.hover-contents');
            const markdownElement = markdownRenderer_1.renderMarkdown(options.text, {
                actionHandler: {
                    callback: (content) => this._linkHandler(content),
                    disposeables: this._messageListeners
                },
                codeBlockRenderer: async (_, value) => {
                    const fontFamily = this._configurationService.getValue('editor').fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
                    return `<span style="font-family: ${fontFamily}; white-space: nowrap">${value.replace(/\n/g, '<br>')}</span>`;
                },
                codeBlockRenderCallback: () => {
                    contentsElement.classList.add('code-hover-contents');
                    // This changes the dimensions of the hover so trigger a layout
                    this._onRequestLayout.fire();
                }
            });
            contentsElement.appendChild(markdownElement);
            rowElement.appendChild(contentsElement);
            this._hover.contentsDomNode.appendChild(rowElement);
            if (options.actions && options.actions.length > 0) {
                const statusBarElement = $('div.hover-row.status-bar');
                const actionsElement = $('div.actions');
                options.actions.forEach(action => {
                    const keybinding = this._keybindingService.lookupKeybinding(action.commandId);
                    const keybindingLabel = keybinding ? keybinding.getLabel() : null;
                    hoverWidget_1.renderHoverAction(actionsElement, {
                        label: action.label,
                        commandId: action.commandId,
                        run: e => {
                            action.run(e);
                            this.dispose();
                        },
                        iconClass: action.iconClass
                    }, keybindingLabel);
                });
                statusBarElement.appendChild(actionsElement);
                this._hover.containerDomNode.appendChild(statusBarElement);
            }
            const mouseTrackerTargets = [...this._target.targetElements];
            if (!options.hideOnHover || (options.actions && options.actions.length > 0)) {
                mouseTrackerTargets.push(this._hover.containerDomNode);
            }
            this._mouseTracker = new CompositeMouseTracker(mouseTrackerTargets);
            this._register(this._mouseTracker.onMouseOut(() => this.dispose()));
            this._register(this._mouseTracker);
        }
        get isDisposed() { return this._isDisposed; }
        get domNode() { return this._hover.containerDomNode; }
        get onDispose() { return this._onDispose.event; }
        get onRequestLayout() { return this._onRequestLayout.event; }
        get anchor() { return this._anchor; }
        get x() { return this._x; }
        get y() { return this._y; }
        render(container) {
            if (this._hover.containerDomNode.parentElement !== container) {
                container === null || container === void 0 ? void 0 : container.appendChild(this._hover.containerDomNode);
            }
            this.layout();
        }
        layout() {
            this._hover.containerDomNode.classList.remove('right-aligned');
            this._hover.contentsDomNode.style.maxHeight = '';
            // Get horizontal alignment and position
            const targetBounds = this._target.targetElements.map(e => e.getBoundingClientRect());
            const targetLeft = Math.min(...targetBounds.map(e => e.left));
            if (targetLeft + this._hover.containerDomNode.clientWidth >= document.documentElement.clientWidth) {
                this._x = document.documentElement.clientWidth;
                this._hover.containerDomNode.classList.add('right-aligned');
            }
            else {
                this._x = targetLeft;
            }
            // Get vertical alignment and position
            const targetTop = Math.min(...targetBounds.map(e => e.top));
            if (targetTop - this._hover.containerDomNode.clientHeight < 0) {
                this._anchor = 0 /* BELOW */;
                this._y = Math.max(...targetBounds.map(e => e.bottom)) - 2;
            }
            else {
                this._y = targetTop;
            }
            this._hover.onContentsChanged();
        }
        focus() {
            this._hover.containerDomNode.focus();
        }
        hide() {
            this.dispose();
        }
        dispose() {
            var _a;
            if (!this._isDisposed) {
                this._onDispose.fire();
                (_a = this._hover.containerDomNode.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(this.domNode);
                this._messageListeners.dispose();
                this._target.dispose();
                super.dispose();
            }
            this._isDisposed = true;
        }
    };
    HoverWidget = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, opener_1.IOpenerService)
    ], HoverWidget);
    exports.HoverWidget = HoverWidget;
    class CompositeMouseTracker extends widget_1.Widget {
        constructor(_elements) {
            super();
            this._elements = _elements;
            this._isMouseIn = false;
            this._onMouseOut = new event_1.Emitter();
            this._elements.forEach(n => this.onmouseover(n, () => this._onTargetMouseOver()));
            this._elements.forEach(n => this.onnonbubblingmouseout(n, () => this._onTargetMouseOut()));
        }
        get onMouseOut() { return this._onMouseOut.event; }
        _onTargetMouseOver() {
            this._isMouseIn = true;
            this._clearEvaluateMouseStateTimeout();
        }
        _onTargetMouseOut() {
            this._isMouseIn = false;
            this._evaluateMouseState();
        }
        _evaluateMouseState() {
            this._clearEvaluateMouseStateTimeout();
            // Evaluate whether the mouse is still outside asynchronously such that other mouse targets
            // have the opportunity to first their mouse in event.
            this._mouseTimeout = window.setTimeout(() => this._fireIfMouseOutside(), 0);
        }
        _clearEvaluateMouseStateTimeout() {
            if (this._mouseTimeout) {
                clearTimeout(this._mouseTimeout);
                this._mouseTimeout = undefined;
            }
        }
        _fireIfMouseOutside() {
            if (!this._isMouseIn) {
                this._onMouseOut.fire();
            }
        }
    }
    class ElementHoverTarget {
        constructor(_element) {
            this._element = _element;
            this.targetElements = [this._element];
        }
        dispose() {
        }
    }
});
//# __sourceMappingURL=hoverWidget.js.map