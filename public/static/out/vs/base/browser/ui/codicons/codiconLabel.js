/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/base/common/codicons"], function (require, exports, strings_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodiconLabel = void 0;
    class CodiconLabel {
        constructor(_container) {
            this._container = _container;
        }
        set text(text) {
            this._container.innerHTML = codicons_1.renderCodicons(strings_1.escape(text !== null && text !== void 0 ? text : ''));
        }
        set title(title) {
            this._container.title = title;
        }
    }
    exports.CodiconLabel = CodiconLabel;
});
//# __sourceMappingURL=codiconLabel.js.map