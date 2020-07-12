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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
define(["require", "exports", "vs/base/common/actions", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/linkedList"], function (require, exports, actions_1, descriptors_1, instantiation_1, keybindingsRegistry_1, contextkey_1, commands_1, lifecycle_1, event_1, iterator_1, linkedList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerAction2 = exports.Action2 = exports.SyncActionDescriptor = exports.MenuItemAction = exports.SubmenuItemAction = exports.ExecuteCommandAction = exports.MenuRegistry = exports.IMenuService = exports.MenuId = exports.isISubmenuItem = exports.isIMenuItem = void 0;
    function isIMenuItem(item) {
        return item.command !== undefined;
    }
    exports.isIMenuItem = isIMenuItem;
    function isISubmenuItem(item) {
        return item.submenu !== undefined;
    }
    exports.isISubmenuItem = isISubmenuItem;
    class MenuId {
        constructor(debugName) {
            this.id = MenuId._idPool++;
            this._debugName = debugName;
        }
    }
    exports.MenuId = MenuId;
    MenuId._idPool = 0;
    MenuId.CommandPalette = new MenuId('CommandPalette');
    MenuId.DebugBreakpointsContext = new MenuId('DebugBreakpointsContext');
    MenuId.DebugCallStackContext = new MenuId('DebugCallStackContext');
    MenuId.DebugConsoleContext = new MenuId('DebugConsoleContext');
    MenuId.DebugVariablesContext = new MenuId('DebugVariablesContext');
    MenuId.DebugWatchContext = new MenuId('DebugWatchContext');
    MenuId.DebugToolBar = new MenuId('DebugToolBar');
    MenuId.EditorContext = new MenuId('EditorContext');
    MenuId.EditorContextPeek = new MenuId('EditorContextPeek');
    MenuId.EditorTitle = new MenuId('EditorTitle');
    MenuId.EditorTitleContext = new MenuId('EditorTitleContext');
    MenuId.EmptyEditorGroupContext = new MenuId('EmptyEditorGroupContext');
    MenuId.ExplorerContext = new MenuId('ExplorerContext');
    MenuId.ExtensionContext = new MenuId('ExtensionContext');
    MenuId.GlobalActivity = new MenuId('GlobalActivity');
    MenuId.MenubarAppearanceMenu = new MenuId('MenubarAppearanceMenu');
    MenuId.MenubarDebugMenu = new MenuId('MenubarDebugMenu');
    MenuId.MenubarEditMenu = new MenuId('MenubarEditMenu');
    MenuId.MenubarFileMenu = new MenuId('MenubarFileMenu');
    MenuId.MenubarGoMenu = new MenuId('MenubarGoMenu');
    MenuId.MenubarHelpMenu = new MenuId('MenubarHelpMenu');
    MenuId.MenubarLayoutMenu = new MenuId('MenubarLayoutMenu');
    MenuId.MenubarNewBreakpointMenu = new MenuId('MenubarNewBreakpointMenu');
    MenuId.MenubarPreferencesMenu = new MenuId('MenubarPreferencesMenu');
    MenuId.MenubarRecentMenu = new MenuId('MenubarRecentMenu');
    MenuId.MenubarSelectionMenu = new MenuId('MenubarSelectionMenu');
    MenuId.MenubarSwitchEditorMenu = new MenuId('MenubarSwitchEditorMenu');
    MenuId.MenubarSwitchGroupMenu = new MenuId('MenubarSwitchGroupMenu');
    MenuId.MenubarTerminalMenu = new MenuId('MenubarTerminalMenu');
    MenuId.MenubarViewMenu = new MenuId('MenubarViewMenu');
    MenuId.MenubarWebNavigationMenu = new MenuId('MenubarWebNavigationMenu');
    MenuId.OpenEditorsContext = new MenuId('OpenEditorsContext');
    MenuId.ProblemsPanelContext = new MenuId('ProblemsPanelContext');
    MenuId.SCMChangeContext = new MenuId('SCMChangeContext');
    MenuId.SCMResourceContext = new MenuId('SCMResourceContext');
    MenuId.SCMResourceFolderContext = new MenuId('SCMResourceFolderContext');
    MenuId.SCMResourceGroupContext = new MenuId('SCMResourceGroupContext');
    MenuId.SCMSourceControl = new MenuId('SCMSourceControl');
    MenuId.SCMTitle = new MenuId('SCMTitle');
    MenuId.SearchContext = new MenuId('SearchContext');
    MenuId.StatusBarWindowIndicatorMenu = new MenuId('StatusBarWindowIndicatorMenu');
    MenuId.TouchBarContext = new MenuId('TouchBarContext');
    MenuId.TitleBarContext = new MenuId('TitleBarContext');
    MenuId.TunnelContext = new MenuId('TunnelContext');
    MenuId.TunnelInline = new MenuId('TunnelInline');
    MenuId.TunnelTitle = new MenuId('TunnelTitle');
    MenuId.ViewItemContext = new MenuId('ViewItemContext');
    MenuId.ViewContainerTitleContext = new MenuId('ViewContainerTitleContext');
    MenuId.ViewTitle = new MenuId('ViewTitle');
    MenuId.ViewTitleContext = new MenuId('ViewTitleContext');
    MenuId.CommentThreadTitle = new MenuId('CommentThreadTitle');
    MenuId.CommentThreadActions = new MenuId('CommentThreadActions');
    MenuId.CommentTitle = new MenuId('CommentTitle');
    MenuId.CommentActions = new MenuId('CommentActions');
    MenuId.NotebookCellTitle = new MenuId('NotebookCellTitle');
    MenuId.NotebookCellBetween = new MenuId('NotebookCellBetween');
    MenuId.BulkEditTitle = new MenuId('BulkEditTitle');
    MenuId.BulkEditContext = new MenuId('BulkEditContext');
    MenuId.TimelineItemContext = new MenuId('TimelineItemContext');
    MenuId.TimelineTitle = new MenuId('TimelineTitle');
    MenuId.TimelineTitleContext = new MenuId('TimelineTitleContext');
    MenuId.AccountsContext = new MenuId('AccountsContext');
    exports.IMenuService = instantiation_1.createDecorator('menuService');
    exports.MenuRegistry = new class {
        constructor() {
            this._commands = new Map();
            this._menuItems = new Map();
            this._onDidChangeMenu = new event_1.Emitter();
            this.onDidChangeMenu = this._onDidChangeMenu.event;
            this._commandPaletteChangeEvent = {
                has: id => id === MenuId.CommandPalette
            };
        }
        addCommand(command) {
            return this.addCommands(iterator_1.Iterable.single(command));
        }
        addCommands(commands) {
            for (const command of commands) {
                this._commands.set(command.id, command);
            }
            this._onDidChangeMenu.fire(this._commandPaletteChangeEvent);
            return lifecycle_1.toDisposable(() => {
                let didChange = false;
                for (const command of commands) {
                    didChange = this._commands.delete(command.id) || didChange;
                }
                if (didChange) {
                    this._onDidChangeMenu.fire(this._commandPaletteChangeEvent);
                }
            });
        }
        getCommand(id) {
            return this._commands.get(id);
        }
        getCommands() {
            const map = new Map();
            this._commands.forEach((value, key) => map.set(key, value));
            return map;
        }
        appendMenuItem(id, item) {
            return this.appendMenuItems(iterator_1.Iterable.single({ id, item }));
        }
        appendMenuItems(items) {
            const changedIds = new Set();
            const toRemove = new linkedList_1.LinkedList();
            for (const { id, item } of items) {
                let list = this._menuItems.get(id);
                if (!list) {
                    list = new linkedList_1.LinkedList();
                    this._menuItems.set(id, list);
                }
                toRemove.push(list.push(item));
                changedIds.add(id);
            }
            this._onDidChangeMenu.fire(changedIds);
            return lifecycle_1.toDisposable(() => {
                if (toRemove.size > 0) {
                    for (let fn of toRemove) {
                        fn();
                    }
                    this._onDidChangeMenu.fire(changedIds);
                    toRemove.clear();
                }
            });
        }
        getMenuItems(id) {
            let result;
            if (this._menuItems.has(id)) {
                result = [...this._menuItems.get(id)];
            }
            else {
                result = [];
            }
            if (id === MenuId.CommandPalette) {
                // CommandPalette is special because it shows
                // all commands by default
                this._appendImplicitItems(result);
            }
            return result;
        }
        _appendImplicitItems(result) {
            const set = new Set();
            for (const item of result) {
                if (isIMenuItem(item)) {
                    set.add(item.command.id);
                    if (item.alt) {
                        set.add(item.alt.id);
                    }
                }
            }
            this._commands.forEach((command, id) => {
                if (!set.has(id)) {
                    result.push({ command });
                }
            });
        }
    };
    let ExecuteCommandAction = class ExecuteCommandAction extends actions_1.Action {
        constructor(id, label, _commandService) {
            super(id, label);
            this._commandService = _commandService;
        }
        run(...args) {
            return this._commandService.executeCommand(this.id, ...args);
        }
    };
    ExecuteCommandAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], ExecuteCommandAction);
    exports.ExecuteCommandAction = ExecuteCommandAction;
    class SubmenuItemAction extends actions_1.Action {
        constructor(item) {
            typeof item.title === 'string' ? super('', item.title, 'submenu') : super('', item.title.value, 'submenu');
            this.item = item;
        }
    }
    exports.SubmenuItemAction = SubmenuItemAction;
    let MenuItemAction = class MenuItemAction extends ExecuteCommandAction {
        constructor(item, alt, options, contextKeyService, commandService) {
            typeof item.title === 'string' ? super(item.id, item.title, commandService) : super(item.id, item.title.value, commandService);
            this._cssClass = undefined;
            this._enabled = !item.precondition || contextKeyService.contextMatchesRules(item.precondition);
            this._tooltip = item.tooltip ? typeof item.tooltip === 'string' ? item.tooltip : item.tooltip.value : undefined;
            if (item.toggled) {
                const toggled = (item.toggled.condition ? item.toggled : { condition: item.toggled });
                this._checked = contextKeyService.contextMatchesRules(toggled.condition);
                if (this._checked && toggled.tooltip) {
                    this._tooltip = typeof toggled.tooltip === 'string' ? toggled.tooltip : toggled.tooltip.value;
                }
            }
            this._options = options || {};
            this.item = item;
            this.alt = alt ? new MenuItemAction(alt, undefined, this._options, contextKeyService, commandService) : undefined;
        }
        dispose() {
            if (this.alt) {
                this.alt.dispose();
            }
            super.dispose();
        }
        run(...args) {
            let runArgs = [];
            if (this._options.arg) {
                runArgs = [...runArgs, this._options.arg];
            }
            if (this._options.shouldForwardArgs) {
                runArgs = [...runArgs, ...args];
            }
            return super.run(...runArgs);
        }
    };
    MenuItemAction = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, commands_1.ICommandService)
    ], MenuItemAction);
    exports.MenuItemAction = MenuItemAction;
    class SyncActionDescriptor {
        constructor(ctor, id, label, keybindings, keybindingContext, keybindingWeight) {
            this._id = id;
            this._label = label;
            this._keybindings = keybindings;
            this._keybindingContext = keybindingContext;
            this._keybindingWeight = keybindingWeight;
            this._descriptor = descriptors_1.createSyncDescriptor(ctor, this._id, this._label);
        }
        static create(ctor, id, label, keybindings, keybindingContext, keybindingWeight) {
            return new SyncActionDescriptor(ctor, id, label, keybindings, keybindingContext, keybindingWeight);
        }
        static from(ctor, keybindings, keybindingContext, keybindingWeight) {
            return SyncActionDescriptor.create(ctor, ctor.ID, ctor.LABEL, keybindings, keybindingContext, keybindingWeight);
        }
        get syncDescriptor() {
            return this._descriptor;
        }
        get id() {
            return this._id;
        }
        get label() {
            return this._label;
        }
        get keybindings() {
            return this._keybindings;
        }
        get keybindingContext() {
            return this._keybindingContext;
        }
        get keybindingWeight() {
            return this._keybindingWeight;
        }
    }
    exports.SyncActionDescriptor = SyncActionDescriptor;
    class Action2 {
        constructor(desc) {
            this.desc = desc;
        }
    }
    exports.Action2 = Action2;
    function registerAction2(ctor) {
        const disposables = new lifecycle_1.DisposableStore();
        const action = new ctor();
        const _a = action.desc, { f1, menu, keybinding, description } = _a, command = __rest(_a, ["f1", "menu", "keybinding", "description"]);
        // command
        disposables.add(commands_1.CommandsRegistry.registerCommand({
            id: command.id,
            handler: (accessor, ...args) => action.run(accessor, ...args),
            description: description,
        }));
        // menu
        if (Array.isArray(menu)) {
            disposables.add(exports.MenuRegistry.appendMenuItems(menu.map(item => ({ id: item.id, item: Object.assign({ command }, item) }))));
        }
        else if (menu) {
            disposables.add(exports.MenuRegistry.appendMenuItem(menu.id, Object.assign({ command }, menu)));
        }
        if (f1) {
            disposables.add(exports.MenuRegistry.appendMenuItem(MenuId.CommandPalette, { command, when: command.precondition }));
            disposables.add(exports.MenuRegistry.addCommand(command));
        }
        // keybinding
        if (Array.isArray(keybinding)) {
            for (let item of keybinding) {
                keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule(Object.assign(Object.assign({}, item), { id: command.id, when: command.precondition ? contextkey_1.ContextKeyExpr.and(command.precondition, item.when) : item.when }));
            }
        }
        else if (keybinding) {
            keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule(Object.assign(Object.assign({}, keybinding), { id: command.id, when: command.precondition ? contextkey_1.ContextKeyExpr.and(command.precondition, keybinding.when) : keybinding.when }));
        }
        return disposables;
    }
    exports.registerAction2 = registerAction2;
});
//#endregion
//# __sourceMappingURL=actions.js.map