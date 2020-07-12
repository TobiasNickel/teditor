/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer"], function (require, exports, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isMessageOfType = exports.createMessageOfType = exports.MessageType = void 0;
    var MessageType;
    (function (MessageType) {
        MessageType[MessageType["Initialized"] = 0] = "Initialized";
        MessageType[MessageType["Ready"] = 1] = "Ready";
        MessageType[MessageType["Terminate"] = 2] = "Terminate";
    })(MessageType = exports.MessageType || (exports.MessageType = {}));
    function createMessageOfType(type) {
        const result = buffer_1.VSBuffer.alloc(1);
        switch (type) {
            case 0 /* Initialized */:
                result.writeUInt8(1, 0);
                break;
            case 1 /* Ready */:
                result.writeUInt8(2, 0);
                break;
            case 2 /* Terminate */:
                result.writeUInt8(3, 0);
                break;
        }
        return result;
    }
    exports.createMessageOfType = createMessageOfType;
    function isMessageOfType(message, type) {
        if (message.byteLength !== 1) {
            return false;
        }
        switch (message.readUInt8(0)) {
            case 1: return type === 0 /* Initialized */;
            case 2: return type === 1 /* Ready */;
            case 3: return type === 2 /* Terminate */;
            default: return false;
        }
    }
    exports.isMessageOfType = isMessageOfType;
});
//# __sourceMappingURL=extensionHostProtocol.js.map