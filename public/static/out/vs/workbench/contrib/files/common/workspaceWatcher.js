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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/base/common/map", "vs/base/common/errors", "vs/platform/notification/common/notification", "vs/nls", "vs/platform/opener/common/opener"], function (require, exports, lifecycle_1, uri_1, configuration_1, files_1, workspace_1, map_1, errors_1, notification_1, nls_1, opener_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceWatcher = void 0;
    let WorkspaceWatcher = class WorkspaceWatcher extends lifecycle_1.Disposable {
        constructor(fileService, configurationService, contextService, notificationService, openerService) {
            super();
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.watches = new map_1.ResourceMap();
            this.registerListeners();
            this.refresh();
        }
        registerListeners() {
            this._register(this.contextService.onDidChangeWorkspaceFolders(e => this.onDidChangeWorkspaceFolders(e)));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.onDidChangeWorkbenchState()));
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onDidChangeConfiguration(e)));
            this._register(this.fileService.onError(error => this.onError(error)));
        }
        onDidChangeWorkspaceFolders(e) {
            // Removed workspace: Unwatch
            for (const removed of e.removed) {
                this.unwatchWorkspace(removed.uri);
            }
            // Added workspace: Watch
            for (const added of e.added) {
                this.watchWorkspace(added.uri);
            }
        }
        onDidChangeWorkbenchState() {
            this.refresh();
        }
        onDidChangeConfiguration(e) {
            if (e.affectsConfiguration('files.watcherExclude')) {
                this.refresh();
            }
        }
        onError(error) {
            const msg = error.toString();
            // Forward to unexpected error handler
            errors_1.onUnexpectedError(msg);
            // Detect if we run < .NET Framework 4.5
            if (msg.indexOf('System.MissingMethodException') >= 0) {
                this.notificationService.prompt(notification_1.Severity.Warning, nls_1.localize('netVersionError', "The Microsoft .NET Framework 4.5 is required. Please follow the link to install it."), [{
                        label: nls_1.localize('installNet', "Download .NET Framework 4.5"),
                        run: () => this.openerService.open(uri_1.URI.parse('https://go.microsoft.com/fwlink/?LinkId=786533'))
                    }], {
                    sticky: true,
                    neverShowAgain: { id: 'ignoreNetVersionError', isSecondary: true, scope: notification_1.NeverShowAgainScope.WORKSPACE }
                });
            }
            // Detect if we run into ENOSPC issues
            if (msg.indexOf('ENOSPC') >= 0) {
                this.notificationService.prompt(notification_1.Severity.Warning, nls_1.localize('enospcError', "Unable to watch for file changes in this large workspace. Please follow the instructions link to resolve this issue."), [{
                        label: nls_1.localize('learnMore', "Instructions"),
                        run: () => this.openerService.open(uri_1.URI.parse('https://go.microsoft.com/fwlink/?linkid=867693'))
                    }], {
                    sticky: true,
                    neverShowAgain: { id: 'ignoreEnospcError', isSecondary: true, scope: notification_1.NeverShowAgainScope.WORKSPACE }
                });
            }
        }
        watchWorkspace(resource) {
            var _a;
            // Compute the watcher exclude rules from configuration
            const excludes = [];
            const config = this.configurationService.getValue({ resource });
            if ((_a = config.files) === null || _a === void 0 ? void 0 : _a.watcherExclude) {
                for (const key in config.files.watcherExclude) {
                    if (config.files.watcherExclude[key] === true) {
                        excludes.push(key);
                    }
                }
            }
            // Watch workspace
            const disposable = this.fileService.watch(resource, { recursive: true, excludes });
            this.watches.set(resource, disposable);
        }
        unwatchWorkspace(resource) {
            if (this.watches.has(resource)) {
                lifecycle_1.dispose(this.watches.get(resource));
                this.watches.delete(resource);
            }
        }
        refresh() {
            // Unwatch all first
            this.unwatchWorkspaces();
            // Watch each workspace folder
            for (const folder of this.contextService.getWorkspace().folders) {
                this.watchWorkspace(folder.uri);
            }
        }
        unwatchWorkspaces() {
            this.watches.forEach(disposable => lifecycle_1.dispose(disposable));
            this.watches.clear();
        }
        dispose() {
            super.dispose();
            this.unwatchWorkspaces();
        }
    };
    WorkspaceWatcher = __decorate([
        __param(0, files_1.IFileService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, notification_1.INotificationService),
        __param(4, opener_1.IOpenerService)
    ], WorkspaceWatcher);
    exports.WorkspaceWatcher = WorkspaceWatcher;
});
//# __sourceMappingURL=workspaceWatcher.js.map