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
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/environment/common/environment", "vs/platform/product/common/product", "vs/base/common/decorators", "vs/base/common/errors", "vs/platform/theme/common/themeService", "vs/base/common/extpath"], function (require, exports, network_1, resources_1, uri_1, uuid_1, environment_1, product_1, decorators_1, errors_1, themeService_1, extpath_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserWorkbenchEnvironmentService = exports.BrowserEnvironmentConfiguration = void 0;
    class BrowserEnvironmentConfiguration {
        constructor(options, payload, backupHome) {
            this.options = options;
            this.payload = payload;
            this.backupHome = backupHome;
        }
        get sessionId() { return uuid_1.generateUuid(); }
        get remoteAuthority() { return this.options.remoteAuthority; }
        get backupWorkspaceResource() { return resources_1.joinPath(this.backupHome, this.options.workspaceId); }
        get filesToOpenOrCreate() {
            if (this.payload) {
                const fileToOpen = this.payload.get('openFile');
                if (fileToOpen) {
                    const fileUri = uri_1.URI.parse(fileToOpen);
                    // Support: --goto parameter to open on line/col
                    if (this.payload.has('gotoLineMode')) {
                        const pathColumnAware = extpath_1.parseLineAndColumnAware(fileUri.path);
                        return [{
                                fileUri: fileUri.with({ path: pathColumnAware.path }),
                                lineNumber: pathColumnAware.line,
                                columnNumber: pathColumnAware.column
                            }];
                    }
                    return [{ fileUri }];
                }
            }
            return undefined;
        }
        get filesToDiff() {
            if (this.payload) {
                const fileToDiffPrimary = this.payload.get('diffFilePrimary');
                const fileToDiffSecondary = this.payload.get('diffFileSecondary');
                if (fileToDiffPrimary && fileToDiffSecondary) {
                    return [
                        { fileUri: uri_1.URI.parse(fileToDiffSecondary) },
                        { fileUri: uri_1.URI.parse(fileToDiffPrimary) }
                    ];
                }
            }
            return undefined;
        }
        get highContrast() {
            return false; // could investigate to detect high contrast theme automatically
        }
        get defaultThemeType() {
            return themeService_1.LIGHT;
        }
    }
    __decorate([
        decorators_1.memoize
    ], BrowserEnvironmentConfiguration.prototype, "sessionId", null);
    __decorate([
        decorators_1.memoize
    ], BrowserEnvironmentConfiguration.prototype, "remoteAuthority", null);
    __decorate([
        decorators_1.memoize
    ], BrowserEnvironmentConfiguration.prototype, "backupWorkspaceResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserEnvironmentConfiguration.prototype, "filesToOpenOrCreate", null);
    __decorate([
        decorators_1.memoize
    ], BrowserEnvironmentConfiguration.prototype, "filesToDiff", null);
    exports.BrowserEnvironmentConfiguration = BrowserEnvironmentConfiguration;
    class BrowserWorkbenchEnvironmentService {
        constructor(options) {
            this.options = options;
            this._configuration = undefined;
            this._extensionHostDebugEnvironment = undefined;
            if (options.workspaceProvider && Array.isArray(options.workspaceProvider.payload)) {
                try {
                    this.payload = new Map(options.workspaceProvider.payload);
                }
                catch (error) {
                    errors_1.onUnexpectedError(error); // possible invalid payload for map
                }
            }
        }
        get configuration() {
            if (!this._configuration) {
                this._configuration = new BrowserEnvironmentConfiguration(this.options, this.payload, this.backupHome);
            }
            return this._configuration;
        }
        get isBuilt() { return !!product_1.default.commit; }
        get logsPath() { return this.options.logsPath.path; }
        get logLevel() { var _a; return (_a = this.payload) === null || _a === void 0 ? void 0 : _a.get('logLevel'); }
        get logFile() { return resources_1.joinPath(this.options.logsPath, 'window.log'); }
        get userRoamingDataHome() { return uri_1.URI.file('/User').with({ scheme: network_1.Schemas.userData }); }
        get settingsResource() { return resources_1.joinPath(this.userRoamingDataHome, 'settings.json'); }
        get argvResource() { return resources_1.joinPath(this.userRoamingDataHome, 'argv.json'); }
        get snippetsHome() { return resources_1.joinPath(this.userRoamingDataHome, 'snippets'); }
        /*
         * In Web every workspace can potentially have scoped user-data and/or extensions and if Sync state is shared then it can make
         * Sync error prone - say removing extensions from another workspace. Hence scope Sync state per workspace.
         * Sync scoped to a workspace is capable of handling opening same workspace in multiple windows.
         */
        get userDataSyncHome() { return resources_1.joinPath(this.userRoamingDataHome, 'sync', this.options.workspaceId); }
        get userDataSyncLogResource() { return resources_1.joinPath(this.options.logsPath, 'userDataSync.log'); }
        get sync() { return undefined; }
        get enableSyncByDefault() { return !!this.options.enableSyncByDefault; }
        get keybindingsResource() { return resources_1.joinPath(this.userRoamingDataHome, 'keybindings.json'); }
        get keyboardLayoutResource() { return resources_1.joinPath(this.userRoamingDataHome, 'keyboardLayout.json'); }
        get backupHome() { return resources_1.joinPath(this.userRoamingDataHome, environment_1.BACKUPS); }
        get untitledWorkspacesHome() { return resources_1.joinPath(this.userRoamingDataHome, 'Workspaces'); }
        get serviceMachineIdResource() { return resources_1.joinPath(this.userRoamingDataHome, 'machineid'); }
        get debugExtensionHost() {
            if (!this._extensionHostDebugEnvironment) {
                this._extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this._extensionHostDebugEnvironment.params;
        }
        get isExtensionDevelopment() {
            if (!this._extensionHostDebugEnvironment) {
                this._extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this._extensionHostDebugEnvironment.isExtensionDevelopment;
        }
        get extensionDevelopmentLocationURI() {
            if (!this._extensionHostDebugEnvironment) {
                this._extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this._extensionHostDebugEnvironment.extensionDevelopmentLocationURI;
        }
        get extensionTestsLocationURI() {
            if (!this._extensionHostDebugEnvironment) {
                this._extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this._extensionHostDebugEnvironment.extensionTestsLocationURI;
        }
        get extensionEnabledProposedApi() {
            if (!this._extensionHostDebugEnvironment) {
                this._extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this._extensionHostDebugEnvironment.extensionEnabledProposedApi;
        }
        get disableExtensions() { var _a; return ((_a = this.payload) === null || _a === void 0 ? void 0 : _a.get('disableExtensions')) === 'true'; }
        get webviewExternalEndpoint() {
            // TODO@matt: get fallback from product.json
            return (this.options.webviewEndpoint || 'https://{{uuid}}.vscode-webview-test.com/{{commit}}').replace('{{commit}}', product_1.default.commit || '0d728c31ebdf03869d2687d9be0b017667c9ff37');
        }
        get webviewResourceRoot() {
            return `${this.webviewExternalEndpoint}/vscode-resource/{{resource}}`;
        }
        get webviewCspSource() {
            return this.webviewExternalEndpoint.replace('{{uuid}}', '*');
        }
        get disableTelemetry() { return false; }
        get verbose() { var _a; return ((_a = this.payload) === null || _a === void 0 ? void 0 : _a.get('verbose')) === 'true'; }
        get logExtensionHostCommunication() { var _a; return ((_a = this.payload) === null || _a === void 0 ? void 0 : _a.get('logExtensionHostCommunication')) === 'true'; }
        resolveExtensionHostDebugEnvironment() {
            const extensionHostDebugEnvironment = {
                params: {
                    port: null,
                    break: false
                },
                isExtensionDevelopment: false,
                extensionDevelopmentLocationURI: undefined
            };
            // Fill in selected extra environmental properties
            if (this.payload) {
                for (const [key, value] of this.payload) {
                    switch (key) {
                        case 'extensionDevelopmentPath':
                            extensionHostDebugEnvironment.extensionDevelopmentLocationURI = [uri_1.URI.parse(value)];
                            extensionHostDebugEnvironment.isExtensionDevelopment = true;
                            break;
                        case 'extensionTestsPath':
                            extensionHostDebugEnvironment.extensionTestsLocationURI = uri_1.URI.parse(value);
                            break;
                        case 'debugId':
                            extensionHostDebugEnvironment.params.debugId = value;
                            break;
                        case 'inspect-brk-extensions':
                            extensionHostDebugEnvironment.params.port = parseInt(value);
                            extensionHostDebugEnvironment.params.break = true;
                            break;
                        case 'inspect-extensions':
                            extensionHostDebugEnvironment.params.port = parseInt(value);
                            break;
                        case 'enableProposedApi':
                            extensionHostDebugEnvironment.extensionEnabledProposedApi = [];
                            break;
                    }
                }
            }
            return extensionHostDebugEnvironment;
        }
        get skipReleaseNotes() { return false; }
    }
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "isBuilt", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "logsPath", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "logFile", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "userRoamingDataHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "settingsResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "argvResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "snippetsHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "userDataSyncHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "userDataSyncLogResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "sync", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "enableSyncByDefault", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "keybindingsResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "keyboardLayoutResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "backupHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "untitledWorkspacesHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "serviceMachineIdResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "webviewExternalEndpoint", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "webviewResourceRoot", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "webviewCspSource", null);
    exports.BrowserWorkbenchEnvironmentService = BrowserWorkbenchEnvironmentService;
});
//# __sourceMappingURL=environmentService.js.map