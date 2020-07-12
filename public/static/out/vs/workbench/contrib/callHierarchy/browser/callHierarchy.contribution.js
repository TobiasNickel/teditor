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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/callHierarchy/common/callHierarchy", "vs/base/common/cancellation", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/callHierarchy/browser/callHierarchyPeek", "vs/base/common/event", "vs/editor/browser/editorExtensions", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle", "vs/editor/common/editorContextKeys", "vs/editor/contrib/peekView/peekView", "vs/platform/storage/common/storage", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/platform/actions/common/actions"], function (require, exports, nls_1, callHierarchy_1, cancellation_1, instantiation_1, callHierarchyPeek_1, event_1, editorExtensions_1, contextkey_1, lifecycle_1, editorContextKeys_1, peekView_1, storage_1, codeEditorService_1, range_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const _ctxHasCallHierarchyProvider = new contextkey_1.RawContextKey('editorHasCallHierarchyProvider', false);
    const _ctxCallHierarchyVisible = new contextkey_1.RawContextKey('callHierarchyVisible', false);
    let CallHierarchyController = class CallHierarchyController {
        constructor(_editor, _contextKeyService, _storageService, _editorService, _instantiationService) {
            this._editor = _editor;
            this._contextKeyService = _contextKeyService;
            this._storageService = _storageService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._dispoables = new lifecycle_1.DisposableStore();
            this._sessionDisposables = new lifecycle_1.DisposableStore();
            this._ctxIsVisible = _ctxCallHierarchyVisible.bindTo(this._contextKeyService);
            this._ctxHasProvider = _ctxHasCallHierarchyProvider.bindTo(this._contextKeyService);
            this._dispoables.add(event_1.Event.any(_editor.onDidChangeModel, _editor.onDidChangeModelLanguage, callHierarchy_1.CallHierarchyProviderRegistry.onDidChange)(() => {
                this._ctxHasProvider.set(_editor.hasModel() && callHierarchy_1.CallHierarchyProviderRegistry.has(_editor.getModel()));
            }));
            this._dispoables.add(this._sessionDisposables);
        }
        static get(editor) {
            return editor.getContribution(CallHierarchyController.Id);
        }
        dispose() {
            this._ctxHasProvider.reset();
            this._ctxIsVisible.reset();
            this._dispoables.dispose();
        }
        async startCallHierarchyFromEditor() {
            this._sessionDisposables.clear();
            if (!this._editor.hasModel()) {
                return;
            }
            const document = this._editor.getModel();
            const position = this._editor.getPosition();
            if (!callHierarchy_1.CallHierarchyProviderRegistry.has(document)) {
                return;
            }
            const cts = new cancellation_1.CancellationTokenSource();
            const model = callHierarchy_1.CallHierarchyModel.create(document, position, cts.token);
            const direction = this._storageService.getNumber(CallHierarchyController._StorageDirection, 0 /* GLOBAL */, 2 /* CallsFrom */);
            this._showCallHierarchyWidget(position, direction, model, cts);
        }
        async startCallHierarchyFromCallHierarchy() {
            if (!this._widget) {
                return;
            }
            const model = this._widget.getModel();
            const call = this._widget.getFocused();
            if (!call || !model) {
                return;
            }
            const newEditor = await this._editorService.openCodeEditor({ resource: call.item.uri }, this._editor);
            if (!newEditor) {
                return;
            }
            const newModel = model.fork(call.item);
            this._sessionDisposables.clear();
            CallHierarchyController.get(newEditor)._showCallHierarchyWidget(range_1.Range.lift(newModel.root.selectionRange).getStartPosition(), this._widget.direction, Promise.resolve(newModel), new cancellation_1.CancellationTokenSource());
        }
        _showCallHierarchyWidget(position, direction, model, cts) {
            event_1.Event.any(this._editor.onDidChangeModel, this._editor.onDidChangeModelLanguage)(this.endCallHierarchy, this, this._sessionDisposables);
            this._widget = this._instantiationService.createInstance(callHierarchyPeek_1.CallHierarchyTreePeekWidget, this._editor, position, direction);
            this._widget.showLoading();
            this._ctxIsVisible.set(true);
            this._sessionDisposables.add(this._widget.onDidClose(() => {
                this.endCallHierarchy();
                this._storageService.store(CallHierarchyController._StorageDirection, this._widget.direction, 0 /* GLOBAL */);
            }));
            this._sessionDisposables.add({ dispose() { cts.dispose(true); } });
            this._sessionDisposables.add(this._widget);
            model.then(model => {
                if (cts.token.isCancellationRequested) {
                    return; // nothing
                }
                if (model) {
                    this._sessionDisposables.add(model);
                    this._widget.showModel(model);
                }
                else {
                    this._widget.showMessage(nls_1.localize('no.item', "No results"));
                }
            }).catch(e => {
                this._widget.showMessage(nls_1.localize('error', "Failed to show call hierarchy"));
                console.error(e);
            });
        }
        toggleCallHierarchyDirection() {
            if (this._widget) {
                this._widget.toggleDirection();
            }
        }
        endCallHierarchy() {
            this._sessionDisposables.clear();
            this._ctxIsVisible.set(false);
            this._editor.focus();
        }
    };
    CallHierarchyController.Id = 'callHierarchy';
    CallHierarchyController._StorageDirection = 'callHierarchy/defaultDirection';
    CallHierarchyController = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, storage_1.IStorageService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, instantiation_1.IInstantiationService)
    ], CallHierarchyController);
    editorExtensions_1.registerEditorContribution(CallHierarchyController.Id, CallHierarchyController);
    editorExtensions_1.registerEditorAction(class extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.showCallHierarchy',
                label: nls_1.localize('title', "Peek Call Hierarchy"),
                alias: 'Peek Call Hierarchy',
                contextMenuOpts: {
                    menuId: actions_1.MenuId.EditorContextPeek,
                    group: 'navigation',
                    order: 1000
                },
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    weight: 200 /* WorkbenchContrib */,
                    primary: 1024 /* Shift */ + 512 /* Alt */ + 38 /* KEY_H */
                },
                precondition: contextkey_1.ContextKeyExpr.and(_ctxHasCallHierarchyProvider, peekView_1.PeekContext.notInPeekEditor)
            });
        }
        async run(_accessor, editor) {
            return CallHierarchyController.get(editor).startCallHierarchyFromEditor();
        }
    });
    editorExtensions_1.registerEditorAction(class extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.toggleCallHierarchy',
                label: nls_1.localize('title.toggle', "Toggle Call Hierarchy"),
                alias: 'Toggle Call Hierarchy',
                kbOpts: {
                    weight: 200 /* WorkbenchContrib */,
                    primary: 1024 /* Shift */ + 512 /* Alt */ + 38 /* KEY_H */
                },
                precondition: _ctxCallHierarchyVisible
            });
        }
        async run(_accessor, editor) {
            return CallHierarchyController.get(editor).toggleCallHierarchyDirection();
        }
    });
    editorExtensions_1.registerEditorAction(class extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.refocusCallHierarchy',
                label: nls_1.localize('title.refocus', "Refocus Call Hierarchy"),
                alias: 'Refocus Call Hierarchy',
                kbOpts: {
                    weight: 200 /* WorkbenchContrib */,
                    primary: 1024 /* Shift */ + 3 /* Enter */
                },
                precondition: _ctxCallHierarchyVisible
            });
        }
        async run(_accessor, editor) {
            return CallHierarchyController.get(editor).startCallHierarchyFromCallHierarchy();
        }
    });
    editorExtensions_1.registerEditorCommand(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: 'editor.closeCallHierarchy',
                kbOpts: {
                    weight: 200 /* WorkbenchContrib */ + 10,
                    primary: 9 /* Escape */
                },
                precondition: contextkey_1.ContextKeyExpr.and(_ctxCallHierarchyVisible, contextkey_1.ContextKeyExpr.not('config.editor.stablePeek'))
            });
        }
        runEditorCommand(_accessor, editor) {
            return CallHierarchyController.get(editor).endCallHierarchy();
        }
    });
});
//# __sourceMappingURL=callHierarchy.contribution.js.map