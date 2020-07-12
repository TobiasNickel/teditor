/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAuthorityResolverError = exports.RemoteAuthorityResolverErrorCode = exports.IRemoteAuthorityResolverService = void 0;
    exports.IRemoteAuthorityResolverService = instantiation_1.createDecorator('remoteAuthorityResolverService');
    var RemoteAuthorityResolverErrorCode;
    (function (RemoteAuthorityResolverErrorCode) {
        RemoteAuthorityResolverErrorCode["Unknown"] = "Unknown";
        RemoteAuthorityResolverErrorCode["NotAvailable"] = "NotAvailable";
        RemoteAuthorityResolverErrorCode["TemporarilyNotAvailable"] = "TemporarilyNotAvailable";
        RemoteAuthorityResolverErrorCode["NoResolverFound"] = "NoResolverFound";
    })(RemoteAuthorityResolverErrorCode = exports.RemoteAuthorityResolverErrorCode || (exports.RemoteAuthorityResolverErrorCode = {}));
    class RemoteAuthorityResolverError extends Error {
        constructor(message, code = RemoteAuthorityResolverErrorCode.Unknown, detail) {
            super(message);
            this._message = message;
            this._code = code;
            this._detail = detail;
            this.isHandled = (code === RemoteAuthorityResolverErrorCode.NotAvailable) && detail === true;
            // workaround when extending builtin objects and when compiling to ES5, see:
            // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
            if (typeof Object.setPrototypeOf === 'function') {
                Object.setPrototypeOf(this, RemoteAuthorityResolverError.prototype);
            }
        }
        static isTemporarilyNotAvailable(err) {
            return (err instanceof RemoteAuthorityResolverError) && err._code === RemoteAuthorityResolverErrorCode.TemporarilyNotAvailable;
        }
        static isNoResolverFound(err) {
            return (err instanceof RemoteAuthorityResolverError) && err._code === RemoteAuthorityResolverErrorCode.NoResolverFound;
        }
        static isHandled(err) {
            return (err instanceof RemoteAuthorityResolverError) && err.isHandled;
        }
    }
    exports.RemoteAuthorityResolverError = RemoteAuthorityResolverError;
});
//# __sourceMappingURL=remoteAuthorityResolver.js.map