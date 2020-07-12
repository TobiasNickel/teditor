/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/base/common/buffer", "vs/base/common/types", "vs/base/common/platform"], function (require, exports, files_1, instantiation_1, buffer_1, types_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SUPPORTED_ENCODINGS = exports.toBufferOrReadable = exports.TextSnapshotReadable = exports.stringToSnapshot = exports.snapshotToString = exports.TextFileLoadReason = exports.TextFileEditorModelState = exports.TextFileOperationError = exports.TextFileOperationResult = exports.ITextFileService = void 0;
    exports.ITextFileService = instantiation_1.createDecorator('textFileService');
    var TextFileOperationResult;
    (function (TextFileOperationResult) {
        TextFileOperationResult[TextFileOperationResult["FILE_IS_BINARY"] = 0] = "FILE_IS_BINARY";
    })(TextFileOperationResult = exports.TextFileOperationResult || (exports.TextFileOperationResult = {}));
    class TextFileOperationError extends files_1.FileOperationError {
        constructor(message, textFileOperationResult, options) {
            super(message, 11 /* FILE_OTHER_ERROR */);
            this.textFileOperationResult = textFileOperationResult;
            this.options = options;
        }
        static isTextFileOperationError(obj) {
            return obj instanceof Error && !types_1.isUndefinedOrNull(obj.textFileOperationResult);
        }
    }
    exports.TextFileOperationError = TextFileOperationError;
    /**
     * States the text file editor model can be in.
     */
    var TextFileEditorModelState;
    (function (TextFileEditorModelState) {
        /**
         * A model is saved.
         */
        TextFileEditorModelState[TextFileEditorModelState["SAVED"] = 0] = "SAVED";
        /**
         * A model is dirty.
         */
        TextFileEditorModelState[TextFileEditorModelState["DIRTY"] = 1] = "DIRTY";
        /**
         * A model is currently being saved but this operation has not completed yet.
         */
        TextFileEditorModelState[TextFileEditorModelState["PENDING_SAVE"] = 2] = "PENDING_SAVE";
        /**
         * A model is in conflict mode when changes cannot be saved because the
         * underlying file has changed. Models in conflict mode are always dirty.
         */
        TextFileEditorModelState[TextFileEditorModelState["CONFLICT"] = 3] = "CONFLICT";
        /**
         * A model is in orphan state when the underlying file has been deleted.
         */
        TextFileEditorModelState[TextFileEditorModelState["ORPHAN"] = 4] = "ORPHAN";
        /**
         * Any error that happens during a save that is not causing the CONFLICT state.
         * Models in error mode are always dirty.
         */
        TextFileEditorModelState[TextFileEditorModelState["ERROR"] = 5] = "ERROR";
    })(TextFileEditorModelState = exports.TextFileEditorModelState || (exports.TextFileEditorModelState = {}));
    var TextFileLoadReason;
    (function (TextFileLoadReason) {
        TextFileLoadReason[TextFileLoadReason["EDITOR"] = 1] = "EDITOR";
        TextFileLoadReason[TextFileLoadReason["REFERENCE"] = 2] = "REFERENCE";
        TextFileLoadReason[TextFileLoadReason["OTHER"] = 3] = "OTHER";
    })(TextFileLoadReason = exports.TextFileLoadReason || (exports.TextFileLoadReason = {}));
    function snapshotToString(snapshot) {
        const chunks = [];
        let chunk;
        while (typeof (chunk = snapshot.read()) === 'string') {
            chunks.push(chunk);
        }
        return chunks.join('');
    }
    exports.snapshotToString = snapshotToString;
    function stringToSnapshot(value) {
        let done = false;
        return {
            read() {
                if (!done) {
                    done = true;
                    return value;
                }
                return null;
            }
        };
    }
    exports.stringToSnapshot = stringToSnapshot;
    class TextSnapshotReadable {
        constructor(snapshot, preamble) {
            this.snapshot = snapshot;
            this.preamble = preamble;
            this.preambleHandled = false;
        }
        read() {
            let value = this.snapshot.read();
            // Handle preamble if provided
            if (!this.preambleHandled) {
                this.preambleHandled = true;
                if (typeof this.preamble === 'string') {
                    if (typeof value === 'string') {
                        value = this.preamble + value;
                    }
                    else {
                        value = this.preamble;
                    }
                }
            }
            if (typeof value === 'string') {
                return buffer_1.VSBuffer.fromString(value);
            }
            return null;
        }
    }
    exports.TextSnapshotReadable = TextSnapshotReadable;
    function toBufferOrReadable(value) {
        if (typeof value === 'undefined') {
            return undefined;
        }
        if (typeof value === 'string') {
            return buffer_1.VSBuffer.fromString(value);
        }
        return new TextSnapshotReadable(value);
    }
    exports.toBufferOrReadable = toBufferOrReadable;
    exports.SUPPORTED_ENCODINGS = 
    // Desktop
    platform_1.isNative ?
        {
            utf8: {
                labelLong: 'UTF-8',
                labelShort: 'UTF-8',
                order: 1,
                alias: 'utf8bom'
            },
            utf8bom: {
                labelLong: 'UTF-8 with BOM',
                labelShort: 'UTF-8 with BOM',
                encodeOnly: true,
                order: 2,
                alias: 'utf8'
            },
            utf16le: {
                labelLong: 'UTF-16 LE',
                labelShort: 'UTF-16 LE',
                order: 3
            },
            utf16be: {
                labelLong: 'UTF-16 BE',
                labelShort: 'UTF-16 BE',
                order: 4
            },
            windows1252: {
                labelLong: 'Western (Windows 1252)',
                labelShort: 'Windows 1252',
                order: 5
            },
            iso88591: {
                labelLong: 'Western (ISO 8859-1)',
                labelShort: 'ISO 8859-1',
                order: 6
            },
            iso88593: {
                labelLong: 'Western (ISO 8859-3)',
                labelShort: 'ISO 8859-3',
                order: 7
            },
            iso885915: {
                labelLong: 'Western (ISO 8859-15)',
                labelShort: 'ISO 8859-15',
                order: 8
            },
            macroman: {
                labelLong: 'Western (Mac Roman)',
                labelShort: 'Mac Roman',
                order: 9
            },
            cp437: {
                labelLong: 'DOS (CP 437)',
                labelShort: 'CP437',
                order: 10
            },
            windows1256: {
                labelLong: 'Arabic (Windows 1256)',
                labelShort: 'Windows 1256',
                order: 11
            },
            iso88596: {
                labelLong: 'Arabic (ISO 8859-6)',
                labelShort: 'ISO 8859-6',
                order: 12
            },
            windows1257: {
                labelLong: 'Baltic (Windows 1257)',
                labelShort: 'Windows 1257',
                order: 13
            },
            iso88594: {
                labelLong: 'Baltic (ISO 8859-4)',
                labelShort: 'ISO 8859-4',
                order: 14
            },
            iso885914: {
                labelLong: 'Celtic (ISO 8859-14)',
                labelShort: 'ISO 8859-14',
                order: 15
            },
            windows1250: {
                labelLong: 'Central European (Windows 1250)',
                labelShort: 'Windows 1250',
                order: 16
            },
            iso88592: {
                labelLong: 'Central European (ISO 8859-2)',
                labelShort: 'ISO 8859-2',
                order: 17
            },
            cp852: {
                labelLong: 'Central European (CP 852)',
                labelShort: 'CP 852',
                order: 18
            },
            windows1251: {
                labelLong: 'Cyrillic (Windows 1251)',
                labelShort: 'Windows 1251',
                order: 19
            },
            cp866: {
                labelLong: 'Cyrillic (CP 866)',
                labelShort: 'CP 866',
                order: 20
            },
            iso88595: {
                labelLong: 'Cyrillic (ISO 8859-5)',
                labelShort: 'ISO 8859-5',
                order: 21
            },
            koi8r: {
                labelLong: 'Cyrillic (KOI8-R)',
                labelShort: 'KOI8-R',
                order: 22
            },
            koi8u: {
                labelLong: 'Cyrillic (KOI8-U)',
                labelShort: 'KOI8-U',
                order: 23
            },
            iso885913: {
                labelLong: 'Estonian (ISO 8859-13)',
                labelShort: 'ISO 8859-13',
                order: 24
            },
            windows1253: {
                labelLong: 'Greek (Windows 1253)',
                labelShort: 'Windows 1253',
                order: 25
            },
            iso88597: {
                labelLong: 'Greek (ISO 8859-7)',
                labelShort: 'ISO 8859-7',
                order: 26
            },
            windows1255: {
                labelLong: 'Hebrew (Windows 1255)',
                labelShort: 'Windows 1255',
                order: 27
            },
            iso88598: {
                labelLong: 'Hebrew (ISO 8859-8)',
                labelShort: 'ISO 8859-8',
                order: 28
            },
            iso885910: {
                labelLong: 'Nordic (ISO 8859-10)',
                labelShort: 'ISO 8859-10',
                order: 29
            },
            iso885916: {
                labelLong: 'Romanian (ISO 8859-16)',
                labelShort: 'ISO 8859-16',
                order: 30
            },
            windows1254: {
                labelLong: 'Turkish (Windows 1254)',
                labelShort: 'Windows 1254',
                order: 31
            },
            iso88599: {
                labelLong: 'Turkish (ISO 8859-9)',
                labelShort: 'ISO 8859-9',
                order: 32
            },
            windows1258: {
                labelLong: 'Vietnamese (Windows 1258)',
                labelShort: 'Windows 1258',
                order: 33
            },
            gbk: {
                labelLong: 'Simplified Chinese (GBK)',
                labelShort: 'GBK',
                order: 34
            },
            gb18030: {
                labelLong: 'Simplified Chinese (GB18030)',
                labelShort: 'GB18030',
                order: 35
            },
            cp950: {
                labelLong: 'Traditional Chinese (Big5)',
                labelShort: 'Big5',
                order: 36
            },
            big5hkscs: {
                labelLong: 'Traditional Chinese (Big5-HKSCS)',
                labelShort: 'Big5-HKSCS',
                order: 37
            },
            shiftjis: {
                labelLong: 'Japanese (Shift JIS)',
                labelShort: 'Shift JIS',
                order: 38
            },
            eucjp: {
                labelLong: 'Japanese (EUC-JP)',
                labelShort: 'EUC-JP',
                order: 39
            },
            euckr: {
                labelLong: 'Korean (EUC-KR)',
                labelShort: 'EUC-KR',
                order: 40
            },
            windows874: {
                labelLong: 'Thai (Windows 874)',
                labelShort: 'Windows 874',
                order: 41
            },
            iso885911: {
                labelLong: 'Latin/Thai (ISO 8859-11)',
                labelShort: 'ISO 8859-11',
                order: 42
            },
            koi8ru: {
                labelLong: 'Cyrillic (KOI8-RU)',
                labelShort: 'KOI8-RU',
                order: 43
            },
            koi8t: {
                labelLong: 'Tajik (KOI8-T)',
                labelShort: 'KOI8-T',
                order: 44
            },
            gb2312: {
                labelLong: 'Simplified Chinese (GB 2312)',
                labelShort: 'GB 2312',
                order: 45
            },
            cp865: {
                labelLong: 'Nordic DOS (CP 865)',
                labelShort: 'CP 865',
                order: 46
            },
            cp850: {
                labelLong: 'Western European DOS (CP 850)',
                labelShort: 'CP 850',
                order: 47
            }
        } :
        // Web (https://github.com/microsoft/vscode/issues/79275)
        {
            utf8: {
                labelLong: 'UTF-8',
                labelShort: 'UTF-8',
                order: 1,
                alias: 'utf8bom'
            }
        };
});
//# __sourceMappingURL=textfiles.js.map