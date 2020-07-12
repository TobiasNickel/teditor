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
define(["require", "exports", "vs/base/common/event", "vs/base/common/json", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/uri", "vs/editor/browser/editorBrowser", "vs/editor/common/services/modelService", "vs/editor/common/services/modeService", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesEditorInput", "vs/workbench/services/preferences/common/preferencesModels", "vs/platform/instantiation/common/extensions", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/types", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/platform/commands/common/commands", "vs/editor/browser/controller/coreCommands"], function (require, exports, event_1, json_1, lifecycle_1, network, objects_1, uri_1, editorBrowser_1, modelService_1, modeService_1, resolverService_1, nls, configuration_1, environment_1, instantiation_1, keybinding_1, label_1, notification_1, telemetry_1, workspace_1, jsonEditing_1, editorService_1, editorGroupsService_1, preferences_1, preferencesEditorInput_1, preferencesModels_1, extensions_1, remoteAgentService_1, textfiles_1, types_1, configurationRegistry_1, platform_1, commands_1, coreCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PreferencesService = void 0;
    const emptyEditableSettingsContent = '{\n}';
    let PreferencesService = class PreferencesService extends lifecycle_1.Disposable {
        constructor(editorService, editorGroupService, textFileService, configurationService, notificationService, contextService, instantiationService, environmentService, telemetryService, textModelResolverService, keybindingService, modelService, jsonEditingService, modeService, labelService, remoteAgentService, commandService) {
            super();
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.textFileService = textFileService;
            this.configurationService = configurationService;
            this.notificationService = notificationService;
            this.contextService = contextService;
            this.instantiationService = instantiationService;
            this.environmentService = environmentService;
            this.telemetryService = telemetryService;
            this.textModelResolverService = textModelResolverService;
            this.modelService = modelService;
            this.jsonEditingService = jsonEditingService;
            this.modeService = modeService;
            this.labelService = labelService;
            this.remoteAgentService = remoteAgentService;
            this.commandService = commandService;
            this.lastOpenedSettingsInput = null;
            this._onDispose = this._register(new event_1.Emitter());
            this._defaultUserSettingsUriCounter = 0;
            this._defaultWorkspaceSettingsUriCounter = 0;
            this._defaultFolderSettingsUriCounter = 0;
            this.defaultKeybindingsResource = uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: '/keybindings.json' });
            this.defaultSettingsRawResource = uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: '/defaultSettings.json' });
            // The default keybindings.json updates based on keyboard layouts, so here we make sure
            // if a model has been given out we update it accordingly.
            this._register(keybindingService.onDidUpdateKeybindings(() => {
                const model = modelService.getModel(this.defaultKeybindingsResource);
                if (!model) {
                    // model has not been given out => nothing to do
                    return;
                }
                modelService.updateModel(model, preferencesModels_1.defaultKeybindingsContents(keybindingService));
            }));
        }
        get userSettingsResource() {
            return this.environmentService.settingsResource;
        }
        get workspaceSettingsResource() {
            if (this.contextService.getWorkbenchState() === 1 /* EMPTY */) {
                return null;
            }
            const workspace = this.contextService.getWorkspace();
            return workspace.configuration || workspace.folders[0].toResource(preferences_1.FOLDER_SETTINGS_PATH);
        }
        get settingsEditor2Input() {
            return this.instantiationService.createInstance(preferencesEditorInput_1.SettingsEditor2Input);
        }
        getFolderSettingsResource(resource) {
            const folder = this.contextService.getWorkspaceFolder(resource);
            return folder ? folder.toResource(preferences_1.FOLDER_SETTINGS_PATH) : null;
        }
        resolveModel(uri) {
            if (this.isDefaultSettingsResource(uri)) {
                const target = this.getConfigurationTargetFromDefaultSettingsResource(uri);
                const languageSelection = this.modeService.create('jsonc');
                const model = this._register(this.modelService.createModel('', languageSelection, uri));
                let defaultSettings;
                this.configurationService.onDidChangeConfiguration(e => {
                    if (e.source === 6 /* DEFAULT */) {
                        const model = this.modelService.getModel(uri);
                        if (!model) {
                            // model has not been given out => nothing to do
                            return;
                        }
                        defaultSettings = this.getDefaultSettings(target);
                        this.modelService.updateModel(model, defaultSettings.getContent(true));
                        defaultSettings._onDidChange.fire();
                    }
                });
                // Check if Default settings is already created and updated in above promise
                if (!defaultSettings) {
                    defaultSettings = this.getDefaultSettings(target);
                    this.modelService.updateModel(model, defaultSettings.getContent(true));
                }
                return Promise.resolve(model);
            }
            if (this.defaultSettingsRawResource.toString() === uri.toString()) {
                const defaultRawSettingsEditorModel = this.instantiationService.createInstance(preferencesModels_1.DefaultRawSettingsEditorModel, this.getDefaultSettings(2 /* USER_LOCAL */));
                const languageSelection = this.modeService.create('jsonc');
                const model = this._register(this.modelService.createModel(defaultRawSettingsEditorModel.content, languageSelection, uri));
                return Promise.resolve(model);
            }
            if (this.defaultKeybindingsResource.toString() === uri.toString()) {
                const defaultKeybindingsEditorModel = this.instantiationService.createInstance(preferencesModels_1.DefaultKeybindingsEditorModel, uri);
                const languageSelection = this.modeService.create('jsonc');
                const model = this._register(this.modelService.createModel(defaultKeybindingsEditorModel.content, languageSelection, uri));
                return Promise.resolve(model);
            }
            return Promise.resolve(null);
        }
        async createPreferencesEditorModel(uri) {
            if (this.isDefaultSettingsResource(uri)) {
                return this.createDefaultSettingsEditorModel(uri);
            }
            if (this.userSettingsResource.toString() === uri.toString()) {
                return this.createEditableSettingsEditorModel(2 /* USER_LOCAL */, uri);
            }
            const workspaceSettingsUri = await this.getEditableSettingsURI(4 /* WORKSPACE */);
            if (workspaceSettingsUri && workspaceSettingsUri.toString() === uri.toString()) {
                return this.createEditableSettingsEditorModel(4 /* WORKSPACE */, workspaceSettingsUri);
            }
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */) {
                const settingsUri = await this.getEditableSettingsURI(5 /* WORKSPACE_FOLDER */, uri);
                if (settingsUri && settingsUri.toString() === uri.toString()) {
                    return this.createEditableSettingsEditorModel(5 /* WORKSPACE_FOLDER */, uri);
                }
            }
            const remoteEnvironment = await this.remoteAgentService.getEnvironment();
            const remoteSettingsUri = remoteEnvironment ? remoteEnvironment.settingsPath : null;
            if (remoteSettingsUri && remoteSettingsUri.toString() === uri.toString()) {
                return this.createEditableSettingsEditorModel(3 /* USER_REMOTE */, uri);
            }
            return null;
        }
        openRawDefaultSettings() {
            return this.editorService.openEditor({ resource: this.defaultSettingsRawResource });
        }
        openRawUserSettings() {
            return this.editorService.openEditor({ resource: this.userSettingsResource });
        }
        openSettings(jsonEditor, query) {
            jsonEditor = typeof jsonEditor === 'undefined' ?
                this.configurationService.getValue('workbench.settings.editor') === 'json' :
                jsonEditor;
            if (!jsonEditor) {
                return this.openSettings2({ query: query });
            }
            const editorInput = this.getActiveSettingsEditorInput() || this.lastOpenedSettingsInput;
            const resource = editorInput ? editorInput.primary.resource : this.userSettingsResource;
            const target = this.getConfigurationTargetFromSettingsResource(resource);
            return this.openOrSwitchSettings(target, resource, { query: query });
        }
        openSettings2(options) {
            const input = this.settingsEditor2Input;
            return this.editorService.openEditor(input, options ? preferences_1.SettingsEditorOptions.create(options) : undefined)
                .then(() => this.editorGroupService.activeGroup.activeEditorPane);
        }
        openGlobalSettings(jsonEditor, options, group) {
            jsonEditor = typeof jsonEditor === 'undefined' ?
                this.configurationService.getValue('workbench.settings.editor') === 'json' :
                jsonEditor;
            return jsonEditor ?
                this.openOrSwitchSettings(2 /* USER_LOCAL */, this.userSettingsResource, options, group) :
                this.openOrSwitchSettings2(2 /* USER_LOCAL */, undefined, options, group);
        }
        async openRemoteSettings() {
            const environment = await this.remoteAgentService.getEnvironment();
            if (environment) {
                await this.createIfNotExists(environment.settingsPath, emptyEditableSettingsContent);
                return this.editorService.openEditor({ resource: environment.settingsPath, options: { pinned: true, revealIfOpened: true } });
            }
            return undefined;
        }
        openWorkspaceSettings(jsonEditor, options, group) {
            jsonEditor = typeof jsonEditor === 'undefined' ?
                this.configurationService.getValue('workbench.settings.editor') === 'json' :
                jsonEditor;
            if (!this.workspaceSettingsResource) {
                this.notificationService.info(nls.localize('openFolderFirst', "Open a folder first to create workspace settings"));
                return Promise.reject(null);
            }
            return jsonEditor ?
                this.openOrSwitchSettings(4 /* WORKSPACE */, this.workspaceSettingsResource, options, group) :
                this.openOrSwitchSettings2(4 /* WORKSPACE */, undefined, options, group);
        }
        async openFolderSettings(folder, jsonEditor, options, group) {
            jsonEditor = typeof jsonEditor === 'undefined' ?
                this.configurationService.getValue('workbench.settings.editor') === 'json' :
                jsonEditor;
            const folderSettingsUri = await this.getEditableSettingsURI(5 /* WORKSPACE_FOLDER */, folder);
            if (jsonEditor) {
                if (folderSettingsUri) {
                    return this.openOrSwitchSettings(5 /* WORKSPACE_FOLDER */, folderSettingsUri, options, group);
                }
                return Promise.reject(`Invalid folder URI - ${folder.toString()}`);
            }
            return this.openOrSwitchSettings2(5 /* WORKSPACE_FOLDER */, folder, options, group);
        }
        switchSettings(target, resource, jsonEditor) {
            if (!jsonEditor) {
                return this.doOpenSettings2(target, resource).then(() => undefined);
            }
            const activeEditorPane = this.editorService.activeEditorPane;
            if ((activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.input) instanceof preferencesEditorInput_1.PreferencesEditorInput) {
                return this.doSwitchSettings(target, resource, activeEditorPane.input, activeEditorPane.group).then(() => undefined);
            }
            else {
                return this.doOpenSettings(target, resource).then(() => undefined);
            }
        }
        openGlobalKeybindingSettings(textual) {
            this.telemetryService.publicLog2('openKeybindings', { textual });
            if (textual) {
                const emptyContents = '// ' + nls.localize('emptyKeybindingsHeader', "Place your key bindings in this file to override the defaults") + '\n[\n]';
                const editableKeybindings = this.environmentService.keybindingsResource;
                const openDefaultKeybindings = !!this.configurationService.getValue('workbench.settings.openDefaultKeybindings');
                // Create as needed and open in editor
                return this.createIfNotExists(editableKeybindings, emptyContents).then(() => {
                    if (openDefaultKeybindings) {
                        const activeEditorGroup = this.editorGroupService.activeGroup;
                        const sideEditorGroup = this.editorGroupService.addGroup(activeEditorGroup.id, 3 /* RIGHT */);
                        return Promise.all([
                            this.editorService.openEditor({ resource: this.defaultKeybindingsResource, options: { pinned: true, preserveFocus: true, revealIfOpened: true }, label: nls.localize('defaultKeybindings', "Default Keybindings"), description: '' }),
                            this.editorService.openEditor({ resource: editableKeybindings, options: { pinned: true, revealIfOpened: true } }, sideEditorGroup.id)
                        ]).then(editors => undefined);
                    }
                    else {
                        return this.editorService.openEditor({ resource: editableKeybindings, options: { pinned: true, revealIfOpened: true } }).then(() => undefined);
                    }
                });
            }
            return this.editorService.openEditor(this.instantiationService.createInstance(preferencesEditorInput_1.KeybindingsEditorInput), { pinned: true, revealIfOpened: true }).then(() => undefined);
        }
        openDefaultKeybindingsFile() {
            return this.editorService.openEditor({ resource: this.defaultKeybindingsResource, label: nls.localize('defaultKeybindings', "Default Keybindings") });
        }
        async openOrSwitchSettings(configurationTarget, resource, options, group = this.editorGroupService.activeGroup) {
            const editorInput = this.getActiveSettingsEditorInput(group);
            if (editorInput) {
                const editorInputResource = editorInput.primary.resource;
                if (editorInputResource && editorInputResource.fsPath !== resource.fsPath) {
                    return this.doSwitchSettings(configurationTarget, resource, editorInput, group, options);
                }
            }
            const editor = await this.doOpenSettings(configurationTarget, resource, options, group);
            if (editor && (options === null || options === void 0 ? void 0 : options.editSetting)) {
                await this.editSetting(options === null || options === void 0 ? void 0 : options.editSetting, editor, resource);
            }
            return editor;
        }
        openOrSwitchSettings2(configurationTarget, folderUri, options, group = this.editorGroupService.activeGroup) {
            return this.doOpenSettings2(configurationTarget, folderUri, options, group);
        }
        doOpenSettings(configurationTarget, resource, options, group) {
            const openSplitJSON = !!this.configurationService.getValue(preferences_1.USE_SPLIT_JSON_SETTING);
            if (openSplitJSON) {
                return this.doOpenSplitJSON(configurationTarget, resource, options, group);
            }
            const openDefaultSettings = !!this.configurationService.getValue(preferences_1.DEFAULT_SETTINGS_EDITOR_SETTING);
            return this.getOrCreateEditableSettingsEditorInput(configurationTarget, resource)
                .then(editableSettingsEditorInput => {
                if (!options) {
                    options = { pinned: true };
                }
                else {
                    options = objects_1.assign(options, { pinned: true });
                }
                if (openDefaultSettings) {
                    const activeEditorGroup = this.editorGroupService.activeGroup;
                    const sideEditorGroup = this.editorGroupService.addGroup(activeEditorGroup.id, 3 /* RIGHT */);
                    return Promise.all([
                        this.editorService.openEditor({ resource: this.defaultSettingsRawResource, options: { pinned: true, preserveFocus: true, revealIfOpened: true }, label: nls.localize('defaultSettings', "Default Settings"), description: '' }),
                        this.editorService.openEditor(editableSettingsEditorInput, { pinned: true, revealIfOpened: true }, sideEditorGroup.id)
                    ]).then(([defaultEditor, editor]) => types_1.withNullAsUndefined(editor));
                }
                else {
                    return this.editorService.openEditor(editableSettingsEditorInput, preferences_1.SettingsEditorOptions.create(options), group);
                }
            });
        }
        doOpenSplitJSON(configurationTarget, resource, options, group) {
            return this.getOrCreateEditableSettingsEditorInput(configurationTarget, resource)
                .then(editableSettingsEditorInput => {
                if (!options) {
                    options = { pinned: true };
                }
                else {
                    options = objects_1.assign(options, { pinned: true });
                }
                const defaultPreferencesEditorInput = this.instantiationService.createInstance(preferencesEditorInput_1.DefaultPreferencesEditorInput, this.getDefaultSettingsResource(configurationTarget));
                const preferencesEditorInput = new preferencesEditorInput_1.PreferencesEditorInput(this.getPreferencesEditorInputName(configurationTarget, resource), editableSettingsEditorInput.getDescription(), defaultPreferencesEditorInput, editableSettingsEditorInput);
                this.lastOpenedSettingsInput = preferencesEditorInput;
                return this.editorService.openEditor(preferencesEditorInput, preferences_1.SettingsEditorOptions.create(options), group);
            });
        }
        createSettings2EditorModel() {
            return this.instantiationService.createInstance(preferencesModels_1.Settings2EditorModel, this.getDefaultSettings(2 /* USER_LOCAL */));
        }
        doOpenSettings2(target, folderUri, options, group) {
            const input = this.settingsEditor2Input;
            const settingsOptions = Object.assign(Object.assign({}, options), { target,
                folderUri });
            return this.editorService.openEditor(input, preferences_1.SettingsEditorOptions.create(settingsOptions), group);
        }
        async doSwitchSettings(target, resource, input, group, options) {
            const settingsURI = await this.getEditableSettingsURI(target, resource);
            if (!settingsURI) {
                return Promise.reject(`Invalid settings URI - ${resource.toString()}`);
            }
            return this.getOrCreateEditableSettingsEditorInput(target, settingsURI)
                .then(toInput => {
                return group.openEditor(input).then(() => {
                    const replaceWith = new preferencesEditorInput_1.PreferencesEditorInput(this.getPreferencesEditorInputName(target, resource), toInput.getDescription(), this.instantiationService.createInstance(preferencesEditorInput_1.DefaultPreferencesEditorInput, this.getDefaultSettingsResource(target)), toInput);
                    return group.replaceEditors([{
                            editor: input,
                            replacement: replaceWith,
                            options: options ? preferences_1.SettingsEditorOptions.create(options) : undefined
                        }]).then(() => {
                        this.lastOpenedSettingsInput = replaceWith;
                        return group.activeEditorPane;
                    });
                });
            });
        }
        getActiveSettingsEditorInput(group = this.editorGroupService.activeGroup) {
            return group.editors.filter(e => e instanceof preferencesEditorInput_1.PreferencesEditorInput)[0];
        }
        getConfigurationTargetFromSettingsResource(resource) {
            if (this.userSettingsResource.toString() === resource.toString()) {
                return 2 /* USER_LOCAL */;
            }
            const workspaceSettingsResource = this.workspaceSettingsResource;
            if (workspaceSettingsResource && workspaceSettingsResource.toString() === resource.toString()) {
                return 4 /* WORKSPACE */;
            }
            const folder = this.contextService.getWorkspaceFolder(resource);
            if (folder) {
                return 5 /* WORKSPACE_FOLDER */;
            }
            return 2 /* USER_LOCAL */;
        }
        getConfigurationTargetFromDefaultSettingsResource(uri) {
            return this.isDefaultWorkspaceSettingsResource(uri) ?
                4 /* WORKSPACE */ :
                this.isDefaultFolderSettingsResource(uri) ?
                    5 /* WORKSPACE_FOLDER */ :
                    2 /* USER_LOCAL */;
        }
        isDefaultSettingsResource(uri) {
            return this.isDefaultUserSettingsResource(uri) || this.isDefaultWorkspaceSettingsResource(uri) || this.isDefaultFolderSettingsResource(uri);
        }
        isDefaultUserSettingsResource(uri) {
            return uri.authority === 'defaultsettings' && uri.scheme === network.Schemas.vscode && !!uri.path.match(/\/(\d+\/)?settings\.json$/);
        }
        isDefaultWorkspaceSettingsResource(uri) {
            return uri.authority === 'defaultsettings' && uri.scheme === network.Schemas.vscode && !!uri.path.match(/\/(\d+\/)?workspaceSettings\.json$/);
        }
        isDefaultFolderSettingsResource(uri) {
            return uri.authority === 'defaultsettings' && uri.scheme === network.Schemas.vscode && !!uri.path.match(/\/(\d+\/)?resourceSettings\.json$/);
        }
        getDefaultSettingsResource(configurationTarget) {
            switch (configurationTarget) {
                case 4 /* WORKSPACE */:
                    return uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: `/${this._defaultWorkspaceSettingsUriCounter++}/workspaceSettings.json` });
                case 5 /* WORKSPACE_FOLDER */:
                    return uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: `/${this._defaultFolderSettingsUriCounter++}/resourceSettings.json` });
            }
            return uri_1.URI.from({ scheme: network.Schemas.vscode, authority: 'defaultsettings', path: `/${this._defaultUserSettingsUriCounter++}/settings.json` });
        }
        getPreferencesEditorInputName(target, resource) {
            const name = preferences_1.getSettingsTargetName(target, resource, this.contextService);
            return target === 5 /* WORKSPACE_FOLDER */ ? nls.localize('folderSettingsName', "{0} (Folder Settings)", name) : name;
        }
        getOrCreateEditableSettingsEditorInput(target, resource) {
            return this.createSettingsIfNotExists(target, resource)
                .then(() => this.editorService.createEditorInput({ resource }));
        }
        createEditableSettingsEditorModel(configurationTarget, settingsUri) {
            const workspace = this.contextService.getWorkspace();
            if (workspace.configuration && workspace.configuration.toString() === settingsUri.toString()) {
                return this.textModelResolverService.createModelReference(settingsUri)
                    .then(reference => this.instantiationService.createInstance(preferencesModels_1.WorkspaceConfigurationEditorModel, reference, configurationTarget));
            }
            return this.textModelResolverService.createModelReference(settingsUri)
                .then(reference => this.instantiationService.createInstance(preferencesModels_1.SettingsEditorModel, reference, configurationTarget));
        }
        createDefaultSettingsEditorModel(defaultSettingsUri) {
            return this.textModelResolverService.createModelReference(defaultSettingsUri)
                .then(reference => {
                const target = this.getConfigurationTargetFromDefaultSettingsResource(defaultSettingsUri);
                return this.instantiationService.createInstance(preferencesModels_1.DefaultSettingsEditorModel, defaultSettingsUri, reference, this.getDefaultSettings(target));
            });
        }
        getDefaultSettings(target) {
            if (target === 4 /* WORKSPACE */) {
                if (!this._defaultWorkspaceSettingsContentModel) {
                    this._defaultWorkspaceSettingsContentModel = new preferencesModels_1.DefaultSettings(this.getMostCommonlyUsedSettings(), target);
                }
                return this._defaultWorkspaceSettingsContentModel;
            }
            if (target === 5 /* WORKSPACE_FOLDER */) {
                if (!this._defaultFolderSettingsContentModel) {
                    this._defaultFolderSettingsContentModel = new preferencesModels_1.DefaultSettings(this.getMostCommonlyUsedSettings(), target);
                }
                return this._defaultFolderSettingsContentModel;
            }
            if (!this._defaultUserSettingsContentModel) {
                this._defaultUserSettingsContentModel = new preferencesModels_1.DefaultSettings(this.getMostCommonlyUsedSettings(), target);
            }
            return this._defaultUserSettingsContentModel;
        }
        async getEditableSettingsURI(configurationTarget, resource) {
            switch (configurationTarget) {
                case 1 /* USER */:
                case 2 /* USER_LOCAL */:
                    return this.userSettingsResource;
                case 3 /* USER_REMOTE */:
                    const remoteEnvironment = await this.remoteAgentService.getEnvironment();
                    return remoteEnvironment ? remoteEnvironment.settingsPath : null;
                case 4 /* WORKSPACE */:
                    return this.workspaceSettingsResource;
                case 5 /* WORKSPACE_FOLDER */:
                    if (resource) {
                        return this.getFolderSettingsResource(resource);
                    }
            }
            return null;
        }
        createSettingsIfNotExists(target, resource) {
            if (this.contextService.getWorkbenchState() === 3 /* WORKSPACE */ && target === 4 /* WORKSPACE */) {
                const workspaceConfig = this.contextService.getWorkspace().configuration;
                if (!workspaceConfig) {
                    return Promise.resolve(undefined);
                }
                return this.textFileService.read(workspaceConfig)
                    .then(content => {
                    if (Object.keys(json_1.parse(content.value)).indexOf('settings') === -1) {
                        return this.jsonEditingService.write(resource, [{ path: ['settings'], value: {} }], true).then(undefined, () => { });
                    }
                    return undefined;
                });
            }
            return this.createIfNotExists(resource, emptyEditableSettingsContent).then(() => { });
        }
        createIfNotExists(resource, contents) {
            return this.textFileService.read(resource, { acceptTextOnly: true }).then(undefined, error => {
                if (error.fileOperationResult === 1 /* FILE_NOT_FOUND */) {
                    return this.textFileService.write(resource, contents).then(undefined, error => {
                        return Promise.reject(new Error(nls.localize('fail.createSettings', "Unable to create '{0}' ({1}).", this.labelService.getUriLabel(resource, { relative: true }), error)));
                    });
                }
                return Promise.reject(error);
            });
        }
        getMostCommonlyUsedSettings() {
            return [
                'files.autoSave',
                'editor.fontSize',
                'editor.fontFamily',
                'editor.tabSize',
                'editor.renderWhitespace',
                'editor.cursorStyle',
                'editor.multiCursorModifier',
                'editor.insertSpaces',
                'editor.wordWrap',
                'files.exclude',
                'files.associations'
            ];
        }
        async editSetting(settingKey, editor, settingsResource) {
            const codeEditor = editor ? editorBrowser_1.getCodeEditor(editor.getControl()) : null;
            if (!codeEditor) {
                return;
            }
            const settingsModel = await this.createPreferencesEditorModel(settingsResource);
            if (!settingsModel) {
                return;
            }
            const position = await this.getPositionToEdit(settingKey, settingsModel, codeEditor);
            if (position) {
                codeEditor.setPosition(position);
                codeEditor.revealPositionNearTop(position);
                codeEditor.focus();
                await this.commandService.executeCommand('editor.action.triggerSuggest');
            }
        }
        async getPositionToEdit(settingKey, settingsModel, codeEditor) {
            const model = codeEditor.getModel();
            if (!model) {
                return null;
            }
            const schema = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties()[settingKey];
            if (!schema && !configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN.test(settingKey)) {
                return null;
            }
            let position = null;
            const type = schema ? schema.type : 'object' /* Override Identifier */;
            let setting = settingsModel.getPreference(settingKey);
            if (!setting) {
                const defaultValue = (type === 'object' || type === 'array') ? this.configurationService.inspect(settingKey).defaultValue : configurationRegistry_1.getDefaultValue(type);
                if (defaultValue !== undefined) {
                    const key = settingsModel instanceof preferencesModels_1.WorkspaceConfigurationEditorModel ? ['settings', settingKey] : [settingKey];
                    await this.jsonEditingService.write(settingsModel.uri, [{ path: key, value: defaultValue }], false);
                    setting = settingsModel.getPreference(settingKey);
                }
            }
            if (setting) {
                position = { lineNumber: setting.valueRange.startLineNumber, column: setting.valueRange.startColumn + 1 };
                if (type === 'object' || type === 'array') {
                    codeEditor.setPosition(position);
                    await coreCommands_1.CoreEditingCommands.LineBreakInsert.runEditorCommand(null, codeEditor, null);
                    position = { lineNumber: position.lineNumber + 1, column: model.getLineMaxColumn(position.lineNumber + 1) };
                    const firstNonWhiteSpaceColumn = model.getLineFirstNonWhitespaceColumn(position.lineNumber);
                    if (firstNonWhiteSpaceColumn) {
                        // Line has some text. Insert another new line.
                        codeEditor.setPosition({ lineNumber: position.lineNumber, column: firstNonWhiteSpaceColumn });
                        await coreCommands_1.CoreEditingCommands.LineBreakInsert.runEditorCommand(null, codeEditor, null);
                        position = { lineNumber: position.lineNumber, column: model.getLineMaxColumn(position.lineNumber) };
                    }
                }
            }
            return position;
        }
        dispose() {
            this._onDispose.fire();
            super.dispose();
        }
    };
    PreferencesService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, textfiles_1.ITextFileService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, notification_1.INotificationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, environment_1.IEnvironmentService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, resolverService_1.ITextModelService),
        __param(10, keybinding_1.IKeybindingService),
        __param(11, modelService_1.IModelService),
        __param(12, jsonEditing_1.IJSONEditingService),
        __param(13, modeService_1.IModeService),
        __param(14, label_1.ILabelService),
        __param(15, remoteAgentService_1.IRemoteAgentService),
        __param(16, commands_1.ICommandService)
    ], PreferencesService);
    exports.PreferencesService = PreferencesService;
    extensions_1.registerSingleton(preferences_1.IPreferencesService, PreferencesService);
});
//# __sourceMappingURL=preferencesService.js.map