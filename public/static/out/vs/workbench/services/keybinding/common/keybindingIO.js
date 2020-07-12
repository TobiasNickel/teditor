/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/keybindingParser", "vs/platform/contextkey/common/contextkey"], function (require, exports, keybindingParser_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutputBuilder = exports.KeybindingIO = void 0;
    class KeybindingIO {
        static writeKeybindingItem(out, item) {
            if (!item.resolvedKeybinding) {
                return;
            }
            let quotedSerializedKeybinding = JSON.stringify(item.resolvedKeybinding.getUserSettingsLabel());
            out.write(`{ "key": ${rightPaddedString(quotedSerializedKeybinding + ',', 25)} "command": `);
            let quotedSerializedWhen = item.when ? JSON.stringify(item.when.serialize()) : '';
            let quotedSerializeCommand = JSON.stringify(item.command);
            if (quotedSerializedWhen.length > 0) {
                out.write(`${quotedSerializeCommand},`);
                out.writeLine();
                out.write(`                                     "when": ${quotedSerializedWhen}`);
            }
            else {
                out.write(`${quotedSerializeCommand}`);
            }
            if (item.commandArgs) {
                out.write(',');
                out.writeLine();
                out.write(`                                     "args": ${JSON.stringify(item.commandArgs)}`);
            }
            out.write(' }');
        }
        static readUserKeybindingItem(input) {
            const parts = (typeof input.key === 'string' ? keybindingParser_1.KeybindingParser.parseUserBinding(input.key) : []);
            const when = (typeof input.when === 'string' ? contextkey_1.ContextKeyExpr.deserialize(input.when) : undefined);
            const command = (typeof input.command === 'string' ? input.command : null);
            const commandArgs = (typeof input.args !== 'undefined' ? input.args : undefined);
            return {
                parts: parts,
                command: command,
                commandArgs: commandArgs,
                when: when
            };
        }
    }
    exports.KeybindingIO = KeybindingIO;
    function rightPaddedString(str, minChars) {
        if (str.length < minChars) {
            return str + (new Array(minChars - str.length).join(' '));
        }
        return str;
    }
    class OutputBuilder {
        constructor() {
            this._lines = [];
            this._currentLine = '';
        }
        write(str) {
            this._currentLine += str;
        }
        writeLine(str = '') {
            this._lines.push(this._currentLine + str);
            this._currentLine = '';
        }
        toString() {
            this.writeLine();
            return this._lines.join('\n');
        }
    }
    exports.OutputBuilder = OutputBuilder;
});
//# __sourceMappingURL=keybindingIO.js.map