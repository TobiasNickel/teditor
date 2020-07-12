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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/parts/ipc/common/ipc", "vs/platform/environment/common/environment", "vs/platform/remote/common/remoteAgentConnection", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/services/remote/common/remoteAgentEnvironmentChannel", "vs/platform/notification/common/notification", "vs/base/common/event"], function (require, exports, nls, lifecycle_1, ipc_1, environment_1, remoteAgentConnection_1, remoteAgentService_1, remoteAuthorityResolver_1, contributions_1, platform_1, remoteAgentEnvironmentChannel_1, notification_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAgentConnection = exports.AbstractRemoteAgentService = void 0;
    let AbstractRemoteAgentService = class AbstractRemoteAgentService extends lifecycle_1.Disposable {
        constructor(_environmentService, _remoteAuthorityResolverService) {
            super();
            this._environmentService = _environmentService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._environment = null;
        }
        getEnvironment(bail) {
            if (!this._environment) {
                this._environment = this._withChannel(async (channel, connection) => {
                    const env = await remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.getEnvironmentData(channel, connection.remoteAuthority, this._environmentService.extensionDevelopmentLocationURI);
                    this._remoteAuthorityResolverService._setAuthorityConnectionToken(connection.remoteAuthority, env.connectionToken);
                    return env;
                }, null);
            }
            return bail ? this._environment : this._environment.then(undefined, () => null);
        }
        getDiagnosticInfo(options) {
            return this._withChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.getDiagnosticInfo(channel, options), undefined);
        }
        disableTelemetry() {
            return this._withChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.disableTelemetry(channel), undefined);
        }
        logTelemetry(eventName, data) {
            return this._withChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.logTelemetry(channel, eventName, data), undefined);
        }
        flushTelemetry() {
            return this._withChannel(channel => remoteAgentEnvironmentChannel_1.RemoteExtensionEnvironmentChannelClient.flushTelemetry(channel), undefined);
        }
        _withChannel(callback, fallback) {
            const connection = this.getConnection();
            if (!connection) {
                return Promise.resolve(fallback);
            }
            return connection.withChannel('remoteextensionsenvironment', (channel) => callback(channel, connection));
        }
    };
    AbstractRemoteAgentService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, remoteAuthorityResolver_1.IRemoteAuthorityResolverService)
    ], AbstractRemoteAgentService);
    exports.AbstractRemoteAgentService = AbstractRemoteAgentService;
    class RemoteAgentConnection extends lifecycle_1.Disposable {
        constructor(remoteAuthority, _commit, _socketFactory, _remoteAuthorityResolverService, _signService, _logService) {
            super();
            this._commit = _commit;
            this._socketFactory = _socketFactory;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._signService = _signService;
            this._logService = _logService;
            this._onReconnecting = this._register(new event_1.Emitter());
            this.onReconnecting = this._onReconnecting.event;
            this._onDidStateChange = this._register(new event_1.Emitter());
            this.onDidStateChange = this._onDidStateChange.event;
            this.remoteAuthority = remoteAuthority;
            this._connection = null;
        }
        getChannel(channelName) {
            return ipc_1.getDelayedChannel(this._getOrCreateConnection().then(c => c.getChannel(channelName)));
        }
        withChannel(channelName, callback) {
            const channel = this.getChannel(channelName);
            const result = callback(channel);
            return result;
        }
        registerChannel(channelName, channel) {
            this._getOrCreateConnection().then(client => client.registerChannel(channelName, channel));
        }
        _getOrCreateConnection() {
            if (!this._connection) {
                this._connection = this._createConnection();
            }
            return this._connection;
        }
        async _createConnection() {
            let firstCall = true;
            const options = {
                commit: this._commit,
                socketFactory: this._socketFactory,
                addressProvider: {
                    getAddress: async () => {
                        if (firstCall) {
                            firstCall = false;
                        }
                        else {
                            this._onReconnecting.fire(undefined);
                        }
                        const { authority } = await this._remoteAuthorityResolverService.resolveAuthority(this.remoteAuthority);
                        return { host: authority.host, port: authority.port };
                    }
                },
                signService: this._signService,
                logService: this._logService
            };
            const connection = this._register(await remoteAgentConnection_1.connectRemoteAgentManagement(options, this.remoteAuthority, `renderer`));
            this._register(connection.onDidStateChange(e => this._onDidStateChange.fire(e)));
            return connection.client;
        }
    }
    exports.RemoteAgentConnection = RemoteAgentConnection;
    let RemoteConnectionFailureNotificationContribution = class RemoteConnectionFailureNotificationContribution {
        constructor(remoteAgentService, notificationService) {
            // Let's cover the case where connecting to fetch the remote extension info fails
            remoteAgentService.getEnvironment(true)
                .then(undefined, err => {
                if (!remoteAuthorityResolver_1.RemoteAuthorityResolverError.isHandled(err)) {
                    notificationService.error(nls.localize('connectionError', "Failed to connect to the remote extension host server (Error: {0})", err ? err.message : ''));
                }
            });
        }
    };
    RemoteConnectionFailureNotificationContribution = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, notification_1.INotificationService)
    ], RemoteConnectionFailureNotificationContribution);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(RemoteConnectionFailureNotificationContribution, 2 /* Ready */);
});
//# __sourceMappingURL=abstractRemoteAgentService.js.map