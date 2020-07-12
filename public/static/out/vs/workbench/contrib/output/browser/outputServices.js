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
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/registry/common/platform", "vs/workbench/contrib/output/common/output", "vs/workbench/services/output/common/output", "vs/workbench/contrib/output/common/outputLinkProvider", "vs/editor/common/services/resolverService", "vs/platform/log/common/log", "vs/platform/lifecycle/common/lifecycle", "vs/workbench/services/output/common/outputChannelModel", "vs/workbench/common/views"], function (require, exports, event_1, uri_1, lifecycle_1, instantiation_1, storage_1, platform_1, output_1, output_2, outputLinkProvider_1, resolverService_1, log_1, lifecycle_2, outputChannelModel_1, views_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LogContentProvider = exports.OutputService = void 0;
    const OUTPUT_ACTIVE_CHANNEL_KEY = 'output.activechannel';
    let OutputChannel = class OutputChannel extends lifecycle_1.Disposable {
        constructor(outputChannelDescriptor, outputChannelModelService) {
            super();
            this.outputChannelDescriptor = outputChannelDescriptor;
            this.scrollLock = false;
            this.id = outputChannelDescriptor.id;
            this.label = outputChannelDescriptor.label;
            this.uri = uri_1.URI.from({ scheme: output_1.OUTPUT_SCHEME, path: this.id });
            this.model = this._register(outputChannelModelService.createOutputChannelModel(this.id, this.uri, outputChannelDescriptor.log ? output_1.LOG_MIME : output_1.OUTPUT_MIME, outputChannelDescriptor.file));
        }
        append(output) {
            this.model.append(output);
        }
        update() {
            this.model.update();
        }
        clear(till) {
            this.model.clear(till);
        }
    };
    OutputChannel = __decorate([
        __param(1, outputChannelModel_1.IOutputChannelModelService)
    ], OutputChannel);
    let OutputService = class OutputService extends lifecycle_1.Disposable {
        constructor(storageService, instantiationService, textModelResolverService, logService, lifecycleService, viewsService) {
            super();
            this.storageService = storageService;
            this.instantiationService = instantiationService;
            this.logService = logService;
            this.lifecycleService = lifecycleService;
            this.viewsService = viewsService;
            this.channels = new Map();
            this._onActiveOutputChannel = this._register(new event_1.Emitter());
            this.onActiveOutputChannel = this._onActiveOutputChannel.event;
            this.activeChannelIdInStorage = this.storageService.get(OUTPUT_ACTIVE_CHANNEL_KEY, 1 /* WORKSPACE */, '');
            // Register as text model content provider for output
            textModelResolverService.registerTextModelContentProvider(output_1.OUTPUT_SCHEME, this);
            instantiationService.createInstance(outputLinkProvider_1.OutputLinkProvider);
            // Create output channels for already registered channels
            const registry = platform_1.Registry.as(output_2.Extensions.OutputChannels);
            for (const channelIdentifier of registry.getChannels()) {
                this.onDidRegisterChannel(channelIdentifier.id);
            }
            this._register(registry.onDidRegisterChannel(this.onDidRegisterChannel, this));
            // Set active channel to first channel if not set
            if (!this.activeChannel) {
                const channels = this.getChannelDescriptors();
                this.setActiveChannel(channels && channels.length > 0 ? this.getChannel(channels[0].id) : undefined);
            }
            this._register(this.lifecycleService.onShutdown(() => this.dispose()));
        }
        provideTextContent(resource) {
            const channel = this.getChannel(resource.path);
            if (channel) {
                return channel.model.loadModel();
            }
            return null;
        }
        async showChannel(id, preserveFocus) {
            var _a;
            const channel = this.getChannel(id);
            if (((_a = this.activeChannel) === null || _a === void 0 ? void 0 : _a.id) !== (channel === null || channel === void 0 ? void 0 : channel.id)) {
                this.setActiveChannel(channel);
                this._onActiveOutputChannel.fire(id);
            }
            const outputView = await this.viewsService.openView(output_1.OUTPUT_VIEW_ID, !preserveFocus);
            if (outputView && channel) {
                outputView.showChannel(channel, !!preserveFocus);
            }
        }
        getChannel(id) {
            return this.channels.get(id);
        }
        getChannelDescriptor(id) {
            return platform_1.Registry.as(output_2.Extensions.OutputChannels).getChannel(id);
        }
        getChannelDescriptors() {
            return platform_1.Registry.as(output_2.Extensions.OutputChannels).getChannels();
        }
        getActiveChannel() {
            return this.activeChannel;
        }
        async onDidRegisterChannel(channelId) {
            const channel = this.createChannel(channelId);
            this.channels.set(channelId, channel);
            if (!this.activeChannel || this.activeChannelIdInStorage === channelId) {
                this.setActiveChannel(channel);
                this._onActiveOutputChannel.fire(channelId);
                const outputView = this.viewsService.getActiveViewWithId(output_1.OUTPUT_VIEW_ID);
                if (outputView) {
                    outputView.showChannel(channel, true);
                }
            }
        }
        createChannel(id) {
            const channelDisposables = [];
            const channel = this.instantiateChannel(id);
            channel.model.onDispose(() => {
                if (this.activeChannel === channel) {
                    const channels = this.getChannelDescriptors();
                    const channel = channels.length ? this.getChannel(channels[0].id) : undefined;
                    this.setActiveChannel(channel);
                    if (this.activeChannel) {
                        this._onActiveOutputChannel.fire(this.activeChannel.id);
                    }
                }
                platform_1.Registry.as(output_2.Extensions.OutputChannels).removeChannel(id);
                lifecycle_1.dispose(channelDisposables);
            }, channelDisposables);
            return channel;
        }
        instantiateChannel(id) {
            const channelData = platform_1.Registry.as(output_2.Extensions.OutputChannels).getChannel(id);
            if (!channelData) {
                this.logService.error(`Channel '${id}' is not registered yet`);
                throw new Error(`Channel '${id}' is not registered yet`);
            }
            return this.instantiationService.createInstance(OutputChannel, channelData);
        }
        setActiveChannel(channel) {
            this.activeChannel = channel;
            if (this.activeChannel) {
                this.storageService.store(OUTPUT_ACTIVE_CHANNEL_KEY, this.activeChannel.id, 1 /* WORKSPACE */);
            }
            else {
                this.storageService.remove(OUTPUT_ACTIVE_CHANNEL_KEY, 1 /* WORKSPACE */);
            }
        }
    };
    OutputService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, resolverService_1.ITextModelService),
        __param(3, log_1.ILogService),
        __param(4, lifecycle_2.ILifecycleService),
        __param(5, views_1.IViewsService)
    ], OutputService);
    exports.OutputService = OutputService;
    let LogContentProvider = class LogContentProvider {
        constructor(outputService, outputChannelModelService) {
            this.outputService = outputService;
            this.outputChannelModelService = outputChannelModelService;
            this.channelModels = new Map();
        }
        provideTextContent(resource) {
            if (resource.scheme === output_1.LOG_SCHEME) {
                let channelModel = this.getChannelModel(resource);
                if (channelModel) {
                    return channelModel.loadModel();
                }
            }
            return null;
        }
        getChannelModel(resource) {
            const channelId = resource.path;
            let channelModel = this.channelModels.get(channelId);
            if (!channelModel) {
                const channelDisposables = [];
                const outputChannelDescriptor = this.outputService.getChannelDescriptors().filter(({ id }) => id === channelId)[0];
                if (outputChannelDescriptor && outputChannelDescriptor.file) {
                    channelModel = this.outputChannelModelService.createOutputChannelModel(channelId, resource, outputChannelDescriptor.log ? output_1.LOG_MIME : output_1.OUTPUT_MIME, outputChannelDescriptor.file);
                    channelModel.onDispose(() => lifecycle_1.dispose(channelDisposables), channelDisposables);
                    this.channelModels.set(channelId, channelModel);
                }
            }
            return channelModel;
        }
    };
    LogContentProvider = __decorate([
        __param(0, output_1.IOutputService),
        __param(1, outputChannelModel_1.IOutputChannelModelService)
    ], LogContentProvider);
    exports.LogContentProvider = LogContentProvider;
});
//# __sourceMappingURL=outputServices.js.map