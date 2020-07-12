/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/jsonEdit"], function (require, exports, jsonEdit_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getLineEndOffset = exports.getLineStartOffset = exports.edit = void 0;
    function edit(content, originalPath, value, formattingOptions) {
        const edit = jsonEdit_1.setProperty(content, originalPath, value, formattingOptions)[0];
        if (edit) {
            content = content.substring(0, edit.offset) + edit.content + content.substring(edit.offset + edit.length);
        }
        return content;
    }
    exports.edit = edit;
    function getLineStartOffset(content, eol, atOffset) {
        let lineStartingOffset = atOffset;
        while (lineStartingOffset >= 0) {
            if (content.charAt(lineStartingOffset) === eol.charAt(eol.length - 1)) {
                if (eol.length === 1) {
                    return lineStartingOffset + 1;
                }
            }
            lineStartingOffset--;
            if (eol.length === 2) {
                if (lineStartingOffset >= 0 && content.charAt(lineStartingOffset) === eol.charAt(0)) {
                    return lineStartingOffset + 2;
                }
            }
        }
        return 0;
    }
    exports.getLineStartOffset = getLineStartOffset;
    function getLineEndOffset(content, eol, atOffset) {
        let lineEndOffset = atOffset;
        while (lineEndOffset >= 0) {
            if (content.charAt(lineEndOffset) === eol.charAt(eol.length - 1)) {
                if (eol.length === 1) {
                    return lineEndOffset;
                }
            }
            lineEndOffset++;
            if (eol.length === 2) {
                if (lineEndOffset >= 0 && content.charAt(lineEndOffset) === eol.charAt(1)) {
                    return lineEndOffset;
                }
            }
        }
        return content.length - 1;
    }
    exports.getLineEndOffset = getLineEndOffset;
});
//# __sourceMappingURL=content.js.map