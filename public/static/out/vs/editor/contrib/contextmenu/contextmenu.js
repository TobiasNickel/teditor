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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/base/browser/contextmenu"], function (require, exports, nls, dom, actionbar_1, lifecycle_1, editorExtensions_1, editorContextKeys_1, actions_1, contextkey_1, contextView_1, keybinding_1, contextmenu_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextMenuController = void 0;
    let ContextMenuController = class ContextMenuController {
        constructor(editor, _contextMenuService, _contextViewService, _contextKeyService, _keybindingService, _menuService) {
            this._contextMenuService = _contextMenuService;
            this._contextViewService = _contextViewService;
            this._contextKeyService = _contextKeyService;
            this._keybindingService = _keybindingService;
            this._menuService = _menuService;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._contextMenuIsBeingShownCount = 0;
            this._editor = editor;
            this._toDispose.add(this._editor.onContextMenu((e) => this._onContextMenu(e)));
            this._toDispose.add(this._editor.onMouseWheel((e) => {
                if (this._contextMenuIsBeingShownCount > 0) {
                    this._contextViewService.hideContextView();
                }
            }));
            this._toDispose.add(this._editor.onKeyDown((e) => {
                if (e.keyCode === 58 /* ContextMenu */) {
                    // Chrome is funny like that
                    e.preventDefault();
                    e.stopPropagation();
                    this.showContextMenu();
                }
            }));
        }
        static get(editor) {
            return editor.getContribution(ContextMenuController.ID);
        }
        _onContextMenu(e) {
            if (!this._editor.hasModel()) {
                return;
            }
            if (!this._editor.getOption(15 /* contextmenu */)) {
                this._editor.focus();
                // Ensure the cursor is at the position of the mouse click
                if (e.target.position && !this._editor.getSelection().containsPosition(e.target.position)) {
                    this._editor.setPosition(e.target.position);
                }
                return; // Context menu is turned off through configuration
            }
            if (e.target.type === 12 /* OVERLAY_WIDGET */) {
                return; // allow native menu on widgets to support right click on input field for example in find
            }
            e.event.preventDefault();
            if (e.target.type !== 6 /* CONTENT_TEXT */ && e.target.type !== 7 /* CONTENT_EMPTY */ && e.target.type !== 1 /* TEXTAREA */) {
                return; // only support mouse click into text or native context menu key for now
            }
            // Ensure the editor gets focus if it hasn't, so the right events are being sent to other contributions
            this._editor.focus();
            // Ensure the cursor is at the position of the mouse click
            if (e.target.position) {
                let hasSelectionAtPosition = false;
                for (const selection of this._editor.getSelections()) {
                    if (selection.containsPosition(e.target.position)) {
                        hasSelectionAtPosition = true;
                        break;
                    }
                }
                if (!hasSelectionAtPosition) {
                    this._editor.setPosition(e.target.position);
                }
            }
            // Unless the user triggerd the context menu through Shift+F10, use the mouse position as menu position
            let anchor = null;
            if (e.target.type !== 1 /* TEXTAREA */) {
                anchor = { x: e.event.posx - 1, width: 2, y: e.event.posy - 1, height: 2 };
            }
            // Show the context menu
            this.showContextMenu(anchor);
        }
        showContextMenu(anchor) {
            if (!this._editor.getOption(15 /* contextmenu */)) {
                return; // Context menu is turned off through configuration
            }
            if (!this._editor.hasModel()) {
                return;
            }
            if (!this._contextMenuService) {
                this._editor.focus();
                return; // We need the context menu service to function
            }
            // Find actions available for menu
            const menuActions = this._getMenuActions(this._editor.getModel(), actions_1.MenuId.EditorContext);
            // Show menu if we have actions to show
            if (menuActions.length > 0) {
                this._doShowContextMenu(menuActions, anchor);
            }
        }
        _getMenuActions(model, menuId) {
            const result = [];
            // get menu groups
            const menu = this._menuService.createMenu(menuId, this._contextKeyService);
            const groups = menu.getActions({ arg: model.uri });
            menu.dispose();
            // translate them into other actions
            for (let group of groups) {
                const [, actions] = group;
                let addedItems = 0;
                for (const action of actions) {
                    if (action instanceof actions_1.SubmenuItemAction) {
                        const subActions = this._getMenuActions(model, action.item.submenu);
                        if (subActions.length > 0) {
                            result.push(new contextmenu_1.ContextSubMenu(action.label, subActions));
                            addedItems++;
                        }
                    }
                    else {
                        result.push(action);
                        addedItems++;
                    }
                }
                if (addedItems) {
                    result.push(new actionbar_1.Separator());
                }
            }
            if (result.length) {
                result.pop(); // remove last separator
            }
            return result;
        }
        _doShowContextMenu(actions, anchor = null) {
            if (!this._editor.hasModel()) {
                return;
            }
            // Disable hover
            const oldHoverSetting = this._editor.getOption(46 /* hover */);
            this._editor.updateOptions({
                hover: {
                    enabled: false
                }
            });
            if (!anchor) {
                // Ensure selection is visible
                this._editor.revealPosition(this._editor.getPosition(), 1 /* Immediate */);
                this._editor.render();
                const cursorCoords = this._editor.getScrolledVisiblePosition(this._editor.getPosition());
                // Translate to absolute editor position
                const editorCoords = dom.getDomNodePagePosition(this._editor.getDomNode());
                const posx = editorCoords.left + cursorCoords.left;
                const posy = editorCoords.top + cursorCoords.top + cursorCoords.height;
                anchor = { x: posx, y: posy };
            }
            // Show menu
            this._contextMenuIsBeingShownCount++;
            this._contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                getActionViewItem: (action) => {
                    const keybinding = this._keybindingFor(action);
                    if (keybinding) {
                        return new actionbar_1.ActionViewItem(action, action, { label: true, keybinding: keybinding.getLabel(), isMenu: true });
                    }
                    const customActionViewItem = action;
                    if (typeof customActionViewItem.getActionViewItem === 'function') {
                        return customActionViewItem.getActionViewItem();
                    }
                    return new actionbar_1.ActionViewItem(action, action, { icon: true, label: true, isMenu: true });
                },
                getKeyBinding: (action) => {
                    return this._keybindingFor(action);
                },
                onHide: (wasCancelled) => {
                    this._contextMenuIsBeingShownCount--;
                    this._editor.focus();
                    this._editor.updateOptions({
                        hover: oldHoverSetting
                    });
                }
            });
        }
        _keybindingFor(action) {
            return this._keybindingService.lookupKeybinding(action.id);
        }
        dispose() {
            if (this._contextMenuIsBeingShownCount > 0) {
                this._contextViewService.hideContextView();
            }
            this._toDispose.dispose();
        }
    };
    ContextMenuController.ID = 'editor.contrib.contextmenu';
    ContextMenuController = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, contextView_1.IContextViewService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, actions_1.IMenuService)
    ], ContextMenuController);
    exports.ContextMenuController = ContextMenuController;
    class ShowContextMenu extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.showContextMenu',
                label: nls.localize('action.showContextMenu.label', "Show Editor Context Menu"),
                alias: 'Show Editor Context Menu',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 1024 /* Shift */ | 68 /* F10 */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            let contribution = ContextMenuController.get(editor);
            contribution.showContextMenu();
        }
    }
    editorExtensions_1.registerEditorContribution(ContextMenuController.ID, ContextMenuController);
    editorExtensions_1.registerEditorAction(ShowContextMenu);
});
//# __sourceMappingURL=contextmenu.js.map