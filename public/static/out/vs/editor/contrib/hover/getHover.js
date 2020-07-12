/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/editor/browser/editorExtensions", "vs/editor/common/modes"], function (require, exports, arrays_1, cancellation_1, errors_1, editorExtensions_1, modes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getHover = void 0;
    function getHover(model, position, token) {
        const supports = modes_1.HoverProviderRegistry.ordered(model);
        const promises = supports.map(support => {
            return Promise.resolve(support.provideHover(model, position, token)).then(hover => {
                return hover && isValid(hover) ? hover : undefined;
            }, err => {
                errors_1.onUnexpectedExternalError(err);
                return undefined;
            });
        });
        return Promise.all(promises).then(arrays_1.coalesce);
    }
    exports.getHover = getHover;
    editorExtensions_1.registerModelAndPositionCommand('_executeHoverProvider', (model, position) => getHover(model, position, cancellation_1.CancellationToken.None));
    function isValid(result) {
        const hasRange = (typeof result.range !== 'undefined');
        const hasHtmlContent = typeof result.contents !== 'undefined' && result.contents && result.contents.length > 0;
        return hasRange && hasHtmlContent;
    }
});
//# __sourceMappingURL=getHover.js.map