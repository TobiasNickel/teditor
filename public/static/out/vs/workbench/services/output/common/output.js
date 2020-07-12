/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/platform/registry/common/platform"], function (require, exports, event_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extensions = void 0;
    exports.Extensions = {
        OutputChannels: 'workbench.contributions.outputChannels'
    };
    class OutputChannelRegistry {
        constructor() {
            this.channels = new Map();
            this._onDidRegisterChannel = new event_1.Emitter();
            this.onDidRegisterChannel = this._onDidRegisterChannel.event;
            this._onDidRemoveChannel = new event_1.Emitter();
            this.onDidRemoveChannel = this._onDidRemoveChannel.event;
        }
        registerChannel(descriptor) {
            if (!this.channels.has(descriptor.id)) {
                this.channels.set(descriptor.id, descriptor);
                this._onDidRegisterChannel.fire(descriptor.id);
            }
        }
        getChannels() {
            const result = [];
            this.channels.forEach(value => result.push(value));
            return result;
        }
        getChannel(id) {
            return this.channels.get(id);
        }
        removeChannel(id) {
            this.channels.delete(id);
            this._onDidRemoveChannel.fire(id);
        }
    }
    platform_1.Registry.add(exports.Extensions.OutputChannels, new OutputChannelRegistry());
});
//# __sourceMappingURL=output.js.map