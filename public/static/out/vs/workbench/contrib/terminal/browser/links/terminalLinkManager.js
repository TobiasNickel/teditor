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
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/opener/common/opener", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/editor/common/editorService", "vs/platform/files/common/files", "vs/platform/remote/common/remoteHosts", "vs/base/common/path", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/platform", "vs/base/common/htmlContent", "vs/base/common/event", "vs/platform/log/common/log", "vs/workbench/contrib/terminal/browser/links/terminalProtocolLinkProvider", "vs/workbench/contrib/terminal/browser/links/terminalValidatedLocalLinkProvider", "vs/workbench/contrib/terminal/browser/links/terminalWordLinkProvider", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/widgets/terminalHoverWidget", "vs/workbench/contrib/terminal/browser/links/terminalExternalLinkProviderAdapter"], function (require, exports, nls, uri_1, lifecycle_1, opener_1, configuration_1, terminal_1, editorService_1, files_1, remoteHosts_1, path_1, terminal_2, platform_1, htmlContent_1, event_1, log_1, terminalProtocolLinkProvider_1, terminalValidatedLocalLinkProvider_1, terminalWordLinkProvider_1, instantiation_1, terminalHoverWidget_1, terminalExternalLinkProviderAdapter_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLinkManager = void 0;
    /**
     * An object responsible for managing registration of link matchers and link providers.
     */
    let TerminalLinkManager = class TerminalLinkManager extends lifecycle_1.DisposableStore {
        constructor(_xterm, _processManager, _openerService, _editorService, _configurationService, _fileService, _logService, _instantiationService) {
            super();
            this._xterm = _xterm;
            this._processManager = _processManager;
            this._openerService = _openerService;
            this._editorService = _editorService;
            this._configurationService = _configurationService;
            this._fileService = _fileService;
            this._logService = _logService;
            this._instantiationService = _instantiationService;
            this._hasBeforeHandleLinkListeners = false;
            this._standardLinkProviders = [];
            this._standardLinkProvidersDisposables = [];
            this._onBeforeHandleLink = this.add(new event_1.Emitter({
                onFirstListenerAdd: () => this._hasBeforeHandleLinkListeners = true,
                onLastListenerRemove: () => this._hasBeforeHandleLinkListeners = false
            }));
            // Protocol links
            const wrappedActivateCallback = this._wrapLinkHandler((_, link) => this._handleProtocolLink(link));
            const protocolProvider = this._instantiationService.createInstance(terminalProtocolLinkProvider_1.TerminalProtocolLinkProvider, this._xterm, wrappedActivateCallback, this._tooltipCallback2.bind(this));
            this._standardLinkProviders.push(protocolProvider);
            // Validated local links
            if (this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION).enableFileLinks) {
                const wrappedTextLinkActivateCallback = this._wrapLinkHandler((_, link) => this._handleLocalLink(link));
                const validatedProvider = this._instantiationService.createInstance(terminalValidatedLocalLinkProvider_1.TerminalValidatedLocalLinkProvider, this._xterm, this._processManager.os || platform_1.OS, wrappedTextLinkActivateCallback, this._wrapLinkHandler.bind(this), this._tooltipCallback2.bind(this), async (link, cb) => cb(await this._resolvePath(link)));
                this._standardLinkProviders.push(validatedProvider);
            }
            // Word links
            const wordProvider = this._instantiationService.createInstance(terminalWordLinkProvider_1.TerminalWordLinkProvider, this._xterm, this._wrapLinkHandler.bind(this), this._tooltipCallback2.bind(this));
            this._standardLinkProviders.push(wordProvider);
            this._registerStandardLinkProviders();
        }
        /**
         * Allows intercepting links and handling them outside of the default link handler. When fired
         * the listener has a set amount of time to handle the link or the default handler will fire.
         * This was designed to only be handled by a single listener.
         */
        get onBeforeHandleLink() { return this._onBeforeHandleLink.event; }
        _tooltipCallback2(link, viewportRange, modifierDownCallback, modifierUpCallback) {
            if (!this._widgetManager) {
                return;
            }
            const core = this._xterm._core;
            const cellDimensions = {
                width: core._renderService.dimensions.actualCellWidth,
                height: core._renderService.dimensions.actualCellHeight
            };
            const terminalDimensions = {
                width: this._xterm.cols,
                height: this._xterm.rows
            };
            // Don't pass the mouse event as this avoids the modifier check
            this._showHover({
                viewportRange,
                cellDimensions,
                terminalDimensions,
                modifierDownCallback,
                modifierUpCallback
            }, this._getLinkHoverString(link.text, link.label), (text) => link.activate(undefined, text), link);
        }
        _showHover(targetOptions, text, linkHandler, link) {
            if (this._widgetManager) {
                const widget = this._instantiationService.createInstance(terminalHoverWidget_1.TerminalHover, targetOptions, text, linkHandler);
                const attached = this._widgetManager.attachWidget(widget);
                if (attached) {
                    link === null || link === void 0 ? void 0 : link.onLeave(() => attached.dispose());
                }
            }
        }
        setWidgetManager(widgetManager) {
            this._widgetManager = widgetManager;
        }
        set processCwd(processCwd) {
            this._processCwd = processCwd;
        }
        _registerStandardLinkProviders() {
            lifecycle_1.dispose(this._standardLinkProvidersDisposables);
            this._standardLinkProvidersDisposables = [];
            for (const p of this._standardLinkProviders) {
                this._standardLinkProvidersDisposables.push(this._xterm.registerLinkProvider(p));
            }
        }
        registerExternalLinkProvider(instance, linkProvider) {
            const wrappedLinkProvider = this._instantiationService.createInstance(terminalExternalLinkProviderAdapter_1.TerminalExternalLinkProviderAdapter, this._xterm, instance, linkProvider, this._tooltipCallback2.bind(this));
            const newLinkProvider = this._xterm.registerLinkProvider(wrappedLinkProvider);
            // Re-register the standard link providers so they are a lower priority that the new one
            this._registerStandardLinkProviders();
            return newLinkProvider;
        }
        _wrapLinkHandler(handler) {
            return async (event, link) => {
                // Prevent default electron link handling so Alt+Click mode works normally
                event === null || event === void 0 ? void 0 : event.preventDefault();
                // Require correct modifier on click
                if (event && !this._isLinkActivationModifierDown(event)) {
                    return;
                }
                // Allow the link to be intercepted if there are listeners
                if (this._hasBeforeHandleLinkListeners) {
                    const wasHandled = await this._triggerBeforeHandleLinkListeners(link);
                    if (!wasHandled) {
                        handler(event, link);
                    }
                    return;
                }
                // Just call the handler if there is no before listener
                handler(event, link);
            };
        }
        async _triggerBeforeHandleLinkListeners(link) {
            return new Promise(r => {
                const timeoutId = setTimeout(() => {
                    canceled = true;
                    this._logService.error(`An extension intecepted a terminal link but it timed out after ${TerminalLinkManager.LINK_INTERCEPT_THRESHOLD / 1000} seconds`);
                    r(false);
                }, TerminalLinkManager.LINK_INTERCEPT_THRESHOLD);
                let canceled = false;
                const resolve = (handled) => {
                    if (!canceled) {
                        clearTimeout(timeoutId);
                        r(handled);
                    }
                };
                this._onBeforeHandleLink.fire({ link, resolve });
            });
        }
        get _localLinkRegex() {
            if (!this._processManager) {
                throw new Error('Process manager is required');
            }
            const baseLocalLinkClause = this._processManager.os === 1 /* Windows */ ? terminalValidatedLocalLinkProvider_1.winLocalLinkClause : terminalValidatedLocalLinkProvider_1.unixLocalLinkClause;
            // Append line and column number regex
            return new RegExp(`${baseLocalLinkClause}(${terminalValidatedLocalLinkProvider_1.lineAndColumnClause})`);
        }
        async _handleLocalLink(link) {
            // TODO: This gets resolved again but doesn't need to as it's already validated
            const resolvedLink = await this._resolvePath(link);
            if (!resolvedLink) {
                return;
            }
            const lineColumnInfo = this.extractLineColumnInfo(link);
            const selection = {
                startLineNumber: lineColumnInfo.lineNumber,
                startColumn: lineColumnInfo.columnNumber
            };
            await this._editorService.openEditor({ resource: resolvedLink.uri, options: { pinned: true, selection } });
        }
        _handleHypertextLink(url) {
            this._openerService.open(url, { allowTunneling: !!(this._processManager && this._processManager.remoteAuthority) });
        }
        async _handleProtocolLink(link) {
            // Check if it's a file:/// link, hand off to local link handler so to open an editor and
            // respect line/col attachment
            const uri = uri_1.URI.parse(link);
            if (uri.scheme === 'file') {
                this._handleLocalLink(uri.fsPath);
                return;
            }
            // Open as a web link if it's not a file
            this._handleHypertextLink(link);
        }
        _isLinkActivationModifierDown(event) {
            const editorConf = this._configurationService.getValue('editor');
            if (editorConf.multiCursorModifier === 'ctrlCmd') {
                return !!event.altKey;
            }
            return platform_1.isMacintosh ? event.metaKey : event.ctrlKey;
        }
        _getLinkHoverString(uri, label) {
            const editorConf = this._configurationService.getValue('editor');
            let clickLabel = '';
            if (editorConf.multiCursorModifier === 'ctrlCmd') {
                if (platform_1.isMacintosh) {
                    clickLabel = nls.localize('terminalLinkHandler.followLinkAlt.mac', "option + click");
                }
                else {
                    clickLabel = nls.localize('terminalLinkHandler.followLinkAlt', "alt + click");
                }
            }
            else {
                if (platform_1.isMacintosh) {
                    clickLabel = nls.localize('terminalLinkHandler.followLinkCmd', "cmd + click");
                }
                else {
                    clickLabel = nls.localize('terminalLinkHandler.followLinkCtrl', "ctrl + click");
                }
            }
            // Use 'undefined' when uri is '' so the link displays correctly
            return new htmlContent_1.MarkdownString(`[${label || nls.localize('followLink', "Follow Link")}](${uri || 'undefined'}) (${clickLabel})`, true);
        }
        get osPath() {
            if (!this._processManager) {
                throw new Error('Process manager is required');
            }
            if (this._processManager.os === 1 /* Windows */) {
                return path_1.win32;
            }
            return path_1.posix;
        }
        _preprocessPath(link) {
            if (!this._processManager) {
                throw new Error('Process manager is required');
            }
            if (link.charAt(0) === '~') {
                // Resolve ~ -> userHome
                if (!this._processManager.userHome) {
                    return null;
                }
                link = this.osPath.join(this._processManager.userHome, link.substring(1));
            }
            else if (link.charAt(0) !== '/' && link.charAt(0) !== '~') {
                // Resolve workspace path . | .. | <relative_path> -> <path>/. | <path>/.. | <path>/<relative_path>
                if (this._processManager.os === 1 /* Windows */) {
                    if (!link.match('^' + terminalValidatedLocalLinkProvider_1.winDrivePrefix) && !link.startsWith('\\\\?\\')) {
                        if (!this._processCwd) {
                            // Abort if no workspace is open
                            return null;
                        }
                        link = this.osPath.join(this._processCwd, link);
                    }
                    else {
                        // Remove \\?\ from paths so that they share the same underlying
                        // uri and don't open multiple tabs for the same file
                        link = link.replace(/^\\\\\?\\/, '');
                    }
                }
                else {
                    if (!this._processCwd) {
                        // Abort if no workspace is open
                        return null;
                    }
                    link = this.osPath.join(this._processCwd, link);
                }
            }
            link = this.osPath.normalize(link);
            return link;
        }
        async _resolvePath(link) {
            if (!this._processManager) {
                throw new Error('Process manager is required');
            }
            const preprocessedLink = this._preprocessPath(link);
            if (!preprocessedLink) {
                return undefined;
            }
            const linkUrl = this.extractLinkUrl(preprocessedLink);
            if (!linkUrl) {
                return undefined;
            }
            try {
                let uri;
                if (this._processManager.remoteAuthority) {
                    uri = uri_1.URI.from({
                        scheme: remoteHosts_1.REMOTE_HOST_SCHEME,
                        authority: this._processManager.remoteAuthority,
                        path: linkUrl
                    });
                }
                else {
                    uri = uri_1.URI.file(linkUrl);
                }
                try {
                    const stat = await this._fileService.resolve(uri);
                    return { uri, isDirectory: stat.isDirectory };
                }
                catch (e) {
                    // Does not exist
                    return undefined;
                }
            }
            catch (_a) {
                // Errors in parsing the path
                return undefined;
            }
        }
        /**
         * Returns line and column number of URl if that is present.
         *
         * @param link Url link which may contain line and column number.
         */
        extractLineColumnInfo(link) {
            const matches = this._localLinkRegex.exec(link);
            const lineColumnInfo = {
                lineNumber: 1,
                columnNumber: 1
            };
            if (!matches || !this._processManager) {
                return lineColumnInfo;
            }
            const lineAndColumnMatchIndex = this._processManager.os === 1 /* Windows */ ? terminalValidatedLocalLinkProvider_1.winLineAndColumnMatchIndex : terminalValidatedLocalLinkProvider_1.unixLineAndColumnMatchIndex;
            for (let i = 0; i < terminalValidatedLocalLinkProvider_1.lineAndColumnClause.length; i++) {
                const lineMatchIndex = lineAndColumnMatchIndex + (terminalValidatedLocalLinkProvider_1.lineAndColumnClauseGroupCount * i);
                const rowNumber = matches[lineMatchIndex];
                if (rowNumber) {
                    lineColumnInfo['lineNumber'] = parseInt(rowNumber, 10);
                    // Check if column number exists
                    const columnNumber = matches[lineMatchIndex + 2];
                    if (columnNumber) {
                        lineColumnInfo['columnNumber'] = parseInt(columnNumber, 10);
                    }
                    break;
                }
            }
            return lineColumnInfo;
        }
        /**
         * Returns url from link as link may contain line and column information.
         *
         * @param link url link which may contain line and column number.
         */
        extractLinkUrl(link) {
            const matches = this._localLinkRegex.exec(link);
            if (!matches) {
                return null;
            }
            return matches[1];
        }
    };
    TerminalLinkManager._LINK_INTERCEPT_THRESHOLD = terminal_2.LINK_INTERCEPT_THRESHOLD;
    TerminalLinkManager.LINK_INTERCEPT_THRESHOLD = TerminalLinkManager._LINK_INTERCEPT_THRESHOLD;
    TerminalLinkManager = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, editorService_1.IEditorService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, files_1.IFileService),
        __param(6, log_1.ILogService),
        __param(7, instantiation_1.IInstantiationService)
    ], TerminalLinkManager);
    exports.TerminalLinkManager = TerminalLinkManager;
});
//# __sourceMappingURL=terminalLinkManager.js.map