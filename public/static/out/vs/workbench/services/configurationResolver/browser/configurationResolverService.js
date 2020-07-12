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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/types", "vs/base/common/network", "vs/workbench/common/editor", "vs/base/common/collections", "vs/workbench/services/environment/common/environmentService", "vs/platform/configuration/common/configuration", "vs/platform/commands/common/commands", "vs/platform/workspace/common/workspace", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/configurationResolver/common/variableResolver", "vs/editor/browser/editorBrowser", "vs/workbench/common/editor/diffEditorInput", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/platform/instantiation/common/extensions"], function (require, exports, nls, path, Types, network_1, editor_1, collections_1, environmentService_1, configuration_1, commands_1, workspace_1, editorService_1, variableResolver_1, editorBrowser_1, diffEditorInput_1, quickInput_1, configurationResolver_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationResolverService = exports.BaseConfigurationResolverService = void 0;
    class BaseConfigurationResolverService extends variableResolver_1.AbstractVariableResolverService {
        constructor(context, envVariables, editorService, configurationService, commandService, workspaceContextService, quickInputService) {
            super({
                getFolderUri: (folderName) => {
                    const folder = workspaceContextService.getWorkspace().folders.filter(f => f.name === folderName).pop();
                    return folder ? folder.uri : undefined;
                },
                getWorkspaceFolderCount: () => {
                    return workspaceContextService.getWorkspace().folders.length;
                },
                getConfigurationValue: (folderUri, suffix) => {
                    return configurationService.getValue(suffix, folderUri ? { resource: folderUri } : {});
                },
                getExecPath: () => {
                    return context.getExecPath();
                },
                getFilePath: () => {
                    let activeEditor = editorService.activeEditor;
                    if (activeEditor instanceof diffEditorInput_1.DiffEditorInput) {
                        activeEditor = activeEditor.modifiedInput;
                    }
                    const fileResource = editor_1.toResource(activeEditor, { filterByScheme: [network_1.Schemas.file, network_1.Schemas.userData] });
                    if (!fileResource) {
                        return undefined;
                    }
                    return path.normalize(fileResource.fsPath);
                },
                getSelectedText: () => {
                    const activeTextEditorControl = editorService.activeTextEditorControl;
                    if (editorBrowser_1.isCodeEditor(activeTextEditorControl)) {
                        const editorModel = activeTextEditorControl.getModel();
                        const editorSelection = activeTextEditorControl.getSelection();
                        if (editorModel && editorSelection) {
                            return editorModel.getValueInRange(editorSelection);
                        }
                    }
                    return undefined;
                },
                getLineNumber: () => {
                    const activeTextEditorControl = editorService.activeTextEditorControl;
                    if (editorBrowser_1.isCodeEditor(activeTextEditorControl)) {
                        const selection = activeTextEditorControl.getSelection();
                        if (selection) {
                            const lineNumber = selection.positionLineNumber;
                            return String(lineNumber);
                        }
                    }
                    return undefined;
                }
            }, envVariables);
            this.configurationService = configurationService;
            this.commandService = commandService;
            this.workspaceContextService = workspaceContextService;
            this.quickInputService = quickInputService;
        }
        async resolveWithInteractionReplace(folder, config, section, variables, target) {
            // resolve any non-interactive variables and any contributed variables
            config = this.resolveAny(folder, config);
            // resolve input variables in the order in which they are encountered
            return this.resolveWithInteraction(folder, config, section, variables, target).then(mapping => {
                // finally substitute evaluated command variables (if there are any)
                if (!mapping) {
                    return null;
                }
                else if (mapping.size > 0) {
                    return this.resolveAny(folder, config, collections_1.fromMap(mapping));
                }
                else {
                    return config;
                }
            });
        }
        async resolveWithInteraction(folder, config, section, variables, target) {
            // resolve any non-interactive variables and any contributed variables
            const resolved = await this.resolveAnyMap(folder, config);
            config = resolved.newConfig;
            const allVariableMapping = resolved.resolvedVariables;
            // resolve input and command variables in the order in which they are encountered
            return this.resolveWithInputAndCommands(folder, config, variables, section, target).then(inputOrCommandMapping => {
                if (this.updateMapping(inputOrCommandMapping, allVariableMapping)) {
                    return allVariableMapping;
                }
                return undefined;
            });
        }
        /**
         * Add all items from newMapping to fullMapping. Returns false if newMapping is undefined.
         */
        updateMapping(newMapping, fullMapping) {
            if (!newMapping) {
                return false;
            }
            collections_1.forEach(newMapping, (entry) => {
                fullMapping.set(entry.key, entry.value);
            });
            return true;
        }
        /**
         * Finds and executes all input and command variables in the given configuration and returns their values as a dictionary.
         * Please note: this method does not substitute the input or command variables (so the configuration is not modified).
         * The returned dictionary can be passed to "resolvePlatform" for the actual substitution.
         * See #6569.
         *
         * @param variableToCommandMap Aliases for commands
         */
        async resolveWithInputAndCommands(folder, configuration, variableToCommandMap, section, target) {
            var _a, _b, _c;
            if (!configuration) {
                return Promise.resolve(undefined);
            }
            // get all "inputs"
            let inputs = [];
            if (folder && this.workspaceContextService.getWorkbenchState() !== 1 /* EMPTY */ && section) {
                let result = this.configurationService.inspect(section, { resource: folder.uri });
                if (result && (result.userValue || result.workspaceValue || result.workspaceFolderValue)) {
                    switch (target) {
                        case 1 /* USER */:
                            inputs = (_a = result.userValue) === null || _a === void 0 ? void 0 : _a.inputs;
                            break;
                        case 4 /* WORKSPACE */:
                            inputs = (_b = result.workspaceValue) === null || _b === void 0 ? void 0 : _b.inputs;
                            break;
                        default: inputs = (_c = result.workspaceFolderValue) === null || _c === void 0 ? void 0 : _c.inputs;
                    }
                }
                else {
                    const valueResult = this.configurationService.getValue(section, { resource: folder.uri });
                    if (valueResult) {
                        inputs = valueResult.inputs;
                    }
                }
            }
            // extract and dedupe all "input" and "command" variables and preserve their order in an array
            const variables = [];
            this.findVariables(configuration, variables);
            const variableValues = Object.create(null);
            for (const variable of variables) {
                const [type, name] = variable.split(':', 2);
                let result;
                switch (type) {
                    case 'input':
                        result = await this.showUserInput(name, inputs);
                        break;
                    case 'command':
                        // use the name as a command ID #12735
                        const commandId = (variableToCommandMap ? variableToCommandMap[name] : undefined) || name;
                        result = await this.commandService.executeCommand(commandId, configuration);
                        if (typeof result !== 'string' && !Types.isUndefinedOrNull(result)) {
                            throw new Error(nls.localize('commandVariable.noStringType', "Cannot substitute command variable '{0}' because command did not return a result of type string.", commandId));
                        }
                        break;
                    default:
                        // Try to resolve it as a contributed variable
                        if (this._contributedVariables.has(variable)) {
                            result = await this._contributedVariables.get(variable)();
                        }
                }
                if (typeof result === 'string') {
                    variableValues[variable] = result;
                }
                else {
                    return undefined;
                }
            }
            return variableValues;
        }
        /**
         * Recursively finds all command or input variables in object and pushes them into variables.
         * @param object object is searched for variables.
         * @param variables All found variables are returned in variables.
         */
        findVariables(object, variables) {
            if (typeof object === 'string') {
                let matches;
                while ((matches = BaseConfigurationResolverService.INPUT_OR_COMMAND_VARIABLES_PATTERN.exec(object)) !== null) {
                    if (matches.length === 4) {
                        const command = matches[1];
                        if (variables.indexOf(command) < 0) {
                            variables.push(command);
                        }
                    }
                }
                this._contributedVariables.forEach((value, contributed) => {
                    if ((variables.indexOf(contributed) < 0) && (object.indexOf('${' + contributed + '}') >= 0)) {
                        variables.push(contributed);
                    }
                });
            }
            else if (Types.isArray(object)) {
                object.forEach(value => {
                    this.findVariables(value, variables);
                });
            }
            else if (object) {
                Object.keys(object).forEach(key => {
                    const value = object[key];
                    this.findVariables(value, variables);
                });
            }
        }
        /**
         * Takes the provided input info and shows the quick pick so the user can provide the value for the input
         * @param variable Name of the input variable.
         * @param inputInfos Information about each possible input variable.
         */
        showUserInput(variable, inputInfos) {
            if (!inputInfos) {
                return Promise.reject(new Error(nls.localize('inputVariable.noInputSection', "Variable '{0}' must be defined in an '{1}' section of the debug or task configuration.", variable, 'input')));
            }
            // find info for the given input variable
            const info = inputInfos.filter(item => item.id === variable).pop();
            if (info) {
                const missingAttribute = (attrName) => {
                    throw new Error(nls.localize('inputVariable.missingAttribute', "Input variable '{0}' is of type '{1}' and must include '{2}'.", variable, info.type, attrName));
                };
                switch (info.type) {
                    case 'promptString': {
                        if (!Types.isString(info.description)) {
                            missingAttribute('description');
                        }
                        const inputOptions = { prompt: info.description };
                        if (info.default) {
                            inputOptions.value = info.default;
                        }
                        if (info.password) {
                            inputOptions.password = info.password;
                        }
                        return this.quickInputService.input(inputOptions).then(resolvedInput => {
                            return resolvedInput;
                        });
                    }
                    case 'pickString': {
                        if (!Types.isString(info.description)) {
                            missingAttribute('description');
                        }
                        if (Types.isArray(info.options)) {
                            info.options.forEach(pickOption => {
                                if (!Types.isString(pickOption) && !Types.isString(pickOption.value)) {
                                    missingAttribute('value');
                                }
                            });
                        }
                        else {
                            missingAttribute('options');
                        }
                        const picks = new Array();
                        info.options.forEach(pickOption => {
                            const value = Types.isString(pickOption) ? pickOption : pickOption.value;
                            const label = Types.isString(pickOption) ? undefined : pickOption.label;
                            // If there is no label defined, use value as label
                            const item = {
                                label: label ? `${label}: ${value}` : value,
                                value: value
                            };
                            if (value === info.default) {
                                item.description = nls.localize('inputVariable.defaultInputValue', "(Default)");
                                picks.unshift(item);
                            }
                            else {
                                picks.push(item);
                            }
                        });
                        const pickOptions = { placeHolder: info.description, matchOnDetail: true };
                        return this.quickInputService.pick(picks, pickOptions, undefined).then(resolvedInput => {
                            if (resolvedInput) {
                                return resolvedInput.value;
                            }
                            return undefined;
                        });
                    }
                    case 'command': {
                        if (!Types.isString(info.command)) {
                            missingAttribute('command');
                        }
                        return this.commandService.executeCommand(info.command, info.args).then(result => {
                            if (typeof result === 'string' || Types.isUndefinedOrNull(result)) {
                                return result;
                            }
                            throw new Error(nls.localize('inputVariable.command.noStringType', "Cannot substitute input variable '{0}' because command '{1}' did not return a result of type string.", variable, info.command));
                        });
                    }
                    default:
                        throw new Error(nls.localize('inputVariable.unknownType', "Input variable '{0}' can only be of type 'promptString', 'pickString', or 'command'.", variable));
                }
            }
            return Promise.reject(new Error(nls.localize('inputVariable.undefinedVariable', "Undefined input variable '{0}' encountered. Remove or define '{0}' to continue.", variable)));
        }
    }
    exports.BaseConfigurationResolverService = BaseConfigurationResolverService;
    BaseConfigurationResolverService.INPUT_OR_COMMAND_VARIABLES_PATTERN = /\${((input|command):(.*?))}/g;
    let ConfigurationResolverService = class ConfigurationResolverService extends BaseConfigurationResolverService {
        constructor(editorService, environmentService, configurationService, commandService, workspaceContextService, quickInputService) {
            super({ getExecPath: () => undefined }, Object.create(null), editorService, configurationService, commandService, workspaceContextService, quickInputService);
        }
    };
    ConfigurationResolverService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, commands_1.ICommandService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, quickInput_1.IQuickInputService)
    ], ConfigurationResolverService);
    exports.ConfigurationResolverService = ConfigurationResolverService;
    extensions_1.registerSingleton(configurationResolver_1.IConfigurationResolverService, ConfigurationResolverService, true);
});
//# __sourceMappingURL=configurationResolverService.js.map