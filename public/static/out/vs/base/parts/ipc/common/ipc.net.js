/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/parts/ipc/common/ipc", "vs/base/common/lifecycle", "vs/base/common/buffer", "vs/base/common/platform", "vs/base/common/process"], function (require, exports, event_1, ipc_1, lifecycle_1, buffer_1, platform, process) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PersistentProtocol = exports.BufferedEmitter = exports.Client = exports.Protocol = exports.ProtocolConstants = exports.ChunkStream = void 0;
    let emptyBuffer = null;
    function getEmptyBuffer() {
        if (!emptyBuffer) {
            emptyBuffer = buffer_1.VSBuffer.alloc(0);
        }
        return emptyBuffer;
    }
    class ChunkStream {
        constructor() {
            this._chunks = [];
            this._totalLength = 0;
        }
        get byteLength() {
            return this._totalLength;
        }
        acceptChunk(buff) {
            this._chunks.push(buff);
            this._totalLength += buff.byteLength;
        }
        read(byteCount) {
            return this._read(byteCount, true);
        }
        peek(byteCount) {
            return this._read(byteCount, false);
        }
        _read(byteCount, advance) {
            if (byteCount === 0) {
                return getEmptyBuffer();
            }
            if (byteCount > this._totalLength) {
                throw new Error(`Cannot read so many bytes!`);
            }
            if (this._chunks[0].byteLength === byteCount) {
                // super fast path, precisely first chunk must be returned
                const result = this._chunks[0];
                if (advance) {
                    this._chunks.shift();
                    this._totalLength -= byteCount;
                }
                return result;
            }
            if (this._chunks[0].byteLength > byteCount) {
                // fast path, the reading is entirely within the first chunk
                const result = this._chunks[0].slice(0, byteCount);
                if (advance) {
                    this._chunks[0] = this._chunks[0].slice(byteCount);
                    this._totalLength -= byteCount;
                }
                return result;
            }
            let result = buffer_1.VSBuffer.alloc(byteCount);
            let resultOffset = 0;
            let chunkIndex = 0;
            while (byteCount > 0) {
                const chunk = this._chunks[chunkIndex];
                if (chunk.byteLength > byteCount) {
                    // this chunk will survive
                    const chunkPart = chunk.slice(0, byteCount);
                    result.set(chunkPart, resultOffset);
                    resultOffset += byteCount;
                    if (advance) {
                        this._chunks[chunkIndex] = chunk.slice(byteCount);
                        this._totalLength -= byteCount;
                    }
                    byteCount -= byteCount;
                }
                else {
                    // this chunk will be entirely read
                    result.set(chunk, resultOffset);
                    resultOffset += chunk.byteLength;
                    if (advance) {
                        this._chunks.shift();
                        this._totalLength -= chunk.byteLength;
                    }
                    else {
                        chunkIndex++;
                    }
                    byteCount -= chunk.byteLength;
                }
            }
            return result;
        }
    }
    exports.ChunkStream = ChunkStream;
    var ProtocolMessageType;
    (function (ProtocolMessageType) {
        ProtocolMessageType[ProtocolMessageType["None"] = 0] = "None";
        ProtocolMessageType[ProtocolMessageType["Regular"] = 1] = "Regular";
        ProtocolMessageType[ProtocolMessageType["Control"] = 2] = "Control";
        ProtocolMessageType[ProtocolMessageType["Ack"] = 3] = "Ack";
        ProtocolMessageType[ProtocolMessageType["KeepAlive"] = 4] = "KeepAlive";
        ProtocolMessageType[ProtocolMessageType["Disconnect"] = 5] = "Disconnect";
    })(ProtocolMessageType || (ProtocolMessageType = {}));
    var ProtocolConstants;
    (function (ProtocolConstants) {
        ProtocolConstants[ProtocolConstants["HeaderLength"] = 13] = "HeaderLength";
        /**
         * Send an Acknowledge message at most 2 seconds later...
         */
        ProtocolConstants[ProtocolConstants["AcknowledgeTime"] = 2000] = "AcknowledgeTime";
        /**
         * If there is a message that has been unacknowledged for 10 seconds, consider the connection closed...
         */
        ProtocolConstants[ProtocolConstants["AcknowledgeTimeoutTime"] = 20000] = "AcknowledgeTimeoutTime";
        /**
         * Send at least a message every 5s for keep alive reasons.
         */
        ProtocolConstants[ProtocolConstants["KeepAliveTime"] = 5000] = "KeepAliveTime";
        /**
         * If there is no message received for 10 seconds, consider the connection closed...
         */
        ProtocolConstants[ProtocolConstants["KeepAliveTimeoutTime"] = 20000] = "KeepAliveTimeoutTime";
        /**
         * If there is no reconnection within this time-frame, consider the connection permanently closed...
         */
        ProtocolConstants[ProtocolConstants["ReconnectionGraceTime"] = 10800000] = "ReconnectionGraceTime";
        /**
         * Maximal grace time between the first and the last reconnection...
         */
        ProtocolConstants[ProtocolConstants["ReconnectionShortGraceTime"] = 300000] = "ReconnectionShortGraceTime";
    })(ProtocolConstants = exports.ProtocolConstants || (exports.ProtocolConstants = {}));
    class ProtocolMessage {
        constructor(type, id, ack, data) {
            this.type = type;
            this.id = id;
            this.ack = ack;
            this.data = data;
            this.writtenTime = 0;
        }
        get size() {
            return this.data.byteLength;
        }
    }
    class ProtocolReader extends lifecycle_1.Disposable {
        constructor(socket) {
            super();
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._state = {
                readHead: true,
                readLen: 13 /* HeaderLength */,
                messageType: 0 /* None */,
                id: 0,
                ack: 0
            };
            this._socket = socket;
            this._isDisposed = false;
            this._incomingData = new ChunkStream();
            this._register(this._socket.onData(data => this.acceptChunk(data)));
            this.lastReadTime = Date.now();
        }
        acceptChunk(data) {
            if (!data || data.byteLength === 0) {
                return;
            }
            this.lastReadTime = Date.now();
            this._incomingData.acceptChunk(data);
            while (this._incomingData.byteLength >= this._state.readLen) {
                const buff = this._incomingData.read(this._state.readLen);
                if (this._state.readHead) {
                    // buff is the header
                    // save new state => next time will read the body
                    this._state.readHead = false;
                    this._state.readLen = buff.readUInt32BE(9);
                    this._state.messageType = buff.readUInt8(0);
                    this._state.id = buff.readUInt32BE(1);
                    this._state.ack = buff.readUInt32BE(5);
                }
                else {
                    // buff is the body
                    const messageType = this._state.messageType;
                    const id = this._state.id;
                    const ack = this._state.ack;
                    // save new state => next time will read the header
                    this._state.readHead = true;
                    this._state.readLen = 13 /* HeaderLength */;
                    this._state.messageType = 0 /* None */;
                    this._state.id = 0;
                    this._state.ack = 0;
                    this._onMessage.fire(new ProtocolMessage(messageType, id, ack, buff));
                    if (this._isDisposed) {
                        // check if an event listener lead to our disposal
                        break;
                    }
                }
            }
        }
        readEntireBuffer() {
            return this._incomingData.read(this._incomingData.byteLength);
        }
        dispose() {
            this._isDisposed = true;
            super.dispose();
        }
    }
    class ProtocolWriter {
        constructor(socket) {
            this._isDisposed = false;
            this._socket = socket;
            this._data = [];
            this._totalLength = 0;
            this.lastWriteTime = 0;
        }
        dispose() {
            this.flush();
            this._isDisposed = true;
        }
        flush() {
            // flush
            this._writeNow();
        }
        write(msg) {
            if (this._isDisposed) {
                // ignore: there could be left-over promises which complete and then
                // decide to write a response, etc...
                return;
            }
            msg.writtenTime = Date.now();
            this.lastWriteTime = Date.now();
            const header = buffer_1.VSBuffer.alloc(13 /* HeaderLength */);
            header.writeUInt8(msg.type, 0);
            header.writeUInt32BE(msg.id, 1);
            header.writeUInt32BE(msg.ack, 5);
            header.writeUInt32BE(msg.data.byteLength, 9);
            this._writeSoon(header, msg.data);
        }
        _bufferAdd(head, body) {
            const wasEmpty = this._totalLength === 0;
            this._data.push(head, body);
            this._totalLength += head.byteLength + body.byteLength;
            return wasEmpty;
        }
        _bufferTake() {
            const ret = buffer_1.VSBuffer.concat(this._data, this._totalLength);
            this._data.length = 0;
            this._totalLength = 0;
            return ret;
        }
        _writeSoon(header, data) {
            if (this._bufferAdd(header, data)) {
                platform.setImmediate(() => {
                    this._writeNow();
                });
            }
        }
        _writeNow() {
            if (this._totalLength === 0) {
                return;
            }
            this._socket.write(this._bufferTake());
        }
    }
    /**
     * A message has the following format:
     * ```
     *     /-------------------------------|------\
     *     |             HEADER            |      |
     *     |-------------------------------| DATA |
     *     | TYPE | ID | ACK | DATA_LENGTH |      |
     *     \-------------------------------|------/
     * ```
     * The header is 9 bytes and consists of:
     *  - TYPE is 1 byte (ProtocolMessageType) - the message type
     *  - ID is 4 bytes (u32be) - the message id (can be 0 to indicate to be ignored)
     *  - ACK is 4 bytes (u32be) - the acknowledged message id (can be 0 to indicate to be ignored)
     *  - DATA_LENGTH is 4 bytes (u32be) - the length in bytes of DATA
     *
     * Only Regular messages are counted, other messages are not counted, nor acknowledged.
     */
    class Protocol extends lifecycle_1.Disposable {
        constructor(socket) {
            super();
            this._onMessage = new event_1.Emitter();
            this.onMessage = this._onMessage.event;
            this._onClose = new event_1.Emitter();
            this.onClose = this._onClose.event;
            this._socket = socket;
            this._socketWriter = this._register(new ProtocolWriter(this._socket));
            this._socketReader = this._register(new ProtocolReader(this._socket));
            this._register(this._socketReader.onMessage((msg) => {
                if (msg.type === 1 /* Regular */) {
                    this._onMessage.fire(msg.data);
                }
            }));
            this._register(this._socket.onClose(() => this._onClose.fire()));
        }
        getSocket() {
            return this._socket;
        }
        sendDisconnect() {
            // Nothing to do...
        }
        send(buffer) {
            this._socketWriter.write(new ProtocolMessage(1 /* Regular */, 0, 0, buffer));
        }
    }
    exports.Protocol = Protocol;
    class Client extends ipc_1.IPCClient {
        constructor(protocol, id) {
            super(protocol, id);
            this.protocol = protocol;
        }
        static fromSocket(socket, id) {
            return new Client(new Protocol(socket), id);
        }
        get onClose() { return this.protocol.onClose; }
        dispose() {
            super.dispose();
            const socket = this.protocol.getSocket();
            this.protocol.sendDisconnect();
            this.protocol.dispose();
            socket.end();
        }
    }
    exports.Client = Client;
    /**
     * Will ensure no messages are lost if there are no event listeners.
     */
    class BufferedEmitter {
        constructor() {
            this._hasListeners = false;
            this._isDeliveringMessages = false;
            this._bufferedMessages = [];
            this._emitter = new event_1.Emitter({
                onFirstListenerAdd: () => {
                    this._hasListeners = true;
                    // it is important to deliver these messages after this call, but before
                    // other messages have a chance to be received (to guarantee in order delivery)
                    // that's why we're using here nextTick and not other types of timeouts
                    process.nextTick(() => this._deliverMessages());
                },
                onLastListenerRemove: () => {
                    this._hasListeners = false;
                }
            });
            this.event = this._emitter.event;
        }
        _deliverMessages() {
            if (this._isDeliveringMessages) {
                return;
            }
            this._isDeliveringMessages = true;
            while (this._hasListeners && this._bufferedMessages.length > 0) {
                this._emitter.fire(this._bufferedMessages.shift());
            }
            this._isDeliveringMessages = false;
        }
        fire(event) {
            if (this._hasListeners) {
                if (this._bufferedMessages.length > 0) {
                    this._bufferedMessages.push(event);
                }
                else {
                    this._emitter.fire(event);
                }
            }
            else {
                this._bufferedMessages.push(event);
            }
        }
        flushBuffer() {
            this._bufferedMessages = [];
        }
    }
    exports.BufferedEmitter = BufferedEmitter;
    class QueueElement {
        constructor(data) {
            this.data = data;
            this.next = null;
        }
    }
    class Queue {
        constructor() {
            this._first = null;
            this._last = null;
        }
        peek() {
            if (!this._first) {
                return null;
            }
            return this._first.data;
        }
        toArray() {
            let result = [], resultLen = 0;
            let it = this._first;
            while (it) {
                result[resultLen++] = it.data;
                it = it.next;
            }
            return result;
        }
        pop() {
            if (!this._first) {
                return;
            }
            if (this._first === this._last) {
                this._first = null;
                this._last = null;
                return;
            }
            this._first = this._first.next;
        }
        push(item) {
            const element = new QueueElement(item);
            if (!this._first) {
                this._first = element;
                this._last = element;
                return;
            }
            this._last.next = element;
            this._last = element;
        }
    }
    /**
     * Same as Protocol, but will actually track messages and acks.
     * Moreover, it will ensure no messages are lost if there are no event listeners.
     */
    class PersistentProtocol {
        constructor(socket, initialChunk = null) {
            this._onControlMessage = new BufferedEmitter();
            this.onControlMessage = this._onControlMessage.event;
            this._onMessage = new BufferedEmitter();
            this.onMessage = this._onMessage.event;
            this._onClose = new BufferedEmitter();
            this.onClose = this._onClose.event;
            this._onSocketClose = new BufferedEmitter();
            this.onSocketClose = this._onSocketClose.event;
            this._onSocketTimeout = new BufferedEmitter();
            this.onSocketTimeout = this._onSocketTimeout.event;
            this._isReconnecting = false;
            this._outgoingUnackMsg = new Queue();
            this._outgoingMsgId = 0;
            this._outgoingAckId = 0;
            this._outgoingAckTimeout = null;
            this._incomingMsgId = 0;
            this._incomingAckId = 0;
            this._incomingMsgLastTime = 0;
            this._incomingAckTimeout = null;
            this._outgoingKeepAliveTimeout = null;
            this._incomingKeepAliveTimeout = null;
            this._socketDisposables = [];
            this._socket = socket;
            this._socketWriter = new ProtocolWriter(this._socket);
            this._socketDisposables.push(this._socketWriter);
            this._socketReader = new ProtocolReader(this._socket);
            this._socketDisposables.push(this._socketReader);
            this._socketDisposables.push(this._socketReader.onMessage(msg => this._receiveMessage(msg)));
            this._socketDisposables.push(this._socket.onClose(() => this._onSocketClose.fire()));
            if (initialChunk) {
                this._socketReader.acceptChunk(initialChunk);
            }
            this._sendKeepAliveCheck();
            this._recvKeepAliveCheck();
        }
        get unacknowledgedCount() {
            return this._outgoingMsgId - this._outgoingAckId;
        }
        dispose() {
            if (this._outgoingAckTimeout) {
                clearTimeout(this._outgoingAckTimeout);
                this._outgoingAckTimeout = null;
            }
            if (this._incomingAckTimeout) {
                clearTimeout(this._incomingAckTimeout);
                this._incomingAckTimeout = null;
            }
            if (this._outgoingKeepAliveTimeout) {
                clearTimeout(this._outgoingKeepAliveTimeout);
                this._outgoingKeepAliveTimeout = null;
            }
            if (this._incomingKeepAliveTimeout) {
                clearTimeout(this._incomingKeepAliveTimeout);
                this._incomingKeepAliveTimeout = null;
            }
            this._socketDisposables = lifecycle_1.dispose(this._socketDisposables);
        }
        sendDisconnect() {
            const msg = new ProtocolMessage(5 /* Disconnect */, 0, 0, getEmptyBuffer());
            this._socketWriter.write(msg);
            this._socketWriter.flush();
        }
        _sendKeepAliveCheck() {
            if (this._outgoingKeepAliveTimeout) {
                // there will be a check in the near future
                return;
            }
            const timeSinceLastOutgoingMsg = Date.now() - this._socketWriter.lastWriteTime;
            if (timeSinceLastOutgoingMsg >= 5000 /* KeepAliveTime */) {
                // sufficient time has passed since last message was written,
                // and no message from our side needed to be sent in the meantime,
                // so we will send a message containing only a keep alive.
                const msg = new ProtocolMessage(4 /* KeepAlive */, 0, 0, getEmptyBuffer());
                this._socketWriter.write(msg);
                this._sendKeepAliveCheck();
                return;
            }
            this._outgoingKeepAliveTimeout = setTimeout(() => {
                this._outgoingKeepAliveTimeout = null;
                this._sendKeepAliveCheck();
            }, 5000 /* KeepAliveTime */ - timeSinceLastOutgoingMsg + 5);
        }
        _recvKeepAliveCheck() {
            if (this._incomingKeepAliveTimeout) {
                // there will be a check in the near future
                return;
            }
            const timeSinceLastIncomingMsg = Date.now() - this._socketReader.lastReadTime;
            if (timeSinceLastIncomingMsg >= 20000 /* KeepAliveTimeoutTime */) {
                // Trash the socket
                this._onSocketTimeout.fire(undefined);
                return;
            }
            this._incomingKeepAliveTimeout = setTimeout(() => {
                this._incomingKeepAliveTimeout = null;
                this._recvKeepAliveCheck();
            }, 20000 /* KeepAliveTimeoutTime */ - timeSinceLastIncomingMsg + 5);
        }
        getSocket() {
            return this._socket;
        }
        beginAcceptReconnection(socket, initialDataChunk) {
            this._isReconnecting = true;
            this._socketDisposables = lifecycle_1.dispose(this._socketDisposables);
            this._onControlMessage.flushBuffer();
            this._onSocketClose.flushBuffer();
            this._onSocketTimeout.flushBuffer();
            this._socket.dispose();
            this._socket = socket;
            this._socketWriter = new ProtocolWriter(this._socket);
            this._socketDisposables.push(this._socketWriter);
            this._socketReader = new ProtocolReader(this._socket);
            this._socketDisposables.push(this._socketReader);
            this._socketDisposables.push(this._socketReader.onMessage(msg => this._receiveMessage(msg)));
            this._socketDisposables.push(this._socket.onClose(() => this._onSocketClose.fire()));
            this._socketReader.acceptChunk(initialDataChunk);
        }
        endAcceptReconnection() {
            this._isReconnecting = false;
            // Send again all unacknowledged messages
            const toSend = this._outgoingUnackMsg.toArray();
            for (let i = 0, len = toSend.length; i < len; i++) {
                this._socketWriter.write(toSend[i]);
            }
            this._recvAckCheck();
            this._sendKeepAliveCheck();
            this._recvKeepAliveCheck();
        }
        acceptDisconnect() {
            this._onClose.fire();
        }
        _receiveMessage(msg) {
            if (msg.ack > this._outgoingAckId) {
                this._outgoingAckId = msg.ack;
                do {
                    const first = this._outgoingUnackMsg.peek();
                    if (first && first.id <= msg.ack) {
                        // this message has been confirmed, remove it
                        this._outgoingUnackMsg.pop();
                    }
                    else {
                        break;
                    }
                } while (true);
            }
            if (msg.type === 1 /* Regular */) {
                if (msg.id > this._incomingMsgId) {
                    if (msg.id !== this._incomingMsgId + 1) {
                        console.error(`PROTOCOL CORRUPTION, LAST SAW MSG ${this._incomingMsgId} AND HAVE NOW RECEIVED MSG ${msg.id}`);
                    }
                    this._incomingMsgId = msg.id;
                    this._incomingMsgLastTime = Date.now();
                    this._sendAckCheck();
                    this._onMessage.fire(msg.data);
                }
            }
            else if (msg.type === 2 /* Control */) {
                this._onControlMessage.fire(msg.data);
            }
            else if (msg.type === 5 /* Disconnect */) {
                this._onClose.fire();
            }
        }
        readEntireBuffer() {
            return this._socketReader.readEntireBuffer();
        }
        flush() {
            this._socketWriter.flush();
        }
        send(buffer) {
            const myId = ++this._outgoingMsgId;
            this._incomingAckId = this._incomingMsgId;
            const msg = new ProtocolMessage(1 /* Regular */, myId, this._incomingAckId, buffer);
            this._outgoingUnackMsg.push(msg);
            if (!this._isReconnecting) {
                this._socketWriter.write(msg);
                this._recvAckCheck();
            }
        }
        /**
         * Send a message which will not be part of the regular acknowledge flow.
         * Use this for early control messages which are repeated in case of reconnection.
         */
        sendControl(buffer) {
            const msg = new ProtocolMessage(2 /* Control */, 0, 0, buffer);
            this._socketWriter.write(msg);
        }
        _sendAckCheck() {
            if (this._incomingMsgId <= this._incomingAckId) {
                // nothink to acknowledge
                return;
            }
            if (this._incomingAckTimeout) {
                // there will be a check in the near future
                return;
            }
            const timeSinceLastIncomingMsg = Date.now() - this._incomingMsgLastTime;
            if (timeSinceLastIncomingMsg >= 2000 /* AcknowledgeTime */) {
                // sufficient time has passed since this message has been received,
                // and no message from our side needed to be sent in the meantime,
                // so we will send a message containing only an ack.
                this._sendAck();
                return;
            }
            this._incomingAckTimeout = setTimeout(() => {
                this._incomingAckTimeout = null;
                this._sendAckCheck();
            }, 2000 /* AcknowledgeTime */ - timeSinceLastIncomingMsg + 5);
        }
        _recvAckCheck() {
            if (this._outgoingMsgId <= this._outgoingAckId) {
                // everything has been acknowledged
                return;
            }
            if (this._outgoingAckTimeout) {
                // there will be a check in the near future
                return;
            }
            const oldestUnacknowledgedMsg = this._outgoingUnackMsg.peek();
            const timeSinceOldestUnacknowledgedMsg = Date.now() - oldestUnacknowledgedMsg.writtenTime;
            if (timeSinceOldestUnacknowledgedMsg >= 20000 /* AcknowledgeTimeoutTime */) {
                // Trash the socket
                this._onSocketTimeout.fire(undefined);
                return;
            }
            this._outgoingAckTimeout = setTimeout(() => {
                this._outgoingAckTimeout = null;
                this._recvAckCheck();
            }, 20000 /* AcknowledgeTimeoutTime */ - timeSinceOldestUnacknowledgedMsg + 5);
        }
        _sendAck() {
            if (this._incomingMsgId <= this._incomingAckId) {
                // nothink to acknowledge
                return;
            }
            this._incomingAckId = this._incomingMsgId;
            const msg = new ProtocolMessage(3 /* Ack */, 0, this._incomingAckId, getEmptyBuffer());
            this._socketWriter.write(msg);
        }
    }
    exports.PersistentProtocol = PersistentProtocol;
});
//# __sourceMappingURL=ipc.net.js.map