/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalDataBufferer = void 0;
    class TerminalDataBufferer {
        constructor(_callback) {
            this._callback = _callback;
            this._terminalBufferMap = new Map();
        }
        dispose() {
            for (const buffer of this._terminalBufferMap.values()) {
                buffer.dispose();
            }
        }
        startBuffering(id, event, throttleBy = 5) {
            let disposable;
            disposable = event((e) => {
                let buffer = this._terminalBufferMap.get(id);
                if (buffer) {
                    buffer.data.push(e);
                    return;
                }
                const timeoutId = setTimeout(() => this._flushBuffer(id), throttleBy);
                buffer = {
                    data: [e],
                    timeoutId: timeoutId,
                    dispose: () => {
                        clearTimeout(timeoutId);
                        this._flushBuffer(id);
                        disposable.dispose();
                    }
                };
                this._terminalBufferMap.set(id, buffer);
            });
            return disposable;
        }
        stopBuffering(id) {
            const buffer = this._terminalBufferMap.get(id);
            if (buffer) {
                buffer.dispose();
            }
        }
        _flushBuffer(id) {
            const buffer = this._terminalBufferMap.get(id);
            if (buffer) {
                this._terminalBufferMap.delete(id);
                this._callback(id, buffer.data.join(''));
            }
        }
    }
    exports.TerminalDataBufferer = TerminalDataBufferer;
});
//# __sourceMappingURL=terminalDataBuffering.js.map