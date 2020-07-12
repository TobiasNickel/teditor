/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/map", "vs/base/common/strings", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/base/common/iterator", "vs/base/common/numbers"], function (require, exports, arrays_1, cancellation_1, errors_1, map_1, strings_1, range_1, modes_1, iterator_1, numbers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutlineModel = exports.OutlineGroup = exports.OutlineElement = exports.TreeElement = void 0;
    class TreeElement {
        remove() {
            if (this.parent) {
                this.parent.children.delete(this.id);
            }
        }
        static findId(candidate, container) {
            // complex id-computation which contains the origin/extension,
            // the parent path, and some dedupe logic when names collide
            let candidateId;
            if (typeof candidate === 'string') {
                candidateId = `${container.id}/${candidate}`;
            }
            else {
                candidateId = `${container.id}/${candidate.name}`;
                if (container.children.get(candidateId) !== undefined) {
                    candidateId = `${container.id}/${candidate.name}_${candidate.range.startLineNumber}_${candidate.range.startColumn}`;
                }
            }
            let id = candidateId;
            for (let i = 0; container.children.get(id) !== undefined; i++) {
                id = `${candidateId}_${i}`;
            }
            return id;
        }
        static getElementById(id, element) {
            if (!id) {
                return undefined;
            }
            let len = strings_1.commonPrefixLength(id, element.id);
            if (len === id.length) {
                return element;
            }
            if (len < element.id.length) {
                return undefined;
            }
            for (const [, child] of element.children) {
                let candidate = TreeElement.getElementById(id, child);
                if (candidate) {
                    return candidate;
                }
            }
            return undefined;
        }
        static size(element) {
            let res = 1;
            for (const [, child] of element.children) {
                res += TreeElement.size(child);
            }
            return res;
        }
        static empty(element) {
            return element.children.size === 0;
        }
    }
    exports.TreeElement = TreeElement;
    class OutlineElement extends TreeElement {
        constructor(id, parent, symbol) {
            super();
            this.id = id;
            this.parent = parent;
            this.symbol = symbol;
            this.children = new Map();
        }
        adopt(parent) {
            let res = new OutlineElement(this.id, parent, this.symbol);
            for (const [key, value] of this.children) {
                res.children.set(key, value.adopt(res));
            }
            return res;
        }
    }
    exports.OutlineElement = OutlineElement;
    class OutlineGroup extends TreeElement {
        constructor(id, parent, label, order) {
            super();
            this.id = id;
            this.parent = parent;
            this.label = label;
            this.order = order;
            this.children = new Map();
        }
        adopt(parent) {
            let res = new OutlineGroup(this.id, parent, this.label, this.order);
            for (const [key, value] of this.children) {
                res.children.set(key, value.adopt(res));
            }
            return res;
        }
        getItemEnclosingPosition(position) {
            return position ? this._getItemEnclosingPosition(position, this.children) : undefined;
        }
        _getItemEnclosingPosition(position, children) {
            for (const [, item] of children) {
                if (!item.symbol.range || !range_1.Range.containsPosition(item.symbol.range, position)) {
                    continue;
                }
                return this._getItemEnclosingPosition(position, item.children) || item;
            }
            return undefined;
        }
        updateMarker(marker) {
            for (const [, child] of this.children) {
                this._updateMarker(marker, child);
            }
        }
        _updateMarker(markers, item) {
            item.marker = undefined;
            // find the proper start index to check for item/marker overlap.
            let idx = arrays_1.binarySearch(markers, item.symbol.range, range_1.Range.compareRangesUsingStarts);
            let start;
            if (idx < 0) {
                start = ~idx;
                if (start > 0 && range_1.Range.areIntersecting(markers[start - 1], item.symbol.range)) {
                    start -= 1;
                }
            }
            else {
                start = idx;
            }
            let myMarkers = [];
            let myTopSev;
            for (; start < markers.length && range_1.Range.areIntersecting(item.symbol.range, markers[start]); start++) {
                // remove markers intersecting with this outline element
                // and store them in a 'private' array.
                let marker = markers[start];
                myMarkers.push(marker);
                markers[start] = undefined;
                if (!myTopSev || marker.severity > myTopSev) {
                    myTopSev = marker.severity;
                }
            }
            // Recurse into children and let them match markers that have matched
            // this outline element. This might remove markers from this element and
            // therefore we remember that we have had markers. That allows us to render
            // the dot, saying 'this element has children with markers'
            for (const [, child] of item.children) {
                this._updateMarker(myMarkers, child);
            }
            if (myTopSev) {
                item.marker = {
                    count: myMarkers.length,
                    topSev: myTopSev
                };
            }
            arrays_1.coalesceInPlace(markers);
        }
    }
    exports.OutlineGroup = OutlineGroup;
    class OutlineModel extends TreeElement {
        constructor(uri) {
            super();
            this.uri = uri;
            this.id = 'root';
            this.parent = undefined;
            this._groups = new Map();
            this.children = new Map();
            this.id = 'root';
            this.parent = undefined;
        }
        static create(textModel, token) {
            let key = this._keys.for(textModel, true);
            let data = OutlineModel._requests.get(key);
            if (!data) {
                let source = new cancellation_1.CancellationTokenSource();
                data = {
                    promiseCnt: 0,
                    source,
                    promise: OutlineModel._create(textModel, source.token),
                    model: undefined,
                };
                OutlineModel._requests.set(key, data);
                // keep moving average of request durations
                const now = Date.now();
                data.promise.then(() => {
                    let key = this._keys.for(textModel, false);
                    let avg = this._requestDurations.get(key);
                    if (!avg) {
                        avg = new numbers_1.MovingAverage();
                        this._requestDurations.set(key, avg);
                    }
                    avg.update(Date.now() - now);
                });
            }
            if (data.model) {
                // resolved -> return data
                return Promise.resolve(data.model);
            }
            // increase usage counter
            data.promiseCnt += 1;
            token.onCancellationRequested(() => {
                // last -> cancel provider request, remove cached promise
                if (--data.promiseCnt === 0) {
                    data.source.cancel();
                    OutlineModel._requests.delete(key);
                }
            });
            return new Promise((resolve, reject) => {
                data.promise.then(model => {
                    data.model = model;
                    resolve(model);
                }, err => {
                    OutlineModel._requests.delete(key);
                    reject(err);
                });
            });
        }
        static getRequestDelay(textModel) {
            if (!textModel) {
                return 350;
            }
            const avg = this._requestDurations.get(this._keys.for(textModel, false));
            if (!avg) {
                return 350;
            }
            return Math.max(350, Math.floor(1.3 * avg.value));
        }
        static _create(textModel, token) {
            const cts = new cancellation_1.CancellationTokenSource(token);
            const result = new OutlineModel(textModel.uri);
            const provider = modes_1.DocumentSymbolProviderRegistry.ordered(textModel);
            const promises = provider.map((provider, index) => {
                var _a;
                let id = TreeElement.findId(`provider_${index}`, result);
                let group = new OutlineGroup(id, result, (_a = provider.displayName) !== null && _a !== void 0 ? _a : 'Unknown Outline Provider', index);
                return Promise.resolve(provider.provideDocumentSymbols(textModel, cts.token)).then(result => {
                    for (const info of result || []) {
                        OutlineModel._makeOutlineElement(info, group);
                    }
                    return group;
                }, err => {
                    errors_1.onUnexpectedExternalError(err);
                    return group;
                }).then(group => {
                    if (!TreeElement.empty(group)) {
                        result._groups.set(id, group);
                    }
                    else {
                        group.remove();
                    }
                });
            });
            const listener = modes_1.DocumentSymbolProviderRegistry.onDidChange(() => {
                const newProvider = modes_1.DocumentSymbolProviderRegistry.ordered(textModel);
                if (!arrays_1.equals(newProvider, provider)) {
                    cts.cancel();
                }
            });
            return Promise.all(promises).then(() => {
                if (cts.token.isCancellationRequested && !token.isCancellationRequested) {
                    return OutlineModel._create(textModel, token);
                }
                else {
                    return result._compact();
                }
            }).finally(() => {
                listener.dispose();
            });
        }
        static _makeOutlineElement(info, container) {
            let id = TreeElement.findId(info, container);
            let res = new OutlineElement(id, container, info);
            if (info.children) {
                for (const childInfo of info.children) {
                    OutlineModel._makeOutlineElement(childInfo, res);
                }
            }
            container.children.set(res.id, res);
        }
        static get(element) {
            while (element) {
                if (element instanceof OutlineModel) {
                    return element;
                }
                element = element.parent;
            }
            return undefined;
        }
        adopt() {
            let res = new OutlineModel(this.uri);
            for (const [key, value] of this._groups) {
                res._groups.set(key, value.adopt(res));
            }
            return res._compact();
        }
        _compact() {
            let count = 0;
            for (const [key, group] of this._groups) {
                if (group.children.size === 0) { // empty
                    this._groups.delete(key);
                }
                else {
                    count += 1;
                }
            }
            if (count !== 1) {
                //
                this.children = this._groups;
            }
            else {
                // adopt all elements of the first group
                let group = iterator_1.Iterable.first(this._groups.values());
                for (let [, child] of group.children) {
                    child.parent = this;
                    this.children.set(child.id, child);
                }
            }
            return this;
        }
        merge(other) {
            if (this.uri.toString() !== other.uri.toString()) {
                return false;
            }
            if (this._groups.size !== other._groups.size) {
                return false;
            }
            this._groups = other._groups;
            this.children = other.children;
            return true;
        }
        getItemEnclosingPosition(position, context) {
            let preferredGroup;
            if (context) {
                let candidate = context.parent;
                while (candidate && !preferredGroup) {
                    if (candidate instanceof OutlineGroup) {
                        preferredGroup = candidate;
                    }
                    candidate = candidate.parent;
                }
            }
            let result = undefined;
            for (const [, group] of this._groups) {
                result = group.getItemEnclosingPosition(position);
                if (result && (!preferredGroup || preferredGroup === group)) {
                    break;
                }
            }
            return result;
        }
        getItemById(id) {
            return TreeElement.getElementById(id, this);
        }
        updateMarker(marker) {
            // sort markers by start range so that we can use
            // outline element starts for quicker look up
            marker.sort(range_1.Range.compareRangesUsingStarts);
            for (const [, group] of this._groups) {
                group.updateMarker(marker.slice(0));
            }
        }
    }
    exports.OutlineModel = OutlineModel;
    OutlineModel._requestDurations = new map_1.LRUCache(50, 0.7);
    OutlineModel._requests = new map_1.LRUCache(9, 0.75);
    OutlineModel._keys = new class {
        constructor() {
            this._counter = 1;
            this._data = new WeakMap();
        }
        for(textModel, version) {
            return `${textModel.id}/${version ? textModel.getVersionId() : ''}/${this._hash(modes_1.DocumentSymbolProviderRegistry.all(textModel))}`;
        }
        _hash(providers) {
            let result = '';
            for (const provider of providers) {
                let n = this._data.get(provider);
                if (typeof n === 'undefined') {
                    n = this._counter++;
                    this._data.set(provider, n);
                }
                result += n;
            }
            return result;
        }
    };
});
//# __sourceMappingURL=outlineModel.js.map