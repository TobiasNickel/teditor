/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/process", "vs/base/common/types", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/labels", "vs/nls"], function (require, exports, paths, process, types, objects, platform_1, labels_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractVariableResolverService = void 0;
    class AbstractVariableResolverService {
        constructor(_context, _envVariables, _ignoreEditorVariables = false) {
            this._ignoreEditorVariables = _ignoreEditorVariables;
            this._contributedVariables = new Map();
            this._context = _context;
            if (_envVariables) {
                if (platform_1.isWindows) {
                    // windows env variables are case insensitive
                    const ev = Object.create(null);
                    this._envVariables = ev;
                    Object.keys(_envVariables).forEach(key => {
                        ev[key.toLowerCase()] = _envVariables[key];
                    });
                }
                else {
                    this._envVariables = _envVariables;
                }
            }
        }
        resolve(root, value) {
            return this.recursiveResolve(root ? root.uri : undefined, value);
        }
        resolveAnyBase(workspaceFolder, config, commandValueMapping, resolvedVariables) {
            const result = objects.deepClone(config);
            // hoist platform specific attributes to top level
            if (platform_1.isWindows && result.windows) {
                Object.keys(result.windows).forEach(key => result[key] = result.windows[key]);
            }
            else if (platform_1.isMacintosh && result.osx) {
                Object.keys(result.osx).forEach(key => result[key] = result.osx[key]);
            }
            else if (platform_1.isLinux && result.linux) {
                Object.keys(result.linux).forEach(key => result[key] = result.linux[key]);
            }
            // delete all platform specific sections
            delete result.windows;
            delete result.osx;
            delete result.linux;
            // substitute all variables recursively in string values
            return this.recursiveResolve(workspaceFolder ? workspaceFolder.uri : undefined, result, commandValueMapping, resolvedVariables);
        }
        resolveAny(workspaceFolder, config, commandValueMapping) {
            return this.resolveAnyBase(workspaceFolder, config, commandValueMapping);
        }
        resolveAnyMap(workspaceFolder, config, commandValueMapping) {
            const resolvedVariables = new Map();
            const newConfig = this.resolveAnyBase(workspaceFolder, config, commandValueMapping, resolvedVariables);
            return { newConfig, resolvedVariables };
        }
        resolveWithInteractionReplace(folder, config, section, variables) {
            throw new Error('resolveWithInteractionReplace not implemented.');
        }
        resolveWithInteraction(folder, config, section, variables) {
            throw new Error('resolveWithInteraction not implemented.');
        }
        contributeVariable(variable, resolution) {
            if (this._contributedVariables.has(variable)) {
                throw new Error('Variable ' + variable + ' is contributed twice.');
            }
            else {
                this._contributedVariables.set(variable, resolution);
            }
        }
        recursiveResolve(folderUri, value, commandValueMapping, resolvedVariables) {
            if (types.isString(value)) {
                return this.resolveString(folderUri, value, commandValueMapping, resolvedVariables);
            }
            else if (types.isArray(value)) {
                return value.map(s => this.recursiveResolve(folderUri, s, commandValueMapping, resolvedVariables));
            }
            else if (types.isObject(value)) {
                let result = Object.create(null);
                Object.keys(value).forEach(key => {
                    const replaced = this.resolveString(folderUri, key, commandValueMapping, resolvedVariables);
                    result[replaced] = this.recursiveResolve(folderUri, value[key], commandValueMapping, resolvedVariables);
                });
                return result;
            }
            return value;
        }
        resolveString(folderUri, value, commandValueMapping, resolvedVariables) {
            // loop through all variables occurrences in 'value'
            const replaced = value.replace(AbstractVariableResolverService.VARIABLE_REGEXP, (match, variable) => {
                let resolvedValue = this.evaluateSingleVariable(match, variable, folderUri, commandValueMapping);
                if (resolvedVariables) {
                    resolvedVariables.set(variable, resolvedValue);
                }
                return resolvedValue;
            });
            return replaced;
        }
        evaluateSingleVariable(match, variable, folderUri, commandValueMapping) {
            // try to separate variable arguments from variable name
            let argument;
            const parts = variable.split(':');
            if (parts.length > 1) {
                variable = parts[0];
                argument = parts[1];
            }
            // common error handling for all variables that require an open editor
            const getFilePath = () => {
                const filePath = this._context.getFilePath();
                if (filePath) {
                    return filePath;
                }
                throw new Error(nls_1.localize('canNotResolveFile', "'{0}' can not be resolved. Please open an editor.", match));
            };
            // common error handling for all variables that require an open folder and accept a folder name argument
            const getFolderUri = (withArg = true) => {
                if (withArg && argument) {
                    const folder = this._context.getFolderUri(argument);
                    if (folder) {
                        return folder;
                    }
                    throw new Error(nls_1.localize('canNotFindFolder', "'{0}' can not be resolved. No such folder '{1}'.", match, argument));
                }
                if (folderUri) {
                    return folderUri;
                }
                if (this._context.getWorkspaceFolderCount() > 1) {
                    throw new Error(nls_1.localize('canNotResolveWorkspaceFolderMultiRoot', "'{0}' can not be resolved in a multi folder workspace. Scope this variable using ':' and a workspace folder name.", match));
                }
                throw new Error(nls_1.localize('canNotResolveWorkspaceFolder', "'{0}' can not be resolved. Please open a folder.", match));
            };
            switch (variable) {
                case 'env':
                    if (argument) {
                        if (this._envVariables) {
                            const env = this._envVariables[platform_1.isWindows ? argument.toLowerCase() : argument];
                            if (types.isString(env)) {
                                return env;
                            }
                        }
                        // For `env` we should do the same as a normal shell does - evaluates undefined envs to an empty string #46436
                        return '';
                    }
                    throw new Error(nls_1.localize('missingEnvVarName', "'{0}' can not be resolved because no environment variable name is given.", match));
                case 'config':
                    if (argument) {
                        const config = this._context.getConfigurationValue(getFolderUri(false), argument);
                        if (types.isUndefinedOrNull(config)) {
                            throw new Error(nls_1.localize('configNotFound', "'{0}' can not be resolved because setting '{1}' not found.", match, argument));
                        }
                        if (types.isObject(config)) {
                            throw new Error(nls_1.localize('configNoString', "'{0}' can not be resolved because '{1}' is a structured value.", match, argument));
                        }
                        return config;
                    }
                    throw new Error(nls_1.localize('missingConfigName', "'{0}' can not be resolved because no settings name is given.", match));
                case 'command':
                    return this.resolveFromMap(match, argument, commandValueMapping, 'command');
                case 'input':
                    return this.resolveFromMap(match, argument, commandValueMapping, 'input');
                default: {
                    switch (variable) {
                        case 'workspaceRoot':
                        case 'workspaceFolder':
                            return labels_1.normalizeDriveLetter(getFolderUri().fsPath);
                        case 'cwd':
                            return ((folderUri || argument) ? labels_1.normalizeDriveLetter(getFolderUri().fsPath) : process.cwd());
                        case 'workspaceRootFolderName':
                        case 'workspaceFolderBasename':
                            return paths.basename(getFolderUri().fsPath);
                        case 'lineNumber':
                            if (this._ignoreEditorVariables) {
                                return match;
                            }
                            const lineNumber = this._context.getLineNumber();
                            if (lineNumber) {
                                return lineNumber;
                            }
                            throw new Error(nls_1.localize('canNotResolveLineNumber', "'{0}' can not be resolved. Make sure to have a line selected in the active editor.", match));
                        case 'selectedText':
                            if (this._ignoreEditorVariables) {
                                return match;
                            }
                            const selectedText = this._context.getSelectedText();
                            if (selectedText) {
                                return selectedText;
                            }
                            throw new Error(nls_1.localize('canNotResolveSelectedText', "'{0}' can not be resolved. Make sure to have some text selected in the active editor.", match));
                        case 'file':
                            if (this._ignoreEditorVariables) {
                                return match;
                            }
                            return getFilePath();
                        case 'relativeFile':
                            if (this._ignoreEditorVariables) {
                                return match;
                            }
                            if (folderUri || argument) {
                                return paths.normalize(paths.relative(getFolderUri().fsPath, getFilePath()));
                            }
                            return getFilePath();
                        case 'relativeFileDirname':
                            if (this._ignoreEditorVariables) {
                                return match;
                            }
                            const dirname = paths.dirname(getFilePath());
                            if (folderUri || argument) {
                                return paths.normalize(paths.relative(getFolderUri().fsPath, dirname));
                            }
                            return dirname;
                        case 'fileDirname':
                            if (this._ignoreEditorVariables) {
                                return match;
                            }
                            return paths.dirname(getFilePath());
                        case 'fileExtname':
                            if (this._ignoreEditorVariables) {
                                return match;
                            }
                            return paths.extname(getFilePath());
                        case 'fileBasename':
                            if (this._ignoreEditorVariables) {
                                return match;
                            }
                            return paths.basename(getFilePath());
                        case 'fileBasenameNoExtension':
                            if (this._ignoreEditorVariables) {
                                return match;
                            }
                            const basename = paths.basename(getFilePath());
                            return (basename.slice(0, basename.length - paths.extname(basename).length));
                        case 'execPath':
                            const ep = this._context.getExecPath();
                            if (ep) {
                                return ep;
                            }
                            return match;
                        default:
                            try {
                                return this.resolveFromMap(match, variable, commandValueMapping, undefined);
                            }
                            catch (error) {
                                return match;
                            }
                    }
                }
            }
        }
        resolveFromMap(match, argument, commandValueMapping, prefix) {
            if (argument && commandValueMapping) {
                const v = (prefix === undefined) ? commandValueMapping[argument] : commandValueMapping[prefix + ':' + argument];
                if (typeof v === 'string') {
                    return v;
                }
                throw new Error(nls_1.localize('noValueForCommand', "'{0}' can not be resolved because the command has no value.", match));
            }
            return match;
        }
    }
    exports.AbstractVariableResolverService = AbstractVariableResolverService;
    AbstractVariableResolverService.VARIABLE_REGEXP = /\$\{(.*?)\}/g;
});
//# __sourceMappingURL=variableResolver.js.map