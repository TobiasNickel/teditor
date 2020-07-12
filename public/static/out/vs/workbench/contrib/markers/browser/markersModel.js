/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources", "vs/editor/common/core/range", "vs/platform/markers/common/markers", "vs/base/common/arrays", "vs/base/common/map", "vs/base/common/event", "vs/base/common/hash", "vs/base/common/types"], function (require, exports, resources_1, range_1, markers_1, arrays_1, map_1, event_1, hash_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkersModel = exports.RelatedInformation = exports.Marker = exports.ResourceMarkers = exports.compareMarkersByUri = void 0;
    function compareMarkersByUri(a, b) {
        return resources_1.extUri.compare(a.resource, b.resource);
    }
    exports.compareMarkersByUri = compareMarkersByUri;
    function compareResourceMarkers(a, b) {
        let [firstMarkerOfA] = a.markers;
        let [firstMarkerOfB] = b.markers;
        let res = 0;
        if (firstMarkerOfA && firstMarkerOfB) {
            res = markers_1.MarkerSeverity.compare(firstMarkerOfA.marker.severity, firstMarkerOfB.marker.severity);
        }
        if (res === 0) {
            res = a.path.localeCompare(b.path) || a.name.localeCompare(b.name);
        }
        return res;
    }
    class ResourceMarkers {
        constructor(id, resource) {
            this.id = id;
            this.resource = resource;
            this._markersMap = new map_1.ResourceMap();
            this._total = 0;
            this.path = this.resource.fsPath;
            this.name = resources_1.basename(this.resource);
        }
        get markers() {
            if (!this._cachedMarkers) {
                this._cachedMarkers = arrays_1.mergeSort(arrays_1.flatten([...this._markersMap.values()]), ResourceMarkers._compareMarkers);
            }
            return this._cachedMarkers;
        }
        has(uri) {
            return this._markersMap.has(uri);
        }
        set(uri, marker) {
            this.delete(uri);
            if (arrays_1.isNonEmptyArray(marker)) {
                this._markersMap.set(uri, marker);
                this._total += marker.length;
                this._cachedMarkers = undefined;
            }
        }
        delete(uri) {
            let array = this._markersMap.get(uri);
            if (array) {
                this._total -= array.length;
                this._cachedMarkers = undefined;
                this._markersMap.delete(uri);
            }
        }
        get total() {
            return this._total;
        }
        static _compareMarkers(a, b) {
            return markers_1.MarkerSeverity.compare(a.marker.severity, b.marker.severity)
                || resources_1.extUri.compare(a.resource, b.resource)
                || range_1.Range.compareRangesUsingStarts(a.marker, b.marker);
        }
    }
    exports.ResourceMarkers = ResourceMarkers;
    class Marker {
        constructor(id, marker, relatedInformation = []) {
            this.id = id;
            this.marker = marker;
            this.relatedInformation = relatedInformation;
        }
        get resource() { return this.marker.resource; }
        get range() { return this.marker; }
        get lines() {
            if (!this._lines) {
                this._lines = this.marker.message.split(/\r\n|\r|\n/g);
            }
            return this._lines;
        }
        toString() {
            return JSON.stringify(Object.assign(Object.assign({}, this.marker), { resource: this.marker.resource.path, relatedInformation: this.relatedInformation.length ? this.relatedInformation.map(r => (Object.assign(Object.assign({}, r.raw), { resource: r.raw.resource.path }))) : undefined }), null, '\t');
        }
    }
    exports.Marker = Marker;
    class RelatedInformation {
        constructor(id, marker, raw) {
            this.id = id;
            this.marker = marker;
            this.raw = raw;
        }
    }
    exports.RelatedInformation = RelatedInformation;
    class MarkersModel {
        constructor() {
            this.cachedSortedResources = undefined;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._total = 0;
            this.resourcesByUri = new Map();
        }
        get resourceMarkers() {
            if (!this.cachedSortedResources) {
                this.cachedSortedResources = [...this.resourcesByUri.values()].sort(compareResourceMarkers);
            }
            return this.cachedSortedResources;
        }
        get total() {
            return this._total;
        }
        getResourceMarkers(resource) {
            return types_1.withUndefinedAsNull(this.resourcesByUri.get(resources_1.extUri.getComparisonKey(resource, true)));
        }
        setResourceMarkers(resourcesMarkers) {
            const change = { added: new Set(), removed: new Set(), updated: new Set() };
            for (const [resource, rawMarkers] of resourcesMarkers) {
                const key = resources_1.extUri.getComparisonKey(resource, true);
                let resourceMarkers = this.resourcesByUri.get(key);
                if (arrays_1.isNonEmptyArray(rawMarkers)) {
                    // update, add
                    if (!resourceMarkers) {
                        const resourceMarkersId = this.id(resource.toString());
                        resourceMarkers = new ResourceMarkers(resourceMarkersId, resource.with({ fragment: null }));
                        this.resourcesByUri.set(key, resourceMarkers);
                        change.added.add(resourceMarkers);
                    }
                    else {
                        change.updated.add(resourceMarkers);
                    }
                    const markersCountByKey = new Map();
                    const markers = rawMarkers.map((rawMarker) => {
                        const key = markers_1.IMarkerData.makeKey(rawMarker);
                        const index = markersCountByKey.get(key) || 0;
                        markersCountByKey.set(key, index + 1);
                        const markerId = this.id(resourceMarkers.id, key, index, rawMarker.resource.toString());
                        let relatedInformation = undefined;
                        if (rawMarker.relatedInformation) {
                            relatedInformation = rawMarker.relatedInformation.map((r, index) => new RelatedInformation(this.id(markerId, r.resource.toString(), r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn, index), rawMarker, r));
                        }
                        return new Marker(markerId, rawMarker, relatedInformation);
                    });
                    this._total -= resourceMarkers.total;
                    resourceMarkers.set(resource, markers);
                    this._total += resourceMarkers.total;
                }
                else if (resourceMarkers) {
                    // clear
                    this._total -= resourceMarkers.total;
                    resourceMarkers.delete(resource);
                    this._total += resourceMarkers.total;
                    if (resourceMarkers.total === 0) {
                        this.resourcesByUri.delete(key);
                        change.removed.add(resourceMarkers);
                    }
                    else {
                        change.updated.add(resourceMarkers);
                    }
                }
            }
            this.cachedSortedResources = undefined;
            if (change.added.size || change.removed.size || change.updated.size) {
                this._onDidChange.fire(change);
            }
        }
        id(...values) {
            const hasher = new hash_1.Hasher();
            for (const value of values) {
                hasher.hash(value);
            }
            return `${hasher.value}`;
        }
        dispose() {
            this._onDidChange.dispose();
            this.resourcesByUri.clear();
        }
    }
    exports.MarkersModel = MarkersModel;
});
//# __sourceMappingURL=markersModel.js.map