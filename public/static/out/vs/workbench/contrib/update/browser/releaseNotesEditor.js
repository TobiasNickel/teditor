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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/common/modes", "vs/editor/common/modes/supports/tokenization", "vs/editor/common/services/modeService", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/platform/request/common/request", "vs/platform/telemetry/common/telemetry", "vs/platform/product/common/productService", "vs/workbench/contrib/webview/browser/webviewWorkbenchService", "vs/workbench/services/editor/common/editorService", "vs/base/common/keybindingParser", "vs/base/common/cancellation", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/uuid", "vs/workbench/contrib/markdown/common/markdownDocumentRenderer", "vs/css!./media/releasenoteseditor"], function (require, exports, errors_1, platform_1, uri_1, modes_1, tokenization_1, modeService_1, nls, environment_1, keybinding_1, opener_1, request_1, telemetry_1, productService_1, webviewWorkbenchService_1, editorService_1, keybindingParser_1, cancellation_1, extensions_1, editorGroupsService_1, uuid_1, markdownDocumentRenderer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReleaseNotesManager = void 0;
    let ReleaseNotesManager = class ReleaseNotesManager {
        constructor(_environmentService, _keybindingService, _modeService, _openerService, _requestService, _telemetryService, _editorService, _editorGroupService, _webviewWorkbenchService, _extensionService, _productService) {
            this._environmentService = _environmentService;
            this._keybindingService = _keybindingService;
            this._modeService = _modeService;
            this._openerService = _openerService;
            this._requestService = _requestService;
            this._telemetryService = _telemetryService;
            this._editorService = _editorService;
            this._editorGroupService = _editorGroupService;
            this._webviewWorkbenchService = _webviewWorkbenchService;
            this._extensionService = _extensionService;
            this._productService = _productService;
            this._releaseNotesCache = new Map();
            this._currentReleaseNotes = undefined;
            modes_1.TokenizationRegistry.onDidChange(async () => {
                if (!this._currentReleaseNotes || !this._lastText) {
                    return;
                }
                const html = await this.renderBody(this._lastText);
                if (this._currentReleaseNotes) {
                    this._currentReleaseNotes.webview.html = html;
                }
            });
        }
        async show(accessor, version) {
            const releaseNoteText = await this.loadReleaseNotes(version);
            this._lastText = releaseNoteText;
            const html = await this.renderBody(releaseNoteText);
            const title = nls.localize('releaseNotesInputName', "Release Notes: {0}", version);
            const activeEditorPane = this._editorService.activeEditorPane;
            if (this._currentReleaseNotes) {
                this._currentReleaseNotes.setName(title);
                this._currentReleaseNotes.webview.html = html;
                this._webviewWorkbenchService.revealWebview(this._currentReleaseNotes, activeEditorPane ? activeEditorPane.group : this._editorGroupService.activeGroup, false);
            }
            else {
                this._currentReleaseNotes = this._webviewWorkbenchService.createWebview('vs_code_release_notes', 'releaseNotes', title, { group: editorService_1.ACTIVE_GROUP, preserveFocus: false }, {
                    tryRestoreScrollPosition: true,
                    enableFindWidget: true,
                    localResourceRoots: []
                }, undefined);
                this._currentReleaseNotes.webview.onDidClickLink(uri => this.onDidClickLink(uri_1.URI.parse(uri)));
                this._currentReleaseNotes.onDispose(() => { this._currentReleaseNotes = undefined; });
                this._currentReleaseNotes.webview.html = html;
            }
            return true;
        }
        loadReleaseNotes(version) {
            const match = /^(\d+\.\d+)\./.exec(version);
            if (!match) {
                return Promise.reject(new Error('not found'));
            }
            const versionLabel = match[1].replace(/\./g, '_');
            const baseUrl = 'https://code.visualstudio.com/raw';
            const url = `${baseUrl}/v${versionLabel}.md`;
            const unassigned = nls.localize('unassigned', "unassigned");
            const patchKeybindings = (text) => {
                const kb = (match, kb) => {
                    const keybinding = this._keybindingService.lookupKeybinding(kb);
                    if (!keybinding) {
                        return unassigned;
                    }
                    return keybinding.getLabel() || unassigned;
                };
                const kbstyle = (match, kb) => {
                    const keybinding = keybindingParser_1.KeybindingParser.parseKeybinding(kb, platform_1.OS);
                    if (!keybinding) {
                        return unassigned;
                    }
                    const resolvedKeybindings = this._keybindingService.resolveKeybinding(keybinding);
                    if (resolvedKeybindings.length === 0) {
                        return unassigned;
                    }
                    return resolvedKeybindings[0].getLabel() || unassigned;
                };
                return text
                    .replace(/kb\(([a-z.\d\-]+)\)/gi, kb)
                    .replace(/kbstyle\(([^\)]+)\)/gi, kbstyle);
            };
            if (!this._releaseNotesCache.has(version)) {
                this._releaseNotesCache.set(version, this._requestService.request({ url }, cancellation_1.CancellationToken.None)
                    .then(request_1.asText)
                    .then(text => {
                    if (!text || !/^#\s/.test(text)) { // release notes always starts with `#` followed by whitespace
                        return Promise.reject(new Error('Invalid release notes'));
                    }
                    return Promise.resolve(text);
                })
                    .then(text => patchKeybindings(text)));
            }
            return this._releaseNotesCache.get(version);
        }
        onDidClickLink(uri) {
            this.addGAParameters(uri, 'ReleaseNotes')
                .then(updated => this._openerService.open(updated))
                .then(undefined, errors_1.onUnexpectedError);
        }
        async addGAParameters(uri, origin, experiment = '1') {
            if (this._environmentService.isBuilt && !this._environmentService.isExtensionDevelopment && !this._environmentService.disableTelemetry && !!this._productService.enableTelemetry) {
                if (uri.scheme === 'https' && uri.authority === 'code.visualstudio.com') {
                    const info = await this._telemetryService.getTelemetryInfo();
                    return uri.with({ query: `${uri.query ? uri.query + '&' : ''}utm_source=VsCode&utm_medium=${encodeURIComponent(origin)}&utm_campaign=${encodeURIComponent(info.instanceId)}&utm_content=${encodeURIComponent(experiment)}` });
                }
            }
            return uri;
        }
        async renderBody(text) {
            const nonce = uuid_1.generateUuid();
            const content = await markdownDocumentRenderer_1.renderMarkdownDocument(text, this._extensionService, this._modeService);
            const colorMap = modes_1.TokenizationRegistry.getColorMap();
            const css = colorMap ? tokenization_1.generateTokensCSSForColorMap(colorMap) : '';
            return `<!DOCTYPE html>
		<html>
			<head>
				<base href="https://code.visualstudio.com/raw/">
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; media-src https:; style-src 'nonce-${nonce}' https://code.visualstudio.com;">
				<style nonce="${nonce}">
					body {
						padding: 10px 20px;
						line-height: 22px;
						max-width: 882px;
						margin: 0 auto;
					}

					img {
						max-width: 100%;
						max-height: 100%;
					}

					a {
						text-decoration: none;
					}

					a:hover {
						text-decoration: underline;
					}

					a:focus,
					input:focus,
					select:focus,
					textarea:focus {
						outline: 1px solid -webkit-focus-ring-color;
						outline-offset: -1px;
					}

					hr {
						border: 0;
						height: 2px;
						border-bottom: 2px solid;
					}

					h1 {
						padding-bottom: 0.3em;
						line-height: 1.2;
						border-bottom-width: 1px;
						border-bottom-style: solid;
					}

					h1, h2, h3 {
						font-weight: normal;
					}

					table {
						border-collapse: collapse;
					}

					table > thead > tr > th {
						text-align: left;
						border-bottom: 1px solid;
					}

					table > thead > tr > th,
					table > thead > tr > td,
					table > tbody > tr > th,
					table > tbody > tr > td {
						padding: 5px 10px;
					}

					table > tbody > tr + tr > td {
						border-top-width: 1px;
						border-top-style: solid;
					}

					blockquote {
						margin: 0 7px 0 5px;
						padding: 0 16px 0 10px;
						border-left-width: 5px;
						border-left-style: solid;
					}

					code {
						font-family: var(--vscode-editor-font-family);
						font-weight: var(--vscode-editor-font-weight);
						font-size: var(--vscode-editor-font-size);
						line-height: 19px;
					}

					code > div {
						padding: 16px;
						border-radius: 3px;
						overflow: auto;
					}

					.monaco-tokenized-source {
						white-space: pre;
					}

					/** Theming */

					.vscode-light code > div {
						background-color: rgba(220, 220, 220, 0.4);
					}

					.vscode-dark code > div {
						background-color: rgba(10, 10, 10, 0.4);
					}

					.vscode-high-contrast code > div {
						background-color: rgb(0, 0, 0);
					}

					.vscode-high-contrast h1 {
						border-color: rgb(0, 0, 0);
					}

					.vscode-light table > thead > tr > th {
						border-color: rgba(0, 0, 0, 0.69);
					}

					.vscode-dark table > thead > tr > th {
						border-color: rgba(255, 255, 255, 0.69);
					}

					.vscode-light h1,
					.vscode-light hr,
					.vscode-light table > tbody > tr + tr > td {
						border-color: rgba(0, 0, 0, 0.18);
					}

					.vscode-dark h1,
					.vscode-dark hr,
					.vscode-dark table > tbody > tr + tr > td {
						border-color: rgba(255, 255, 255, 0.18);
					}

					${css}
				</style>
			</head>
			<body>${content}</body>
		</html>`;
        }
    };
    ReleaseNotesManager = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, keybinding_1.IKeybindingService),
        __param(2, modeService_1.IModeService),
        __param(3, opener_1.IOpenerService),
        __param(4, request_1.IRequestService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, editorService_1.IEditorService),
        __param(7, editorGroupsService_1.IEditorGroupsService),
        __param(8, webviewWorkbenchService_1.IWebviewWorkbenchService),
        __param(9, extensions_1.IExtensionService),
        __param(10, productService_1.IProductService)
    ], ReleaseNotesManager);
    exports.ReleaseNotesManager = ReleaseNotesManager;
});
//# __sourceMappingURL=releaseNotesEditor.js.map