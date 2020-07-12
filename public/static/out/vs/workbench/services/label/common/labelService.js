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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/event", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/environment/common/environment", "vs/platform/workspace/common/workspace", "vs/base/common/resources", "vs/base/common/labels", "vs/platform/workspaces/common/workspaces", "vs/platform/label/common/label", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/base/common/glob", "vs/platform/instantiation/common/extensions", "vs/workbench/services/path/common/pathService"], function (require, exports, nls_1, uri_1, lifecycle_1, paths, event_1, contributions_1, platform_1, environment_1, workspace_1, resources_1, labels_1, workspaces_1, label_1, extensionsRegistry_1, glob_1, extensions_1, pathService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LabelService = void 0;
    const resourceLabelFormattersExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'resourceLabelFormatters',
        jsonSchema: {
            description: nls_1.localize('vscode.extension.contributes.resourceLabelFormatters', 'Contributes resource label formatting rules.'),
            type: 'array',
            items: {
                type: 'object',
                required: ['scheme', 'formatting'],
                properties: {
                    scheme: {
                        type: 'string',
                        description: nls_1.localize('vscode.extension.contributes.resourceLabelFormatters.scheme', 'URI scheme on which to match the formatter on. For example "file". Simple glob patterns are supported.'),
                    },
                    authority: {
                        type: 'string',
                        description: nls_1.localize('vscode.extension.contributes.resourceLabelFormatters.authority', 'URI authority on which to match the formatter on. Simple glob patterns are supported.'),
                    },
                    formatting: {
                        description: nls_1.localize('vscode.extension.contributes.resourceLabelFormatters.formatting', "Rules for formatting uri resource labels."),
                        type: 'object',
                        properties: {
                            label: {
                                type: 'string',
                                description: nls_1.localize('vscode.extension.contributes.resourceLabelFormatters.label', "Label rules to display. For example: myLabel:/${path}. ${path}, ${scheme} and ${authority} are supported as variables.")
                            },
                            separator: {
                                type: 'string',
                                description: nls_1.localize('vscode.extension.contributes.resourceLabelFormatters.separator', "Separator to be used in the uri label display. '/' or '\' as an example.")
                            },
                            tildify: {
                                type: 'boolean',
                                description: nls_1.localize('vscode.extension.contributes.resourceLabelFormatters.tildify', "Controls if the start of the uri label should be tildified when possible.")
                            },
                            workspaceSuffix: {
                                type: 'string',
                                description: nls_1.localize('vscode.extension.contributes.resourceLabelFormatters.formatting.workspaceSuffix', "Suffix appended to the workspace label.")
                            }
                        }
                    }
                }
            }
        }
    });
    const sepRegexp = /\//g;
    const labelMatchingRegexp = /\$\{(scheme|authority|path|(query)\.(.+?))\}/g;
    function hasDriveLetter(path) {
        return !!(path && path[2] === ':');
    }
    let ResourceLabelFormattersHandler = class ResourceLabelFormattersHandler {
        constructor(labelService) {
            this.formattersDisposables = new Map();
            resourceLabelFormattersExtPoint.setHandler((extensions, delta) => {
                delta.added.forEach(added => added.value.forEach(formatter => {
                    this.formattersDisposables.set(formatter, labelService.registerFormatter(formatter));
                }));
                delta.removed.forEach(removed => removed.value.forEach(formatter => {
                    this.formattersDisposables.get(formatter).dispose();
                }));
            });
        }
    };
    ResourceLabelFormattersHandler = __decorate([
        __param(0, label_1.ILabelService)
    ], ResourceLabelFormattersHandler);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ResourceLabelFormattersHandler, 3 /* Restored */);
    let LabelService = class LabelService extends lifecycle_1.Disposable {
        constructor(environmentService, contextService, pathService) {
            super();
            this.environmentService = environmentService;
            this.contextService = contextService;
            this.pathService = pathService;
            this.formatters = [];
            this._onDidChangeFormatters = this._register(new event_1.Emitter());
            this.onDidChangeFormatters = this._onDidChangeFormatters.event;
        }
        findFormatting(resource) {
            let bestResult;
            this.formatters.forEach(formatter => {
                if (formatter.scheme === resource.scheme) {
                    if (!bestResult && !formatter.authority) {
                        bestResult = formatter;
                        return;
                    }
                    if (!formatter.authority) {
                        return;
                    }
                    if (glob_1.match(formatter.authority.toLowerCase(), resource.authority.toLowerCase()) && (!bestResult || !bestResult.authority || formatter.authority.length > bestResult.authority.length || ((formatter.authority.length === bestResult.authority.length) && formatter.priority))) {
                        bestResult = formatter;
                    }
                }
            });
            return bestResult ? bestResult.formatting : undefined;
        }
        getUriLabel(resource, options = {}) {
            return this.doGetUriLabel(resource, this.findFormatting(resource), options);
        }
        doGetUriLabel(resource, formatting, options = {}) {
            var _a, _b;
            if (!formatting) {
                return labels_1.getPathLabel(resource.path, { userHome: this.pathService.resolvedUserHome }, options.relative ? this.contextService : undefined);
            }
            let label;
            const baseResource = (_a = this.contextService) === null || _a === void 0 ? void 0 : _a.getWorkspaceFolder(resource);
            if (options.relative && baseResource) {
                const rootName = (_b = baseResource === null || baseResource === void 0 ? void 0 : baseResource.name) !== null && _b !== void 0 ? _b : resources_1.basenameOrAuthority(baseResource.uri);
                let relativeLabel;
                if (resources_1.isEqual(baseResource.uri, resource)) {
                    relativeLabel = ''; // no label if resources are identical
                }
                else {
                    const baseResourceLabel = this.formatUri(baseResource.uri, formatting, options.noPrefix);
                    relativeLabel = this.formatUri(resource, formatting, options.noPrefix).substring(baseResourceLabel.lastIndexOf(formatting.separator) + 1);
                    if (relativeLabel.startsWith(rootName)) {
                        relativeLabel = relativeLabel.substring(rootName.length + (relativeLabel[rootName.length] === formatting.separator ? 1 : 0));
                    }
                }
                const hasMultipleRoots = this.contextService.getWorkspace().folders.length > 1;
                if (hasMultipleRoots && !options.noPrefix) {
                    relativeLabel = relativeLabel ? (rootName + ' • ' + relativeLabel) : rootName; // always show root basename if there are multiple
                }
                label = relativeLabel;
            }
            else {
                label = this.formatUri(resource, formatting, options.noPrefix);
            }
            return options.endWithSeparator ? this.appendSeparatorIfMissing(label, formatting) : label;
        }
        getUriBasenameLabel(resource) {
            const formatting = this.findFormatting(resource);
            const label = this.doGetUriLabel(resource, formatting);
            if (formatting) {
                switch (formatting.separator) {
                    case paths.win32.sep: return paths.win32.basename(label);
                    case paths.posix.sep: return paths.posix.basename(label);
                }
            }
            return paths.basename(label);
        }
        getWorkspaceLabel(workspace, options) {
            if (workspace_1.IWorkspace.isIWorkspace(workspace)) {
                const identifier = workspaces_1.toWorkspaceIdentifier(workspace);
                if (!identifier) {
                    return '';
                }
                workspace = identifier;
            }
            // Workspace: Single Folder
            if (workspaces_1.isSingleFolderWorkspaceIdentifier(workspace)) {
                // Folder on disk
                const label = options && options.verbose ? this.getUriLabel(workspace) : resources_1.basename(workspace) || '/';
                return this.appendWorkspaceSuffix(label, workspace);
            }
            if (workspaces_1.isWorkspaceIdentifier(workspace)) {
                // Workspace: Untitled
                if (workspaces_1.isUntitledWorkspace(workspace.configPath, this.environmentService)) {
                    return nls_1.localize('untitledWorkspace', "Untitled (Workspace)");
                }
                // Workspace: Saved
                let filename = resources_1.basename(workspace.configPath);
                if (filename.endsWith(workspaces_1.WORKSPACE_EXTENSION)) {
                    filename = filename.substr(0, filename.length - workspaces_1.WORKSPACE_EXTENSION.length - 1);
                }
                let label;
                if (options && options.verbose) {
                    label = nls_1.localize('workspaceNameVerbose', "{0} (Workspace)", this.getUriLabel(resources_1.joinPath(resources_1.dirname(workspace.configPath), filename)));
                }
                else {
                    label = nls_1.localize('workspaceName', "{0} (Workspace)", filename);
                }
                return this.appendWorkspaceSuffix(label, workspace.configPath);
            }
            return '';
        }
        getSeparator(scheme, authority) {
            const formatter = this.findFormatting(uri_1.URI.from({ scheme, authority }));
            return formatter && formatter.separator || '/';
        }
        getHostLabel(scheme, authority) {
            const formatter = this.findFormatting(uri_1.URI.from({ scheme, authority }));
            return formatter && formatter.workspaceSuffix || '';
        }
        registerFormatter(formatter) {
            this.formatters.push(formatter);
            this._onDidChangeFormatters.fire({ scheme: formatter.scheme });
            return {
                dispose: () => {
                    this.formatters = this.formatters.filter(f => f !== formatter);
                    this._onDidChangeFormatters.fire({ scheme: formatter.scheme });
                }
            };
        }
        formatUri(resource, formatting, forceNoTildify) {
            let label = formatting.label.replace(labelMatchingRegexp, (match, token, qsToken, qsValue) => {
                switch (token) {
                    case 'scheme': return resource.scheme;
                    case 'authority': return resource.authority;
                    case 'path': return resource.path;
                    default: {
                        if (qsToken === 'query') {
                            const { query } = resource;
                            if (query && query[0] === '{' && query[query.length - 1] === '}') {
                                try {
                                    return JSON.parse(query)[qsValue] || '';
                                }
                                catch (_a) { }
                            }
                        }
                        return '';
                    }
                }
            });
            // convert \c:\something => C:\something
            if (formatting.normalizeDriveLetter && hasDriveLetter(label)) {
                label = label.charAt(1).toUpperCase() + label.substr(2);
            }
            if (formatting.tildify && !forceNoTildify) {
                const userHome = this.pathService.resolvedUserHome;
                if (userHome) {
                    label = labels_1.tildify(label, userHome.fsPath);
                }
            }
            if (formatting.authorityPrefix && resource.authority) {
                label = formatting.authorityPrefix + label;
            }
            return label.replace(sepRegexp, formatting.separator);
        }
        appendSeparatorIfMissing(label, formatting) {
            let appendedLabel = label;
            if (!label.endsWith(formatting.separator)) {
                appendedLabel += formatting.separator;
            }
            return appendedLabel;
        }
        appendWorkspaceSuffix(label, uri) {
            const formatting = this.findFormatting(uri);
            const suffix = formatting && (typeof formatting.workspaceSuffix === 'string') ? formatting.workspaceSuffix : undefined;
            return suffix ? `${label} [${suffix}]` : label;
        }
    };
    LabelService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, pathService_1.IPathService)
    ], LabelService);
    exports.LabelService = LabelService;
    extensions_1.registerSingleton(label_1.ILabelService, LabelService, true);
});
//# __sourceMappingURL=labelService.js.map