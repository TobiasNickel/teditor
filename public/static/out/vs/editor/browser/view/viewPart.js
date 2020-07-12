/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/editor/common/viewModel/viewEventHandler"], function (require, exports, fastDomNode_1, viewEventHandler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PartFingerprints = exports.PartFingerprint = exports.ViewPart = void 0;
    class ViewPart extends viewEventHandler_1.ViewEventHandler {
        constructor(context) {
            super();
            this._context = context;
            this._context.addEventHandler(this);
        }
        dispose() {
            this._context.removeEventHandler(this);
            super.dispose();
        }
    }
    exports.ViewPart = ViewPart;
    var PartFingerprint;
    (function (PartFingerprint) {
        PartFingerprint[PartFingerprint["None"] = 0] = "None";
        PartFingerprint[PartFingerprint["ContentWidgets"] = 1] = "ContentWidgets";
        PartFingerprint[PartFingerprint["OverflowingContentWidgets"] = 2] = "OverflowingContentWidgets";
        PartFingerprint[PartFingerprint["OverflowGuard"] = 3] = "OverflowGuard";
        PartFingerprint[PartFingerprint["OverlayWidgets"] = 4] = "OverlayWidgets";
        PartFingerprint[PartFingerprint["ScrollableElement"] = 5] = "ScrollableElement";
        PartFingerprint[PartFingerprint["TextArea"] = 6] = "TextArea";
        PartFingerprint[PartFingerprint["ViewLines"] = 7] = "ViewLines";
        PartFingerprint[PartFingerprint["Minimap"] = 8] = "Minimap";
    })(PartFingerprint = exports.PartFingerprint || (exports.PartFingerprint = {}));
    class PartFingerprints {
        static write(target, partId) {
            if (target instanceof fastDomNode_1.FastDomNode) {
                target.setAttribute('data-mprt', String(partId));
            }
            else {
                target.setAttribute('data-mprt', String(partId));
            }
        }
        static read(target) {
            const r = target.getAttribute('data-mprt');
            if (r === null) {
                return 0 /* None */;
            }
            return parseInt(r, 10);
        }
        static collect(child, stopAt) {
            let result = [], resultLen = 0;
            while (child && child !== document.body) {
                if (child === stopAt) {
                    break;
                }
                if (child.nodeType === child.ELEMENT_NODE) {
                    result[resultLen++] = this.read(child);
                }
                child = child.parentElement;
            }
            const r = new Uint8Array(resultLen);
            for (let i = 0; i < resultLen; i++) {
                r[i] = result[resultLen - i - 1];
            }
            return r;
        }
    }
    exports.PartFingerprints = PartFingerprints;
});
//# __sourceMappingURL=viewPart.js.map