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
define(["require", "exports", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/webview/browser/webview", "vs/platform/layout/browser/layoutService"], function (require, exports, decorators_1, event_1, lifecycle_1, contextkey_1, webview_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DynamicWebviewEditorOverlay = void 0;
    /**
     * Webview editor overlay that creates and destroys the underlying webview as needed.
     */
    let DynamicWebviewEditorOverlay = class DynamicWebviewEditorOverlay extends lifecycle_1.Disposable {
        constructor(id, initialOptions, initialContentOptions, extension, _layoutService, _webviewService, _contextKeyService) {
            super();
            this.id = id;
            this.extension = extension;
            this._layoutService = _layoutService;
            this._webviewService = _webviewService;
            this._contextKeyService = _contextKeyService;
            this._onDidWheel = this._register(new event_1.Emitter());
            this.onDidWheel = this._onDidWheel.event;
            this._pendingMessages = new Set();
            this._webview = this._register(new lifecycle_1.MutableDisposable());
            this._webviewEvents = this._register(new lifecycle_1.DisposableStore());
            this._html = '';
            this._initialScrollProgress = 0;
            this._state = undefined;
            this._owner = undefined;
            this._scopedContextKeyService = this._register(new lifecycle_1.MutableDisposable());
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._onDidClickLink = this._register(new event_1.Emitter());
            this.onDidClickLink = this._onDidClickLink.event;
            this._onDidReload = this._register(new event_1.Emitter());
            this.onDidReload = this._onDidReload.event;
            this._onDidScroll = this._register(new event_1.Emitter());
            this.onDidScroll = this._onDidScroll.event;
            this._onDidUpdateState = this._register(new event_1.Emitter());
            this.onDidUpdateState = this._onDidUpdateState.event;
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._onMissingCsp = this._register(new event_1.Emitter());
            this.onMissingCsp = this._onMissingCsp.event;
            this._options = initialOptions;
            this._contentOptions = initialContentOptions;
            this._findWidgetVisible = webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE.bindTo(_contextKeyService);
        }
        dispose() {
            this.container.remove();
            this._onDispose.fire();
            super.dispose();
        }
        get container() {
            const container = document.createElement('div');
            container.id = `webview-${this.id}`;
            container.style.visibility = 'hidden';
            // Webviews cannot be reparented in the dom as it will destory their contents.
            // Mount them to a high level node to avoid this.
            this._layoutService.container.appendChild(container);
            return container;
        }
        claim(owner) {
            this._owner = owner;
            this.show();
        }
        release(owner) {
            if (this._owner !== owner) {
                return;
            }
            this._owner = undefined;
            this.container.style.visibility = 'hidden';
            if (!this._options.retainContextWhenHidden) {
                this._webview.clear();
                this._webviewEvents.clear();
            }
        }
        layoutWebviewOverElement(element, dimension) {
            if (!this.container || !this.container.parentElement) {
                return;
            }
            const frameRect = element.getBoundingClientRect();
            const containerRect = this.container.parentElement.getBoundingClientRect();
            this.container.style.position = 'absolute';
            this.container.style.top = `${frameRect.top - containerRect.top}px`;
            this.container.style.left = `${frameRect.left - containerRect.left}px`;
            this.container.style.width = `${dimension ? dimension.width : frameRect.width}px`;
            this.container.style.height = `${dimension ? dimension.height : frameRect.height}px`;
        }
        show() {
            if (!this._webview.value) {
                const webview = this._webviewService.createWebviewElement(this.id, this._options, this._contentOptions, this.extension);
                this._webview.value = webview;
                webview.state = this._state;
                if (this._html) {
                    webview.html = this._html;
                }
                if (this._options.tryRestoreScrollPosition) {
                    webview.initialScrollProgress = this._initialScrollProgress;
                }
                webview.mountTo(this.container);
                this._scopedContextKeyService.value = this._contextKeyService.createScoped(this.container);
                this._findWidgetVisible = webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE.bindTo(this._scopedContextKeyService.value);
                // Forward events from inner webview to outer listeners
                this._webviewEvents.clear();
                this._webviewEvents.add(webview.onDidFocus(() => { this._onDidFocus.fire(); }));
                this._webviewEvents.add(webview.onDidBlur(() => { this._onDidBlur.fire(); }));
                this._webviewEvents.add(webview.onDidClickLink(x => { this._onDidClickLink.fire(x); }));
                this._webviewEvents.add(webview.onMessage(x => { this._onMessage.fire(x); }));
                this._webviewEvents.add(webview.onMissingCsp(x => { this._onMissingCsp.fire(x); }));
                this._webviewEvents.add(webview.onDidWheel(x => { this._onDidWheel.fire(x); }));
                this._webviewEvents.add(webview.onDidReload(() => { this._onDidReload.fire(); }));
                this._webviewEvents.add(webview.onDidScroll(x => {
                    this._initialScrollProgress = x.scrollYPercentage;
                    this._onDidScroll.fire(x);
                }));
                this._webviewEvents.add(webview.onDidUpdateState(state => {
                    this._state = state;
                    this._onDidUpdateState.fire(state);
                }));
                this._pendingMessages.forEach(msg => webview.postMessage(msg));
                this._pendingMessages.clear();
            }
            this.container.style.visibility = 'visible';
        }
        get html() { return this._html; }
        set html(value) {
            this._html = value;
            this.withWebview(webview => webview.html = value);
        }
        get initialScrollProgress() { return this._initialScrollProgress; }
        set initialScrollProgress(value) {
            this._initialScrollProgress = value;
            this.withWebview(webview => webview.initialScrollProgress = value);
        }
        get state() { return this._state; }
        set state(value) {
            this._state = value;
            this.withWebview(webview => webview.state = value);
        }
        get options() { return this._options; }
        set options(value) { this._options = Object.assign({ customClasses: this._options.customClasses }, value); }
        get contentOptions() { return this._contentOptions; }
        set contentOptions(value) {
            this._contentOptions = value;
            this.withWebview(webview => webview.contentOptions = value);
        }
        set localResourcesRoot(resources) {
            this.withWebview(webview => webview.localResourcesRoot = resources);
        }
        postMessage(data) {
            if (this._webview.value) {
                this._webview.value.postMessage(data);
            }
            else {
                this._pendingMessages.add(data);
            }
        }
        focus() { this.withWebview(webview => webview.focus()); }
        reload() { this.withWebview(webview => webview.reload()); }
        selectAll() { this.withWebview(webview => webview.selectAll()); }
        showFind() {
            if (this._webview.value) {
                this._webview.value.showFind();
                this._findWidgetVisible.set(true);
            }
        }
        hideFind() {
            var _a;
            this._findWidgetVisible.reset();
            (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.hideFind();
        }
        runFindAction(previous) { this.withWebview(webview => webview.runFindAction(previous)); }
        getInnerWebview() {
            return this._webview.value;
        }
        withWebview(f) {
            if (this._webview.value) {
                f(this._webview.value);
            }
        }
        windowDidDragStart() {
            this.withWebview(webview => webview.windowDidDragStart());
        }
        windowDidDragEnd() {
            this.withWebview(webview => webview.windowDidDragEnd());
        }
    };
    __decorate([
        decorators_1.memoize
    ], DynamicWebviewEditorOverlay.prototype, "container", null);
    DynamicWebviewEditorOverlay = __decorate([
        __param(4, layoutService_1.ILayoutService),
        __param(5, webview_1.IWebviewService),
        __param(6, contextkey_1.IContextKeyService)
    ], DynamicWebviewEditorOverlay);
    exports.DynamicWebviewEditorOverlay = DynamicWebviewEditorOverlay;
});
//# __sourceMappingURL=dynamicWebviewEditorOverlay.js.map