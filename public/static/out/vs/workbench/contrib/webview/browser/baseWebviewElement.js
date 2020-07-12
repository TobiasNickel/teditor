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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/webview/browser/webviewWorkbenchService", "vs/workbench/services/environment/common/environmentService", "vs/platform/log/common/log"], function (require, exports, dom_1, event_1, lifecycle_1, environment_1, telemetry_1, webviewWorkbenchService_1, environmentService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BaseWebview = exports.WebviewMessageChannels = void 0;
    var WebviewMessageChannels;
    (function (WebviewMessageChannels) {
        WebviewMessageChannels["onmessage"] = "onmessage";
        WebviewMessageChannels["didClickLink"] = "did-click-link";
        WebviewMessageChannels["didScroll"] = "did-scroll";
        WebviewMessageChannels["didFocus"] = "did-focus";
        WebviewMessageChannels["didBlur"] = "did-blur";
        WebviewMessageChannels["didLoad"] = "did-load";
        WebviewMessageChannels["doUpdateState"] = "do-update-state";
        WebviewMessageChannels["doReload"] = "do-reload";
        WebviewMessageChannels["loadResource"] = "load-resource";
        WebviewMessageChannels["loadLocalhost"] = "load-localhost";
        WebviewMessageChannels["webviewReady"] = "webview-ready";
        WebviewMessageChannels["wheel"] = "did-scroll-wheel";
    })(WebviewMessageChannels = exports.WebviewMessageChannels || (exports.WebviewMessageChannels = {}));
    var WebviewState;
    (function (WebviewState) {
        let Type;
        (function (Type) {
            Type[Type["Initializing"] = 0] = "Initializing";
            Type[Type["Ready"] = 1] = "Ready";
        })(Type = WebviewState.Type || (WebviewState.Type = {}));
        class Initializing {
            constructor(pendingMessages) {
                this.pendingMessages = pendingMessages;
                this.type = 0 /* Initializing */;
            }
        }
        WebviewState.Initializing = Initializing;
        WebviewState.Ready = { type: 1 /* Ready */ };
    })(WebviewState || (WebviewState = {}));
    let BaseWebview = class BaseWebview extends lifecycle_1.Disposable {
        constructor(
        // TODO: matb, this should not be protected. The only reason it needs to be is that the base class ends up using it in the call to createElement
        id, options, contentOptions, extension, webviewThemeDataProvider, _logService, _telemetryService, _environementService, workbenchEnvironmentService) {
            super();
            this.id = id;
            this.extension = extension;
            this.webviewThemeDataProvider = webviewThemeDataProvider;
            this._logService = _logService;
            this._telemetryService = _telemetryService;
            this._environementService = _environementService;
            this.workbenchEnvironmentService = workbenchEnvironmentService;
            this._state = new WebviewState.Initializing([]);
            this._onMissingCsp = this._register(new event_1.Emitter());
            this.onMissingCsp = this._onMissingCsp.event;
            this._onDidClickLink = this._register(new event_1.Emitter());
            this.onDidClickLink = this._onDidClickLink.event;
            this._onDidReload = this._register(new event_1.Emitter());
            this.onDidReload = this._onDidReload.event;
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._onDidScroll = this._register(new event_1.Emitter());
            this.onDidScroll = this._onDidScroll.event;
            this._onDidWheel = this._register(new event_1.Emitter());
            this.onDidWheel = this._onDidWheel.event;
            this._onDidUpdateState = this._register(new event_1.Emitter());
            this.onDidUpdateState = this._onDidUpdateState.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._hasAlertedAboutMissingCsp = false;
            this.content = {
                html: '',
                options: contentOptions,
                state: undefined
            };
            this._element = this.createElement(options, contentOptions);
            const subscription = this._register(this.on("webview-ready" /* webviewReady */, () => {
                this._logService.debug(`Webview(${this.id}): webview ready`);
                if (this.element) {
                    dom_1.addClass(this.element, 'ready');
                }
                if (this._state.type === 0 /* Initializing */) {
                    this._state.pendingMessages.forEach(({ channel, data }) => this.doPostMessage(channel, data));
                }
                this._state = WebviewState.Ready;
                subscription.dispose();
            }));
            this._register(this.on('no-csp-found', () => {
                this.handleNoCspFound();
            }));
            this._register(this.on("did-click-link" /* didClickLink */, (uri) => {
                this._onDidClickLink.fire(uri);
            }));
            this._register(this.on("onmessage" /* onmessage */, (data) => {
                this._onMessage.fire(data);
            }));
            this._register(this.on("did-scroll" /* didScroll */, (scrollYPercentage) => {
                this._onDidScroll.fire({ scrollYPercentage: scrollYPercentage });
            }));
            this._register(this.on("do-reload" /* doReload */, () => {
                this.reload();
            }));
            this._register(this.on("do-update-state" /* doUpdateState */, (state) => {
                this.state = state;
                this._onDidUpdateState.fire(state);
            }));
            this._register(this.on("did-focus" /* didFocus */, () => {
                this.handleFocusChange(true);
            }));
            this._register(this.on("did-scroll-wheel" /* wheel */, (event) => {
                this._onDidWheel.fire(event);
            }));
            this._register(this.on("did-blur" /* didBlur */, () => {
                this.handleFocusChange(false);
            }));
            this._register(this.on('did-keydown', (data) => {
                // Electron: workaround for https://github.com/electron/electron/issues/14258
                // We have to detect keyboard events in the <webview> and dispatch them to our
                // keybinding service because these events do not bubble to the parent window anymore.
                this.handleKeyDown(data);
            }));
            this.style();
            this._register(webviewThemeDataProvider.onThemeDataChanged(this.style, this));
        }
        get element() { return this._element; }
        get focused() { return !!this._focused; }
        dispose() {
            if (this.element) {
                this.element.remove();
            }
            this._element = undefined;
            super.dispose();
        }
        postMessage(data) {
            this._send('message', data);
        }
        _send(channel, data) {
            if (this._state.type === 0 /* Initializing */) {
                this._state.pendingMessages.push({ channel, data });
            }
            else {
                this.doPostMessage(channel, data);
            }
        }
        handleNoCspFound() {
            if (this._hasAlertedAboutMissingCsp) {
                return;
            }
            this._hasAlertedAboutMissingCsp = true;
            if (this.extension && this.extension.id) {
                if (this._environementService.isExtensionDevelopment) {
                    this._onMissingCsp.fire(this.extension.id);
                }
                this._telemetryService.publicLog2('webviewMissingCsp', {
                    extension: this.extension.id.value
                });
            }
        }
        reload() {
            this.doUpdateContent(this.content);
            const subscription = this._register(this.on("did-load" /* didLoad */, () => {
                this._onDidReload.fire();
                subscription.dispose();
            }));
        }
        set html(value) {
            this.doUpdateContent({
                html: value,
                options: this.content.options,
                state: this.content.state,
            });
        }
        set contentOptions(options) {
            this._logService.debug(`Webview(${this.id}): will update content options`);
            if (webviewWorkbenchService_1.areWebviewInputOptionsEqual(options, this.content.options)) {
                this._logService.debug(`Webview(${this.id}): skipping content options update`);
                return;
            }
            this.doUpdateContent({
                html: this.content.html,
                options: options,
                state: this.content.state,
            });
        }
        set localResourcesRoot(resources) {
            /** no op */
        }
        set state(state) {
            this.content = {
                html: this.content.html,
                options: this.content.options,
                state,
            };
        }
        set initialScrollProgress(value) {
            this._send('initial-scroll-position', value);
        }
        doUpdateContent(newContent) {
            this._logService.debug(`Webview(${this.id}): will update content`);
            this.content = newContent;
            this._send('content', Object.assign({ contents: this.content.html, options: this.content.options, state: this.content.state }, this.extraContentOptions));
        }
        style() {
            const { styles, activeTheme, themeLabel } = this.webviewThemeDataProvider.getWebviewThemeData();
            this._send('styles', { styles, activeTheme, themeName: themeLabel });
        }
        handleFocusChange(isFocused) {
            this._focused = isFocused;
            if (isFocused) {
                this._onDidFocus.fire();
            }
            else {
                this._onDidBlur.fire();
            }
        }
        handleKeyDown(event) {
            // Create a fake KeyboardEvent from the data provided
            const emulatedKeyboardEvent = new KeyboardEvent('keydown', event);
            // Force override the target
            Object.defineProperty(emulatedKeyboardEvent, 'target', {
                get: () => this.element,
            });
            // And re-dispatch
            window.dispatchEvent(emulatedKeyboardEvent);
        }
        windowDidDragStart() {
            // Webview break drag and droping around the main window (no events are generated when you are over them)
            // Work around this by disabling pointer events during the drag.
            // https://github.com/electron/electron/issues/18226
            if (this.element) {
                this.element.style.pointerEvents = 'none';
            }
        }
        windowDidDragEnd() {
            if (this.element) {
                this.element.style.pointerEvents = '';
            }
        }
        selectAll() {
            if (this.element) {
                this._send('execCommand', 'selectAll');
            }
        }
    };
    BaseWebview = __decorate([
        __param(5, log_1.ILogService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, environment_1.IEnvironmentService),
        __param(8, environmentService_1.IWorkbenchEnvironmentService)
    ], BaseWebview);
    exports.BaseWebview = BaseWebview;
});
//# __sourceMappingURL=baseWebviewElement.js.map