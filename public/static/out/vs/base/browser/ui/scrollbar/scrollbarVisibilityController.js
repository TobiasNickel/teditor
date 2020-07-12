/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle"], function (require, exports, async_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ScrollbarVisibilityController = void 0;
    class ScrollbarVisibilityController extends lifecycle_1.Disposable {
        constructor(visibility, visibleClassName, invisibleClassName) {
            super();
            this._visibility = visibility;
            this._visibleClassName = visibleClassName;
            this._invisibleClassName = invisibleClassName;
            this._domNode = null;
            this._isVisible = false;
            this._isNeeded = false;
            this._shouldBeVisible = false;
            this._revealTimer = this._register(new async_1.TimeoutTimer());
        }
        // ----------------- Hide / Reveal
        applyVisibilitySetting(shouldBeVisible) {
            if (this._visibility === 2 /* Hidden */) {
                return false;
            }
            if (this._visibility === 3 /* Visible */) {
                return true;
            }
            return shouldBeVisible;
        }
        setShouldBeVisible(rawShouldBeVisible) {
            let shouldBeVisible = this.applyVisibilitySetting(rawShouldBeVisible);
            if (this._shouldBeVisible !== shouldBeVisible) {
                this._shouldBeVisible = shouldBeVisible;
                this.ensureVisibility();
            }
        }
        setIsNeeded(isNeeded) {
            if (this._isNeeded !== isNeeded) {
                this._isNeeded = isNeeded;
                this.ensureVisibility();
            }
        }
        setDomNode(domNode) {
            this._domNode = domNode;
            this._domNode.setClassName(this._invisibleClassName);
            // Now that the flags & the dom node are in a consistent state, ensure the Hidden/Visible configuration
            this.setShouldBeVisible(false);
        }
        ensureVisibility() {
            if (!this._isNeeded) {
                // Nothing to be rendered
                this._hide(false);
                return;
            }
            if (this._shouldBeVisible) {
                this._reveal();
            }
            else {
                this._hide(true);
            }
        }
        _reveal() {
            if (this._isVisible) {
                return;
            }
            this._isVisible = true;
            // The CSS animation doesn't play otherwise
            this._revealTimer.setIfNotSet(() => {
                if (this._domNode) {
                    this._domNode.setClassName(this._visibleClassName);
                }
            }, 0);
        }
        _hide(withFadeAway) {
            this._revealTimer.cancel();
            if (!this._isVisible) {
                return;
            }
            this._isVisible = false;
            if (this._domNode) {
                this._domNode.setClassName(this._invisibleClassName + (withFadeAway ? ' fade' : ''));
            }
        }
    }
    exports.ScrollbarVisibilityController = ScrollbarVisibilityController;
});
//# __sourceMappingURL=scrollbarVisibilityController.js.map