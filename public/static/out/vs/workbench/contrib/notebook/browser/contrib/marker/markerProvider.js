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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/editor/contrib/gotoError/markerNavigationService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/markers/common/markers"], function (require, exports, platform_1, contributions_1, markerNavigationService_1, notebookCommon_1, markers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let MarkerListProvider = class MarkerListProvider {
        constructor(_markerService, markerNavigation) {
            this._markerService = _markerService;
            this._dispoables = markerNavigation.registerProvider(this);
        }
        dispose() {
            this._dispoables.dispose();
        }
        getMarkerList(resource) {
            if (!resource) {
                return undefined;
            }
            const data = notebookCommon_1.CellUri.parse(resource);
            if (!data) {
                return undefined;
            }
            return new markerNavigationService_1.MarkerList(uri => {
                const otherData = notebookCommon_1.CellUri.parse(uri);
                return (otherData === null || otherData === void 0 ? void 0 : otherData.notebook.toString()) === data.notebook.toString();
            }, this._markerService);
        }
    };
    MarkerListProvider = __decorate([
        __param(0, markers_1.IMarkerService),
        __param(1, markerNavigationService_1.IMarkerNavigationService)
    ], MarkerListProvider);
    platform_1.Registry
        .as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(MarkerListProvider, 2 /* Ready */);
});
//# __sourceMappingURL=markerProvider.js.map