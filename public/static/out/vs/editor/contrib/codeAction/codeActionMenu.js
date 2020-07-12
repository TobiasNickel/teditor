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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/editor/common/modes", "vs/editor/contrib/codeAction/codeAction", "vs/editor/contrib/codeAction/types", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding"], function (require, exports, dom_1, actionbar_1, actions_1, errors_1, lazy_1, lifecycle_1, position_1, modes_1, codeAction_1, types_1, contextView_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionKeybindingResolver = exports.CodeActionMenu = void 0;
    class CodeActionAction extends actions_1.Action {
        constructor(action, callback) {
            super(action.command ? action.command.id : action.title, action.title, undefined, !action.disabled, callback);
            this.action = action;
        }
    }
    let CodeActionMenu = class CodeActionMenu extends lifecycle_1.Disposable {
        constructor(_editor, _delegate, _contextMenuService, keybindingService) {
            super();
            this._editor = _editor;
            this._delegate = _delegate;
            this._contextMenuService = _contextMenuService;
            this._visible = false;
            this._showingActions = this._register(new lifecycle_1.MutableDisposable());
            this._keybindingResolver = new CodeActionKeybindingResolver({
                getKeybindings: () => keybindingService.getKeybindings()
            });
        }
        get isVisible() {
            return this._visible;
        }
        async show(trigger, codeActions, at, options) {
            const actionsToShow = options.includeDisabledActions ? codeActions.allActions : codeActions.validActions;
            if (!actionsToShow.length) {
                this._visible = false;
                return;
            }
            if (!this._editor.getDomNode()) {
                // cancel when editor went off-dom
                this._visible = false;
                throw errors_1.canceled();
            }
            this._visible = true;
            this._showingActions.value = codeActions;
            const menuActions = this.getMenuActions(trigger, actionsToShow, codeActions.documentation);
            const anchor = position_1.Position.isIPosition(at) ? this._toCoords(at) : at || { x: 0, y: 0 };
            const resolver = this._keybindingResolver.getResolver();
            this._contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => menuActions,
                onHide: () => {
                    this._visible = false;
                    this._editor.focus();
                },
                autoSelectFirstItem: true,
                getKeyBinding: action => action instanceof CodeActionAction ? resolver(action.action) : undefined,
            });
        }
        getMenuActions(trigger, actionsToShow, documentation) {
            var _a, _b;
            const toCodeActionAction = (action) => new CodeActionAction(action, () => this._delegate.onSelectCodeAction(action));
            const result = actionsToShow
                .map(toCodeActionAction);
            const allDocumentation = [...documentation];
            const model = this._editor.getModel();
            if (model && result.length) {
                for (const provider of modes_1.CodeActionProviderRegistry.all(model)) {
                    if (provider._getAdditionalMenuItems) {
                        allDocumentation.push(...provider._getAdditionalMenuItems({ trigger: trigger.type, only: (_b = (_a = trigger.filter) === null || _a === void 0 ? void 0 : _a.include) === null || _b === void 0 ? void 0 : _b.value }, actionsToShow));
                    }
                }
            }
            if (allDocumentation.length) {
                result.push(new actionbar_1.Separator(), ...allDocumentation.map(command => toCodeActionAction({
                    title: command.title,
                    command: command,
                })));
            }
            return result;
        }
        _toCoords(position) {
            if (!this._editor.hasModel()) {
                return { x: 0, y: 0 };
            }
            this._editor.revealPosition(position, 1 /* Immediate */);
            this._editor.render();
            // Translate to absolute editor position
            const cursorCoords = this._editor.getScrolledVisiblePosition(position);
            const editorCoords = dom_1.getDomNodePagePosition(this._editor.getDomNode());
            const x = editorCoords.left + cursorCoords.left;
            const y = editorCoords.top + cursorCoords.top + cursorCoords.height;
            return { x, y };
        }
    };
    CodeActionMenu = __decorate([
        __param(2, contextView_1.IContextMenuService),
        __param(3, keybinding_1.IKeybindingService)
    ], CodeActionMenu);
    exports.CodeActionMenu = CodeActionMenu;
    class CodeActionKeybindingResolver {
        constructor(_keybindingProvider) {
            this._keybindingProvider = _keybindingProvider;
        }
        getResolver() {
            // Lazy since we may not actually ever read the value
            const allCodeActionBindings = new lazy_1.Lazy(() => this._keybindingProvider.getKeybindings()
                .filter(item => CodeActionKeybindingResolver.codeActionCommands.indexOf(item.command) >= 0)
                .filter(item => item.resolvedKeybinding)
                .map((item) => {
                // Special case these commands since they come built-in with VS Code and don't use 'commandArgs'
                let commandArgs = item.commandArgs;
                if (item.command === codeAction_1.organizeImportsCommandId) {
                    commandArgs = { kind: types_1.CodeActionKind.SourceOrganizeImports.value };
                }
                else if (item.command === codeAction_1.fixAllCommandId) {
                    commandArgs = { kind: types_1.CodeActionKind.SourceFixAll.value };
                }
                return Object.assign({ resolvedKeybinding: item.resolvedKeybinding }, types_1.CodeActionCommandArgs.fromUser(commandArgs, {
                    kind: types_1.CodeActionKind.None,
                    apply: "never" /* Never */
                }));
            }));
            return (action) => {
                if (action.kind) {
                    const binding = this.bestKeybindingForCodeAction(action, allCodeActionBindings.getValue());
                    return binding === null || binding === void 0 ? void 0 : binding.resolvedKeybinding;
                }
                return undefined;
            };
        }
        bestKeybindingForCodeAction(action, candidates) {
            if (!action.kind) {
                return undefined;
            }
            const kind = new types_1.CodeActionKind(action.kind);
            return candidates
                .filter(candidate => candidate.kind.contains(kind))
                .filter(candidate => {
                if (candidate.preferred) {
                    // If the candidate keybinding only applies to preferred actions, the this action must also be preferred
                    return action.isPreferred;
                }
                return true;
            })
                .reduceRight((currentBest, candidate) => {
                if (!currentBest) {
                    return candidate;
                }
                // Select the more specific binding
                return currentBest.kind.contains(candidate.kind) ? candidate : currentBest;
            }, undefined);
        }
    }
    exports.CodeActionKeybindingResolver = CodeActionKeybindingResolver;
    CodeActionKeybindingResolver.codeActionCommands = [
        codeAction_1.refactorCommandId,
        codeAction_1.codeActionCommandId,
        codeAction_1.sourceActionCommandId,
        codeAction_1.organizeImportsCommandId,
        codeAction_1.fixAllCommandId
    ];
});
//# __sourceMappingURL=codeActionMenu.js.map