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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/views", "vs/base/common/event"], function (require, exports, lifecycle_1, instantiation_1, views_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProgressBadge = exports.IconBadge = exports.TextBadge = exports.NumberBadge = exports.ViewContaierActivityByView = exports.IActivityService = void 0;
    exports.IActivityService = instantiation_1.createDecorator('activityService');
    let ViewContaierActivityByView = class ViewContaierActivityByView extends lifecycle_1.Disposable {
        constructor(viewId, viewDescriptorService, activityService) {
            super();
            this.viewId = viewId;
            this.viewDescriptorService = viewDescriptorService;
            this.activityService = activityService;
            this.activity = undefined;
            this.activityDisposable = lifecycle_1.Disposable.None;
            this._register(event_1.Event.filter(this.viewDescriptorService.onDidChangeContainer, e => e.views.some(view => view.id === viewId))(() => this.update()));
            this._register(event_1.Event.filter(this.viewDescriptorService.onDidChangeLocation, e => e.views.some(view => view.id === viewId))(() => this.update()));
        }
        setActivity(activity) {
            this.activity = activity;
            this.update();
        }
        update() {
            this.activityDisposable.dispose();
            const container = this.viewDescriptorService.getViewContainerByViewId(this.viewId);
            if (container && this.activity) {
                this.activityDisposable = this.activityService.showViewContainerActivity(container.id, this.activity);
            }
        }
        dispose() {
            this.activityDisposable.dispose();
        }
    };
    ViewContaierActivityByView = __decorate([
        __param(1, views_1.IViewDescriptorService),
        __param(2, exports.IActivityService)
    ], ViewContaierActivityByView);
    exports.ViewContaierActivityByView = ViewContaierActivityByView;
    class BaseBadge {
        constructor(descriptorFn) {
            this.descriptorFn = descriptorFn;
            this.descriptorFn = descriptorFn;
        }
        getDescription() {
            return this.descriptorFn(null);
        }
    }
    class NumberBadge extends BaseBadge {
        constructor(number, descriptorFn) {
            super(descriptorFn);
            this.number = number;
            this.number = number;
        }
        getDescription() {
            return this.descriptorFn(this.number);
        }
    }
    exports.NumberBadge = NumberBadge;
    class TextBadge extends BaseBadge {
        constructor(text, descriptorFn) {
            super(descriptorFn);
            this.text = text;
        }
    }
    exports.TextBadge = TextBadge;
    class IconBadge extends BaseBadge {
        constructor(descriptorFn) {
            super(descriptorFn);
        }
    }
    exports.IconBadge = IconBadge;
    class ProgressBadge extends BaseBadge {
    }
    exports.ProgressBadge = ProgressBadge;
});
//# __sourceMappingURL=activity.js.map