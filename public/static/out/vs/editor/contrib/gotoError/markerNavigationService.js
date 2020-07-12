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
define(["require", "exports", "vs/platform/markers/common/markers", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/base/common/strings", "vs/base/common/arrays", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/base/common/linkedList"], function (require, exports, markers_1, uri_1, event_1, lifecycle_1, range_1, strings_1, arrays_1, instantiation_1, extensions_1, linkedList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IMarkerNavigationService = exports.MarkerList = exports.MarkerCoordinate = void 0;
    class MarkerCoordinate {
        constructor(marker, index, total) {
            this.marker = marker;
            this.index = index;
            this.total = total;
        }
    }
    exports.MarkerCoordinate = MarkerCoordinate;
    let MarkerList = class MarkerList {
        constructor(resourceFilter, _markerService) {
            this._markerService = _markerService;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._dispoables = new lifecycle_1.DisposableStore();
            this._markers = [];
            this._nextIdx = -1;
            if (uri_1.URI.isUri(resourceFilter)) {
                this._resourceFilter = uri => uri.toString() === resourceFilter.toString();
            }
            else if (resourceFilter) {
                this._resourceFilter = resourceFilter;
            }
            const updateMarker = () => {
                this._markers = this._markerService.read({
                    resource: uri_1.URI.isUri(resourceFilter) ? resourceFilter : undefined,
                    severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning | markers_1.MarkerSeverity.Info
                });
                if (typeof resourceFilter === 'function') {
                    this._markers = this._markers.filter(m => this._resourceFilter(m.resource));
                }
                this._markers.sort(MarkerList._compareMarker);
            };
            updateMarker();
            this._dispoables.add(_markerService.onMarkerChanged(uris => {
                if (!this._resourceFilter || uris.some(uri => this._resourceFilter(uri))) {
                    updateMarker();
                    this._nextIdx = -1;
                    this._onDidChange.fire();
                }
            }));
        }
        dispose() {
            this._dispoables.dispose();
            this._onDidChange.dispose();
        }
        matches(uri) {
            if (!this._resourceFilter && !uri) {
                return true;
            }
            if (!this._resourceFilter || !uri) {
                return false;
            }
            return this._resourceFilter(uri);
        }
        get selected() {
            const marker = this._markers[this._nextIdx];
            return marker && new MarkerCoordinate(marker, this._nextIdx + 1, this._markers.length);
        }
        _initIdx(model, position, fwd) {
            let found = false;
            let idx = this._markers.findIndex(marker => marker.resource.toString() === model.uri.toString());
            if (idx < 0) {
                idx = arrays_1.binarySearch(this._markers, { resource: model.uri }, (a, b) => strings_1.compare(a.resource.toString(), b.resource.toString()));
                if (idx < 0) {
                    idx = ~idx;
                }
            }
            for (let i = idx; i < this._markers.length; i++) {
                let range = range_1.Range.lift(this._markers[i]);
                if (range.isEmpty()) {
                    const word = model.getWordAtPosition(range.getStartPosition());
                    if (word) {
                        range = new range_1.Range(range.startLineNumber, word.startColumn, range.startLineNumber, word.endColumn);
                    }
                }
                if (position && (range.containsPosition(position) || position.isBeforeOrEqual(range.getStartPosition()))) {
                    this._nextIdx = i;
                    found = true;
                    break;
                }
                if (this._markers[i].resource.toString() !== model.uri.toString()) {
                    break;
                }
            }
            if (!found) {
                // after the last change
                this._nextIdx = fwd ? 0 : this._markers.length - 1;
            }
            if (this._nextIdx < 0) {
                this._nextIdx = this._markers.length - 1;
            }
        }
        resetIndex() {
            this._nextIdx = -1;
        }
        move(fwd, model, position) {
            if (this._markers.length === 0) {
                return false;
            }
            let oldIdx = this._nextIdx;
            if (this._nextIdx === -1) {
                this._initIdx(model, position, fwd);
            }
            else if (fwd) {
                this._nextIdx = (this._nextIdx + 1) % this._markers.length;
            }
            else if (!fwd) {
                this._nextIdx = (this._nextIdx - 1 + this._markers.length) % this._markers.length;
            }
            if (oldIdx !== this._nextIdx) {
                return true;
            }
            return false;
        }
        find(uri, position) {
            let idx = this._markers.findIndex(marker => marker.resource.toString() === uri.toString());
            if (idx < 0) {
                return undefined;
            }
            for (; idx < this._markers.length; idx++) {
                if (range_1.Range.containsPosition(this._markers[idx], position)) {
                    return new MarkerCoordinate(this._markers[idx], idx + 1, this._markers.length);
                }
            }
            return undefined;
        }
        static _compareMarker(a, b) {
            let res = strings_1.compare(a.resource.toString(), b.resource.toString());
            if (res === 0) {
                res = markers_1.MarkerSeverity.compare(a.severity, b.severity);
            }
            if (res === 0) {
                res = range_1.Range.compareRangesUsingStarts(a, b);
            }
            return res;
        }
    };
    MarkerList = __decorate([
        __param(1, markers_1.IMarkerService)
    ], MarkerList);
    exports.MarkerList = MarkerList;
    exports.IMarkerNavigationService = instantiation_1.createDecorator('IMarkerNavigationService');
    let MarkerNavigationService = class MarkerNavigationService {
        constructor(_markerService) {
            this._markerService = _markerService;
            this._provider = new linkedList_1.LinkedList();
        }
        registerProvider(provider) {
            const remove = this._provider.unshift(provider);
            return lifecycle_1.toDisposable(() => remove());
        }
        getMarkerList(resource) {
            for (let provider of this._provider) {
                const result = provider.getMarkerList(resource);
                if (result) {
                    return result;
                }
            }
            // default
            return new MarkerList(resource, this._markerService);
        }
    };
    MarkerNavigationService = __decorate([
        __param(0, markers_1.IMarkerService)
    ], MarkerNavigationService);
    extensions_1.registerSingleton(exports.IMarkerNavigationService, MarkerNavigationService, true);
});
//# __sourceMappingURL=markerNavigationService.js.map