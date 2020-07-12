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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/contrib/output/common/output", "vs/workbench/services/output/common/output", "../common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/common/views"], function (require, exports, platform_1, output_1, output_2, extHost_protocol_1, extHostCustomers_1, uri_1, lifecycle_1, event_1, views_1) {
    "use strict";
    var MainThreadOutputService_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadOutputService = void 0;
    let MainThreadOutputService = MainThreadOutputService_1 = class MainThreadOutputService extends lifecycle_1.Disposable {
        constructor(extHostContext, outputService, viewsService) {
            super();
            this._outputService = outputService;
            this._viewsService = viewsService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostOutputService);
            const setVisibleChannel = () => {
                const visibleChannel = this._viewsService.isViewVisible(output_1.OUTPUT_VIEW_ID) ? this._outputService.getActiveChannel() : undefined;
                this._proxy.$setVisibleChannel(visibleChannel ? visibleChannel.id : null);
            };
            this._register(event_1.Event.any(this._outputService.onActiveOutputChannel, event_1.Event.filter(this._viewsService.onDidChangeViewVisibility, ({ id }) => id === output_1.OUTPUT_VIEW_ID))(() => setVisibleChannel()));
            setVisibleChannel();
        }
        $register(label, log, file) {
            const id = 'extension-output-#' + (MainThreadOutputService_1._idPool++);
            platform_1.Registry.as(output_2.Extensions.OutputChannels).registerChannel({ id, label, file: file ? uri_1.URI.revive(file) : undefined, log });
            this._register(lifecycle_1.toDisposable(() => this.$dispose(id)));
            return Promise.resolve(id);
        }
        $append(channelId, value) {
            const channel = this._getChannel(channelId);
            if (channel) {
                channel.append(value);
            }
            return undefined;
        }
        $update(channelId) {
            const channel = this._getChannel(channelId);
            if (channel) {
                channel.update();
            }
            return undefined;
        }
        $clear(channelId, till) {
            const channel = this._getChannel(channelId);
            if (channel) {
                channel.clear(till);
            }
            return undefined;
        }
        $reveal(channelId, preserveFocus) {
            const channel = this._getChannel(channelId);
            if (channel) {
                this._outputService.showChannel(channel.id, preserveFocus);
            }
            return undefined;
        }
        $close(channelId) {
            if (this._viewsService.isViewVisible(output_1.OUTPUT_VIEW_ID)) {
                const activeChannel = this._outputService.getActiveChannel();
                if (activeChannel && channelId === activeChannel.id) {
                    this._viewsService.closeView(output_1.OUTPUT_VIEW_ID);
                }
            }
            return undefined;
        }
        $dispose(channelId) {
            const channel = this._getChannel(channelId);
            if (channel) {
                channel.dispose();
            }
            return undefined;
        }
        _getChannel(channelId) {
            return this._outputService.getChannel(channelId);
        }
    };
    MainThreadOutputService._idPool = 1;
    MainThreadOutputService = MainThreadOutputService_1 = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadOutputService),
        __param(1, output_1.IOutputService),
        __param(2, views_1.IViewsService)
    ], MainThreadOutputService);
    exports.MainThreadOutputService = MainThreadOutputService;
});
//# __sourceMappingURL=mainThreadOutputService.js.map