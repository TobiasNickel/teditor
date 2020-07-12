/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHost.protocol", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes"], function (require, exports, extHost_protocol_1, typeConvert, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLanguages = void 0;
    class ExtHostLanguages {
        constructor(mainContext, documents) {
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadLanguages);
            this._documents = documents;
        }
        getLanguages() {
            return this._proxy.$getLanguages();
        }
        async changeLanguage(uri, languageId) {
            await this._proxy.$changeLanguage(uri, languageId);
            const data = this._documents.getDocumentData(uri);
            if (!data) {
                throw new Error(`document '${uri.toString}' NOT found`);
            }
            return data.document;
        }
        async tokenAtPosition(document, position) {
            var _a;
            const versionNow = document.version;
            const pos = typeConvert.Position.from(position);
            const info = await this._proxy.$tokensAtPosition(document.uri, pos);
            const defaultRange = {
                type: extHostTypes_1.StandardTokenType.Other,
                range: (_a = document.getWordRangeAtPosition(position)) !== null && _a !== void 0 ? _a : new extHostTypes_1.Range(position.line, position.character, position.line, position.character)
            };
            if (!info) {
                // no result
                return defaultRange;
            }
            const result = {
                range: typeConvert.Range.to(info.range),
                type: typeConvert.TokenType.to(info.type)
            };
            if (!result.range.contains(position)) {
                // bogous result
                return defaultRange;
            }
            if (versionNow !== document.version) {
                // concurrent change
                return defaultRange;
            }
            return result;
        }
    }
    exports.ExtHostLanguages = ExtHostLanguages;
});
//# __sourceMappingURL=extHostLanguages.js.map