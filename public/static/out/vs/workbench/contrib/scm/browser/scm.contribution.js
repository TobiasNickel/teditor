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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "./dirtydiffDecorator", "vs/workbench/browser/viewlet", "vs/workbench/contrib/scm/common/scm", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/services/viewlet/browser/viewlet", "./activity", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/contextkey/common/contextkey", "vs/platform/commands/common/commands", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/scm/common/scmService", "vs/workbench/common/views", "vs/workbench/contrib/scm/browser/scmViewlet", "vs/platform/instantiation/common/descriptors", "vs/editor/common/modes/modesRegistry", "vs/base/common/codicons"], function (require, exports, nls_1, platform_1, contributions_1, dirtydiffDecorator_1, viewlet_1, scm_1, actions_1, actions_2, viewlet_2, activity_1, configurationRegistry_1, editorGroupsService_1, contextkey_1, commands_1, keybindingsRegistry_1, layoutService_1, extensions_1, scmService_1, views_1, scmViewlet_1, descriptors_1, modesRegistry_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let OpenSCMViewletAction = class OpenSCMViewletAction extends viewlet_1.ShowViewletAction {
        constructor(id, label, viewletService, editorGroupService, layoutService) {
            super(id, label, scm_1.VIEWLET_ID, viewletService, editorGroupService, layoutService);
        }
    };
    OpenSCMViewletAction.ID = scm_1.VIEWLET_ID;
    OpenSCMViewletAction.LABEL = nls_1.localize('toggleSCMViewlet', "Show SCM");
    OpenSCMViewletAction = __decorate([
        __param(2, viewlet_2.IViewletService), __param(3, editorGroupsService_1.IEditorGroupsService), __param(4, layoutService_1.IWorkbenchLayoutService)
    ], OpenSCMViewletAction);
    modesRegistry_1.ModesRegistry.registerLanguage({
        id: 'scminput',
        extensions: [],
        mimetypes: ['text/x-scm-input']
    });
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(dirtydiffDecorator_1.DirtyDiffWorkbenchController, 3 /* Restored */);
    platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: scm_1.VIEWLET_ID,
        name: nls_1.localize('source control', "Source Control"),
        ctorDescriptor: new descriptors_1.SyncDescriptor(scmViewlet_1.SCMViewPaneContainer),
        storageId: 'workbench.scm.views.state',
        icon: codicons_1.Codicon.sourceControl.classNames,
        alwaysUseContainerInfo: true,
        order: 2
    }, views_1.ViewContainerLocation.Sidebar);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(activity_1.SCMStatusController, 3 /* Restored */);
    // Register Action to Open Viewlet
    platform_1.Registry.as(actions_1.Extensions.WorkbenchActions).registerWorkbenchAction(actions_2.SyncActionDescriptor.from(OpenSCMViewletAction, {
        primary: 0,
        win: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 37 /* KEY_G */ },
        linux: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 37 /* KEY_G */ },
        mac: { primary: 256 /* WinCtrl */ | 1024 /* Shift */ | 37 /* KEY_G */ }
    }), 'View: Show SCM', nls_1.localize('view', "View"));
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        id: 'scm',
        order: 5,
        title: nls_1.localize('scmConfigurationTitle', "SCM"),
        type: 'object',
        scope: 4 /* RESOURCE */,
        properties: {
            'scm.alwaysShowProviders': {
                type: 'boolean',
                description: nls_1.localize('alwaysShowProviders', "Controls whether to show the Source Control Provider section even when there's only one Provider registered."),
                default: false
            },
            'scm.providers.visible': {
                type: 'number',
                description: nls_1.localize('providersVisible', "Controls how many providers are visible in the Source Control Provider section. Set to `0` to be able to manually resize the view."),
                default: 10
            },
            'scm.diffDecorations': {
                type: 'string',
                enum: ['all', 'gutter', 'overview', 'minimap', 'none'],
                enumDescriptions: [
                    nls_1.localize('scm.diffDecorations.all', "Show the diff decorations in all available locations."),
                    nls_1.localize('scm.diffDecorations.gutter', "Show the diff decorations only in the editor gutter."),
                    nls_1.localize('scm.diffDecorations.overviewRuler', "Show the diff decorations only in the overview ruler."),
                    nls_1.localize('scm.diffDecorations.minimap', "Show the diff decorations only in the minimap."),
                    nls_1.localize('scm.diffDecorations.none', "Do not show the diff decorations.")
                ],
                default: 'all',
                description: nls_1.localize('diffDecorations', "Controls diff decorations in the editor.")
            },
            'scm.diffDecorationsGutterWidth': {
                type: 'number',
                enum: [1, 2, 3, 4, 5],
                default: 3,
                description: nls_1.localize('diffGutterWidth', "Controls the width(px) of diff decorations in gutter (added & modified).")
            },
            'scm.diffDecorationsGutterVisibility': {
                type: 'string',
                enum: ['always', 'hover'],
                enumDescriptions: [
                    nls_1.localize('scm.diffDecorationsGutterVisibility.always', "Show the diff decorator in the gutter at all times."),
                    nls_1.localize('scm.diffDecorationsGutterVisibility.hover', "Show the diff decorator in the gutter only on hover.")
                ],
                description: nls_1.localize('scm.diffDecorationsGutterVisibility', "Controls the visibility of the Source Control diff decorator in the gutter."),
                default: 'always'
            },
            'scm.alwaysShowActions': {
                type: 'boolean',
                description: nls_1.localize('alwaysShowActions', "Controls whether inline actions are always visible in the Source Control view."),
                default: false
            },
            'scm.countBadge': {
                type: 'string',
                enum: ['all', 'focused', 'off'],
                enumDescriptions: [
                    nls_1.localize('scm.countBadge.all', "Show the sum of all Source Control Providers count badges."),
                    nls_1.localize('scm.countBadge.focused', "Show the count badge of the focused Source Control Provider."),
                    nls_1.localize('scm.countBadge.off', "Disable the Source Control count badge.")
                ],
                description: nls_1.localize('scm.countBadge', "Controls the Source Control count badge."),
                default: 'all'
            },
            'scm.defaultViewMode': {
                type: 'string',
                enum: ['tree', 'list'],
                enumDescriptions: [
                    nls_1.localize('scm.defaultViewMode.tree', "Show the repository changes as a tree."),
                    nls_1.localize('scm.defaultViewMode.list', "Show the repository changes as a list.")
                ],
                description: nls_1.localize('scm.defaultViewMode', "Controls the default Source Control repository view mode."),
                default: 'list'
            },
            'scm.autoReveal': {
                type: 'boolean',
                description: nls_1.localize('autoReveal', "Controls whether the SCM view should automatically reveal and select files when opening them."),
                default: true
            },
            'scm.inputFontFamily': {
                type: 'string',
                markdownDescription: nls_1.localize('inputFontFamily', "Controls the font for the input message. Use `default` for the workbench user interface font family, `editor` for the `#editor.fontFamily#`'s value, or a custom font family."),
                default: 'default'
            }
        }
    });
    // View menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarViewMenu, {
        group: '3_views',
        command: {
            id: scm_1.VIEWLET_ID,
            title: nls_1.localize({ key: 'miViewSCM', comment: ['&& denotes a mnemonic'] }, "S&&CM")
        },
        order: 3
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'scm.acceptInput',
        description: { description: nls_1.localize('scm accept', "SCM: Accept Input"), args: [] },
        weight: 200 /* WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.has('scmRepository'),
        primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
        handler: accessor => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const context = contextKeyService.getContext(document.activeElement);
            const repository = context.getValue('scmRepository');
            if (!repository || !repository.provider.acceptInputCommand) {
                return Promise.resolve(null);
            }
            const id = repository.provider.acceptInputCommand.id;
            const args = repository.provider.acceptInputCommand.arguments;
            const commandService = accessor.get(commands_1.ICommandService);
            return commandService.executeCommand(id, ...(args || []));
        }
    });
    extensions_1.registerSingleton(scm_1.ISCMService, scmService_1.SCMService);
});
//# __sourceMappingURL=scm.contribution.js.map