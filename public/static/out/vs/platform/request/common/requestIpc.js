/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/buffer"], function (require, exports, cancellation_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestChannelClient = exports.RequestChannel = void 0;
    class RequestChannel {
        constructor(service) {
            this.service = service;
        }
        listen(context, event) {
            throw new Error('Invalid listen');
        }
        call(context, command, args) {
            switch (command) {
                case 'request': return this.service.request(args[0], cancellation_1.CancellationToken.None)
                    .then(async ({ res, stream }) => {
                    const buffer = await buffer_1.streamToBuffer(stream);
                    return [{ statusCode: res.statusCode, headers: res.headers }, buffer];
                });
            }
            throw new Error('Invalid call');
        }
    }
    exports.RequestChannel = RequestChannel;
    class RequestChannelClient {
        constructor(channel) {
            this.channel = channel;
        }
        async request(options, token) {
            return RequestChannelClient.request(this.channel, options, token);
        }
        static async request(channel, options, token) {
            const [res, buffer] = await channel.call('request', [options]);
            return { res, stream: buffer_1.bufferToStream(buffer) };
        }
    }
    exports.RequestChannelClient = RequestChannelClient;
});
//# __sourceMappingURL=requestIpc.js.map