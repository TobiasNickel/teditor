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
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/iterator", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/platform/editor/common/editor", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "./webviewEditorInput"], function (require, exports, arrays_1, async_1, cancellation_1, decorators_1, errors_1, iterator_1, lazy_1, lifecycle_1, resources_1, editor_1, extensions_1, instantiation_1, webview_1, editorGroupsService_1, editorService_1, webviewEditorInput_1) {
    "use strict";
    var _resolved, _resolvePromise;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewEditorService = exports.LazilyResolvedWebviewEditorInput = exports.areWebviewInputOptionsEqual = exports.IWebviewWorkbenchService = void 0;
    exports.IWebviewWorkbenchService = instantiation_1.createDecorator('webviewEditorService');
    function areWebviewInputOptionsEqual(a, b) {
        return a.enableCommandUris === b.enableCommandUris
            && a.enableFindWidget === b.enableFindWidget
            && a.allowScripts === b.allowScripts
            && a.allowMultipleAPIAcquire === b.allowMultipleAPIAcquire
            && a.retainContextWhenHidden === b.retainContextWhenHidden
            && a.tryRestoreScrollPosition === b.tryRestoreScrollPosition
            && arrays_1.equals(a.localResourceRoots, b.localResourceRoots, resources_1.isEqual)
            && arrays_1.equals(a.portMapping, b.portMapping, (a, b) => a.extensionHostPort === b.extensionHostPort && a.webviewPort === b.webviewPort);
    }
    exports.areWebviewInputOptionsEqual = areWebviewInputOptionsEqual;
    function canRevive(reviver, webview) {
        if (webview.isDisposed()) {
            return false;
        }
        return reviver.canResolve(webview);
    }
    let LazilyResolvedWebviewEditorInput = class LazilyResolvedWebviewEditorInput extends webviewEditorInput_1.WebviewInput {
        constructor(id, viewType, name, webview, webviewService, _webviewWorkbenchService) {
            super(id, viewType, name, webview, webviewService);
            this._webviewWorkbenchService = _webviewWorkbenchService;
            _resolved.set(this, false);
            _resolvePromise.set(this, void 0);
        }
        dispose() {
            var _a;
            super.dispose();
            (_a = __classPrivateFieldGet(this, _resolvePromise)) === null || _a === void 0 ? void 0 : _a.cancel();
            __classPrivateFieldSet(this, _resolvePromise, undefined);
        }
        async resolve() {
            if (!__classPrivateFieldGet(this, _resolved)) {
                __classPrivateFieldSet(this, _resolved, true);
                __classPrivateFieldSet(this, _resolvePromise, this._webviewWorkbenchService.resolveWebview(this));
                try {
                    await __classPrivateFieldGet(this, _resolvePromise);
                }
                catch (e) {
                    if (!errors_1.isPromiseCanceledError(e)) {
                        throw e;
                    }
                }
            }
            return super.resolve();
        }
        transfer(other) {
            if (!super.transfer(other)) {
                return;
            }
            __classPrivateFieldSet(other, _resolved, __classPrivateFieldGet(this, _resolved));
            return other;
        }
    };
    _resolved = new WeakMap(), _resolvePromise = new WeakMap();
    __decorate([
        decorators_1.memoize
    ], LazilyResolvedWebviewEditorInput.prototype, "resolve", null);
    LazilyResolvedWebviewEditorInput = __decorate([
        __param(4, webview_1.IWebviewService),
        __param(5, exports.IWebviewWorkbenchService)
    ], LazilyResolvedWebviewEditorInput);
    exports.LazilyResolvedWebviewEditorInput = LazilyResolvedWebviewEditorInput;
    class RevivalPool {
        constructor() {
            this._awaitingRevival = [];
        }
        add(input, resolve) {
            this._awaitingRevival.push({ input, resolve });
        }
        reviveFor(reviver, cancellation) {
            const toRevive = this._awaitingRevival.filter(({ input }) => canRevive(reviver, input));
            this._awaitingRevival = this._awaitingRevival.filter(({ input }) => !canRevive(reviver, input));
            for (const { input, resolve } of toRevive) {
                reviver.resolveWebview(input, cancellation).then(resolve);
            }
        }
    }
    let WebviewEditorService = class WebviewEditorService {
        constructor(_editorGroupService, _editorService, _instantiationService, _webviewService) {
            this._editorGroupService = _editorGroupService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._webviewService = _webviewService;
            this._revivers = new Set();
            this._revivalPool = new RevivalPool();
        }
        createWebview(id, viewType, title, showOptions, options, extension) {
            const webview = new lazy_1.Lazy(() => this.createWebviewElement(id, extension, options));
            const webviewInput = this._instantiationService.createInstance(webviewEditorInput_1.WebviewInput, id, viewType, title, webview);
            this._editorService.openEditor(webviewInput, {
                pinned: true,
                preserveFocus: showOptions.preserveFocus,
                // preserve pre 1.38 behaviour to not make group active when preserveFocus: true
                // but make sure to restore the editor to fix https://github.com/microsoft/vscode/issues/79633
                activation: showOptions.preserveFocus ? editor_1.EditorActivation.RESTORE : undefined
            }, showOptions.group);
            return webviewInput;
        }
        revealWebview(webview, group, preserveFocus) {
            if (webview.group === group.id) {
                this._editorService.openEditor(webview, {
                    preserveFocus,
                    // preserve pre 1.38 behaviour to not make group active when preserveFocus: true
                    // but make sure to restore the editor to fix https://github.com/microsoft/vscode/issues/79633
                    activation: preserveFocus ? editor_1.EditorActivation.RESTORE : undefined
                }, webview.group);
            }
            else {
                const groupView = this._editorGroupService.getGroup(webview.group);
                if (groupView) {
                    groupView.moveEditor(webview, group, { preserveFocus });
                }
            }
        }
        reviveWebview(id, viewType, title, iconPath, state, options, extension, group) {
            const webview = new lazy_1.Lazy(() => {
                const webview = this.createWebviewElement(id, extension, options);
                webview.state = state;
                return webview;
            });
            const webviewInput = this._instantiationService.createInstance(LazilyResolvedWebviewEditorInput, id, viewType, title, webview);
            webviewInput.iconPath = iconPath;
            if (typeof group === 'number') {
                webviewInput.updateGroup(group);
            }
            return webviewInput;
        }
        registerResolver(reviver) {
            this._revivers.add(reviver);
            const cts = new cancellation_1.CancellationTokenSource();
            this._revivalPool.reviveFor(reviver, cts.token);
            return lifecycle_1.toDisposable(() => {
                this._revivers.delete(reviver);
                cts.dispose(true);
            });
        }
        shouldPersist(webview) {
            // Revived webviews may not have an actively registered reviver but we still want to presist them
            // since a reviver should exist when it is actually needed.
            if (webview instanceof LazilyResolvedWebviewEditorInput) {
                return true;
            }
            return iterator_1.Iterable.some(this._revivers.values(), reviver => canRevive(reviver, webview));
        }
        async tryRevive(webview, cancellation) {
            for (const reviver of this._revivers.values()) {
                if (canRevive(reviver, webview)) {
                    await reviver.resolveWebview(webview, cancellation);
                    return true;
                }
            }
            return false;
        }
        resolveWebview(webview) {
            return async_1.createCancelablePromise(async (cancellation) => {
                const didRevive = await this.tryRevive(webview, cancellation);
                if (!didRevive) {
                    // A reviver may not be registered yet. Put into pool and resolve promise when we can revive
                    let resolve;
                    const promise = new Promise(r => { resolve = r; });
                    this._revivalPool.add(webview, resolve);
                    return promise;
                }
            });
        }
        createWebviewElement(id, extension, options) {
            return this._webviewService.createWebviewOverlay(id, {
                enableFindWidget: options.enableFindWidget,
                retainContextWhenHidden: options.retainContextWhenHidden
            }, options, extension);
        }
    };
    WebviewEditorService = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, editorService_1.IEditorService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, webview_1.IWebviewService)
    ], WebviewEditorService);
    exports.WebviewEditorService = WebviewEditorService;
    extensions_1.registerSingleton(exports.IWebviewWorkbenchService, WebviewEditorService, true);
});
//# __sourceMappingURL=webviewWorkbenchService.js.map