/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/common/extHostTypeConverters", "vs/platform/commands/common/commands", "vs/platform/workspaces/common/workspaces", "vs/base/common/network", "vs/platform/log/common/log", "vs/platform/environment/common/environment"], function (require, exports, uri_1, typeConverters, commands_1, workspaces_1, network_1, log_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SetEditorLayoutAPICommand = exports.OpenIssueReporter = exports.RemoveFromRecentlyOpenedAPICommand = exports.OpenWithAPICommand = exports.OpenAPICommand = exports.DiffAPICommand = exports.NewWindowAPICommand = exports.OpenFolderAPICommand = void 0;
    function adjustHandler(handler) {
        return (accessor, ...args) => {
            return handler(accessor.get(commands_1.ICommandService), ...args);
        };
    }
    class OpenFolderAPICommand {
        static execute(executor, uri, arg = {}) {
            if (typeof arg === 'boolean') {
                arg = { forceNewWindow: arg };
            }
            if (!uri) {
                return executor.executeCommand('_files.pickFolderAndOpen', { forceNewWindow: arg.forceNewWindow });
            }
            const options = { forceNewWindow: arg.forceNewWindow, forceReuseWindow: arg.forceReuseWindow, noRecentEntry: arg.noRecentEntry };
            uri = uri_1.URI.revive(uri);
            const uriToOpen = (workspaces_1.hasWorkspaceFileExtension(uri) || uri.scheme === network_1.Schemas.untitled) ? { workspaceUri: uri } : { folderUri: uri };
            return executor.executeCommand('_files.windowOpen', [uriToOpen], options);
        }
    }
    exports.OpenFolderAPICommand = OpenFolderAPICommand;
    OpenFolderAPICommand.ID = 'vscode.openFolder';
    commands_1.CommandsRegistry.registerCommand({
        id: OpenFolderAPICommand.ID,
        handler: adjustHandler(OpenFolderAPICommand.execute),
        description: {
            description: 'Open a folder or workspace in the current window or new window depending on the newWindow argument. Note that opening in the same window will shutdown the current extension host process and start a new one on the given folder/workspace unless the newWindow parameter is set to true.',
            args: [
                { name: 'uri', description: '(optional) Uri of the folder or workspace file to open. If not provided, a native dialog will ask the user for the folder', constraint: (value) => value === undefined || value instanceof uri_1.URI },
                { name: 'options', description: '(optional) Options. Object with the following properties: `forceNewWindow `: Whether to open the folder/workspace in a new window or the same. Defaults to opening in the same window. `noRecentEntry`: Wheter the opened URI will appear in the \'Open Recent\' list. Defaults to true.  Note, for backward compatibility, options can also be of type boolean, representing the `forceNewWindow` setting.', constraint: (value) => value === undefined || typeof value === 'object' || typeof value === 'boolean' }
            ]
        }
    });
    class NewWindowAPICommand {
        static execute(executor, options) {
            const commandOptions = {
                forceReuseWindow: options && options.reuseWindow,
                remoteAuthority: options && options.remoteAuthority
            };
            return executor.executeCommand('_files.newWindow', commandOptions);
        }
    }
    exports.NewWindowAPICommand = NewWindowAPICommand;
    NewWindowAPICommand.ID = 'vscode.newWindow';
    commands_1.CommandsRegistry.registerCommand({
        id: NewWindowAPICommand.ID,
        handler: adjustHandler(NewWindowAPICommand.execute),
        description: {
            description: 'Opens an new window',
            args: []
        }
    });
    class DiffAPICommand {
        static execute(executor, left, right, label, options) {
            return executor.executeCommand('_workbench.diff', [
                left, right,
                label,
                undefined,
                typeConverters.TextEditorOpenOptions.from(options),
                options ? typeConverters.ViewColumn.from(options.viewColumn) : undefined
            ]);
        }
    }
    exports.DiffAPICommand = DiffAPICommand;
    DiffAPICommand.ID = 'vscode.diff';
    commands_1.CommandsRegistry.registerCommand(DiffAPICommand.ID, adjustHandler(DiffAPICommand.execute));
    class OpenAPICommand {
        static execute(executor, resource, columnOrOptions, label) {
            let options;
            let position;
            if (columnOrOptions) {
                if (typeof columnOrOptions === 'number') {
                    position = typeConverters.ViewColumn.from(columnOrOptions);
                }
                else {
                    options = typeConverters.TextEditorOpenOptions.from(columnOrOptions);
                    position = typeConverters.ViewColumn.from(columnOrOptions.viewColumn);
                }
            }
            return executor.executeCommand('_workbench.open', [
                resource,
                options,
                position,
                label
            ]);
        }
    }
    exports.OpenAPICommand = OpenAPICommand;
    OpenAPICommand.ID = 'vscode.open';
    commands_1.CommandsRegistry.registerCommand(OpenAPICommand.ID, adjustHandler(OpenAPICommand.execute));
    class OpenWithAPICommand {
        static execute(executor, resource, viewType, columnOrOptions) {
            let options;
            let position;
            if (typeof columnOrOptions === 'number') {
                position = typeConverters.ViewColumn.from(columnOrOptions);
            }
            else if (typeof columnOrOptions !== 'undefined') {
                options = typeConverters.TextEditorOpenOptions.from(columnOrOptions);
            }
            return executor.executeCommand('_workbench.openWith', [
                resource,
                viewType,
                options,
                position
            ]);
        }
    }
    exports.OpenWithAPICommand = OpenWithAPICommand;
    OpenWithAPICommand.ID = 'vscode.openWith';
    commands_1.CommandsRegistry.registerCommand(OpenWithAPICommand.ID, adjustHandler(OpenWithAPICommand.execute));
    commands_1.CommandsRegistry.registerCommand('_workbench.removeFromRecentlyOpened', function (accessor, uri) {
        const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
        return workspacesService.removeRecentlyOpened([uri]);
    });
    class RemoveFromRecentlyOpenedAPICommand {
        static execute(executor, path) {
            if (typeof path === 'string') {
                path = path.match(/^[^:/?#]+:\/\//) ? uri_1.URI.parse(path) : uri_1.URI.file(path);
            }
            else {
                path = uri_1.URI.revive(path); // called from extension host
            }
            return executor.executeCommand('_workbench.removeFromRecentlyOpened', path);
        }
    }
    exports.RemoveFromRecentlyOpenedAPICommand = RemoveFromRecentlyOpenedAPICommand;
    RemoveFromRecentlyOpenedAPICommand.ID = 'vscode.removeFromRecentlyOpened';
    commands_1.CommandsRegistry.registerCommand(RemoveFromRecentlyOpenedAPICommand.ID, adjustHandler(RemoveFromRecentlyOpenedAPICommand.execute));
    class OpenIssueReporter {
        static execute(executor, args) {
            const commandArgs = typeof args === 'string'
                ? { extensionId: args }
                : args;
            return executor.executeCommand('workbench.action.openIssueReporter', commandArgs);
        }
    }
    exports.OpenIssueReporter = OpenIssueReporter;
    OpenIssueReporter.ID = 'vscode.openIssueReporter';
    commands_1.CommandsRegistry.registerCommand('_workbench.addToRecentlyOpened', async function (accessor, recentEntry) {
        const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
        let recent = undefined;
        const uri = recentEntry.uri;
        const label = recentEntry.label;
        if (recentEntry.type === 'workspace') {
            const workspace = await workspacesService.getWorkspaceIdentifier(uri);
            recent = { workspace, label };
        }
        else if (recentEntry.type === 'folder') {
            recent = { folderUri: uri, label };
        }
        else {
            recent = { fileUri: uri, label };
        }
        return workspacesService.addRecentlyOpened([recent]);
    });
    commands_1.CommandsRegistry.registerCommand('_workbench.getRecentlyOpened', async function (accessor) {
        const workspacesService = accessor.get(workspaces_1.IWorkspacesService);
        return workspacesService.getRecentlyOpened();
    });
    class SetEditorLayoutAPICommand {
        static execute(executor, layout) {
            return executor.executeCommand('layoutEditorGroups', layout);
        }
    }
    exports.SetEditorLayoutAPICommand = SetEditorLayoutAPICommand;
    SetEditorLayoutAPICommand.ID = 'vscode.setEditorLayout';
    commands_1.CommandsRegistry.registerCommand({
        id: SetEditorLayoutAPICommand.ID,
        handler: adjustHandler(SetEditorLayoutAPICommand.execute),
        description: {
            description: 'Set Editor Layout',
            args: [{
                    name: 'args',
                    schema: {
                        'type': 'object',
                        'required': ['groups'],
                        'properties': {
                            'orientation': {
                                'type': 'number',
                                'default': 0,
                                'enum': [0, 1]
                            },
                            'groups': {
                                '$ref': '#/definitions/editorGroupsSchema',
                                'default': [{}, {}],
                            }
                        }
                    }
                }]
        }
    });
    commands_1.CommandsRegistry.registerCommand('_extensionTests.setLogLevel', function (accessor, level) {
        const logService = accessor.get(log_1.ILogService);
        const environmentService = accessor.get(environment_1.IEnvironmentService);
        if (environmentService.isExtensionDevelopment && !!environmentService.extensionTestsLocationURI) {
            logService.setLevel(level);
        }
    });
    commands_1.CommandsRegistry.registerCommand('_extensionTests.getLogLevel', function (accessor) {
        const logService = accessor.get(log_1.ILogService);
        return logService.getLevel();
    });
});
//# __sourceMappingURL=apiCommands.js.map