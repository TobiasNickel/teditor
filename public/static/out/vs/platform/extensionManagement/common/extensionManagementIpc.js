/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/uriIpc", "vs/base/common/objects"], function (require, exports, event_1, uri_1, uriIpc_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionTipsChannel = exports.ExtensionManagementChannelClient = exports.ExtensionManagementChannel = void 0;
    function transformIncomingURI(uri, transformer) {
        return uri_1.URI.revive(transformer ? transformer.transformIncoming(uri) : uri);
    }
    function transformOutgoingURI(uri, transformer) {
        return transformer ? transformer.transformOutgoingURI(uri) : uri;
    }
    function transformIncomingExtension(extension, transformer) {
        transformer = transformer ? transformer : uriIpc_1.DefaultURITransformer;
        const manifest = extension.manifest;
        const transformed = uriIpc_1.transformAndReviveIncomingURIs(Object.assign(Object.assign({}, extension), { manifest: undefined }), transformer);
        return Object.assign(Object.assign({}, transformed), { manifest });
    }
    function transformOutgoingExtension(extension, transformer) {
        return transformer ? objects_1.cloneAndChange(extension, value => value instanceof uri_1.URI ? transformer.transformOutgoingURI(value) : undefined) : extension;
    }
    class ExtensionManagementChannel {
        constructor(service, getUriTransformer) {
            this.service = service;
            this.getUriTransformer = getUriTransformer;
            this.onInstallExtension = event_1.Event.buffer(service.onInstallExtension, true);
            this.onDidInstallExtension = event_1.Event.buffer(service.onDidInstallExtension, true);
            this.onUninstallExtension = event_1.Event.buffer(service.onUninstallExtension, true);
            this.onDidUninstallExtension = event_1.Event.buffer(service.onDidUninstallExtension, true);
        }
        listen(context, event) {
            const uriTransformer = this.getUriTransformer(context);
            switch (event) {
                case 'onInstallExtension': return this.onInstallExtension;
                case 'onDidInstallExtension': return event_1.Event.map(this.onDidInstallExtension, i => (Object.assign(Object.assign({}, i), { local: i.local ? transformOutgoingExtension(i.local, uriTransformer) : i.local })));
                case 'onUninstallExtension': return this.onUninstallExtension;
                case 'onDidUninstallExtension': return this.onDidUninstallExtension;
            }
            throw new Error('Invalid listen');
        }
        call(context, command, args) {
            const uriTransformer = this.getUriTransformer(context);
            switch (command) {
                case 'zip': return this.service.zip(transformIncomingExtension(args[0], uriTransformer)).then(uri => transformOutgoingURI(uri, uriTransformer));
                case 'unzip': return this.service.unzip(transformIncomingURI(args[0], uriTransformer));
                case 'install': return this.service.install(transformIncomingURI(args[0], uriTransformer));
                case 'getManifest': return this.service.getManifest(transformIncomingURI(args[0], uriTransformer));
                case 'installFromGallery': return this.service.installFromGallery(args[0]);
                case 'uninstall': return this.service.uninstall(transformIncomingExtension(args[0], uriTransformer), args[1]);
                case 'reinstallFromGallery': return this.service.reinstallFromGallery(transformIncomingExtension(args[0], uriTransformer));
                case 'getInstalled': return this.service.getInstalled(args[0]).then(extensions => extensions.map(e => transformOutgoingExtension(e, uriTransformer)));
                case 'updateMetadata': return this.service.updateMetadata(transformIncomingExtension(args[0], uriTransformer), args[1]).then(e => transformOutgoingExtension(e, uriTransformer));
                case 'getExtensionsReport': return this.service.getExtensionsReport();
            }
            throw new Error('Invalid call');
        }
    }
    exports.ExtensionManagementChannel = ExtensionManagementChannel;
    class ExtensionManagementChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        get onInstallExtension() { return this.channel.listen('onInstallExtension'); }
        get onDidInstallExtension() { return event_1.Event.map(this.channel.listen('onDidInstallExtension'), i => (Object.assign(Object.assign({}, i), { local: i.local ? transformIncomingExtension(i.local, null) : i.local }))); }
        get onUninstallExtension() { return this.channel.listen('onUninstallExtension'); }
        get onDidUninstallExtension() { return this.channel.listen('onDidUninstallExtension'); }
        zip(extension) {
            return Promise.resolve(this.channel.call('zip', [extension]).then(result => uri_1.URI.revive(result)));
        }
        unzip(zipLocation) {
            return Promise.resolve(this.channel.call('unzip', [zipLocation]));
        }
        install(vsix) {
            return Promise.resolve(this.channel.call('install', [vsix])).then(local => transformIncomingExtension(local, null));
        }
        getManifest(vsix) {
            return Promise.resolve(this.channel.call('getManifest', [vsix]));
        }
        installFromGallery(extension) {
            return Promise.resolve(this.channel.call('installFromGallery', [extension])).then(local => transformIncomingExtension(local, null));
        }
        uninstall(extension, force = false) {
            return Promise.resolve(this.channel.call('uninstall', [extension, force]));
        }
        reinstallFromGallery(extension) {
            return Promise.resolve(this.channel.call('reinstallFromGallery', [extension]));
        }
        getInstalled(type = null) {
            return Promise.resolve(this.channel.call('getInstalled', [type]))
                .then(extensions => extensions.map(extension => transformIncomingExtension(extension, null)));
        }
        updateMetadata(local, metadata) {
            return Promise.resolve(this.channel.call('updateMetadata', [local, metadata]))
                .then(extension => transformIncomingExtension(extension, null));
        }
        getExtensionsReport() {
            return Promise.resolve(this.channel.call('getExtensionsReport'));
        }
    }
    exports.ExtensionManagementChannelClient = ExtensionManagementChannelClient;
    class ExtensionTipsChannel {
        constructor(service) {
            this.service = service;
        }
        listen(context, event) {
            throw new Error('Invalid listen');
        }
        call(context, command, args) {
            switch (command) {
                case 'getConfigBasedTips': return this.service.getConfigBasedTips(uri_1.URI.revive(args[0]));
                case 'getImportantExecutableBasedTips': return this.service.getImportantExecutableBasedTips();
                case 'getOtherExecutableBasedTips': return this.service.getOtherExecutableBasedTips();
                case 'getAllWorkspacesTips': return this.service.getAllWorkspacesTips();
            }
            throw new Error('Invalid call');
        }
    }
    exports.ExtensionTipsChannel = ExtensionTipsChannel;
});
//# __sourceMappingURL=extensionManagementIpc.js.map