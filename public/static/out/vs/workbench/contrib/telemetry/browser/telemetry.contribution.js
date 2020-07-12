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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/platform/lifecycle/common/lifecycle", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/services/activityBar/browser/activityBarService", "vs/workbench/services/editor/common/editorService", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/services/environment/common/environmentService", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/platform/telemetry/browser/errorTelemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/configuration/common/configuration", "vs/workbench/services/viewlet/browser/viewlet", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/resources", "vs/base/common/network", "vs/base/common/mime", "vs/base/common/hash"], function (require, exports, platform_1, contributions_1, lifecycle_1, telemetry_1, workspace_1, activityBarService_1, editorService_1, keybinding_1, workbenchThemeService_1, environmentService_1, platform_2, lifecycle_2, errorTelemetry_1, telemetryUtils_1, configuration_1, viewlet_1, textfiles_1, resources_1, network_1, mime_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryContribution = void 0;
    let TelemetryContribution = class TelemetryContribution extends lifecycle_2.Disposable {
        constructor(telemetryService, contextService, activityBarService, lifecycleService, editorService, keybindingsService, themeService, environmentService, configurationService, viewletService, textFileService) {
            super();
            this.telemetryService = telemetryService;
            this.contextService = contextService;
            this.environmentService = environmentService;
            const { filesToOpenOrCreate, filesToDiff } = environmentService.configuration;
            const activeViewlet = viewletService.getActiveViewlet();
            telemetryService.publicLog2('workspaceLoad', {
                userAgent: navigator.userAgent,
                windowSize: { innerHeight: window.innerHeight, innerWidth: window.innerWidth, outerHeight: window.outerHeight, outerWidth: window.outerWidth },
                emptyWorkbench: contextService.getWorkbenchState() === 1 /* EMPTY */,
                'workbench.filesToOpenOrCreate': filesToOpenOrCreate && filesToOpenOrCreate.length || 0,
                'workbench.filesToDiff': filesToDiff && filesToDiff.length || 0,
                customKeybindingsCount: keybindingsService.customKeybindingsCount(),
                theme: themeService.getColorTheme().id,
                language: platform_2.language,
                pinnedViewlets: activityBarService.getPinnedViewContainerIds(),
                restoredViewlet: activeViewlet ? activeViewlet.getId() : undefined,
                restoredEditors: editorService.visibleEditors.length,
                startupKind: lifecycleService.startupKind
            });
            // Error Telemetry
            this._register(new errorTelemetry_1.default(telemetryService));
            // Configuration Telemetry
            this._register(telemetryUtils_1.configurationTelemetry(telemetryService, configurationService));
            //  Files Telemetry
            this._register(textFileService.files.onDidLoad(e => this.onTextFileModelLoaded(e)));
            this._register(textFileService.files.onDidSave(e => this.onTextFileModelSaved(e)));
            // Lifecycle
            this._register(lifecycleService.onShutdown(() => this.dispose()));
        }
        onTextFileModelLoaded(e) {
            const settingsType = this.getTypeIfSettings(e.model.resource);
            if (settingsType) {
                this.telemetryService.publicLog2('settingsRead', { settingsType }); // Do not log read to user settings.json and .vscode folder as a fileGet event as it ruins our JSON usage data
            }
            else {
                this.telemetryService.publicLog2('fileGet', this.getTelemetryData(e.model.resource, e.reason));
            }
        }
        onTextFileModelSaved(e) {
            const settingsType = this.getTypeIfSettings(e.model.resource);
            if (settingsType) {
                this.telemetryService.publicLog2('settingsWritten', { settingsType }); // Do not log write to user settings.json and .vscode folder as a filePUT event as it ruins our JSON usage data
            }
            else {
                this.telemetryService.publicLog2('filePUT', this.getTelemetryData(e.model.resource, e.reason));
            }
        }
        getTypeIfSettings(resource) {
            if (resources_1.extname(resource) !== '.json') {
                return '';
            }
            // Check for global settings file
            if (resources_1.isEqual(resource, this.environmentService.settingsResource)) {
                return 'global-settings';
            }
            // Check for keybindings file
            if (resources_1.isEqual(resource, this.environmentService.keybindingsResource)) {
                return 'keybindings';
            }
            // Check for snippets
            if (resources_1.isEqualOrParent(resource, this.environmentService.snippetsHome)) {
                return 'snippets';
            }
            // Check for workspace settings file
            const folders = this.contextService.getWorkspace().folders;
            for (const folder of folders) {
                if (resources_1.isEqualOrParent(resource, folder.toResource('.vscode'))) {
                    const filename = resources_1.basename(resource);
                    if (TelemetryContribution.WHITELIST_WORKSPACE_JSON.indexOf(filename) > -1) {
                        return `.vscode/${filename}`;
                    }
                }
            }
            return '';
        }
        getTelemetryData(resource, reason) {
            const ext = resources_1.extname(resource);
            const fileName = resources_1.basename(resource);
            const path = resource.scheme === network_1.Schemas.file ? resource.fsPath : resource.path;
            const telemetryData = {
                mimeType: mime_1.guessMimeTypes(resource).join(', '),
                ext,
                path: hash_1.hash(path),
                reason,
                whitelistedjson: undefined
            };
            if (ext === '.json' && TelemetryContribution.WHITELIST_JSON.indexOf(fileName) > -1) {
                telemetryData['whitelistedjson'] = fileName;
            }
            return telemetryData;
        }
    };
    TelemetryContribution.WHITELIST_JSON = ['package.json', 'package-lock.json', 'tsconfig.json', 'jsconfig.json', 'bower.json', '.eslintrc.json', 'tslint.json', 'composer.json'];
    TelemetryContribution.WHITELIST_WORKSPACE_JSON = ['settings.json', 'extensions.json', 'tasks.json', 'launch.json'];
    TelemetryContribution = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, activityBarService_1.IActivityBarService),
        __param(3, lifecycle_1.ILifecycleService),
        __param(4, editorService_1.IEditorService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, workbenchThemeService_1.IWorkbenchThemeService),
        __param(7, environmentService_1.IWorkbenchEnvironmentService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, viewlet_1.IViewletService),
        __param(10, textfiles_1.ITextFileService)
    ], TelemetryContribution);
    exports.TelemetryContribution = TelemetryContribution;
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(TelemetryContribution, 3 /* Restored */);
});
//# __sourceMappingURL=telemetry.contribution.js.map