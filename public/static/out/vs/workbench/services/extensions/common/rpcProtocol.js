/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uriIpc", "vs/workbench/services/extensions/common/lazyPromise", "vs/workbench/services/extensions/common/proxyIdentifier", "vs/base/common/buffer"], function (require, exports, async_1, cancellation_1, errors, event_1, lifecycle_1, uriIpc_1, lazyPromise_1, proxyIdentifier_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RPCProtocol = exports.ResponsiveState = exports.RequestInitiator = void 0;
    function safeStringify(obj, replacer) {
        try {
            return JSON.stringify(obj, replacer);
        }
        catch (err) {
            return 'null';
        }
    }
    function stringify(obj, replacer) {
        return JSON.stringify(obj, replacer);
    }
    function createURIReplacer(transformer) {
        if (!transformer) {
            return null;
        }
        return (key, value) => {
            if (value && value.$mid === 1) {
                return transformer.transformOutgoing(value);
            }
            return value;
        };
    }
    var RequestInitiator;
    (function (RequestInitiator) {
        RequestInitiator[RequestInitiator["LocalSide"] = 0] = "LocalSide";
        RequestInitiator[RequestInitiator["OtherSide"] = 1] = "OtherSide";
    })(RequestInitiator = exports.RequestInitiator || (exports.RequestInitiator = {}));
    var ResponsiveState;
    (function (ResponsiveState) {
        ResponsiveState[ResponsiveState["Responsive"] = 0] = "Responsive";
        ResponsiveState[ResponsiveState["Unresponsive"] = 1] = "Unresponsive";
    })(ResponsiveState = exports.ResponsiveState || (exports.ResponsiveState = {}));
    const noop = () => { };
    class RPCProtocol extends lifecycle_1.Disposable {
        constructor(protocol, logger = null, transformer = null) {
            super();
            this._onDidChangeResponsiveState = this._register(new event_1.Emitter());
            this.onDidChangeResponsiveState = this._onDidChangeResponsiveState.event;
            this._protocol = protocol;
            this._logger = logger;
            this._uriTransformer = transformer;
            this._uriReplacer = createURIReplacer(this._uriTransformer);
            this._isDisposed = false;
            this._locals = [];
            this._proxies = [];
            for (let i = 0, len = proxyIdentifier_1.ProxyIdentifier.count; i < len; i++) {
                this._locals[i] = null;
                this._proxies[i] = null;
            }
            this._lastMessageId = 0;
            this._cancelInvokedHandlers = Object.create(null);
            this._pendingRPCReplies = {};
            this._responsiveState = 0 /* Responsive */;
            this._unacknowledgedCount = 0;
            this._unresponsiveTime = 0;
            this._asyncCheckUresponsive = this._register(new async_1.RunOnceScheduler(() => this._checkUnresponsive(), 1000));
            this._protocol.onMessage((msg) => this._receiveOneMessage(msg));
        }
        dispose() {
            this._isDisposed = true;
            // Release all outstanding promises with a canceled error
            Object.keys(this._pendingRPCReplies).forEach((msgId) => {
                const pending = this._pendingRPCReplies[msgId];
                pending.resolveErr(errors.canceled());
            });
        }
        _onWillSendRequest(req) {
            if (this._unacknowledgedCount === 0) {
                // Since this is the first request we are sending in a while,
                // mark this moment as the start for the countdown to unresponsive time
                this._unresponsiveTime = Date.now() + RPCProtocol.UNRESPONSIVE_TIME;
            }
            this._unacknowledgedCount++;
            if (!this._asyncCheckUresponsive.isScheduled()) {
                this._asyncCheckUresponsive.schedule();
            }
        }
        _onDidReceiveAcknowledge(req) {
            // The next possible unresponsive time is now + delta.
            this._unresponsiveTime = Date.now() + RPCProtocol.UNRESPONSIVE_TIME;
            this._unacknowledgedCount--;
            if (this._unacknowledgedCount === 0) {
                // No more need to check for unresponsive
                this._asyncCheckUresponsive.cancel();
            }
            // The ext host is responsive!
            this._setResponsiveState(0 /* Responsive */);
        }
        _checkUnresponsive() {
            if (this._unacknowledgedCount === 0) {
                // Not waiting for anything => cannot say if it is responsive or not
                return;
            }
            if (Date.now() > this._unresponsiveTime) {
                // Unresponsive!!
                this._setResponsiveState(1 /* Unresponsive */);
            }
            else {
                // Not (yet) unresponsive, be sure to check again soon
                this._asyncCheckUresponsive.schedule();
            }
        }
        _setResponsiveState(newResponsiveState) {
            if (this._responsiveState === newResponsiveState) {
                // no change
                return;
            }
            this._responsiveState = newResponsiveState;
            this._onDidChangeResponsiveState.fire(this._responsiveState);
        }
        get responsiveState() {
            return this._responsiveState;
        }
        transformIncomingURIs(obj) {
            if (!this._uriTransformer) {
                return obj;
            }
            return uriIpc_1.transformIncomingURIs(obj, this._uriTransformer);
        }
        getProxy(identifier) {
            const rpcId = identifier.nid;
            if (!this._proxies[rpcId]) {
                this._proxies[rpcId] = this._createProxy(rpcId);
            }
            return this._proxies[rpcId];
        }
        _createProxy(rpcId) {
            let handler = {
                get: (target, name) => {
                    if (typeof name === 'string' && !target[name] && name.charCodeAt(0) === 36 /* DollarSign */) {
                        target[name] = (...myArgs) => {
                            return this._remoteCall(rpcId, name, myArgs);
                        };
                    }
                    return target[name];
                }
            };
            return new Proxy(Object.create(null), handler);
        }
        set(identifier, value) {
            this._locals[identifier.nid] = value;
            return value;
        }
        assertRegistered(identifiers) {
            for (let i = 0, len = identifiers.length; i < len; i++) {
                const identifier = identifiers[i];
                if (!this._locals[identifier.nid]) {
                    throw new Error(`Missing actor ${identifier.sid} (isMain: ${identifier.isMain})`);
                }
            }
        }
        _receiveOneMessage(rawmsg) {
            if (this._isDisposed) {
                return;
            }
            const msgLength = rawmsg.byteLength;
            const buff = MessageBuffer.read(rawmsg, 0);
            const messageType = buff.readUInt8();
            const req = buff.readUInt32();
            switch (messageType) {
                case 1 /* RequestJSONArgs */:
                case 2 /* RequestJSONArgsWithCancellation */: {
                    let { rpcId, method, args } = MessageIO.deserializeRequestJSONArgs(buff);
                    if (this._uriTransformer) {
                        args = uriIpc_1.transformIncomingURIs(args, this._uriTransformer);
                    }
                    this._receiveRequest(msgLength, req, rpcId, method, args, (messageType === 2 /* RequestJSONArgsWithCancellation */));
                    break;
                }
                case 3 /* RequestMixedArgs */:
                case 4 /* RequestMixedArgsWithCancellation */: {
                    let { rpcId, method, args } = MessageIO.deserializeRequestMixedArgs(buff);
                    if (this._uriTransformer) {
                        args = uriIpc_1.transformIncomingURIs(args, this._uriTransformer);
                    }
                    this._receiveRequest(msgLength, req, rpcId, method, args, (messageType === 4 /* RequestMixedArgsWithCancellation */));
                    break;
                }
                case 5 /* Acknowledged */: {
                    if (this._logger) {
                        this._logger.logIncoming(msgLength, req, 0 /* LocalSide */, `ack`);
                    }
                    this._onDidReceiveAcknowledge(req);
                    break;
                }
                case 6 /* Cancel */: {
                    this._receiveCancel(msgLength, req);
                    break;
                }
                case 7 /* ReplyOKEmpty */: {
                    this._receiveReply(msgLength, req, undefined);
                    break;
                }
                case 9 /* ReplyOKJSON */: {
                    let value = MessageIO.deserializeReplyOKJSON(buff);
                    if (this._uriTransformer) {
                        value = uriIpc_1.transformIncomingURIs(value, this._uriTransformer);
                    }
                    this._receiveReply(msgLength, req, value);
                    break;
                }
                case 8 /* ReplyOKVSBuffer */: {
                    let value = MessageIO.deserializeReplyOKVSBuffer(buff);
                    this._receiveReply(msgLength, req, value);
                    break;
                }
                case 10 /* ReplyErrError */: {
                    let err = MessageIO.deserializeReplyErrError(buff);
                    if (this._uriTransformer) {
                        err = uriIpc_1.transformIncomingURIs(err, this._uriTransformer);
                    }
                    this._receiveReplyErr(msgLength, req, err);
                    break;
                }
                case 11 /* ReplyErrEmpty */: {
                    this._receiveReplyErr(msgLength, req, undefined);
                    break;
                }
                default:
                    console.error(`received unexpected message`);
                    console.error(rawmsg);
            }
        }
        _receiveRequest(msgLength, req, rpcId, method, args, usesCancellationToken) {
            if (this._logger) {
                this._logger.logIncoming(msgLength, req, 1 /* OtherSide */, `receiveRequest ${proxyIdentifier_1.getStringIdentifierForProxy(rpcId)}.${method}(`, args);
            }
            const callId = String(req);
            let promise;
            let cancel;
            if (usesCancellationToken) {
                const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
                args.push(cancellationTokenSource.token);
                promise = this._invokeHandler(rpcId, method, args);
                cancel = () => cancellationTokenSource.cancel();
            }
            else {
                // cannot be cancelled
                promise = this._invokeHandler(rpcId, method, args);
                cancel = noop;
            }
            this._cancelInvokedHandlers[callId] = cancel;
            // Acknowledge the request
            const msg = MessageIO.serializeAcknowledged(req);
            if (this._logger) {
                this._logger.logOutgoing(msg.byteLength, req, 1 /* OtherSide */, `ack`);
            }
            this._protocol.send(msg);
            promise.then((r) => {
                delete this._cancelInvokedHandlers[callId];
                const msg = MessageIO.serializeReplyOK(req, r, this._uriReplacer);
                if (this._logger) {
                    this._logger.logOutgoing(msg.byteLength, req, 1 /* OtherSide */, `reply:`, r);
                }
                this._protocol.send(msg);
            }, (err) => {
                delete this._cancelInvokedHandlers[callId];
                const msg = MessageIO.serializeReplyErr(req, err);
                if (this._logger) {
                    this._logger.logOutgoing(msg.byteLength, req, 1 /* OtherSide */, `replyErr:`, err);
                }
                this._protocol.send(msg);
            });
        }
        _receiveCancel(msgLength, req) {
            if (this._logger) {
                this._logger.logIncoming(msgLength, req, 1 /* OtherSide */, `receiveCancel`);
            }
            const callId = String(req);
            if (this._cancelInvokedHandlers[callId]) {
                this._cancelInvokedHandlers[callId]();
            }
        }
        _receiveReply(msgLength, req, value) {
            if (this._logger) {
                this._logger.logIncoming(msgLength, req, 0 /* LocalSide */, `receiveReply:`, value);
            }
            const callId = String(req);
            if (!this._pendingRPCReplies.hasOwnProperty(callId)) {
                return;
            }
            const pendingReply = this._pendingRPCReplies[callId];
            delete this._pendingRPCReplies[callId];
            pendingReply.resolveOk(value);
        }
        _receiveReplyErr(msgLength, req, value) {
            if (this._logger) {
                this._logger.logIncoming(msgLength, req, 0 /* LocalSide */, `receiveReplyErr:`, value);
            }
            const callId = String(req);
            if (!this._pendingRPCReplies.hasOwnProperty(callId)) {
                return;
            }
            const pendingReply = this._pendingRPCReplies[callId];
            delete this._pendingRPCReplies[callId];
            let err = undefined;
            if (value) {
                if (value.$isError) {
                    err = new Error();
                    err.name = value.name;
                    err.message = value.message;
                    err.stack = value.stack;
                }
                else {
                    err = value;
                }
            }
            pendingReply.resolveErr(err);
        }
        _invokeHandler(rpcId, methodName, args) {
            try {
                return Promise.resolve(this._doInvokeHandler(rpcId, methodName, args));
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
        _doInvokeHandler(rpcId, methodName, args) {
            const actor = this._locals[rpcId];
            if (!actor) {
                throw new Error('Unknown actor ' + proxyIdentifier_1.getStringIdentifierForProxy(rpcId));
            }
            let method = actor[methodName];
            if (typeof method !== 'function') {
                throw new Error('Unknown method ' + methodName + ' on actor ' + proxyIdentifier_1.getStringIdentifierForProxy(rpcId));
            }
            return method.apply(actor, args);
        }
        _remoteCall(rpcId, methodName, args) {
            if (this._isDisposed) {
                return Promise.reject(errors.canceled());
            }
            let cancellationToken = null;
            if (args.length > 0 && cancellation_1.CancellationToken.isCancellationToken(args[args.length - 1])) {
                cancellationToken = args.pop();
            }
            if (cancellationToken && cancellationToken.isCancellationRequested) {
                // No need to do anything...
                return Promise.reject(errors.canceled());
            }
            const serializedRequestArguments = MessageIO.serializeRequestArguments(args, this._uriReplacer);
            const req = ++this._lastMessageId;
            const callId = String(req);
            const result = new lazyPromise_1.LazyPromise();
            if (cancellationToken) {
                cancellationToken.onCancellationRequested(() => {
                    const msg = MessageIO.serializeCancel(req);
                    if (this._logger) {
                        this._logger.logOutgoing(msg.byteLength, req, 0 /* LocalSide */, `cancel`);
                    }
                    this._protocol.send(MessageIO.serializeCancel(req));
                });
            }
            this._pendingRPCReplies[callId] = result;
            this._onWillSendRequest(req);
            const msg = MessageIO.serializeRequest(req, rpcId, methodName, serializedRequestArguments, !!cancellationToken);
            if (this._logger) {
                this._logger.logOutgoing(msg.byteLength, req, 0 /* LocalSide */, `request: ${proxyIdentifier_1.getStringIdentifierForProxy(rpcId)}.${methodName}(`, args);
            }
            this._protocol.send(msg);
            return result;
        }
    }
    exports.RPCProtocol = RPCProtocol;
    RPCProtocol.UNRESPONSIVE_TIME = 3 * 1000; // 3s
    class MessageBuffer {
        constructor(buff, offset) {
            this._buff = buff;
            this._offset = offset;
        }
        static alloc(type, req, messageSize) {
            let result = new MessageBuffer(buffer_1.VSBuffer.alloc(messageSize + 1 /* type */ + 4 /* req */), 0);
            result.writeUInt8(type);
            result.writeUInt32(req);
            return result;
        }
        static read(buff, offset) {
            return new MessageBuffer(buff, offset);
        }
        get buffer() {
            return this._buff;
        }
        static sizeUInt8() {
            return 1;
        }
        writeUInt8(n) {
            this._buff.writeUInt8(n, this._offset);
            this._offset += 1;
        }
        readUInt8() {
            const n = this._buff.readUInt8(this._offset);
            this._offset += 1;
            return n;
        }
        writeUInt32(n) {
            this._buff.writeUInt32BE(n, this._offset);
            this._offset += 4;
        }
        readUInt32() {
            const n = this._buff.readUInt32BE(this._offset);
            this._offset += 4;
            return n;
        }
        static sizeShortString(str) {
            return 1 /* string length */ + str.byteLength /* actual string */;
        }
        writeShortString(str) {
            this._buff.writeUInt8(str.byteLength, this._offset);
            this._offset += 1;
            this._buff.set(str, this._offset);
            this._offset += str.byteLength;
        }
        readShortString() {
            const strByteLength = this._buff.readUInt8(this._offset);
            this._offset += 1;
            const strBuff = this._buff.slice(this._offset, this._offset + strByteLength);
            const str = strBuff.toString();
            this._offset += strByteLength;
            return str;
        }
        static sizeLongString(str) {
            return 4 /* string length */ + str.byteLength /* actual string */;
        }
        writeLongString(str) {
            this._buff.writeUInt32BE(str.byteLength, this._offset);
            this._offset += 4;
            this._buff.set(str, this._offset);
            this._offset += str.byteLength;
        }
        readLongString() {
            const strByteLength = this._buff.readUInt32BE(this._offset);
            this._offset += 4;
            const strBuff = this._buff.slice(this._offset, this._offset + strByteLength);
            const str = strBuff.toString();
            this._offset += strByteLength;
            return str;
        }
        writeBuffer(buff) {
            this._buff.writeUInt32BE(buff.byteLength, this._offset);
            this._offset += 4;
            this._buff.set(buff, this._offset);
            this._offset += buff.byteLength;
        }
        static sizeVSBuffer(buff) {
            return 4 /* buffer length */ + buff.byteLength /* actual buffer */;
        }
        writeVSBuffer(buff) {
            this._buff.writeUInt32BE(buff.byteLength, this._offset);
            this._offset += 4;
            this._buff.set(buff, this._offset);
            this._offset += buff.byteLength;
        }
        readVSBuffer() {
            const buffLength = this._buff.readUInt32BE(this._offset);
            this._offset += 4;
            const buff = this._buff.slice(this._offset, this._offset + buffLength);
            this._offset += buffLength;
            return buff;
        }
        static sizeMixedArray(arr, arrType) {
            let size = 0;
            size += 1; // arr length
            for (let i = 0, len = arr.length; i < len; i++) {
                const el = arr[i];
                const elType = arrType[i];
                size += 1; // arg type
                switch (elType) {
                    case 1 /* String */:
                        size += this.sizeLongString(el);
                        break;
                    case 2 /* VSBuffer */:
                        size += this.sizeVSBuffer(el);
                        break;
                    case 3 /* Undefined */:
                        // empty...
                        break;
                }
            }
            return size;
        }
        writeMixedArray(arr, arrType) {
            this._buff.writeUInt8(arr.length, this._offset);
            this._offset += 1;
            for (let i = 0, len = arr.length; i < len; i++) {
                const el = arr[i];
                const elType = arrType[i];
                switch (elType) {
                    case 1 /* String */:
                        this.writeUInt8(1 /* String */);
                        this.writeLongString(el);
                        break;
                    case 2 /* VSBuffer */:
                        this.writeUInt8(2 /* VSBuffer */);
                        this.writeVSBuffer(el);
                        break;
                    case 3 /* Undefined */:
                        this.writeUInt8(3 /* Undefined */);
                        break;
                }
            }
        }
        readMixedArray() {
            const arrLen = this._buff.readUInt8(this._offset);
            this._offset += 1;
            let arr = new Array(arrLen);
            for (let i = 0; i < arrLen; i++) {
                const argType = this.readUInt8();
                switch (argType) {
                    case 1 /* String */:
                        arr[i] = this.readLongString();
                        break;
                    case 2 /* VSBuffer */:
                        arr[i] = this.readVSBuffer();
                        break;
                    case 3 /* Undefined */:
                        arr[i] = undefined;
                        break;
                }
            }
            return arr;
        }
    }
    class MessageIO {
        static _arrayContainsBufferOrUndefined(arr) {
            for (let i = 0, len = arr.length; i < len; i++) {
                if (arr[i] instanceof buffer_1.VSBuffer) {
                    return true;
                }
                if (typeof arr[i] === 'undefined') {
                    return true;
                }
            }
            return false;
        }
        static serializeRequestArguments(args, replacer) {
            if (this._arrayContainsBufferOrUndefined(args)) {
                let massagedArgs = [];
                let massagedArgsType = [];
                for (let i = 0, len = args.length; i < len; i++) {
                    const arg = args[i];
                    if (arg instanceof buffer_1.VSBuffer) {
                        massagedArgs[i] = arg;
                        massagedArgsType[i] = 2 /* VSBuffer */;
                    }
                    else if (typeof arg === 'undefined') {
                        massagedArgs[i] = buffer_1.VSBuffer.alloc(0);
                        massagedArgsType[i] = 3 /* Undefined */;
                    }
                    else {
                        massagedArgs[i] = buffer_1.VSBuffer.fromString(stringify(arg, replacer));
                        massagedArgsType[i] = 1 /* String */;
                    }
                }
                return {
                    type: 'mixed',
                    args: massagedArgs,
                    argsType: massagedArgsType
                };
            }
            return {
                type: 'simple',
                args: stringify(args, replacer)
            };
        }
        static serializeRequest(req, rpcId, method, serializedArgs, usesCancellationToken) {
            if (serializedArgs.type === 'mixed') {
                return this._requestMixedArgs(req, rpcId, method, serializedArgs.args, serializedArgs.argsType, usesCancellationToken);
            }
            return this._requestJSONArgs(req, rpcId, method, serializedArgs.args, usesCancellationToken);
        }
        static _requestJSONArgs(req, rpcId, method, args, usesCancellationToken) {
            const methodBuff = buffer_1.VSBuffer.fromString(method);
            const argsBuff = buffer_1.VSBuffer.fromString(args);
            let len = 0;
            len += MessageBuffer.sizeUInt8();
            len += MessageBuffer.sizeShortString(methodBuff);
            len += MessageBuffer.sizeLongString(argsBuff);
            let result = MessageBuffer.alloc(usesCancellationToken ? 2 /* RequestJSONArgsWithCancellation */ : 1 /* RequestJSONArgs */, req, len);
            result.writeUInt8(rpcId);
            result.writeShortString(methodBuff);
            result.writeLongString(argsBuff);
            return result.buffer;
        }
        static deserializeRequestJSONArgs(buff) {
            const rpcId = buff.readUInt8();
            const method = buff.readShortString();
            const args = buff.readLongString();
            return {
                rpcId: rpcId,
                method: method,
                args: JSON.parse(args)
            };
        }
        static _requestMixedArgs(req, rpcId, method, args, argsType, usesCancellationToken) {
            const methodBuff = buffer_1.VSBuffer.fromString(method);
            let len = 0;
            len += MessageBuffer.sizeUInt8();
            len += MessageBuffer.sizeShortString(methodBuff);
            len += MessageBuffer.sizeMixedArray(args, argsType);
            let result = MessageBuffer.alloc(usesCancellationToken ? 4 /* RequestMixedArgsWithCancellation */ : 3 /* RequestMixedArgs */, req, len);
            result.writeUInt8(rpcId);
            result.writeShortString(methodBuff);
            result.writeMixedArray(args, argsType);
            return result.buffer;
        }
        static deserializeRequestMixedArgs(buff) {
            const rpcId = buff.readUInt8();
            const method = buff.readShortString();
            const rawargs = buff.readMixedArray();
            const args = new Array(rawargs.length);
            for (let i = 0, len = rawargs.length; i < len; i++) {
                const rawarg = rawargs[i];
                if (typeof rawarg === 'string') {
                    args[i] = JSON.parse(rawarg);
                }
                else {
                    args[i] = rawarg;
                }
            }
            return {
                rpcId: rpcId,
                method: method,
                args: args
            };
        }
        static serializeAcknowledged(req) {
            return MessageBuffer.alloc(5 /* Acknowledged */, req, 0).buffer;
        }
        static serializeCancel(req) {
            return MessageBuffer.alloc(6 /* Cancel */, req, 0).buffer;
        }
        static serializeReplyOK(req, res, replacer) {
            if (typeof res === 'undefined') {
                return this._serializeReplyOKEmpty(req);
            }
            if (res instanceof buffer_1.VSBuffer) {
                return this._serializeReplyOKVSBuffer(req, res);
            }
            return this._serializeReplyOKJSON(req, safeStringify(res, replacer));
        }
        static _serializeReplyOKEmpty(req) {
            return MessageBuffer.alloc(7 /* ReplyOKEmpty */, req, 0).buffer;
        }
        static _serializeReplyOKVSBuffer(req, res) {
            let len = 0;
            len += MessageBuffer.sizeVSBuffer(res);
            let result = MessageBuffer.alloc(8 /* ReplyOKVSBuffer */, req, len);
            result.writeVSBuffer(res);
            return result.buffer;
        }
        static deserializeReplyOKVSBuffer(buff) {
            return buff.readVSBuffer();
        }
        static _serializeReplyOKJSON(req, res) {
            const resBuff = buffer_1.VSBuffer.fromString(res);
            let len = 0;
            len += MessageBuffer.sizeLongString(resBuff);
            let result = MessageBuffer.alloc(9 /* ReplyOKJSON */, req, len);
            result.writeLongString(resBuff);
            return result.buffer;
        }
        static deserializeReplyOKJSON(buff) {
            const res = buff.readLongString();
            return JSON.parse(res);
        }
        static serializeReplyErr(req, err) {
            if (err) {
                return this._serializeReplyErrEror(req, err);
            }
            return this._serializeReplyErrEmpty(req);
        }
        static _serializeReplyErrEror(req, _err) {
            const errBuff = buffer_1.VSBuffer.fromString(safeStringify(errors.transformErrorForSerialization(_err), null));
            let len = 0;
            len += MessageBuffer.sizeLongString(errBuff);
            let result = MessageBuffer.alloc(10 /* ReplyErrError */, req, len);
            result.writeLongString(errBuff);
            return result.buffer;
        }
        static deserializeReplyErrError(buff) {
            const err = buff.readLongString();
            return JSON.parse(err);
        }
        static _serializeReplyErrEmpty(req) {
            return MessageBuffer.alloc(11 /* ReplyErrEmpty */, req, 0).buffer;
        }
    }
    var MessageType;
    (function (MessageType) {
        MessageType[MessageType["RequestJSONArgs"] = 1] = "RequestJSONArgs";
        MessageType[MessageType["RequestJSONArgsWithCancellation"] = 2] = "RequestJSONArgsWithCancellation";
        MessageType[MessageType["RequestMixedArgs"] = 3] = "RequestMixedArgs";
        MessageType[MessageType["RequestMixedArgsWithCancellation"] = 4] = "RequestMixedArgsWithCancellation";
        MessageType[MessageType["Acknowledged"] = 5] = "Acknowledged";
        MessageType[MessageType["Cancel"] = 6] = "Cancel";
        MessageType[MessageType["ReplyOKEmpty"] = 7] = "ReplyOKEmpty";
        MessageType[MessageType["ReplyOKVSBuffer"] = 8] = "ReplyOKVSBuffer";
        MessageType[MessageType["ReplyOKJSON"] = 9] = "ReplyOKJSON";
        MessageType[MessageType["ReplyErrError"] = 10] = "ReplyErrError";
        MessageType[MessageType["ReplyErrEmpty"] = 11] = "ReplyErrEmpty";
    })(MessageType || (MessageType = {}));
    var ArgType;
    (function (ArgType) {
        ArgType[ArgType["String"] = 1] = "String";
        ArgType[ArgType["VSBuffer"] = 2] = "VSBuffer";
        ArgType[ArgType["Undefined"] = 3] = "Undefined";
    })(ArgType || (ArgType = {}));
});
//# __sourceMappingURL=rpcProtocol.js.map