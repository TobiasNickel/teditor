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
define(["require", "exports", "vs/platform/markers/common/markers", "vs/base/common/uri", "../common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/workbench/services/uriIdentity/common/uriIdentity"], function (require, exports, markers_1, uri_1, extHost_protocol_1, extHostCustomers_1, uriIdentity_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadDiagnostics = void 0;
    let MainThreadDiagnostics = class MainThreadDiagnostics {
        constructor(extHostContext, _markerService, _uriIdentService) {
            this._markerService = _markerService;
            this._uriIdentService = _uriIdentService;
            this._activeOwners = new Set();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostDiagnostics);
            this._markerListener = this._markerService.onMarkerChanged(this._forwardMarkers, this);
        }
        dispose() {
            this._markerListener.dispose();
            this._activeOwners.forEach(owner => this._markerService.changeAll(owner, []));
            this._activeOwners.clear();
        }
        _forwardMarkers(resources) {
            const data = [];
            for (const resource of resources) {
                data.push([
                    resource,
                    this._markerService.read({ resource }).filter(marker => !this._activeOwners.has(marker.owner))
                ]);
            }
            this._proxy.$acceptMarkersChange(data);
        }
        $changeMany(owner, entries) {
            for (let entry of entries) {
                let [uri, markers] = entry;
                if (markers) {
                    for (const marker of markers) {
                        if (marker.relatedInformation) {
                            for (const relatedInformation of marker.relatedInformation) {
                                relatedInformation.resource = uri_1.URI.revive(relatedInformation.resource);
                            }
                        }
                        if (marker.code && typeof marker.code !== 'string') {
                            marker.code.target = uri_1.URI.revive(marker.code.target);
                        }
                    }
                }
                this._markerService.changeOne(owner, this._uriIdentService.asCanonicalUri(uri_1.URI.revive(uri)), markers);
            }
            this._activeOwners.add(owner);
        }
        $clear(owner) {
            this._markerService.changeAll(owner, []);
            this._activeOwners.delete(owner);
        }
    };
    MainThreadDiagnostics = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadDiagnostics),
        __param(1, markers_1.IMarkerService),
        __param(2, uriIdentity_1.IUriIdentityService)
    ], MainThreadDiagnostics);
    exports.MainThreadDiagnostics = MainThreadDiagnostics;
});
//# __sourceMappingURL=mainThreadDiagnostics.js.map