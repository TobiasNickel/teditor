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
define(["require", "exports", "./extHost.protocol", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/buffer", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService"], function (require, exports, extHost_protocol_1, event_1, lifecycle_1, buffer_1, instantiation_1, extHostRpcService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostOutputService = exports.ExtHostOutputService = exports.LazyOutputChannel = exports.ExtHostPushOutputChannel = exports.AbstractExtHostOutputChannel = void 0;
    class AbstractExtHostOutputChannel extends lifecycle_1.Disposable {
        constructor(name, log, file, proxy) {
            super();
            this._onDidAppend = this._register(new event_1.Emitter());
            this.onDidAppend = this._onDidAppend.event;
            this._name = name;
            this._proxy = proxy;
            this._id = proxy.$register(this.name, log, file);
            this._disposed = false;
            this._offset = 0;
        }
        get name() {
            return this._name;
        }
        append(value) {
            this.validate();
            this._offset += value ? buffer_1.VSBuffer.fromString(value).byteLength : 0;
        }
        update() {
            this._id.then(id => this._proxy.$update(id));
        }
        appendLine(value) {
            this.validate();
            this.append(value + '\n');
        }
        clear() {
            this.validate();
            const till = this._offset;
            this._id.then(id => this._proxy.$clear(id, till));
        }
        show(columnOrPreserveFocus, preserveFocus) {
            this.validate();
            this._id.then(id => this._proxy.$reveal(id, !!(typeof columnOrPreserveFocus === 'boolean' ? columnOrPreserveFocus : preserveFocus)));
        }
        hide() {
            this.validate();
            this._id.then(id => this._proxy.$close(id));
        }
        validate() {
            if (this._disposed) {
                throw new Error('Channel has been closed');
            }
        }
        dispose() {
            super.dispose();
            if (!this._disposed) {
                this._id
                    .then(id => this._proxy.$dispose(id))
                    .then(() => this._disposed = true);
            }
        }
    }
    exports.AbstractExtHostOutputChannel = AbstractExtHostOutputChannel;
    class ExtHostPushOutputChannel extends AbstractExtHostOutputChannel {
        constructor(name, proxy) {
            super(name, false, undefined, proxy);
        }
        append(value) {
            super.append(value);
            this._id.then(id => this._proxy.$append(id, value));
            this._onDidAppend.fire();
        }
    }
    exports.ExtHostPushOutputChannel = ExtHostPushOutputChannel;
    class ExtHostLogFileOutputChannel extends AbstractExtHostOutputChannel {
        constructor(name, file, proxy) {
            super(name, true, file, proxy);
        }
        append(value) {
            throw new Error('Not supported');
        }
    }
    class LazyOutputChannel {
        constructor(name, _channel) {
            this.name = name;
            this._channel = _channel;
        }
        append(value) {
            this._channel.then(channel => channel.append(value));
        }
        appendLine(value) {
            this._channel.then(channel => channel.appendLine(value));
        }
        clear() {
            this._channel.then(channel => channel.clear());
        }
        show(columnOrPreserveFocus, preserveFocus) {
            this._channel.then(channel => channel.show(columnOrPreserveFocus, preserveFocus));
        }
        hide() {
            this._channel.then(channel => channel.hide());
        }
        dispose() {
            this._channel.then(channel => channel.dispose());
        }
    }
    exports.LazyOutputChannel = LazyOutputChannel;
    let ExtHostOutputService = class ExtHostOutputService {
        constructor(extHostRpc) {
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadOutputService);
        }
        $setVisibleChannel(channelId) {
        }
        createOutputChannel(name) {
            name = name.trim();
            if (!name) {
                throw new Error('illegal argument `name`. must not be falsy');
            }
            return new ExtHostPushOutputChannel(name, this._proxy);
        }
        createOutputChannelFromLogFile(name, file) {
            name = name.trim();
            if (!name) {
                throw new Error('illegal argument `name`. must not be falsy');
            }
            if (!file) {
                throw new Error('illegal argument `file`. must not be falsy');
            }
            return new ExtHostLogFileOutputChannel(name, file, this._proxy);
        }
    };
    ExtHostOutputService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService)
    ], ExtHostOutputService);
    exports.ExtHostOutputService = ExtHostOutputService;
    exports.IExtHostOutputService = instantiation_1.createDecorator('IExtHostOutputService');
});
//# __sourceMappingURL=extHostOutput.js.map