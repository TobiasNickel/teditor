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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/strings", "vs/base/common/objects", "vs/base/common/json", "vs/base/common/uri", "vs/base/common/resources", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/platform/instantiation/common/instantiation", "vs/platform/commands/common/commands", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugger", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/editorBrowser", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/preferences/common/preferences", "vs/platform/registry/common/platform", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/contrib/debug/common/debugSchemas", "vs/platform/quickinput/common/quickInput", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/cancellation", "vs/base/common/types", "vs/base/common/async", "vs/workbench/services/history/common/history", "vs/base/common/arrays", "vs/workbench/contrib/debug/common/debugUtils", "vs/workbench/api/common/extHostTypes"], function (require, exports, nls, lifecycle_1, event_1, strings, objects, json, uri_1, resources, storage_1, extensions_1, configuration_1, files_1, workspace_1, instantiation_1, commands_1, debug_1, debugger_1, editorService_1, editorBrowser_1, configuration_2, preferences_1, platform_1, jsonContributionRegistry_1, debugSchemas_1, quickInput_1, contextkey_1, textfiles_1, cancellation_1, types_1, async_1, history_1, arrays_1, debugUtils_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationManager = void 0;
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    jsonRegistry.registerSchema(configuration_2.launchSchemaId, debugSchemas_1.launchSchema);
    const DEBUG_SELECTED_CONFIG_NAME_KEY = 'debug.selectedconfigname';
    const DEBUG_SELECTED_ROOT = 'debug.selectedroot';
    let ConfigurationManager = class ConfigurationManager {
        constructor(contextService, editorService, configurationService, quickInputService, instantiationService, commandService, storageService, extensionService, historyService, contextKeyService) {
            this.contextService = contextService;
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.commandService = commandService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.historyService = historyService;
            this.breakpointModeIdsSet = new Set();
            this._onDidSelectConfigurationName = new event_1.Emitter();
            this.debugAdapterFactories = new Map();
            this._onDidRegisterDebugger = new event_1.Emitter();
            this.configProviders = [];
            this.adapterDescriptorFactories = [];
            this.debuggers = [];
            this.toDispose = [];
            this.initLaunches();
            this.registerListeners();
            const previousSelectedRoot = this.storageService.get(DEBUG_SELECTED_ROOT, 1 /* WORKSPACE */);
            const previousSelectedLaunch = this.launches.find(l => l.uri.toString() === previousSelectedRoot);
            this.debugConfigurationTypeContext = debug_1.CONTEXT_DEBUG_CONFIGURATION_TYPE.bindTo(contextKeyService);
            if (previousSelectedLaunch && previousSelectedLaunch.getConfigurationNames().length) {
                this.selectConfiguration(previousSelectedLaunch, this.storageService.get(DEBUG_SELECTED_CONFIG_NAME_KEY, 1 /* WORKSPACE */));
            }
            else if (this.launches.length > 0) {
                this.selectConfiguration(undefined);
            }
        }
        // debuggers
        registerDebugAdapterFactory(debugTypes, debugAdapterLauncher) {
            debugTypes.forEach(debugType => this.debugAdapterFactories.set(debugType, debugAdapterLauncher));
            return {
                dispose: () => {
                    debugTypes.forEach(debugType => this.debugAdapterFactories.delete(debugType));
                }
            };
        }
        createDebugAdapter(session) {
            let factory = this.debugAdapterFactories.get(session.configuration.type);
            if (factory) {
                return factory.createDebugAdapter(session);
            }
            return undefined;
        }
        substituteVariables(debugType, folder, config) {
            let factory = this.debugAdapterFactories.get(debugType);
            if (factory) {
                return factory.substituteVariables(folder, config);
            }
            return Promise.resolve(config);
        }
        runInTerminal(debugType, args) {
            let factory = this.debugAdapterFactories.get(debugType);
            if (factory) {
                return factory.runInTerminal(args);
            }
            return Promise.resolve(void 0);
        }
        // debug adapter
        registerDebugAdapterDescriptorFactory(debugAdapterProvider) {
            this.adapterDescriptorFactories.push(debugAdapterProvider);
            return {
                dispose: () => {
                    this.unregisterDebugAdapterDescriptorFactory(debugAdapterProvider);
                }
            };
        }
        unregisterDebugAdapterDescriptorFactory(debugAdapterProvider) {
            const ix = this.adapterDescriptorFactories.indexOf(debugAdapterProvider);
            if (ix >= 0) {
                this.adapterDescriptorFactories.splice(ix, 1);
            }
        }
        getDebugAdapterDescriptor(session) {
            const config = session.configuration;
            // first try legacy proposed API: DebugConfigurationProvider.debugAdapterExecutable
            const providers0 = this.configProviders.filter(p => p.type === config.type && p.debugAdapterExecutable);
            if (providers0.length === 1 && providers0[0].debugAdapterExecutable) {
                return providers0[0].debugAdapterExecutable(session.root ? session.root.uri : undefined);
            }
            else {
                // TODO@AW handle n > 1 case
            }
            // new API
            const providers = this.adapterDescriptorFactories.filter(p => p.type === config.type && p.createDebugAdapterDescriptor);
            if (providers.length === 1) {
                return providers[0].createDebugAdapterDescriptor(session);
            }
            else {
                // TODO@AW handle n > 1 case
            }
            return Promise.resolve(undefined);
        }
        getDebuggerLabel(type) {
            const dbgr = this.getDebugger(type);
            if (dbgr) {
                return dbgr.label;
            }
            return undefined;
        }
        get onDidRegisterDebugger() {
            return this._onDidRegisterDebugger.event;
        }
        // debug configurations
        registerDebugConfigurationProvider(debugConfigurationProvider) {
            this.configProviders.push(debugConfigurationProvider);
            return {
                dispose: () => {
                    this.unregisterDebugConfigurationProvider(debugConfigurationProvider);
                }
            };
        }
        unregisterDebugConfigurationProvider(debugConfigurationProvider) {
            const ix = this.configProviders.indexOf(debugConfigurationProvider);
            if (ix >= 0) {
                this.configProviders.splice(ix, 1);
            }
        }
        /**
         * if scope is not specified,a value of DebugConfigurationProvideTrigger.Initial is assumed.
         */
        hasDebugConfigurationProvider(debugType, triggerKind) {
            if (triggerKind === undefined) {
                triggerKind = extHostTypes_1.DebugConfigurationProviderTriggerKind.Initial;
            }
            // check if there are providers for the given type that contribute a provideDebugConfigurations method
            const provider = this.configProviders.find(p => p.provideDebugConfigurations && (p.type === debugType) && (p.triggerKind === triggerKind));
            return !!provider;
        }
        async resolveConfigurationByProviders(folderUri, type, config, token) {
            await this.activateDebuggers('onDebugResolve', type);
            // pipe the config through the promises sequentially. Append at the end the '*' types
            const providers = this.configProviders.filter(p => p.type === type && p.resolveDebugConfiguration)
                .concat(this.configProviders.filter(p => p.type === '*' && p.resolveDebugConfiguration));
            let result = config;
            await async_1.sequence(providers.map(provider => async () => {
                // If any provider returned undefined or null make sure to respect that and do not pass the result to more resolver
                if (result) {
                    result = await provider.resolveDebugConfiguration(folderUri, result, token);
                }
            }));
            return result;
        }
        async resolveDebugConfigurationWithSubstitutedVariables(folderUri, type, config, token) {
            // pipe the config through the promises sequentially. Append at the end the '*' types
            const providers = this.configProviders.filter(p => p.type === type && p.resolveDebugConfigurationWithSubstitutedVariables)
                .concat(this.configProviders.filter(p => p.type === '*' && p.resolveDebugConfigurationWithSubstitutedVariables));
            let result = config;
            await async_1.sequence(providers.map(provider => async () => {
                // If any provider returned undefined or null make sure to respect that and do not pass the result to more resolver
                if (result) {
                    result = await provider.resolveDebugConfigurationWithSubstitutedVariables(folderUri, result, token);
                }
            }));
            return result;
        }
        async provideDebugConfigurations(folderUri, type, token) {
            await this.activateDebuggers('onDebugInitialConfigurations');
            const results = await Promise.all(this.configProviders.filter(p => p.type === type && p.triggerKind === extHostTypes_1.DebugConfigurationProviderTriggerKind.Initial && p.provideDebugConfigurations).map(p => p.provideDebugConfigurations(folderUri, token)));
            return results.reduce((first, second) => first.concat(second), []);
        }
        async getDynamicProviders() {
            const extensions = await this.extensionService.getExtensions();
            const onDebugDynamicConfigurationsName = 'onDebugDynamicConfigurations';
            const debugDynamicExtensionsTypes = extensions.map(e => {
                const activationEvent = e.activationEvents && e.activationEvents.find(e => e.includes(onDebugDynamicConfigurationsName));
                if (activationEvent) {
                    const type = activationEvent.substr(onDebugDynamicConfigurationsName.length + 1);
                    return type || (e.contributes && e.contributes.debuggers && e.contributes.debuggers.length ? e.contributes.debuggers[0].type : undefined);
                }
                return undefined;
            }).filter(type => typeof type === 'string' && !!this.getDebuggerLabel(type));
            return debugDynamicExtensionsTypes.map(type => {
                return {
                    label: this.getDebuggerLabel(type),
                    pick: async () => {
                        await this.activateDebuggers(onDebugDynamicConfigurationsName, type);
                        const token = new cancellation_1.CancellationTokenSource();
                        const picks = [];
                        const provider = this.configProviders.filter(p => p.type === type && p.triggerKind === extHostTypes_1.DebugConfigurationProviderTriggerKind.Dynamic && p.provideDebugConfigurations)[0];
                        this.getLaunches().forEach(launch => {
                            if (launch.workspace && provider) {
                                picks.push(provider.provideDebugConfigurations(launch.workspace.uri, token.token).then(configurations => configurations.map(config => ({
                                    label: config.name,
                                    config,
                                    buttons: [{
                                            iconClass: 'codicon-gear',
                                            tooltip: nls.localize('editLaunchConfig', "Edit Debug Configuration in launch.json")
                                        }],
                                    launch
                                }))));
                            }
                        });
                        const promiseOfPicks = Promise.all(picks).then(result => result.reduce((first, second) => first.concat(second), []));
                        const result = await this.quickInputService.pick(promiseOfPicks, {
                            placeHolder: nls.localize('selectConfiguration', "Select Launch Configuration"),
                            onDidTriggerItemButton: async (context) => {
                                await this.quickInputService.cancel();
                                const { launch, config } = context.item;
                                await launch.openConfigFile(false, config.type);
                                // Only Launch have a pin trigger button
                                await launch.writeConfiguration(config);
                                this.selectConfiguration(launch, config.name);
                            }
                        });
                        if (!result) {
                            // User canceled quick input we should notify the provider to cancel computing configurations
                            token.cancel();
                        }
                        return result;
                    }
                };
            });
        }
        getAllConfigurations() {
            const all = [];
            for (let l of this.launches) {
                for (let name of l.getConfigurationNames()) {
                    const config = l.getConfiguration(name) || l.getCompound(name);
                    if (config) {
                        all.push({ launch: l, name, presentation: config.presentation });
                    }
                }
            }
            return debugUtils_1.getVisibleAndSorted(all);
        }
        registerListeners() {
            debugSchemas_1.debuggersExtPoint.setHandler((extensions, delta) => {
                delta.added.forEach(added => {
                    added.value.forEach(rawAdapter => {
                        if (!rawAdapter.type || (typeof rawAdapter.type !== 'string')) {
                            added.collector.error(nls.localize('debugNoType', "Debugger 'type' can not be omitted and must be of type 'string'."));
                        }
                        if (rawAdapter.enableBreakpointsFor) {
                            rawAdapter.enableBreakpointsFor.languageIds.forEach(modeId => {
                                this.breakpointModeIdsSet.add(modeId);
                            });
                        }
                        if (rawAdapter.type !== '*') {
                            const existing = this.getDebugger(rawAdapter.type);
                            if (existing) {
                                existing.merge(rawAdapter, added.description);
                            }
                            else {
                                this.debuggers.push(this.instantiationService.createInstance(debugger_1.Debugger, this, rawAdapter, added.description));
                            }
                        }
                    });
                });
                // take care of all wildcard contributions
                extensions.forEach(extension => {
                    extension.value.forEach(rawAdapter => {
                        if (rawAdapter.type === '*') {
                            this.debuggers.forEach(dbg => dbg.merge(rawAdapter, extension.description));
                        }
                    });
                });
                delta.removed.forEach(removed => {
                    const removedTypes = removed.value.map(rawAdapter => rawAdapter.type);
                    this.debuggers = this.debuggers.filter(d => removedTypes.indexOf(d.type) === -1);
                });
                // update the schema to include all attributes, snippets and types from extensions.
                this.debuggers.forEach(adapter => {
                    const items = debugSchemas_1.launchSchema.properties['configurations'].items;
                    const schemaAttributes = adapter.getSchemaAttributes();
                    if (schemaAttributes && items.oneOf) {
                        items.oneOf.push(...schemaAttributes);
                    }
                    const configurationSnippets = adapter.configurationSnippets;
                    if (configurationSnippets && items.defaultSnippets) {
                        items.defaultSnippets.push(...configurationSnippets);
                    }
                });
                this.setCompoundSchemaValues();
                this._onDidRegisterDebugger.fire();
            });
            debugSchemas_1.breakpointsExtPoint.setHandler((extensions, delta) => {
                delta.removed.forEach(removed => {
                    removed.value.forEach(breakpoints => this.breakpointModeIdsSet.delete(breakpoints.language));
                });
                delta.added.forEach(added => {
                    added.value.forEach(breakpoints => this.breakpointModeIdsSet.add(breakpoints.language));
                });
            });
            this.toDispose.push(event_1.Event.any(this.contextService.onDidChangeWorkspaceFolders, this.contextService.onDidChangeWorkbenchState)(() => {
                this.initLaunches();
                this.selectConfiguration(undefined);
                this.setCompoundSchemaValues();
            }));
            this.toDispose.push(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('launch')) {
                    // A change happen in the launch.json. If there is already a launch configuration selected, do not change the selection.
                    this.selectConfiguration(undefined);
                    this.setCompoundSchemaValues();
                }
            }));
        }
        initLaunches() {
            this.launches = this.contextService.getWorkspace().folders.map(folder => this.instantiationService.createInstance(Launch, this, folder));
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                this.launches.push(this.instantiationService.createInstance(WorkspaceLaunch, this));
            }
            this.launches.push(this.instantiationService.createInstance(UserLaunch, this));
            if (this.selectedLaunch && this.launches.indexOf(this.selectedLaunch) === -1) {
                this.selectConfiguration(undefined);
            }
        }
        setCompoundSchemaValues() {
            const compoundConfigurationsSchema = debugSchemas_1.launchSchema.properties['compounds'].items.properties['configurations'];
            const launchNames = this.launches.map(l => l.getConfigurationNames(true)).reduce((first, second) => first.concat(second), []);
            compoundConfigurationsSchema.items.oneOf[0].enum = launchNames;
            compoundConfigurationsSchema.items.oneOf[1].properties.name.enum = launchNames;
            const folderNames = this.contextService.getWorkspace().folders.map(f => f.name);
            compoundConfigurationsSchema.items.oneOf[1].properties.folder.enum = folderNames;
            jsonRegistry.registerSchema(configuration_2.launchSchemaId, debugSchemas_1.launchSchema);
        }
        getLaunches() {
            return this.launches;
        }
        getLaunch(workspaceUri) {
            if (!uri_1.URI.isUri(workspaceUri)) {
                return undefined;
            }
            return this.launches.find(l => l.workspace && l.workspace.uri.toString() === workspaceUri.toString());
        }
        get selectedConfiguration() {
            return {
                launch: this.selectedLaunch,
                name: this.selectedName,
                config: this.selectedConfig
            };
        }
        get onDidSelectConfiguration() {
            return this._onDidSelectConfigurationName.event;
        }
        getWorkspaceLaunch() {
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                return this.launches[this.launches.length - 1];
            }
            return undefined;
        }
        selectConfiguration(launch, name, config) {
            if (typeof launch === 'undefined') {
                const rootUri = this.historyService.getLastActiveWorkspaceRoot();
                launch = this.getLaunch(rootUri);
                if (!launch || launch.getConfigurationNames().length === 0) {
                    launch = arrays_1.first(this.launches, l => !!(l && l.getConfigurationNames().length), launch) || this.launches[0];
                }
            }
            const previousLaunch = this.selectedLaunch;
            const previousName = this.selectedName;
            this.selectedLaunch = launch;
            if (this.selectedLaunch) {
                this.storageService.store(DEBUG_SELECTED_ROOT, this.selectedLaunch.uri.toString(), 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(DEBUG_SELECTED_ROOT, 1 /* WORKSPACE */);
            }
            const names = launch ? launch.getConfigurationNames() : [];
            if ((name && names.indexOf(name) >= 0) || config) {
                this.setSelectedLaunchName(name);
            }
            else if (!this.selectedName || names.indexOf(this.selectedName) === -1) {
                this.setSelectedLaunchName(names.length ? names[0] : undefined);
            }
            this.selectedConfig = config;
            const configForType = this.selectedConfig || (this.selectedLaunch && this.selectedName ? this.selectedLaunch.getConfiguration(this.selectedName) : undefined);
            if (configForType) {
                this.debugConfigurationTypeContext.set(configForType.type);
            }
            else {
                this.debugConfigurationTypeContext.reset();
            }
            if (this.selectedLaunch !== previousLaunch || this.selectedName !== previousName) {
                this._onDidSelectConfigurationName.fire();
            }
        }
        canSetBreakpointsIn(model) {
            const modeId = model.getLanguageIdentifier().language;
            if (!modeId || modeId === 'jsonc' || modeId === 'log') {
                // do not allow breakpoints in our settings files and output
                return false;
            }
            if (this.configurationService.getValue('debug').allowBreakpointsEverywhere) {
                return true;
            }
            return this.breakpointModeIdsSet.has(modeId);
        }
        getDebugger(type) {
            return this.debuggers.find(dbg => strings.equalsIgnoreCase(dbg.type, type));
        }
        isDebuggerInterestedInLanguage(language) {
            return !!this.debuggers.find(a => language && a.languages && a.languages.indexOf(language) >= 0);
        }
        async guessDebugger(type) {
            if (type) {
                const adapter = this.getDebugger(type);
                return Promise.resolve(adapter);
            }
            const activeTextEditorControl = this.editorService.activeTextEditorControl;
            let candidates;
            if (editorBrowser_1.isCodeEditor(activeTextEditorControl)) {
                const model = activeTextEditorControl.getModel();
                const language = model ? model.getLanguageIdentifier().language : undefined;
                const adapters = this.debuggers.filter(a => language && a.languages && a.languages.indexOf(language) >= 0);
                if (adapters.length === 1) {
                    return adapters[0];
                }
                if (adapters.length > 1) {
                    candidates = adapters;
                }
            }
            if (!candidates) {
                await this.activateDebuggers('onDebugInitialConfigurations');
                candidates = this.debuggers.filter(dbg => dbg.hasInitialConfiguration() || dbg.hasConfigurationProvider());
            }
            candidates.sort((first, second) => first.label.localeCompare(second.label));
            const picks = candidates.map(c => ({ label: c.label, debugger: c }));
            return this.quickInputService.pick([...picks, { type: 'separator' }, { label: nls.localize('more', "More..."), debugger: undefined }], { placeHolder: nls.localize('selectDebug', "Select Environment") })
                .then(picked => {
                if (picked && picked.debugger) {
                    return picked.debugger;
                }
                if (picked) {
                    this.commandService.executeCommand('debug.installAdditionalDebuggers');
                }
                return undefined;
            });
        }
        async activateDebuggers(activationEvent, debugType) {
            const promises = [
                this.extensionService.activateByEvent(activationEvent),
                this.extensionService.activateByEvent('onDebug')
            ];
            if (debugType) {
                promises.push(this.extensionService.activateByEvent(`${activationEvent}:${debugType}`));
            }
            await Promise.all(promises);
        }
        setSelectedLaunchName(selectedName) {
            this.selectedName = selectedName;
            if (this.selectedName) {
                this.storageService.store(DEBUG_SELECTED_CONFIG_NAME_KEY, this.selectedName, 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(DEBUG_SELECTED_CONFIG_NAME_KEY, 1 /* WORKSPACE */);
            }
        }
        dispose() {
            this.toDispose = lifecycle_1.dispose(this.toDispose);
        }
    };
    ConfigurationManager = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, editorService_1.IEditorService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, commands_1.ICommandService),
        __param(6, storage_1.IStorageService),
        __param(7, extensions_1.IExtensionService),
        __param(8, history_1.IHistoryService),
        __param(9, contextkey_1.IContextKeyService)
    ], ConfigurationManager);
    exports.ConfigurationManager = ConfigurationManager;
    class AbstractLaunch {
        constructor(configurationManager) {
            this.configurationManager = configurationManager;
        }
        getCompound(name) {
            const config = this.getConfig();
            if (!config || !config.compounds) {
                return undefined;
            }
            return config.compounds.find(compound => compound.name === name);
        }
        getConfigurationNames(ignoreCompoundsAndPresentation = false) {
            const config = this.getConfig();
            if (!config || (!Array.isArray(config.configurations) && !Array.isArray(config.compounds))) {
                return [];
            }
            else {
                const configurations = [];
                if (config.configurations) {
                    configurations.push(...config.configurations.filter(cfg => cfg && typeof cfg.name === 'string'));
                }
                if (ignoreCompoundsAndPresentation) {
                    return configurations.map(c => c.name);
                }
                if (config.compounds) {
                    configurations.push(...config.compounds.filter(compound => typeof compound.name === 'string' && compound.configurations && compound.configurations.length));
                }
                return debugUtils_1.getVisibleAndSorted(configurations).map(c => c.name);
            }
        }
        getConfiguration(name) {
            // We need to clone the configuration in order to be able to make changes to it #42198
            const config = objects.deepClone(this.getConfig());
            if (!config || !config.configurations) {
                return undefined;
            }
            return config.configurations.find(config => config && config.name === name);
        }
        async getInitialConfigurationContent(folderUri, type, token) {
            let content = '';
            const adapter = await this.configurationManager.guessDebugger(type);
            if (adapter) {
                const initialConfigs = await this.configurationManager.provideDebugConfigurations(folderUri, adapter.type, token || cancellation_1.CancellationToken.None);
                content = await adapter.getInitialConfigurationContent(initialConfigs);
            }
            return content;
        }
        get hidden() {
            return false;
        }
    }
    let Launch = class Launch extends AbstractLaunch {
        constructor(configurationManager, workspace, fileService, textFileService, editorService, configurationService) {
            super(configurationManager);
            this.workspace = workspace;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.editorService = editorService;
            this.configurationService = configurationService;
        }
        get uri() {
            return resources.joinPath(this.workspace.uri, '/.vscode/launch.json');
        }
        get name() {
            return this.workspace.name;
        }
        getConfig() {
            return this.configurationService.inspect('launch', { resource: this.workspace.uri }).workspaceFolderValue;
        }
        async openConfigFile(preserveFocus, type, token) {
            const resource = this.uri;
            let created = false;
            let content = '';
            try {
                const fileContent = await this.fileService.readFile(resource);
                content = fileContent.value.toString();
            }
            catch (_a) {
                // launch.json not found: create one by collecting launch configs from debugConfigProviders
                content = await this.getInitialConfigurationContent(this.workspace.uri, type, token);
                if (content) {
                    created = true; // pin only if config file is created #8727
                    try {
                        await this.textFileService.write(resource, content);
                    }
                    catch (error) {
                        throw new Error(nls.localize('DebugConfig.failed', "Unable to create 'launch.json' file inside the '.vscode' folder ({0}).", error.message));
                    }
                }
            }
            if (content === '') {
                return { editor: null, created: false };
            }
            const index = content.indexOf(`"${this.configurationManager.selectedConfiguration.name}"`);
            let startLineNumber = 1;
            for (let i = 0; i < index; i++) {
                if (content.charAt(i) === '\n') {
                    startLineNumber++;
                }
            }
            const selection = startLineNumber > 1 ? { startLineNumber, startColumn: 4 } : undefined;
            const editor = await this.editorService.openEditor({
                resource,
                options: {
                    selection,
                    preserveFocus,
                    pinned: created,
                    revealIfVisible: true
                },
            }, editorService_1.ACTIVE_GROUP);
            return ({
                editor: types_1.withUndefinedAsNull(editor),
                created
            });
        }
        async writeConfiguration(configuration) {
            const fullConfig = objects.deepClone(this.getConfig());
            if (!fullConfig.configurations) {
                fullConfig.configurations = [];
            }
            fullConfig.configurations.push(configuration);
            await this.configurationService.updateValue('launch', fullConfig, { resource: this.workspace.uri }, 5 /* WORKSPACE_FOLDER */);
        }
    };
    Launch = __decorate([
        __param(2, files_1.IFileService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, editorService_1.IEditorService),
        __param(5, configuration_1.IConfigurationService)
    ], Launch);
    let WorkspaceLaunch = class WorkspaceLaunch extends AbstractLaunch {
        constructor(configurationManager, editorService, configurationService, contextService) {
            super(configurationManager);
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.contextService = contextService;
        }
        get workspace() {
            return undefined;
        }
        get uri() {
            return this.contextService.getWorkspace().configuration;
        }
        get name() {
            return nls.localize('workspace', "workspace");
        }
        getConfig() {
            return this.configurationService.inspect('launch').workspaceValue;
        }
        async openConfigFile(preserveFocus, type, token) {
            let launchExistInFile = !!this.getConfig();
            if (!launchExistInFile) {
                // Launch property in workspace config not found: create one by collecting launch configs from debugConfigProviders
                let content = await this.getInitialConfigurationContent(undefined, type, token);
                if (content) {
                    await this.configurationService.updateValue('launch', json.parse(content), 4 /* WORKSPACE */);
                }
                else {
                    return { editor: null, created: false };
                }
            }
            const editor = await this.editorService.openEditor({
                resource: this.contextService.getWorkspace().configuration,
                options: { preserveFocus }
            }, editorService_1.ACTIVE_GROUP);
            return ({
                editor: types_1.withUndefinedAsNull(editor),
                created: false
            });
        }
    };
    WorkspaceLaunch = __decorate([
        __param(1, editorService_1.IEditorService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, workspace_1.IWorkspaceContextService)
    ], WorkspaceLaunch);
    let UserLaunch = class UserLaunch extends AbstractLaunch {
        constructor(configurationManager, configurationService, preferencesService) {
            super(configurationManager);
            this.configurationService = configurationService;
            this.preferencesService = preferencesService;
        }
        get workspace() {
            return undefined;
        }
        get uri() {
            return this.preferencesService.userSettingsResource;
        }
        get name() {
            return nls.localize('user settings', "user settings");
        }
        get hidden() {
            return true;
        }
        getConfig() {
            return this.configurationService.inspect('launch').userValue;
        }
        async openConfigFile(preserveFocus) {
            const editor = await this.preferencesService.openGlobalSettings(true, { preserveFocus });
            return ({
                editor: types_1.withUndefinedAsNull(editor),
                created: false
            });
        }
    };
    UserLaunch = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, preferences_1.IPreferencesService)
    ], UserLaunch);
});
//# __sourceMappingURL=debugConfigurationManager.js.map