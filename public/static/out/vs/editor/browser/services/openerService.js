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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/linkedList", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/platform/commands/common/commands", "vs/platform/opener/common/opener", "vs/platform/editor/common/editor"], function (require, exports, dom, linkedList_1, marshalling_1, network_1, resources_1, uri_1, codeEditorService_1, commands_1, opener_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenerService = void 0;
    let CommandOpener = class CommandOpener {
        constructor(_commandService) {
            this._commandService = _commandService;
        }
        async open(target) {
            if (!opener_1.matchesScheme(target, network_1.Schemas.command)) {
                return false;
            }
            // run command or bail out if command isn't known
            if (typeof target === 'string') {
                target = uri_1.URI.parse(target);
            }
            // execute as command
            let args = [];
            try {
                args = marshalling_1.parse(decodeURIComponent(target.query));
            }
            catch (_a) {
                // ignore and retry
                try {
                    args = marshalling_1.parse(target.query);
                }
                catch (_b) {
                    // ignore error
                }
            }
            if (!Array.isArray(args)) {
                args = [args];
            }
            await this._commandService.executeCommand(target.path, ...args);
            return true;
        }
    };
    CommandOpener = __decorate([
        __param(0, commands_1.ICommandService)
    ], CommandOpener);
    let EditorOpener = class EditorOpener {
        constructor(_editorService) {
            this._editorService = _editorService;
        }
        async open(target, options) {
            if (typeof target === 'string') {
                target = uri_1.URI.parse(target);
            }
            let selection = undefined;
            const match = /^L?(\d+)(?:,(\d+))?/.exec(target.fragment);
            if (match) {
                // support file:///some/file.js#73,84
                // support file:///some/file.js#L73
                selection = {
                    startLineNumber: parseInt(match[1]),
                    startColumn: match[2] ? parseInt(match[2]) : 1
                };
                // remove fragment
                target = target.with({ fragment: '' });
            }
            if (target.scheme === network_1.Schemas.file) {
                target = resources_1.normalizePath(target); // workaround for non-normalized paths (https://github.com/Microsoft/vscode/issues/12954)
            }
            await this._editorService.openCodeEditor({ resource: target, options: { selection, context: (options === null || options === void 0 ? void 0 : options.fromUserGesture) ? editor_1.EditorOpenContext.USER : editor_1.EditorOpenContext.API } }, this._editorService.getFocusedCodeEditor(), options === null || options === void 0 ? void 0 : options.openToSide);
            return true;
        }
    };
    EditorOpener = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService)
    ], EditorOpener);
    let OpenerService = class OpenerService {
        constructor(editorService, commandService) {
            this._openers = new linkedList_1.LinkedList();
            this._validators = new linkedList_1.LinkedList();
            this._resolvers = new linkedList_1.LinkedList();
            // Default external opener is going through window.open()
            this._externalOpener = {
                openExternal: href => {
                    // ensure to open HTTP/HTTPS links into new windows
                    // to not trigger a navigation. Any other link is
                    // safe to be set as HREF to prevent a blank window
                    // from opening.
                    if (opener_1.matchesScheme(href, network_1.Schemas.http) || opener_1.matchesScheme(href, network_1.Schemas.https)) {
                        dom.windowOpenNoOpener(href);
                    }
                    else {
                        window.location.href = href;
                    }
                    return Promise.resolve(true);
                }
            };
            // Default opener: maito, http(s), command, and catch-all-editors
            this._openers.push({
                open: async (target, options) => {
                    if ((options === null || options === void 0 ? void 0 : options.openExternal) || opener_1.matchesScheme(target, network_1.Schemas.mailto) || opener_1.matchesScheme(target, network_1.Schemas.http) || opener_1.matchesScheme(target, network_1.Schemas.https)) {
                        // open externally
                        await this._doOpenExternal(target, options);
                        return true;
                    }
                    return false;
                }
            });
            this._openers.push(new CommandOpener(commandService));
            this._openers.push(new EditorOpener(editorService));
        }
        registerOpener(opener) {
            const remove = this._openers.unshift(opener);
            return { dispose: remove };
        }
        registerValidator(validator) {
            const remove = this._validators.push(validator);
            return { dispose: remove };
        }
        registerExternalUriResolver(resolver) {
            const remove = this._resolvers.push(resolver);
            return { dispose: remove };
        }
        setExternalOpener(externalOpener) {
            this._externalOpener = externalOpener;
        }
        async open(target, options) {
            // check with contributed validators
            for (const validator of this._validators.toArray()) {
                if (!(await validator.shouldOpen(target))) {
                    return false;
                }
            }
            // check with contributed openers
            for (const opener of this._openers.toArray()) {
                const handled = await opener.open(target, options);
                if (handled) {
                    return true;
                }
            }
            return false;
        }
        async resolveExternalUri(resource, options) {
            for (const resolver of this._resolvers.toArray()) {
                const result = await resolver.resolveExternalUri(resource, options);
                if (result) {
                    return result;
                }
            }
            return { resolved: resource, dispose: () => { } };
        }
        async _doOpenExternal(resource, options) {
            //todo@joh IExternalUriResolver should support `uri: URI | string`
            const uri = typeof resource === 'string' ? uri_1.URI.parse(resource) : resource;
            const { resolved } = await this.resolveExternalUri(uri, options);
            if (typeof resource === 'string' && uri.toString() === resolved.toString()) {
                // open the url-string AS IS
                return this._externalOpener.openExternal(resource);
            }
            else {
                // open URI using the toString(noEncode)+encodeURI-trick
                return this._externalOpener.openExternal(encodeURI(resolved.toString(true)));
            }
        }
        dispose() {
            this._validators.clear();
        }
    };
    OpenerService = __decorate([
        __param(0, codeEditorService_1.ICodeEditorService),
        __param(1, commands_1.ICommandService)
    ], OpenerService);
    exports.OpenerService = OpenerService;
});
//# __sourceMappingURL=openerService.js.map