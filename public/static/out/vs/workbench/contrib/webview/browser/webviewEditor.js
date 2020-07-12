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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/services/editor/browser/editorDropService", "vs/workbench/contrib/webview/browser/webviewEditorInput", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host"], function (require, exports, DOM, event_1, lifecycle_1, platform_1, storage_1, telemetry_1, themeService_1, baseEditor_1, editorDropService_1, webviewEditorInput_1, editorService_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewEditor = void 0;
    let WebviewEditor = class WebviewEditor extends baseEditor_1.BaseEditor {
        constructor(telemetryService, themeService, storageService, _editorService, _editorDropService, _hostService) {
            super(WebviewEditor.ID, telemetryService, themeService, storageService);
            this._editorService = _editorService;
            this._editorDropService = _editorDropService;
            this._hostService = _hostService;
            this._visible = false;
            this._webviewVisibleDisposables = this._register(new lifecycle_1.DisposableStore());
            this._onFocusWindowHandler = this._register(new lifecycle_1.MutableDisposable());
            this._onDidFocusWebview = this._register(new event_1.Emitter());
        }
        get onDidFocus() { return this._onDidFocusWebview.event; }
        get webview() {
            return this.input instanceof webviewEditorInput_1.WebviewInput ? this.input.webview : undefined;
        }
        createEditor(parent) {
            const element = document.createElement('div');
            this._element = element;
            parent.appendChild(element);
        }
        dispose() {
            if (this._element) {
                this._element.remove();
                this._element = undefined;
            }
            super.dispose();
        }
        layout(dimension) {
            this._dimension = dimension;
            if (this.webview && this._visible) {
                this.synchronizeWebviewContainerDimensions(this.webview, dimension);
            }
        }
        focus() {
            var _a;
            super.focus();
            if (!this._onFocusWindowHandler.value && !platform_1.isWeb) {
                // Make sure we restore focus when switching back to a VS Code window
                this._onFocusWindowHandler.value = this._hostService.onDidChangeFocus(focused => {
                    if (focused && this._editorService.activeEditorPane === this) {
                        this.focus();
                    }
                });
            }
            (_a = this.webview) === null || _a === void 0 ? void 0 : _a.focus();
        }
        setEditorVisible(visible, group) {
            this._visible = visible;
            if (this.input instanceof webviewEditorInput_1.WebviewInput && this.webview) {
                if (visible) {
                    this.claimWebview(this.input);
                }
                else {
                    this.webview.release(this);
                }
            }
            super.setEditorVisible(visible, group);
        }
        clearInput() {
            if (this.webview) {
                this.webview.release(this);
                this._webviewVisibleDisposables.clear();
            }
            super.clearInput();
        }
        async setInput(input, options, token) {
            if (input.matches(this.input)) {
                return;
            }
            const alreadyOwnsWebview = input instanceof webviewEditorInput_1.WebviewInput && input.webview === this.webview;
            if (this.webview && !alreadyOwnsWebview) {
                this.webview.release(this);
            }
            await super.setInput(input, options, token);
            await input.resolve();
            if (token.isCancellationRequested) {
                return;
            }
            if (input instanceof webviewEditorInput_1.WebviewInput) {
                if (this.group) {
                    input.updateGroup(this.group.id);
                }
                if (!alreadyOwnsWebview) {
                    this.claimWebview(input);
                }
                if (this._dimension) {
                    this.layout(this._dimension);
                }
            }
        }
        claimWebview(input) {
            input.webview.claim(this);
            if (this._element) {
                this._element.setAttribute('aria-flowto', input.webview.container.id);
            }
            this._webviewVisibleDisposables.clear();
            // Webviews are not part of the normal editor dom, so we have to register our own drag and drop handler on them.
            this._webviewVisibleDisposables.add(this._editorDropService.createEditorDropTarget(input.webview.container, {
                containsGroup: (group) => { var _a; return ((_a = this.group) === null || _a === void 0 ? void 0 : _a.id) === group.group.id; }
            }));
            this._webviewVisibleDisposables.add(DOM.addDisposableListener(window, DOM.EventType.DRAG_START, () => {
                var _a;
                (_a = this.webview) === null || _a === void 0 ? void 0 : _a.windowDidDragStart();
            }));
            const onDragEnd = () => {
                var _a;
                (_a = this.webview) === null || _a === void 0 ? void 0 : _a.windowDidDragEnd();
            };
            this._webviewVisibleDisposables.add(DOM.addDisposableListener(window, DOM.EventType.DRAG_END, onDragEnd));
            this._webviewVisibleDisposables.add(DOM.addDisposableListener(window, DOM.EventType.MOUSE_MOVE, currentEvent => {
                if (currentEvent.buttons === 0) {
                    onDragEnd();
                }
            }));
            this.synchronizeWebviewContainerDimensions(input.webview);
            this._webviewVisibleDisposables.add(this.trackFocus(input.webview));
        }
        synchronizeWebviewContainerDimensions(webview, dimension) {
            if (this._element) {
                webview.layoutWebviewOverElement(this._element.parentElement, dimension);
            }
        }
        trackFocus(webview) {
            const store = new lifecycle_1.DisposableStore();
            // Track focus in webview content
            const webviewContentFocusTracker = DOM.trackFocus(webview.container);
            store.add(webviewContentFocusTracker);
            store.add(webviewContentFocusTracker.onDidFocus(() => this._onDidFocusWebview.fire()));
            // Track focus in webview element
            store.add(webview.onDidFocus(() => this._onDidFocusWebview.fire()));
            return store;
        }
    };
    WebviewEditor.ID = 'WebviewEditor';
    WebviewEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, storage_1.IStorageService),
        __param(3, editorService_1.IEditorService),
        __param(4, editorDropService_1.IEditorDropService),
        __param(5, host_1.IHostService)
    ], WebviewEditor);
    exports.WebviewEditor = WebviewEditor;
});
//# __sourceMappingURL=webviewEditor.js.map