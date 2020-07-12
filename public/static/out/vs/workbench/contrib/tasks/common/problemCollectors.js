/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/tasks/common/problemMatcher", "vs/platform/markers/common/markers", "vs/base/common/uuid"], function (require, exports, uri_1, event_1, lifecycle_1, problemMatcher_1, markers_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WatchingProblemCollector = exports.StartStopProblemCollector = exports.ProblemHandlingStrategy = exports.AbstractProblemCollector = exports.ProblemCollectorEventKind = void 0;
    var ProblemCollectorEventKind;
    (function (ProblemCollectorEventKind) {
        ProblemCollectorEventKind["BackgroundProcessingBegins"] = "backgroundProcessingBegins";
        ProblemCollectorEventKind["BackgroundProcessingEnds"] = "backgroundProcessingEnds";
    })(ProblemCollectorEventKind = exports.ProblemCollectorEventKind || (exports.ProblemCollectorEventKind = {}));
    var ProblemCollectorEvent;
    (function (ProblemCollectorEvent) {
        function create(kind) {
            return Object.freeze({ kind });
        }
        ProblemCollectorEvent.create = create;
    })(ProblemCollectorEvent || (ProblemCollectorEvent = {}));
    class AbstractProblemCollector {
        constructor(problemMatchers, markerService, modelService, fileService) {
            this.markerService = markerService;
            this.modelService = modelService;
            this.modelListeners = new lifecycle_1.DisposableStore();
            this.matchers = Object.create(null);
            this.bufferLength = 1;
            problemMatchers.map(elem => problemMatcher_1.createLineMatcher(elem, fileService)).forEach((matcher) => {
                let length = matcher.matchLength;
                if (length > this.bufferLength) {
                    this.bufferLength = length;
                }
                let value = this.matchers[length];
                if (!value) {
                    value = [];
                    this.matchers[length] = value;
                }
                value.push(matcher);
            });
            this.buffer = [];
            this.activeMatcher = null;
            this._numberOfMatches = 0;
            this._maxMarkerSeverity = undefined;
            this.openModels = Object.create(null);
            this.applyToByOwner = new Map();
            for (let problemMatcher of problemMatchers) {
                let current = this.applyToByOwner.get(problemMatcher.owner);
                if (current === undefined) {
                    this.applyToByOwner.set(problemMatcher.owner, problemMatcher.applyTo);
                }
                else {
                    this.applyToByOwner.set(problemMatcher.owner, this.mergeApplyTo(current, problemMatcher.applyTo));
                }
            }
            this.resourcesToClean = new Map();
            this.markers = new Map();
            this.deliveredMarkers = new Map();
            this.modelService.onModelAdded((model) => {
                this.openModels[model.uri.toString()] = true;
            }, this, this.modelListeners);
            this.modelService.onModelRemoved((model) => {
                delete this.openModels[model.uri.toString()];
            }, this, this.modelListeners);
            this.modelService.getModels().forEach(model => this.openModels[model.uri.toString()] = true);
            this._onDidStateChange = new event_1.Emitter();
        }
        get onDidStateChange() {
            return this._onDidStateChange.event;
        }
        processLine(line) {
            if (this.tail) {
                const oldTail = this.tail;
                this.tail = oldTail.then(() => {
                    return this.processLineInternal(line);
                });
            }
            else {
                this.tail = this.processLineInternal(line);
            }
        }
        dispose() {
            this.modelListeners.dispose();
        }
        get numberOfMatches() {
            return this._numberOfMatches;
        }
        get maxMarkerSeverity() {
            return this._maxMarkerSeverity;
        }
        tryFindMarker(line) {
            let result = null;
            if (this.activeMatcher) {
                result = this.activeMatcher.next(line);
                if (result) {
                    this.captureMatch(result);
                    return result;
                }
                this.clearBuffer();
                this.activeMatcher = null;
            }
            if (this.buffer.length < this.bufferLength) {
                this.buffer.push(line);
            }
            else {
                let end = this.buffer.length - 1;
                for (let i = 0; i < end; i++) {
                    this.buffer[i] = this.buffer[i + 1];
                }
                this.buffer[end] = line;
            }
            result = this.tryMatchers();
            if (result) {
                this.clearBuffer();
            }
            return result;
        }
        async shouldApplyMatch(result) {
            switch (result.description.applyTo) {
                case problemMatcher_1.ApplyToKind.allDocuments:
                    return true;
                case problemMatcher_1.ApplyToKind.openDocuments:
                    return !!this.openModels[(await result.resource).toString()];
                case problemMatcher_1.ApplyToKind.closedDocuments:
                    return !this.openModels[(await result.resource).toString()];
                default:
                    return true;
            }
        }
        mergeApplyTo(current, value) {
            if (current === value || current === problemMatcher_1.ApplyToKind.allDocuments) {
                return current;
            }
            return problemMatcher_1.ApplyToKind.allDocuments;
        }
        tryMatchers() {
            this.activeMatcher = null;
            let length = this.buffer.length;
            for (let startIndex = 0; startIndex < length; startIndex++) {
                let candidates = this.matchers[length - startIndex];
                if (!candidates) {
                    continue;
                }
                for (const matcher of candidates) {
                    let result = matcher.handle(this.buffer, startIndex);
                    if (result.match) {
                        this.captureMatch(result.match);
                        if (result.continue) {
                            this.activeMatcher = matcher;
                        }
                        return result.match;
                    }
                }
            }
            return null;
        }
        captureMatch(match) {
            this._numberOfMatches++;
            if (this._maxMarkerSeverity === undefined || match.marker.severity > this._maxMarkerSeverity) {
                this._maxMarkerSeverity = match.marker.severity;
            }
        }
        clearBuffer() {
            if (this.buffer.length > 0) {
                this.buffer = [];
            }
        }
        recordResourcesToClean(owner) {
            let resourceSetToClean = this.getResourceSetToClean(owner);
            this.markerService.read({ owner: owner }).forEach(marker => resourceSetToClean.set(marker.resource.toString(), marker.resource));
        }
        recordResourceToClean(owner, resource) {
            this.getResourceSetToClean(owner).set(resource.toString(), resource);
        }
        removeResourceToClean(owner, resource) {
            let resourceSet = this.resourcesToClean.get(owner);
            if (resourceSet) {
                resourceSet.delete(resource);
            }
        }
        getResourceSetToClean(owner) {
            let result = this.resourcesToClean.get(owner);
            if (!result) {
                result = new Map();
                this.resourcesToClean.set(owner, result);
            }
            return result;
        }
        cleanAllMarkers() {
            this.resourcesToClean.forEach((value, owner) => {
                this._cleanMarkers(owner, value);
            });
            this.resourcesToClean = new Map();
        }
        cleanMarkers(owner) {
            let toClean = this.resourcesToClean.get(owner);
            if (toClean) {
                this._cleanMarkers(owner, toClean);
                this.resourcesToClean.delete(owner);
            }
        }
        _cleanMarkers(owner, toClean) {
            let uris = [];
            let applyTo = this.applyToByOwner.get(owner);
            toClean.forEach((uri, uriAsString) => {
                if (applyTo === problemMatcher_1.ApplyToKind.allDocuments ||
                    (applyTo === problemMatcher_1.ApplyToKind.openDocuments && this.openModels[uriAsString]) ||
                    (applyTo === problemMatcher_1.ApplyToKind.closedDocuments && !this.openModels[uriAsString])) {
                    uris.push(uri);
                }
            });
            this.markerService.remove(owner, uris);
        }
        recordMarker(marker, owner, resourceAsString) {
            let markersPerOwner = this.markers.get(owner);
            if (!markersPerOwner) {
                markersPerOwner = new Map();
                this.markers.set(owner, markersPerOwner);
            }
            let markersPerResource = markersPerOwner.get(resourceAsString);
            if (!markersPerResource) {
                markersPerResource = new Map();
                markersPerOwner.set(resourceAsString, markersPerResource);
            }
            let key = markers_1.IMarkerData.makeKeyOptionalMessage(marker, false);
            let existingMarker;
            if (!markersPerResource.has(key)) {
                markersPerResource.set(key, marker);
            }
            else if (((existingMarker = markersPerResource.get(key)) !== undefined) && existingMarker.message.length < marker.message.length) {
                // Most likely https://github.com/microsoft/vscode/issues/77475
                // Heuristic dictates that when the key is the same and message is smaller, we have hit this limitation.
                markersPerResource.set(key, marker);
            }
        }
        reportMarkers() {
            this.markers.forEach((markersPerOwner, owner) => {
                let deliveredMarkersPerOwner = this.getDeliveredMarkersPerOwner(owner);
                markersPerOwner.forEach((markers, resource) => {
                    this.deliverMarkersPerOwnerAndResourceResolved(owner, resource, markers, deliveredMarkersPerOwner);
                });
            });
        }
        deliverMarkersPerOwnerAndResource(owner, resource) {
            let markersPerOwner = this.markers.get(owner);
            if (!markersPerOwner) {
                return;
            }
            let deliveredMarkersPerOwner = this.getDeliveredMarkersPerOwner(owner);
            let markersPerResource = markersPerOwner.get(resource);
            if (!markersPerResource) {
                return;
            }
            this.deliverMarkersPerOwnerAndResourceResolved(owner, resource, markersPerResource, deliveredMarkersPerOwner);
        }
        deliverMarkersPerOwnerAndResourceResolved(owner, resource, markers, reported) {
            if (markers.size !== reported.get(resource)) {
                let toSet = [];
                markers.forEach(value => toSet.push(value));
                this.markerService.changeOne(owner, uri_1.URI.parse(resource), toSet);
                reported.set(resource, markers.size);
            }
        }
        getDeliveredMarkersPerOwner(owner) {
            let result = this.deliveredMarkers.get(owner);
            if (!result) {
                result = new Map();
                this.deliveredMarkers.set(owner, result);
            }
            return result;
        }
        cleanMarkerCaches() {
            this._numberOfMatches = 0;
            this._maxMarkerSeverity = undefined;
            this.markers.clear();
            this.deliveredMarkers.clear();
        }
        done() {
            this.reportMarkers();
            this.cleanAllMarkers();
        }
    }
    exports.AbstractProblemCollector = AbstractProblemCollector;
    var ProblemHandlingStrategy;
    (function (ProblemHandlingStrategy) {
        ProblemHandlingStrategy[ProblemHandlingStrategy["Clean"] = 0] = "Clean";
    })(ProblemHandlingStrategy = exports.ProblemHandlingStrategy || (exports.ProblemHandlingStrategy = {}));
    class StartStopProblemCollector extends AbstractProblemCollector {
        constructor(problemMatchers, markerService, modelService, _strategy = 0 /* Clean */, fileService) {
            super(problemMatchers, markerService, modelService, fileService);
            let ownerSet = Object.create(null);
            problemMatchers.forEach(description => ownerSet[description.owner] = true);
            this.owners = Object.keys(ownerSet);
            this.owners.forEach((owner) => {
                this.recordResourcesToClean(owner);
            });
        }
        async processLineInternal(line) {
            let markerMatch = this.tryFindMarker(line);
            if (!markerMatch) {
                return;
            }
            let owner = markerMatch.description.owner;
            let resource = await markerMatch.resource;
            let resourceAsString = resource.toString();
            this.removeResourceToClean(owner, resourceAsString);
            let shouldApplyMatch = await this.shouldApplyMatch(markerMatch);
            if (shouldApplyMatch) {
                this.recordMarker(markerMatch.marker, owner, resourceAsString);
                if (this.currentOwner !== owner || this.currentResource !== resourceAsString) {
                    if (this.currentOwner && this.currentResource) {
                        this.deliverMarkersPerOwnerAndResource(this.currentOwner, this.currentResource);
                    }
                    this.currentOwner = owner;
                    this.currentResource = resourceAsString;
                }
            }
        }
    }
    exports.StartStopProblemCollector = StartStopProblemCollector;
    class WatchingProblemCollector extends AbstractProblemCollector {
        constructor(problemMatchers, markerService, modelService, fileService) {
            super(problemMatchers, markerService, modelService, fileService);
            this.problemMatchers = problemMatchers;
            this.resetCurrentResource();
            this.backgroundPatterns = [];
            this._activeBackgroundMatchers = new Set();
            this.problemMatchers.forEach(matcher => {
                if (matcher.watching) {
                    const key = uuid_1.generateUuid();
                    this.backgroundPatterns.push({
                        key,
                        matcher: matcher,
                        begin: matcher.watching.beginsPattern,
                        end: matcher.watching.endsPattern
                    });
                }
            });
        }
        aboutToStart() {
            for (let background of this.backgroundPatterns) {
                if (background.matcher.watching && background.matcher.watching.activeOnStart) {
                    this._activeBackgroundMatchers.add(background.key);
                    this._onDidStateChange.fire(ProblemCollectorEvent.create("backgroundProcessingBegins" /* BackgroundProcessingBegins */));
                    this.recordResourcesToClean(background.matcher.owner);
                }
            }
        }
        async processLineInternal(line) {
            if (await this.tryBegin(line) || this.tryFinish(line)) {
                return;
            }
            let markerMatch = this.tryFindMarker(line);
            if (!markerMatch) {
                return;
            }
            let resource = await markerMatch.resource;
            let owner = markerMatch.description.owner;
            let resourceAsString = resource.toString();
            this.removeResourceToClean(owner, resourceAsString);
            let shouldApplyMatch = await this.shouldApplyMatch(markerMatch);
            if (shouldApplyMatch) {
                this.recordMarker(markerMatch.marker, owner, resourceAsString);
                if (this.currentOwner !== owner || this.currentResource !== resourceAsString) {
                    this.reportMarkersForCurrentResource();
                    this.currentOwner = owner;
                    this.currentResource = resourceAsString;
                }
            }
        }
        forceDelivery() {
            this.reportMarkersForCurrentResource();
        }
        async tryBegin(line) {
            let result = false;
            for (const background of this.backgroundPatterns) {
                let matches = background.begin.regexp.exec(line);
                if (matches) {
                    if (this._activeBackgroundMatchers.has(background.key)) {
                        continue;
                    }
                    this._activeBackgroundMatchers.add(background.key);
                    result = true;
                    this._onDidStateChange.fire(ProblemCollectorEvent.create("backgroundProcessingBegins" /* BackgroundProcessingBegins */));
                    this.cleanMarkerCaches();
                    this.resetCurrentResource();
                    let owner = background.matcher.owner;
                    let file = matches[background.begin.file];
                    if (file) {
                        let resource = problemMatcher_1.getResource(file, background.matcher);
                        this.recordResourceToClean(owner, await resource);
                    }
                    else {
                        this.recordResourcesToClean(owner);
                    }
                }
            }
            return result;
        }
        tryFinish(line) {
            let result = false;
            for (const background of this.backgroundPatterns) {
                let matches = background.end.regexp.exec(line);
                if (matches) {
                    if (this._activeBackgroundMatchers.has(background.key)) {
                        this._activeBackgroundMatchers.delete(background.key);
                        this.resetCurrentResource();
                        this._onDidStateChange.fire(ProblemCollectorEvent.create("backgroundProcessingEnds" /* BackgroundProcessingEnds */));
                        result = true;
                        let owner = background.matcher.owner;
                        this.cleanMarkers(owner);
                        this.cleanMarkerCaches();
                    }
                }
            }
            return result;
        }
        resetCurrentResource() {
            this.reportMarkersForCurrentResource();
            this.currentOwner = undefined;
            this.currentResource = undefined;
        }
        reportMarkersForCurrentResource() {
            if (this.currentOwner && this.currentResource) {
                this.deliverMarkersPerOwnerAndResource(this.currentOwner, this.currentResource);
            }
        }
        done() {
            [...this.applyToByOwner.keys()].forEach(owner => {
                this.recordResourcesToClean(owner);
            });
            super.done();
        }
        isWatching() {
            return this.backgroundPatterns.length > 0;
        }
    }
    exports.WatchingProblemCollector = WatchingProblemCollector;
});
//# __sourceMappingURL=problemCollectors.js.map