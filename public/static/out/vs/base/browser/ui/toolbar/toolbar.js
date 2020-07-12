/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/dropdown/dropdown", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/common/codicons", "vs/css!./toolbar"], function (require, exports, nls, actions_1, actionbar_1, dropdown_1, lifecycle_1, types_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToolBar = exports.CONTEXT = void 0;
    exports.CONTEXT = 'context.toolbar';
    const toolBarMoreIcon = codicons_1.registerIcon('toolbar-more', codicons_1.Codicon.more);
    /**
     * A widget that combines an action bar for primary actions and a dropdown for secondary actions.
     */
    class ToolBar extends lifecycle_1.Disposable {
        constructor(container, contextMenuProvider, options = { orientation: 0 /* HORIZONTAL */ }) {
            super();
            this.toggleMenuActionViewItem = this._register(new lifecycle_1.MutableDisposable());
            this.hasSecondaryActions = false;
            this.options = options;
            this.lookupKeybindings = typeof this.options.getKeyBinding === 'function';
            this.toggleMenuAction = this._register(new ToggleMenuAction(() => this.toggleMenuActionViewItem.value && this.toggleMenuActionViewItem.value.show(), options.toggleMenuTitle));
            let element = document.createElement('div');
            element.className = 'monaco-toolbar';
            container.appendChild(element);
            this.actionBar = this._register(new actionbar_1.ActionBar(element, {
                orientation: options.orientation,
                ariaLabel: options.ariaLabel,
                actionRunner: options.actionRunner,
                actionViewItemProvider: (action) => {
                    // Return special action item for the toggle menu action
                    if (action.id === ToggleMenuAction.ID) {
                        // Create new
                        this.toggleMenuActionViewItem.value = new dropdown_1.DropdownMenuActionViewItem(action, action.menuActions, contextMenuProvider, this.options.actionViewItemProvider, this.actionRunner, this.options.getKeyBinding, toolBarMoreIcon.classNames, this.options.anchorAlignmentProvider, true);
                        this.toggleMenuActionViewItem.value.setActionContext(this.actionBar.context);
                        return this.toggleMenuActionViewItem.value;
                    }
                    return options.actionViewItemProvider ? options.actionViewItemProvider(action) : undefined;
                }
            }));
        }
        set actionRunner(actionRunner) {
            this.actionBar.actionRunner = actionRunner;
        }
        get actionRunner() {
            return this.actionBar.actionRunner;
        }
        set context(context) {
            this.actionBar.context = context;
            if (this.toggleMenuActionViewItem.value) {
                this.toggleMenuActionViewItem.value.setActionContext(context);
            }
        }
        getContainer() {
            return this.actionBar.getContainer();
        }
        getItemsWidth() {
            let itemsWidth = 0;
            for (let i = 0; i < this.actionBar.length(); i++) {
                itemsWidth += this.actionBar.getWidth(i);
            }
            return itemsWidth;
        }
        setAriaLabel(label) {
            this.actionBar.setAriaLabel(label);
        }
        setActions(primaryActions, secondaryActions) {
            return () => {
                let primaryActionsToSet = primaryActions ? primaryActions.slice(0) : [];
                // Inject additional action to open secondary actions if present
                this.hasSecondaryActions = !!(secondaryActions && secondaryActions.length > 0);
                if (this.hasSecondaryActions && secondaryActions) {
                    this.toggleMenuAction.menuActions = secondaryActions.slice(0);
                    primaryActionsToSet.push(this.toggleMenuAction);
                }
                this.actionBar.clear();
                primaryActionsToSet.forEach(action => {
                    this.actionBar.push(action, { icon: true, label: false, keybinding: this.getKeybindingLabel(action) });
                });
            };
        }
        getKeybindingLabel(action) {
            var _a, _b;
            const key = this.lookupKeybindings ? (_b = (_a = this.options).getKeyBinding) === null || _b === void 0 ? void 0 : _b.call(_a, action) : undefined;
            return types_1.withNullAsUndefined(key === null || key === void 0 ? void 0 : key.getLabel());
        }
        addPrimaryAction(primaryAction) {
            return () => {
                // Add after the "..." action if we have secondary actions
                if (this.hasSecondaryActions) {
                    let itemCount = this.actionBar.length();
                    this.actionBar.push(primaryAction, { icon: true, label: false, index: itemCount, keybinding: this.getKeybindingLabel(primaryAction) });
                }
                // Otherwise just add to the end
                else {
                    this.actionBar.push(primaryAction, { icon: true, label: false, keybinding: this.getKeybindingLabel(primaryAction) });
                }
            };
        }
    }
    exports.ToolBar = ToolBar;
    class ToggleMenuAction extends actions_1.Action {
        constructor(toggleDropdownMenu, title) {
            title = title || nls.localize('moreActions', "More Actions...");
            super(ToggleMenuAction.ID, title, undefined, true);
            this._menuActions = [];
            this.toggleDropdownMenu = toggleDropdownMenu;
        }
        async run() {
            this.toggleDropdownMenu();
        }
        get menuActions() {
            return this._menuActions;
        }
        set menuActions(actions) {
            this._menuActions = actions;
        }
    }
    ToggleMenuAction.ID = 'toolbar.toggle.more';
});
//# __sourceMappingURL=toolbar.js.map