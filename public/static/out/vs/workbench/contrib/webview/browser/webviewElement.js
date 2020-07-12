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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/buffer", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/remote/common/remoteHosts", "vs/platform/remote/common/tunnel", "vs/platform/request/common/request", "vs/platform/telemetry/common/telemetry", "vs/platform/webview/common/resourceLoader", "vs/platform/webview/common/webviewPortMapping", "vs/workbench/contrib/webview/browser/baseWebviewElement", "vs/workbench/services/environment/common/environmentService"], function (require, exports, dom_1, buffer_1, network_1, platform_1, uri_1, configuration_1, environment_1, files_1, log_1, remoteAuthorityResolver_1, remoteHosts_1, tunnel_1, request_1, telemetry_1, resourceLoader_1, webviewPortMapping_1, baseWebviewElement_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IFrameWebview = void 0;
    let IFrameWebview = class IFrameWebview extends baseWebviewElement_1.BaseWebview {
        constructor(id, options, contentOptions, extension, webviewThemeDataProvider, tunnelService, fileService, requestService, _configurationService, telemetryService, environmentService, _workbenchEnvironmentService, _remoteAuthorityResolverService, logService) {
            super(id, options, contentOptions, extension, webviewThemeDataProvider, logService, telemetryService, environmentService, _workbenchEnvironmentService);
            this.fileService = fileService;
            this.requestService = requestService;
            this._configurationService = _configurationService;
            this._workbenchEnvironmentService = _workbenchEnvironmentService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            if (!this.useExternalEndpoint && (!_workbenchEnvironmentService.options || typeof _workbenchEnvironmentService.webviewExternalEndpoint !== 'string')) {
                throw new Error('To use iframe based webviews, you must configure `environmentService.webviewExternalEndpoint`');
            }
            this._portMappingManager = this._register(new webviewPortMapping_1.WebviewPortMappingManager(() => { var _a; return (_a = this.extension) === null || _a === void 0 ? void 0 : _a.location; }, () => this.content.options.portMapping || [], tunnelService));
            this._register(this.on("load-resource" /* loadResource */, (entry) => {
                const rawPath = entry.path;
                const normalizedPath = decodeURIComponent(rawPath);
                const uri = uri_1.URI.parse(normalizedPath.replace(/^\/(\w+)\/(.+)$/, (_, scheme, path) => scheme + ':/' + path));
                this.loadResource(rawPath, uri);
            }));
            this._register(this.on("load-localhost" /* loadLocalhost */, (entry) => {
                this.localLocalhost(entry.origin);
            }));
            this.element.setAttribute('src', `${this.externalEndpoint}/index.html?id=${this.id}`);
        }
        createElement(options, _contentOptions) {
            // Do not start loading the webview yet.
            // Wait the end of the ctor when all listeners have been hooked up.
            const element = document.createElement('iframe');
            element.className = `webview ${options.customClasses || ''}`;
            element.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-forms');
            element.style.border = 'none';
            element.style.width = '100%';
            element.style.height = '100%';
            return element;
        }
        get externalEndpoint() {
            const endpoint = this.workbenchEnvironmentService.webviewExternalEndpoint.replace('{{uuid}}', this.id);
            if (endpoint[endpoint.length - 1] === '/') {
                return endpoint.slice(0, endpoint.length - 1);
            }
            return endpoint;
        }
        get useExternalEndpoint() {
            return platform_1.isWeb || this._configurationService.getValue('webview.experimental.useExternalEndpoint');
        }
        mountTo(parent) {
            if (this.element) {
                parent.appendChild(this.element);
            }
        }
        set html(value) {
            super.html = this.preprocessHtml(value);
        }
        preprocessHtml(value) {
            return value
                .replace(/(["'])(?:vscode-resource):(\/\/([^\s\/'"]+?)(?=\/))?([^\s'"]+?)(["'])/gi, (match, startQuote, _1, scheme, path, endQuote) => {
                if (scheme) {
                    return `${startQuote}${this.externalEndpoint}/vscode-resource/${scheme}${path}${endQuote}`;
                }
                return `${startQuote}${this.externalEndpoint}/vscode-resource/file${path}${endQuote}`;
            })
                .replace(/(["'])(?:vscode-webview-resource):(\/\/[^\s\/'"]+\/([^\s\/'"]+?)(?=\/))?([^\s'"]+?)(["'])/gi, (match, startQuote, _1, scheme, path, endQuote) => {
                if (scheme) {
                    return `${startQuote}${this.externalEndpoint}/vscode-resource/${scheme}${path}${endQuote}`;
                }
                return `${startQuote}${this.externalEndpoint}/vscode-resource/file${path}${endQuote}`;
            });
        }
        get extraContentOptions() {
            return {
                endpoint: this.externalEndpoint,
            };
        }
        focus() {
            if (this.element) {
                this._send('focus');
            }
        }
        showFind() {
            throw new Error('Method not implemented.');
        }
        hideFind() {
            throw new Error('Method not implemented.');
        }
        runFindAction(previous) {
            throw new Error('Method not implemented.');
        }
        async loadResource(requestPath, uri) {
            var _a;
            try {
                const remoteAuthority = this._workbenchEnvironmentService.configuration.remoteAuthority;
                const remoteConnectionData = remoteAuthority ? this._remoteAuthorityResolverService.getConnectionData(remoteAuthority) : null;
                const extensionLocation = (_a = this.extension) === null || _a === void 0 ? void 0 : _a.location;
                // If we are loading a file resource from a remote extension, rewrite the uri to go remote
                let rewriteUri;
                if ((extensionLocation === null || extensionLocation === void 0 ? void 0 : extensionLocation.scheme) === remoteHosts_1.REMOTE_HOST_SCHEME) {
                    rewriteUri = (uri) => {
                        if (uri.scheme === network_1.Schemas.file && (extensionLocation === null || extensionLocation === void 0 ? void 0 : extensionLocation.scheme) === remoteHosts_1.REMOTE_HOST_SCHEME) {
                            return uri_1.URI.from({
                                scheme: remoteHosts_1.REMOTE_HOST_SCHEME,
                                authority: extensionLocation.authority,
                                path: '/vscode-resource',
                                query: JSON.stringify({
                                    requestResourcePath: uri.path
                                })
                            });
                        }
                        return uri;
                    };
                }
                const result = await resourceLoader_1.loadLocalResource(uri, {
                    extensionLocation: extensionLocation,
                    roots: this.content.options.localResourceRoots || [],
                    remoteConnectionData,
                    rewriteUri,
                }, this.fileService, this.requestService);
                if (result.type === resourceLoader_1.WebviewResourceResponse.Type.Success) {
                    const { buffer } = await buffer_1.streamToBuffer(result.stream);
                    return this._send('did-load-resource', {
                        status: 200,
                        path: requestPath,
                        mime: result.mimeType,
                        data: buffer,
                    });
                }
            }
            catch (_b) {
                // noop
            }
            return this._send('did-load-resource', {
                status: 404,
                path: requestPath
            });
        }
        async localLocalhost(origin) {
            const authority = this._workbenchEnvironmentService.configuration.remoteAuthority;
            const resolveAuthority = authority ? await this._remoteAuthorityResolverService.resolveAuthority(authority) : undefined;
            const redirect = resolveAuthority ? await this._portMappingManager.getRedirect(resolveAuthority.authority, origin) : undefined;
            return this._send('did-load-localhost', {
                origin,
                location: redirect
            });
        }
        doPostMessage(channel, data) {
            if (this.element) {
                this.element.contentWindow.postMessage({ channel, args: data }, '*');
            }
        }
        on(channel, handler) {
            return dom_1.addDisposableListener(window, 'message', e => {
                if (!e || !e.data || e.data.target !== this.id) {
                    return;
                }
                if (e.data.channel === channel) {
                    handler(e.data.data);
                }
            });
        }
    };
    IFrameWebview = __decorate([
        __param(5, tunnel_1.ITunnelService),
        __param(6, files_1.IFileService),
        __param(7, request_1.IRequestService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, environment_1.IEnvironmentService),
        __param(11, environmentService_1.IWorkbenchEnvironmentService),
        __param(12, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(13, log_1.ILogService)
    ], IFrameWebview);
    exports.IFrameWebview = IFrameWebview;
});
//# __sourceMappingURL=webviewElement.js.map