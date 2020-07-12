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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "./markersModel", "vs/base/common/lifecycle", "vs/platform/markers/common/markers", "vs/workbench/services/activity/common/activity", "vs/nls", "./constants", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/map"], function (require, exports, instantiation_1, markersModel_1, lifecycle_1, markers_1, activity_1, nls_1, constants_1, arrays_1, event_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ActivityUpdater = exports.MarkersWorkbenchService = exports.IMarkersWorkbenchService = void 0;
    exports.IMarkersWorkbenchService = instantiation_1.createDecorator('markersWorkbenchService');
    let MarkersWorkbenchService = class MarkersWorkbenchService extends lifecycle_1.Disposable {
        constructor(markerService, instantiationService) {
            super();
            this.markerService = markerService;
            this.markersModel = this._register(instantiationService.createInstance(markersModel_1.MarkersModel));
            this.markersModel.setResourceMarkers(arrays_1.groupBy(this.readMarkers(), markersModel_1.compareMarkersByUri).map(group => [group[0].resource, group]));
            this._register(event_1.Event.debounce(markerService.onMarkerChanged, (resourcesMap, resources) => {
                resourcesMap = resourcesMap ? resourcesMap : new map_1.ResourceMap();
                resources.forEach(resource => resourcesMap.set(resource, resource));
                return resourcesMap;
            }, 0)(resourcesMap => this.onMarkerChanged([...resourcesMap.values()])));
        }
        onMarkerChanged(resources) {
            this.markersModel.setResourceMarkers(resources.map(resource => [resource, this.readMarkers(resource)]));
        }
        readMarkers(resource) {
            return this.markerService.read({ resource, severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning | markers_1.MarkerSeverity.Info });
        }
    };
    MarkersWorkbenchService = __decorate([
        __param(0, markers_1.IMarkerService),
        __param(1, instantiation_1.IInstantiationService)
    ], MarkersWorkbenchService);
    exports.MarkersWorkbenchService = MarkersWorkbenchService;
    let ActivityUpdater = class ActivityUpdater extends lifecycle_1.Disposable {
        constructor(instantiationService, markerService) {
            super();
            this.markerService = markerService;
            this.activity = this._register(instantiationService.createInstance(activity_1.ViewContaierActivityByView, constants_1.default.MARKERS_VIEW_ID));
            this._register(this.markerService.onMarkerChanged(() => this.updateActivity()));
            this.updateActivity();
        }
        updateActivity() {
            const { errors, warnings, infos } = this.markerService.getStatistics();
            const total = errors + warnings + infos;
            const message = nls_1.localize('totalProblems', 'Total {0} Problems', total);
            this.activity.setActivity({ badge: new activity_1.NumberBadge(total, () => message) });
        }
    };
    ActivityUpdater = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, markers_1.IMarkerService)
    ], ActivityUpdater);
    exports.ActivityUpdater = ActivityUpdater;
});
//# __sourceMappingURL=markers.js.map