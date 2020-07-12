/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostDebugChannelClient = exports.ExtensionHostDebugBroadcastChannel = void 0;
    class ExtensionHostDebugBroadcastChannel {
        constructor() {
            this._onCloseEmitter = new event_1.Emitter();
            this._onReloadEmitter = new event_1.Emitter();
            this._onTerminateEmitter = new event_1.Emitter();
            this._onLogToEmitter = new event_1.Emitter();
            this._onAttachEmitter = new event_1.Emitter();
        }
        call(ctx, command, arg) {
            switch (command) {
                case 'close':
                    return Promise.resolve(this._onCloseEmitter.fire({ sessionId: arg[0] }));
                case 'reload':
                    return Promise.resolve(this._onReloadEmitter.fire({ sessionId: arg[0] }));
                case 'terminate':
                    return Promise.resolve(this._onTerminateEmitter.fire({ sessionId: arg[0] }));
                case 'log':
                    return Promise.resolve(this._onLogToEmitter.fire({ sessionId: arg[0], log: arg[1] }));
                case 'attach':
                    return Promise.resolve(this._onAttachEmitter.fire({ sessionId: arg[0], port: arg[1], subId: arg[2] }));
            }
            throw new Error('Method not implemented.');
        }
        listen(ctx, event, arg) {
            switch (event) {
                case 'close':
                    return this._onCloseEmitter.event;
                case 'reload':
                    return this._onReloadEmitter.event;
                case 'terminate':
                    return this._onTerminateEmitter.event;
                case 'log':
                    return this._onLogToEmitter.event;
                case 'attach':
                    return this._onAttachEmitter.event;
            }
            throw new Error('Method not implemented.');
        }
    }
    exports.ExtensionHostDebugBroadcastChannel = ExtensionHostDebugBroadcastChannel;
    ExtensionHostDebugBroadcastChannel.ChannelName = 'extensionhostdebugservice';
    class ExtensionHostDebugChannelClient extends lifecycle_1.Disposable {
        constructor(channel) {
            super();
            this.channel = channel;
        }
        reload(sessionId) {
            this.channel.call('reload', [sessionId]);
        }
        get onReload() {
            return this.channel.listen('reload');
        }
        close(sessionId) {
            this.channel.call('close', [sessionId]);
        }
        get onClose() {
            return this.channel.listen('close');
        }
        attachSession(sessionId, port, subId) {
            this.channel.call('attach', [sessionId, port, subId]);
        }
        get onAttachSession() {
            return this.channel.listen('attach');
        }
        logToSession(sessionId, log) {
            this.channel.call('log', [sessionId, log]);
        }
        get onLogToSession() {
            return this.channel.listen('log');
        }
        terminateSession(sessionId, subId) {
            this.channel.call('terminate', [sessionId, subId]);
        }
        get onTerminateSession() {
            return this.channel.listen('terminate');
        }
        openExtensionDevelopmentHostWindow(args, env) {
            return this.channel.call('openExtensionDevelopmentHostWindow', [args, env]);
        }
    }
    exports.ExtensionHostDebugChannelClient = ExtensionHostDebugChannelClient;
});
//# __sourceMappingURL=extensionHostDebugIpc.js.map