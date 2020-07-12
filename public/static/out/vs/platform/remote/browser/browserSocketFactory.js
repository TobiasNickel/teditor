/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/browser/dom", "vs/base/common/async", "vs/platform/remote/common/remoteAuthorityResolver"], function (require, exports, buffer_1, lifecycle_1, event_1, dom, async_1, remoteAuthorityResolver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserSocketFactory = exports.defaultWebSocketFactory = void 0;
    class BrowserWebSocket extends lifecycle_1.Disposable {
        constructor(socket) {
            super();
            this._onData = new event_1.Emitter();
            this.onData = this._onData.event;
            this._onClose = this._register(new event_1.Emitter());
            this.onClose = this._onClose.event;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this._socket = socket;
            this._fileReader = new FileReader();
            this._queue = [];
            this._isReading = false;
            this._isClosed = false;
            this._fileReader.onload = (event) => {
                this._isReading = false;
                const buff = event.target.result;
                this._onData.fire(buff);
                if (this._queue.length > 0) {
                    enqueue(this._queue.shift());
                }
            };
            const enqueue = (blob) => {
                if (this._isReading) {
                    this._queue.push(blob);
                    return;
                }
                this._isReading = true;
                this._fileReader.readAsArrayBuffer(blob);
            };
            this._socketMessageListener = (ev) => {
                enqueue(ev.data);
            };
            this._socket.addEventListener('message', this._socketMessageListener);
            this.onOpen = event_1.Event.fromDOMEventEmitter(this._socket, 'open');
            // WebSockets emit error events that do not contain any real information
            // Our only chance of getting to the root cause of an error is to
            // listen to the close event which gives out some real information:
            // - https://www.w3.org/TR/websockets/#closeevent
            // - https://tools.ietf.org/html/rfc6455#section-11.7
            //
            // But the error event is emitted before the close event, so we therefore
            // delay the error event processing in the hope of receiving a close event
            // with more information
            let pendingErrorEvent = null;
            const sendPendingErrorNow = () => {
                const err = pendingErrorEvent;
                pendingErrorEvent = null;
                this._onError.fire(err);
            };
            const errorRunner = this._register(new async_1.RunOnceScheduler(sendPendingErrorNow, 0));
            const sendErrorSoon = (err) => {
                errorRunner.cancel();
                pendingErrorEvent = err;
                errorRunner.schedule();
            };
            const sendErrorNow = (err) => {
                errorRunner.cancel();
                pendingErrorEvent = err;
                sendPendingErrorNow();
            };
            this._register(dom.addDisposableListener(this._socket, 'close', (e) => {
                this._isClosed = true;
                if (pendingErrorEvent) {
                    if (!window.navigator.onLine) {
                        // The browser is offline => this is a temporary error which might resolve itself
                        sendErrorNow(new remoteAuthorityResolver_1.RemoteAuthorityResolverError('Browser is offline', remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.TemporarilyNotAvailable, e));
                    }
                    else {
                        // An error event is pending
                        // The browser appears to be online...
                        if (!e.wasClean) {
                            // Let's be optimistic and hope that perhaps the server could not be reached or something
                            sendErrorNow(new remoteAuthorityResolver_1.RemoteAuthorityResolverError(e.reason || `WebSocket close with status code ${e.code}`, remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.TemporarilyNotAvailable, e));
                        }
                        else {
                            // this was a clean close => send existing error
                            errorRunner.cancel();
                            sendPendingErrorNow();
                        }
                    }
                }
                this._onClose.fire();
            }));
            this._register(dom.addDisposableListener(this._socket, 'error', sendErrorSoon));
        }
        send(data) {
            if (this._isClosed) {
                // Refuse to write data to closed WebSocket...
                return;
            }
            this._socket.send(data);
        }
        close() {
            this._isClosed = true;
            this._socket.close();
            this._socket.removeEventListener('message', this._socketMessageListener);
            this.dispose();
        }
    }
    exports.defaultWebSocketFactory = new class {
        create(url) {
            return new BrowserWebSocket(new WebSocket(url));
        }
    };
    class BrowserSocket {
        constructor(socket) {
            this.socket = socket;
        }
        dispose() {
            this.socket.close();
        }
        onData(listener) {
            return this.socket.onData((data) => listener(buffer_1.VSBuffer.wrap(new Uint8Array(data))));
        }
        onClose(listener) {
            return this.socket.onClose(listener);
        }
        onEnd(listener) {
            return lifecycle_1.Disposable.None;
        }
        write(buffer) {
            this.socket.send(buffer.buffer);
        }
        end() {
            this.socket.close();
        }
    }
    class BrowserSocketFactory {
        constructor(webSocketFactory) {
            this._webSocketFactory = webSocketFactory || exports.defaultWebSocketFactory;
        }
        connect(host, port, query, callback) {
            const socket = this._webSocketFactory.create(`ws://${host}:${port}/?${query}&skipWebSocketFrames=false`);
            const errorListener = socket.onError((err) => callback(err, undefined));
            socket.onOpen(() => {
                errorListener.dispose();
                callback(undefined, new BrowserSocket(socket));
            });
        }
    }
    exports.BrowserSocketFactory = BrowserSocketFactory;
});
//# __sourceMappingURL=browserSocketFactory.js.map