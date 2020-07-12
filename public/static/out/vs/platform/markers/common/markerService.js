/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/network", "vs/base/common/uri", "vs/base/common/event", "./markers", "vs/base/common/map", "vs/base/common/iterator"], function (require, exports, arrays_1, network_1, uri_1, event_1, markers_1, map_1, iterator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkerService = void 0;
    class DoubleResourceMap {
        constructor() {
            this._byResource = new map_1.ResourceMap();
            this._byOwner = new Map();
        }
        set(resource, owner, value) {
            let ownerMap = this._byResource.get(resource);
            if (!ownerMap) {
                ownerMap = new Map();
                this._byResource.set(resource, ownerMap);
            }
            ownerMap.set(owner, value);
            let resourceMap = this._byOwner.get(owner);
            if (!resourceMap) {
                resourceMap = new map_1.ResourceMap();
                this._byOwner.set(owner, resourceMap);
            }
            resourceMap.set(resource, value);
        }
        get(resource, owner) {
            let ownerMap = this._byResource.get(resource);
            return ownerMap === null || ownerMap === void 0 ? void 0 : ownerMap.get(owner);
        }
        delete(resource, owner) {
            let removedA = false;
            let removedB = false;
            let ownerMap = this._byResource.get(resource);
            if (ownerMap) {
                removedA = ownerMap.delete(owner);
            }
            let resourceMap = this._byOwner.get(owner);
            if (resourceMap) {
                removedB = resourceMap.delete(resource);
            }
            if (removedA !== removedB) {
                throw new Error('illegal state');
            }
            return removedA && removedB;
        }
        values(key) {
            var _a, _b, _c, _d;
            if (typeof key === 'string') {
                return (_b = (_a = this._byOwner.get(key)) === null || _a === void 0 ? void 0 : _a.values()) !== null && _b !== void 0 ? _b : iterator_1.Iterable.empty();
            }
            if (uri_1.URI.isUri(key)) {
                return (_d = (_c = this._byResource.get(key)) === null || _c === void 0 ? void 0 : _c.values()) !== null && _d !== void 0 ? _d : iterator_1.Iterable.empty();
            }
            return iterator_1.Iterable.map(iterator_1.Iterable.concat(...this._byOwner.values()), map => map[1]);
        }
    }
    class MarkerStats {
        constructor(service) {
            this.errors = 0;
            this.infos = 0;
            this.warnings = 0;
            this.unknowns = 0;
            this._data = new map_1.ResourceMap();
            this._service = service;
            this._subscription = service.onMarkerChanged(this._update, this);
        }
        dispose() {
            this._subscription.dispose();
        }
        _update(resources) {
            for (const resource of resources) {
                const oldStats = this._data.get(resource);
                if (oldStats) {
                    this._substract(oldStats);
                }
                const newStats = this._resourceStats(resource);
                this._add(newStats);
                this._data.set(resource, newStats);
            }
        }
        _resourceStats(resource) {
            const result = { errors: 0, warnings: 0, infos: 0, unknowns: 0 };
            // TODO this is a hack
            if (resource.scheme === network_1.Schemas.inMemory || resource.scheme === network_1.Schemas.walkThrough || resource.scheme === network_1.Schemas.walkThroughSnippet) {
                return result;
            }
            for (const { severity } of this._service.read({ resource })) {
                if (severity === markers_1.MarkerSeverity.Error) {
                    result.errors += 1;
                }
                else if (severity === markers_1.MarkerSeverity.Warning) {
                    result.warnings += 1;
                }
                else if (severity === markers_1.MarkerSeverity.Info) {
                    result.infos += 1;
                }
                else {
                    result.unknowns += 1;
                }
            }
            return result;
        }
        _substract(op) {
            this.errors -= op.errors;
            this.warnings -= op.warnings;
            this.infos -= op.infos;
            this.unknowns -= op.unknowns;
        }
        _add(op) {
            this.errors += op.errors;
            this.warnings += op.warnings;
            this.infos += op.infos;
            this.unknowns += op.unknowns;
        }
    }
    class MarkerService {
        constructor() {
            this._onMarkerChanged = new event_1.Emitter();
            this.onMarkerChanged = event_1.Event.debounce(this._onMarkerChanged.event, MarkerService._debouncer, 0);
            this._data = new DoubleResourceMap();
            this._stats = new MarkerStats(this);
        }
        dispose() {
            this._stats.dispose();
        }
        getStatistics() {
            return this._stats;
        }
        remove(owner, resources) {
            for (const resource of resources || []) {
                this.changeOne(owner, resource, []);
            }
        }
        changeOne(owner, resource, markerData) {
            if (arrays_1.isFalsyOrEmpty(markerData)) {
                // remove marker for this (owner,resource)-tuple
                const removed = this._data.delete(resource, owner);
                if (removed) {
                    this._onMarkerChanged.fire([resource]);
                }
            }
            else {
                // insert marker for this (owner,resource)-tuple
                const markers = [];
                for (const data of markerData) {
                    const marker = MarkerService._toMarker(owner, resource, data);
                    if (marker) {
                        markers.push(marker);
                    }
                }
                this._data.set(resource, owner, markers);
                this._onMarkerChanged.fire([resource]);
            }
        }
        static _toMarker(owner, resource, data) {
            let { code, severity, message, source, startLineNumber, startColumn, endLineNumber, endColumn, relatedInformation, tags, } = data;
            if (!message) {
                return undefined;
            }
            // santize data
            startLineNumber = startLineNumber > 0 ? startLineNumber : 1;
            startColumn = startColumn > 0 ? startColumn : 1;
            endLineNumber = endLineNumber >= startLineNumber ? endLineNumber : startLineNumber;
            endColumn = endColumn > 0 ? endColumn : startColumn;
            return {
                resource,
                owner,
                code,
                severity,
                message,
                source,
                startLineNumber,
                startColumn,
                endLineNumber,
                endColumn,
                relatedInformation,
                tags,
            };
        }
        changeAll(owner, data) {
            const changes = [];
            // remove old marker
            const existing = this._data.values(owner);
            if (existing) {
                for (let data of existing) {
                    const first = iterator_1.Iterable.first(data);
                    if (first) {
                        changes.push(first.resource);
                        this._data.delete(first.resource, owner);
                    }
                }
            }
            // add new markers
            if (arrays_1.isNonEmptyArray(data)) {
                // group by resource
                const groups = new map_1.ResourceMap();
                for (const { resource, marker: markerData } of data) {
                    const marker = MarkerService._toMarker(owner, resource, markerData);
                    if (!marker) {
                        // filter bad markers
                        continue;
                    }
                    const array = groups.get(resource);
                    if (!array) {
                        groups.set(resource, [marker]);
                        changes.push(resource);
                    }
                    else {
                        array.push(marker);
                    }
                }
                // insert all
                for (const [resource, value] of groups) {
                    this._data.set(resource, owner, value);
                }
            }
            if (changes.length > 0) {
                this._onMarkerChanged.fire(changes);
            }
        }
        read(filter = Object.create(null)) {
            let { owner, resource, severities, take } = filter;
            if (!take || take < 0) {
                take = -1;
            }
            if (owner && resource) {
                // exactly one owner AND resource
                const data = this._data.get(resource, owner);
                if (!data) {
                    return [];
                }
                else {
                    const result = [];
                    for (const marker of data) {
                        if (MarkerService._accept(marker, severities)) {
                            const newLen = result.push(marker);
                            if (take > 0 && newLen === take) {
                                break;
                            }
                        }
                    }
                    return result;
                }
            }
            else if (!owner && !resource) {
                // all
                const result = [];
                for (let markers of this._data.values()) {
                    for (let data of markers) {
                        if (MarkerService._accept(data, severities)) {
                            const newLen = result.push(data);
                            if (take > 0 && newLen === take) {
                                return result;
                            }
                        }
                    }
                }
                return result;
            }
            else {
                // of one resource OR owner
                const iterable = this._data.values(resource !== null && resource !== void 0 ? resource : owner);
                const result = [];
                for (const markers of iterable) {
                    for (const data of markers) {
                        if (MarkerService._accept(data, severities)) {
                            const newLen = result.push(data);
                            if (take > 0 && newLen === take) {
                                return result;
                            }
                        }
                    }
                }
                return result;
            }
        }
        static _accept(marker, severities) {
            return severities === undefined || (severities & marker.severity) === marker.severity;
        }
        static _debouncer(last, event) {
            if (!last) {
                MarkerService._dedupeMap = new map_1.ResourceMap();
                last = [];
            }
            for (const uri of event) {
                if (!MarkerService._dedupeMap.has(uri)) {
                    MarkerService._dedupeMap.set(uri, true);
                    last.push(uri);
                }
            }
            return last;
        }
    }
    exports.MarkerService = MarkerService;
});
//# __sourceMappingURL=markerService.js.map