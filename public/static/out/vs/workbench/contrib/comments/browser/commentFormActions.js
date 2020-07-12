/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/button/button", "vs/base/common/lifecycle", "vs/platform/theme/common/styler"], function (require, exports, DOM, button_1, lifecycle_1, styler_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentFormActions = void 0;
    class CommentFormActions {
        constructor(container, actionHandler, themeService) {
            this.container = container;
            this.actionHandler = actionHandler;
            this.themeService = themeService;
            this._buttonElements = [];
            this._toDispose = new lifecycle_1.DisposableStore();
            this._actions = [];
        }
        setActions(menu) {
            this._toDispose.clear();
            this._buttonElements.forEach(b => DOM.removeNode(b));
            const groups = menu.getActions({ shouldForwardArgs: true });
            for (const group of groups) {
                const [, actions] = group;
                this._actions = actions;
                actions.forEach(action => {
                    const button = new button_1.Button(this.container);
                    this._buttonElements.push(button.element);
                    this._toDispose.add(button);
                    this._toDispose.add(styler_1.attachButtonStyler(button, this.themeService));
                    this._toDispose.add(button.onDidClick(() => this.actionHandler(action)));
                    button.enabled = action.enabled;
                    button.label = action.label;
                });
            }
        }
        triggerDefaultAction() {
            if (this._actions.length) {
                let lastAction = this._actions[0];
                if (lastAction.enabled) {
                    this.actionHandler(lastAction);
                }
            }
        }
        dispose() {
            this._toDispose.dispose();
        }
    }
    exports.CommentFormActions = CommentFormActions;
});
//# __sourceMappingURL=commentFormActions.js.map