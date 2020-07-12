/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/uri"], function (require, exports, nls, dom, actionbar_1, actions_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReactionAction = exports.ReactionActionViewItem = exports.ToggleReactionsAction = void 0;
    class ToggleReactionsAction extends actions_1.Action {
        constructor(toggleDropdownMenu, title) {
            super(ToggleReactionsAction.ID, title || nls.localize('pickReactions', "Pick Reactions..."), 'toggle-reactions', true);
            this._menuActions = [];
            this.toggleDropdownMenu = toggleDropdownMenu;
        }
        run() {
            this.toggleDropdownMenu();
            return Promise.resolve(true);
        }
        get menuActions() {
            return this._menuActions;
        }
        set menuActions(actions) {
            this._menuActions = actions;
        }
    }
    exports.ToggleReactionsAction = ToggleReactionsAction;
    ToggleReactionsAction.ID = 'toolbar.toggle.pickReactions';
    class ReactionActionViewItem extends actionbar_1.ActionViewItem {
        constructor(action) {
            super(null, action, {});
        }
        updateLabel() {
            if (!this.label) {
                return;
            }
            let action = this.getAction();
            if (action.class) {
                this.label.classList.add(action.class);
            }
            if (!action.icon) {
                let reactionLabel = dom.append(this.label, dom.$('span.reaction-label'));
                reactionLabel.innerText = action.label;
            }
            else {
                let reactionIcon = dom.append(this.label, dom.$('.reaction-icon'));
                reactionIcon.style.display = '';
                let uri = uri_1.URI.revive(action.icon);
                reactionIcon.style.backgroundImage = `url('${uri}')`;
                reactionIcon.title = action.label;
            }
            if (action.count) {
                let reactionCount = dom.append(this.label, dom.$('span.reaction-count'));
                reactionCount.innerText = `${action.count}`;
            }
        }
    }
    exports.ReactionActionViewItem = ReactionActionViewItem;
    class ReactionAction extends actions_1.Action {
        constructor(id, label = '', cssClass = '', enabled = true, actionCallback, icon, count) {
            super(ReactionAction.ID, label, cssClass, enabled, actionCallback);
            this.icon = icon;
            this.count = count;
        }
    }
    exports.ReactionAction = ReactionAction;
    ReactionAction.ID = 'toolbar.toggle.reaction';
});
//# __sourceMappingURL=reactionsAction.js.map