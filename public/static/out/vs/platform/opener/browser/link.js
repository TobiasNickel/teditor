/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/platform/opener/common/opener", "vs/base/browser/dom", "vs/base/browser/event", "vs/base/browser/keyboardEvent", "vs/base/common/lifecycle", "vs/base/common/color"], function (require, exports, event_1, opener_1, dom_1, event_2, keyboardEvent_1, lifecycle_1, color_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Link = void 0;
    let Link = class Link extends lifecycle_1.Disposable {
        constructor(link, openerService) {
            super();
            this.styles = {
                textLinkForeground: color_1.Color.fromHex('#006AB1')
            };
            this.el = dom_1.$('a', {
                tabIndex: 0,
                href: link.href,
                title: link.title
            }, link.label);
            const onClick = event_2.domEvent(this.el, 'click');
            const onEnterPress = event_1.Event.chain(event_2.domEvent(this.el, 'keypress'))
                .map(e => new keyboardEvent_1.StandardKeyboardEvent(e))
                .filter(e => e.keyCode === 3 /* Enter */)
                .event;
            const onOpen = event_1.Event.any(onClick, onEnterPress);
            this._register(onOpen(e => {
                dom_1.EventHelper.stop(e, true);
                openerService.open(link.href);
            }));
            this.applyStyles();
        }
        style(styles) {
            this.styles = styles;
            this.applyStyles();
        }
        applyStyles() {
            var _a;
            this.el.style.color = ((_a = this.styles.textLinkForeground) === null || _a === void 0 ? void 0 : _a.toString()) || '';
        }
    };
    Link = __decorate([
        __param(1, opener_1.IOpenerService)
    ], Link);
    exports.Link = Link;
});
//# __sourceMappingURL=link.js.map