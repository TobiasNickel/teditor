/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uri"], function (require, exports, platform, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteExtensionEnvironmentChannelClient = void 0;
    class RemoteExtensionEnvironmentChannelClient {
        static async getEnvironmentData(channel, remoteAuthority, extensionDevelopmentPath) {
            const args = {
                language: platform.language,
                remoteAuthority,
                extensionDevelopmentPath
            };
            const data = await channel.call('getEnvironmentData', args);
            return {
                pid: data.pid,
                connectionToken: data.connectionToken,
                appRoot: uri_1.URI.revive(data.appRoot),
                appSettingsHome: uri_1.URI.revive(data.appSettingsHome),
                settingsPath: uri_1.URI.revive(data.settingsPath),
                logsPath: uri_1.URI.revive(data.logsPath),
                extensionsPath: uri_1.URI.revive(data.extensionsPath),
                extensionHostLogsPath: uri_1.URI.revive(data.extensionHostLogsPath),
                globalStorageHome: uri_1.URI.revive(data.globalStorageHome),
                userHome: uri_1.URI.revive(data.userHome),
                extensions: data.extensions.map(ext => { ext.extensionLocation = uri_1.URI.revive(ext.extensionLocation); return ext; }),
                os: data.os
            };
        }
        static getDiagnosticInfo(channel, options) {
            return channel.call('getDiagnosticInfo', options);
        }
        static disableTelemetry(channel) {
            return channel.call('disableTelemetry');
        }
        static logTelemetry(channel, eventName, data) {
            return channel.call('logTelemetry', { eventName, data });
        }
        static flushTelemetry(channel) {
            return channel.call('flushTelemetry');
        }
    }
    exports.RemoteExtensionEnvironmentChannelClient = RemoteExtensionEnvironmentChannelClient;
});
//# __sourceMappingURL=remoteAgentEnvironmentChannel.js.map