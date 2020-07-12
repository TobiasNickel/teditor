/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/instantiation"], function (require, exports, extensions_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ITimelineService = exports.TimelinePaneId = exports.toKey = void 0;
    function toKey(extension, source) {
        return `${typeof extension === 'string' ? extension : extensions_1.ExtensionIdentifier.toKey(extension)}|${source}`;
    }
    exports.toKey = toKey;
    exports.TimelinePaneId = 'timeline';
    const TIMELINE_SERVICE_ID = 'timeline';
    exports.ITimelineService = instantiation_1.createDecorator(TIMELINE_SERVICE_ID);
});
//# __sourceMappingURL=timeline.js.map