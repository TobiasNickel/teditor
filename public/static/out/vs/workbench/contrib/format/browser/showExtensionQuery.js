/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/extensions/common/extensions"], function (require, exports, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.showExtensionQuery = void 0;
    function showExtensionQuery(viewletService, query) {
        return viewletService.openViewlet(extensions_1.VIEWLET_ID, true).then(viewlet => {
            if (viewlet) {
                (viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer()).search(query);
            }
        });
    }
    exports.showExtensionQuery = showExtensionQuery;
});
//# __sourceMappingURL=showExtensionQuery.js.map