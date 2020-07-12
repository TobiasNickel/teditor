/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/workbench/services/extensions/common/extensionHostMain", "vs/workbench/services/extensions/worker/extHost.services"], function (require, exports, buffer_1, event_1, extensionHostProtocol_1, extensionHostMain_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const nativeClose = self.close.bind(self);
    self.close = () => console.trace(`'close' has been blocked`);
    const nativePostMessage = postMessage.bind(self);
    self.postMessage = () => console.trace(`'postMessage' has been blocked`);
    const nativeAddEventLister = addEventListener.bind(self);
    self.addEventLister = () => console.trace(`'addEventListener' has been blocked`);
    //#endregion ---
    const hostUtil = new class {
        exit(_code) {
            nativeClose();
        }
        async exists(_path) {
            return true;
        }
        async realpath(path) {
            return path;
        }
    };
    class ExtensionWorker {
        constructor() {
            let emitter = new event_1.Emitter();
            let terminating = false;
            nativeAddEventLister('message', event => {
                const { data } = event;
                if (!(data instanceof ArrayBuffer)) {
                    console.warn('UNKNOWN data received', data);
                    return;
                }
                const msg = buffer_1.VSBuffer.wrap(new Uint8Array(data, 0, data.byteLength));
                if (extensionHostProtocol_1.isMessageOfType(msg, 2 /* Terminate */)) {
                    // handle terminate-message right here
                    terminating = true;
                    onTerminate();
                    return;
                }
                // emit non-terminate messages to the outside
                emitter.fire(msg);
            });
            this.protocol = {
                onMessage: emitter.event,
                send: vsbuf => {
                    if (!terminating) {
                        const data = vsbuf.buffer.buffer.slice(vsbuf.buffer.byteOffset, vsbuf.buffer.byteOffset + vsbuf.buffer.byteLength);
                        nativePostMessage(data, [data]);
                    }
                }
            };
        }
    }
    function connectToRenderer(protocol) {
        return new Promise(resolve => {
            const once = protocol.onMessage(raw => {
                once.dispose();
                const initData = JSON.parse(raw.toString());
                protocol.send(extensionHostProtocol_1.createMessageOfType(0 /* Initialized */));
                resolve({ protocol, initData });
            });
            protocol.send(extensionHostProtocol_1.createMessageOfType(1 /* Ready */));
        });
    }
    let onTerminate = nativeClose;
    (function create() {
        const res = new ExtensionWorker();
        connectToRenderer(res.protocol).then(data => {
            const extHostMain = new extensionHostMain_1.ExtensionHostMain(data.protocol, data.initData, hostUtil, null);
            onTerminate = () => extHostMain.terminate();
        });
    })();
});
//# __sourceMappingURL=extensionHostWorker.js.map