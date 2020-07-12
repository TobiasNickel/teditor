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
define(["require", "exports", "vs/base/browser/ui/widget", "vs/base/common/htmlContent", "vs/base/common/async", "vs/platform/configuration/common/configuration", "vs/base/browser/dom", "vs/workbench/services/hover/browser/hover"], function (require, exports, widget_1, htmlContent_1, async_1, configuration_1, dom, hover_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnvironmentVariableInfoWidget = void 0;
    let EnvironmentVariableInfoWidget = class EnvironmentVariableInfoWidget extends widget_1.Widget {
        constructor(_info, _configurationService, _hoverService) {
            super();
            this._info = _info;
            this._configurationService = _configurationService;
            this._hoverService = _hoverService;
            this.id = 'env-var-info';
        }
        get requiresAction() { return this._info.requiresAction; }
        attach(container) {
            this._container = container;
            this._domNode = document.createElement('div');
            this._domNode.classList.add('terminal-env-var-info', 'codicon', `codicon-${this._info.getIcon()}`);
            if (this.requiresAction) {
                this._domNode.classList.add('requires-action');
            }
            container.appendChild(this._domNode);
            const timeout = this._configurationService.getValue('editor.hover.delay');
            const scheduler = new async_1.RunOnceScheduler(() => this._showHover(), timeout);
            this._register(scheduler);
            let origin = { x: 0, y: 0 };
            this.onmouseover(this._domNode, e => {
                origin.x = e.browserEvent.pageX;
                origin.y = e.browserEvent.pageY;
                scheduler.schedule();
                this._mouseMoveListener = dom.addDisposableListener(this._domNode, dom.EventType.MOUSE_MOVE, e => {
                    // Reset the scheduler if the mouse moves too much
                    if (Math.abs(e.pageX - origin.x) > window.devicePixelRatio * 2 || Math.abs(e.pageY - origin.y) > window.devicePixelRatio * 2) {
                        origin.x = e.pageX;
                        origin.y = e.pageY;
                        scheduler.schedule();
                    }
                });
            });
            this.onnonbubblingmouseout(this._domNode, () => {
                var _a;
                scheduler.cancel();
                (_a = this._mouseMoveListener) === null || _a === void 0 ? void 0 : _a.dispose();
            });
        }
        dispose() {
            var _a, _b, _c;
            super.dispose();
            (_b = (_a = this._domNode) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.removeChild(this._domNode);
            (_c = this._mouseMoveListener) === null || _c === void 0 ? void 0 : _c.dispose();
        }
        focus() {
            this._showHover(true);
        }
        _showHover(focus) {
            if (!this._domNode || !this._container) {
                return;
            }
            if (!this._hoverOptions) {
                const actions = this._info.getActions ? this._info.getActions() : undefined;
                this._hoverOptions = {
                    target: this._domNode,
                    text: new htmlContent_1.MarkdownString(this._info.getInfo()),
                    actions
                };
            }
            this._hoverService.showHover(this._hoverOptions, focus);
        }
    };
    EnvironmentVariableInfoWidget = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, hover_1.IHoverService)
    ], EnvironmentVariableInfoWidget);
    exports.EnvironmentVariableInfoWidget = EnvironmentVariableInfoWidget;
});
//# __sourceMappingURL=environmentVariableInfoWidget.js.map