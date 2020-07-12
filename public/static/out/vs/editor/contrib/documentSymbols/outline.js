/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutlineConfigKeys = exports.OutlineViewFocused = exports.OutlineViewFiltered = exports.OutlineViewId = void 0;
    exports.OutlineViewId = 'outline';
    exports.OutlineViewFiltered = new contextkey_1.RawContextKey('outlineFiltered', false);
    exports.OutlineViewFocused = new contextkey_1.RawContextKey('outlineFocused', false);
    var OutlineConfigKeys;
    (function (OutlineConfigKeys) {
        OutlineConfigKeys["icons"] = "outline.icons";
        OutlineConfigKeys["problemsEnabled"] = "outline.problems.enabled";
        OutlineConfigKeys["problemsColors"] = "outline.problems.colors";
        OutlineConfigKeys["problemsBadges"] = "outline.problems.badges";
    })(OutlineConfigKeys = exports.OutlineConfigKeys || (exports.OutlineConfigKeys = {}));
});
//# __sourceMappingURL=outline.js.map