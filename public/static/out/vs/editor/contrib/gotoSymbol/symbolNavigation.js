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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/platform/keybinding/common/keybindingsRegistry", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/base/common/lifecycle", "vs/base/common/event", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/base/common/resources"], function (require, exports, contextkey_1, instantiation_1, extensions_1, keybindingsRegistry_1, editorExtensions_1, codeEditorService_1, range_1, lifecycle_1, event_1, nls_1, keybinding_1, notification_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ISymbolNavigationService = exports.ctxHasSymbols = void 0;
    exports.ctxHasSymbols = new contextkey_1.RawContextKey('hasSymbols', false);
    exports.ISymbolNavigationService = instantiation_1.createDecorator('ISymbolNavigationService');
    let SymbolNavigationService = class SymbolNavigationService {
        constructor(contextKeyService, _editorService, _notificationService, _keybindingService) {
            this._editorService = _editorService;
            this._notificationService = _notificationService;
            this._keybindingService = _keybindingService;
            this._currentModel = undefined;
            this._currentIdx = -1;
            this._ignoreEditorChange = false;
            this._ctxHasSymbols = exports.ctxHasSymbols.bindTo(contextKeyService);
        }
        reset() {
            this._ctxHasSymbols.reset();
            lifecycle_1.dispose(this._currentState);
            lifecycle_1.dispose(this._currentMessage);
            this._currentModel = undefined;
            this._currentIdx = -1;
        }
        put(anchor) {
            const refModel = anchor.parent.parent;
            if (refModel.references.length <= 1) {
                this.reset();
                return;
            }
            this._currentModel = refModel;
            this._currentIdx = refModel.references.indexOf(anchor);
            this._ctxHasSymbols.set(true);
            this._showMessage();
            const editorState = new EditorState(this._editorService);
            const listener = editorState.onDidChange(_ => {
                if (this._ignoreEditorChange) {
                    return;
                }
                const editor = this._editorService.getActiveCodeEditor();
                if (!editor) {
                    return;
                }
                const model = editor.getModel();
                const position = editor.getPosition();
                if (!model || !position) {
                    return;
                }
                let seenUri = false;
                let seenPosition = false;
                for (const reference of refModel.references) {
                    if (resources_1.isEqual(reference.uri, model.uri)) {
                        seenUri = true;
                        seenPosition = seenPosition || range_1.Range.containsPosition(reference.range, position);
                    }
                    else if (seenUri) {
                        break;
                    }
                }
                if (!seenUri || !seenPosition) {
                    this.reset();
                }
            });
            this._currentState = lifecycle_1.combinedDisposable(editorState, listener);
        }
        revealNext(source) {
            if (!this._currentModel) {
                return Promise.resolve();
            }
            // get next result and advance
            this._currentIdx += 1;
            this._currentIdx %= this._currentModel.references.length;
            const reference = this._currentModel.references[this._currentIdx];
            // status
            this._showMessage();
            // open editor, ignore events while that happens
            this._ignoreEditorChange = true;
            return this._editorService.openCodeEditor({
                resource: reference.uri,
                options: {
                    selection: range_1.Range.collapseToStart(reference.range),
                    selectionRevealType: 3 /* NearTopIfOutsideViewport */
                }
            }, source).finally(() => {
                this._ignoreEditorChange = false;
            });
        }
        _showMessage() {
            lifecycle_1.dispose(this._currentMessage);
            const kb = this._keybindingService.lookupKeybinding('editor.gotoNextSymbolFromResult');
            const message = kb
                ? nls_1.localize('location.kb', "Symbol {0} of {1}, {2} for next", this._currentIdx + 1, this._currentModel.references.length, kb.getLabel())
                : nls_1.localize('location', "Symbol {0} of {1}", this._currentIdx + 1, this._currentModel.references.length);
            this._currentMessage = this._notificationService.status(message);
        }
    };
    SymbolNavigationService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, codeEditorService_1.ICodeEditorService),
        __param(2, notification_1.INotificationService),
        __param(3, keybinding_1.IKeybindingService)
    ], SymbolNavigationService);
    extensions_1.registerSingleton(exports.ISymbolNavigationService, SymbolNavigationService, true);
    editorExtensions_1.registerEditorCommand(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: 'editor.gotoNextSymbolFromResult',
                precondition: exports.ctxHasSymbols,
                kbOpts: {
                    weight: 100 /* EditorContrib */,
                    primary: 70 /* F12 */
                }
            });
        }
        runEditorCommand(accessor, editor) {
            return accessor.get(exports.ISymbolNavigationService).revealNext(editor);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'editor.gotoNextSymbolFromResult.cancel',
        weight: 100 /* EditorContrib */,
        when: exports.ctxHasSymbols,
        primary: 9 /* Escape */,
        handler(accessor) {
            accessor.get(exports.ISymbolNavigationService).reset();
        }
    });
    //
    let EditorState = class EditorState {
        constructor(editorService) {
            this._listener = new Map();
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._disposables.add(editorService.onCodeEditorRemove(this._onDidRemoveEditor, this));
            this._disposables.add(editorService.onCodeEditorAdd(this._onDidAddEditor, this));
            editorService.listCodeEditors().forEach(this._onDidAddEditor, this);
        }
        dispose() {
            this._disposables.dispose();
            this._onDidChange.dispose();
            lifecycle_1.dispose(this._listener.values());
        }
        _onDidAddEditor(editor) {
            this._listener.set(editor, lifecycle_1.combinedDisposable(editor.onDidChangeCursorPosition(_ => this._onDidChange.fire({ editor })), editor.onDidChangeModelContent(_ => this._onDidChange.fire({ editor }))));
        }
        _onDidRemoveEditor(editor) {
            lifecycle_1.dispose(this._listener.get(editor));
            this._listener.delete(editor);
        }
    };
    EditorState = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService)
    ], EditorState);
});
//# __sourceMappingURL=symbolNavigation.js.map