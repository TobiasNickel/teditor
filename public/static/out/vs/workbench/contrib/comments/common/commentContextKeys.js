/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentContextKeys = void 0;
    var CommentContextKeys;
    (function (CommentContextKeys) {
        /**
         * A context key that is set when the comment thread has no comments.
         */
        CommentContextKeys.commentThreadIsEmpty = new contextkey_1.RawContextKey('commentThreadIsEmpty', false);
        /**
         * A context key that is set when the comment has no input.
         */
        CommentContextKeys.commentIsEmpty = new contextkey_1.RawContextKey('commentIsEmpty', false);
    })(CommentContextKeys = exports.CommentContextKeys || (exports.CommentContextKeys = {}));
});
//# __sourceMappingURL=commentContextKeys.js.map