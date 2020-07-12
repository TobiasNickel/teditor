/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/commands/common/commands", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/platform/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkey"], function (require, exports, platform_1, keybindingsRegistry_1, commands_1, actions_1, instantiation_1, lifecycle_1, lifecycle_2, notification_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extensions = void 0;
    exports.Extensions = {
        WorkbenchActions: 'workbench.contributions.actions'
    };
    platform_1.Registry.add(exports.Extensions.WorkbenchActions, new class {
        registerWorkbenchAction(descriptor, alias, category, when) {
            return this.registerWorkbenchCommandFromAction(descriptor, alias, category, when);
        }
        registerWorkbenchCommandFromAction(descriptor, alias, category, when) {
            const registrations = new lifecycle_1.DisposableStore();
            // command
            registrations.add(commands_1.CommandsRegistry.registerCommand(descriptor.id, this.createCommandHandler(descriptor)));
            // keybinding
            const weight = (typeof descriptor.keybindingWeight === 'undefined' ? 200 /* WorkbenchContrib */ : descriptor.keybindingWeight);
            const keybindings = descriptor.keybindings;
            keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
                id: descriptor.id,
                weight: weight,
                when: descriptor.keybindingContext && when
                    ? contextkey_1.ContextKeyExpr.and(descriptor.keybindingContext, when)
                    : descriptor.keybindingContext || when || null,
                primary: keybindings ? keybindings.primary : 0,
                secondary: keybindings === null || keybindings === void 0 ? void 0 : keybindings.secondary,
                win: keybindings === null || keybindings === void 0 ? void 0 : keybindings.win,
                mac: keybindings === null || keybindings === void 0 ? void 0 : keybindings.mac,
                linux: keybindings === null || keybindings === void 0 ? void 0 : keybindings.linux
            });
            // menu item
            // TODO@Rob slightly weird if-check required because of
            // https://github.com/Microsoft/vscode/blob/master/src/vs/workbench/contrib/search/electron-browser/search.contribution.ts#L266
            if (descriptor.label) {
                let idx = alias.indexOf(': ');
                let categoryOriginal = '';
                if (idx > 0) {
                    categoryOriginal = alias.substr(0, idx);
                    alias = alias.substr(idx + 2);
                }
                const command = {
                    id: descriptor.id,
                    title: { value: descriptor.label, original: alias },
                    category: category ? { value: category, original: categoryOriginal } : undefined
                };
                actions_1.MenuRegistry.addCommand(command);
                registrations.add(actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command, when }));
            }
            // TODO@alex,joh
            // support removal of keybinding rule
            // support removal of command-ui
            return registrations;
        }
        createCommandHandler(descriptor) {
            return async (accessor, args) => {
                const notificationService = accessor.get(notification_1.INotificationService);
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const lifecycleService = accessor.get(lifecycle_2.ILifecycleService);
                try {
                    await this.triggerAndDisposeAction(instantiationService, lifecycleService, descriptor, args);
                }
                catch (error) {
                    notificationService.error(error);
                }
            };
        }
        async triggerAndDisposeAction(instantiationService, lifecycleService, descriptor, args) {
            var _a;
            // run action when workbench is created
            await lifecycleService.when(2 /* Ready */);
            const actionInstance = instantiationService.createInstance(descriptor.syncDescriptor);
            actionInstance.label = descriptor.label || actionInstance.label;
            // don't run the action when not enabled
            if (!actionInstance.enabled) {
                actionInstance.dispose();
                return;
            }
            // otherwise run and dispose
            try {
                const from = ((_a = args) === null || _a === void 0 ? void 0 : _a.from) || 'keybinding';
                await actionInstance.run(undefined, { from });
            }
            finally {
                actionInstance.dispose();
            }
        }
    });
});
//# __sourceMappingURL=actions.js.map