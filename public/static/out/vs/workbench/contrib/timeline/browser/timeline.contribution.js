/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/registry/common/platform", "vs/workbench/common/views", "vs/workbench/contrib/files/browser/explorerViewlet", "vs/workbench/contrib/timeline/common/timeline", "vs/workbench/contrib/timeline/common/timelineService", "./timelinePane", "vs/platform/configuration/common/configurationRegistry", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/workbench/contrib/files/common/files", "vs/workbench/common/resources"], function (require, exports, nls_1, descriptors_1, extensions_1, platform_1, views_1, explorerViewlet_1, timeline_1, timelineService_1, timelinePane_1, configurationRegistry_1, contextkey_1, actions_1, commands_1, files_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimelinePaneDescriptor = void 0;
    class TimelinePaneDescriptor {
        constructor() {
            this.id = timeline_1.TimelinePaneId;
            this.name = timelinePane_1.TimelinePane.TITLE;
            this.containerIcon = 'codicon-history';
            this.ctorDescriptor = new descriptors_1.SyncDescriptor(timelinePane_1.TimelinePane);
            this.order = 2;
            this.weight = 30;
            this.collapsed = true;
            this.canToggleVisibility = true;
            this.hideByDefault = false;
            this.canMoveView = true;
            this.focusCommand = { id: 'timeline.focus' };
        }
    }
    exports.TimelinePaneDescriptor = TimelinePaneDescriptor;
    // Configuration
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'timeline',
        order: 1001,
        title: nls_1.localize('timelineConfigurationTitle', "Timeline"),
        type: 'object',
        properties: {
            'timeline.excludeSources': {
                type: [
                    'array',
                    'null'
                ],
                default: null,
                description: nls_1.localize('timeline.excludeSources', "An array of Timeline sources that should be excluded from the Timeline view"),
            },
            'timeline.pageSize': {
                type: ['number', 'null'],
                default: null,
                markdownDescription: nls_1.localize('timeline.pageSize', "The number of items to show in the Timeline view by default and when loading more items. Setting to `null` (the default) will automatically choose a page size based on the visible area of the Timeline view"),
            },
            'timeline.pageOnScroll': {
                type: 'boolean',
                default: false,
                description: nls_1.localize('timeline.pageOnScroll', "Experimental. Controls whether the Timeline view will load the next page of items when you scroll to the end of the list"),
            },
        }
    });
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([new TimelinePaneDescriptor()], explorerViewlet_1.VIEW_CONTAINER);
    var OpenTimelineAction;
    (function (OpenTimelineAction) {
        OpenTimelineAction.ID = 'files.openTimeline';
        OpenTimelineAction.LABEL = nls_1.localize('files.openTimeline', "Open Timeline");
        function handler() {
            return (accessor, arg) => {
                const service = accessor.get(timeline_1.ITimelineService);
                return service.setUri(arg);
            };
        }
        OpenTimelineAction.handler = handler;
    })(OpenTimelineAction || (OpenTimelineAction = {}));
    commands_1.CommandsRegistry.registerCommand(OpenTimelineAction.ID, OpenTimelineAction.handler());
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, ({
        group: '4_timeline',
        order: 1,
        command: {
            id: OpenTimelineAction.ID,
            title: OpenTimelineAction.LABEL,
            icon: { id: 'codicon/history' }
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), resources_1.ResourceContextKey.HasResource)
    }));
    extensions_1.registerSingleton(timeline_1.ITimelineService, timelineService_1.TimelineService, true);
});
//# __sourceMappingURL=timeline.contribution.js.map