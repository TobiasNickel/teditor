/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/nls", "vs/base/common/severity"], function (require, exports, instantiation_1, nls_1, severity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IMarkerService = exports.IMarkerData = exports.MarkerSeverity = exports.MarkerTag = void 0;
    var MarkerTag;
    (function (MarkerTag) {
        MarkerTag[MarkerTag["Unnecessary"] = 1] = "Unnecessary";
        MarkerTag[MarkerTag["Deprecated"] = 2] = "Deprecated";
    })(MarkerTag = exports.MarkerTag || (exports.MarkerTag = {}));
    var MarkerSeverity;
    (function (MarkerSeverity) {
        MarkerSeverity[MarkerSeverity["Hint"] = 1] = "Hint";
        MarkerSeverity[MarkerSeverity["Info"] = 2] = "Info";
        MarkerSeverity[MarkerSeverity["Warning"] = 4] = "Warning";
        MarkerSeverity[MarkerSeverity["Error"] = 8] = "Error";
    })(MarkerSeverity = exports.MarkerSeverity || (exports.MarkerSeverity = {}));
    (function (MarkerSeverity) {
        function compare(a, b) {
            return b - a;
        }
        MarkerSeverity.compare = compare;
        const _displayStrings = Object.create(null);
        _displayStrings[MarkerSeverity.Error] = nls_1.localize('sev.error', "Error");
        _displayStrings[MarkerSeverity.Warning] = nls_1.localize('sev.warning', "Warning");
        _displayStrings[MarkerSeverity.Info] = nls_1.localize('sev.info', "Info");
        function toString(a) {
            return _displayStrings[a] || '';
        }
        MarkerSeverity.toString = toString;
        function fromSeverity(severity) {
            switch (severity) {
                case severity_1.default.Error: return MarkerSeverity.Error;
                case severity_1.default.Warning: return MarkerSeverity.Warning;
                case severity_1.default.Info: return MarkerSeverity.Info;
                case severity_1.default.Ignore: return MarkerSeverity.Hint;
            }
        }
        MarkerSeverity.fromSeverity = fromSeverity;
        function toSeverity(severity) {
            switch (severity) {
                case MarkerSeverity.Error: return severity_1.default.Error;
                case MarkerSeverity.Warning: return severity_1.default.Warning;
                case MarkerSeverity.Info: return severity_1.default.Info;
                case MarkerSeverity.Hint: return severity_1.default.Ignore;
            }
        }
        MarkerSeverity.toSeverity = toSeverity;
    })(MarkerSeverity = exports.MarkerSeverity || (exports.MarkerSeverity = {}));
    var IMarkerData;
    (function (IMarkerData) {
        const emptyString = '';
        function makeKey(markerData) {
            return makeKeyOptionalMessage(markerData, true);
        }
        IMarkerData.makeKey = makeKey;
        function makeKeyOptionalMessage(markerData, useMessage) {
            let result = [emptyString];
            if (markerData.source) {
                result.push(markerData.source.replace('¦', '\\¦'));
            }
            else {
                result.push(emptyString);
            }
            if (markerData.code) {
                if (typeof markerData.code === 'string') {
                    result.push(markerData.code.replace('¦', '\\¦'));
                }
                else {
                    result.push(markerData.code.value.replace('¦', '\\¦'));
                }
            }
            else {
                result.push(emptyString);
            }
            if (markerData.severity !== undefined && markerData.severity !== null) {
                result.push(MarkerSeverity.toString(markerData.severity));
            }
            else {
                result.push(emptyString);
            }
            // Modifed to not include the message as part of the marker key to work around
            // https://github.com/microsoft/vscode/issues/77475
            if (markerData.message && useMessage) {
                result.push(markerData.message.replace('¦', '\\¦'));
            }
            else {
                result.push(emptyString);
            }
            if (markerData.startLineNumber !== undefined && markerData.startLineNumber !== null) {
                result.push(markerData.startLineNumber.toString());
            }
            else {
                result.push(emptyString);
            }
            if (markerData.startColumn !== undefined && markerData.startColumn !== null) {
                result.push(markerData.startColumn.toString());
            }
            else {
                result.push(emptyString);
            }
            if (markerData.endLineNumber !== undefined && markerData.endLineNumber !== null) {
                result.push(markerData.endLineNumber.toString());
            }
            else {
                result.push(emptyString);
            }
            if (markerData.endColumn !== undefined && markerData.endColumn !== null) {
                result.push(markerData.endColumn.toString());
            }
            else {
                result.push(emptyString);
            }
            result.push(emptyString);
            return result.join('¦');
        }
        IMarkerData.makeKeyOptionalMessage = makeKeyOptionalMessage;
    })(IMarkerData = exports.IMarkerData || (exports.IMarkerData = {}));
    exports.IMarkerService = instantiation_1.createDecorator('markerService');
});
//# __sourceMappingURL=markers.js.map