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
define(["require", "exports", "vs/platform/markers/common/markers", "vs/base/common/lifecycle", "vs/editor/common/model", "vs/platform/theme/common/themeService", "vs/editor/common/view/editorColorRegistry", "vs/editor/common/services/modelService", "vs/editor/common/core/range", "vs/base/common/map", "vs/base/common/network", "vs/base/common/event", "vs/base/common/types", "vs/platform/theme/common/colorRegistry", "vs/base/common/async"], function (require, exports, markers_1, lifecycle_1, model_1, themeService_1, editorColorRegistry_1, modelService_1, range_1, map_1, network_1, event_1, types_1, colorRegistry_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkerDecorationsService = void 0;
    function MODEL_ID(resource) {
        return resource.toString();
    }
    class MarkerDecorations extends lifecycle_1.Disposable {
        constructor(model) {
            super();
            this.model = model;
            this._markersData = new Map();
            this._register(lifecycle_1.toDisposable(() => {
                this.model.deltaDecorations(map_1.keys(this._markersData), []);
                this._markersData.clear();
            }));
        }
        register(t) {
            return super._register(t);
        }
        update(markers, newDecorations) {
            const oldIds = map_1.keys(this._markersData);
            this._markersData.clear();
            const ids = this.model.deltaDecorations(oldIds, newDecorations);
            for (let index = 0; index < ids.length; index++) {
                this._markersData.set(ids[index], markers[index]);
            }
            return oldIds.length !== 0 || ids.length !== 0;
        }
        getMarker(decoration) {
            return this._markersData.get(decoration.id);
        }
        getMarkers() {
            const res = [];
            this._markersData.forEach((marker, id) => {
                let range = this.model.getDecorationRange(id);
                if (range) {
                    res.push([range, marker]);
                }
            });
            return res;
        }
    }
    let MarkerDecorationsService = class MarkerDecorationsService extends lifecycle_1.Disposable {
        constructor(modelService, _markerService) {
            super();
            this._markerService = _markerService;
            this._onDidChangeMarker = this._register(new event_1.Emitter());
            this.onDidChangeMarker = this._onDidChangeMarker.event;
            this._markerDecorations = new Map();
            modelService.getModels().forEach(model => this._onModelAdded(model));
            this._register(modelService.onModelAdded(this._onModelAdded, this));
            this._register(modelService.onModelRemoved(this._onModelRemoved, this));
            this._register(this._markerService.onMarkerChanged(this._handleMarkerChange, this));
        }
        dispose() {
            super.dispose();
            this._markerDecorations.forEach(value => value.dispose());
            this._markerDecorations.clear();
        }
        getMarker(model, decoration) {
            const markerDecorations = this._markerDecorations.get(MODEL_ID(model.uri));
            return markerDecorations ? types_1.withUndefinedAsNull(markerDecorations.getMarker(decoration)) : null;
        }
        getLiveMarkers(model) {
            const markerDecorations = this._markerDecorations.get(MODEL_ID(model.uri));
            return markerDecorations ? markerDecorations.getMarkers() : [];
        }
        _handleMarkerChange(changedResources) {
            changedResources.forEach((resource) => {
                const markerDecorations = this._markerDecorations.get(MODEL_ID(resource));
                if (markerDecorations) {
                    this._updateDecorations(markerDecorations);
                }
            });
        }
        _onModelAdded(model) {
            const markerDecorations = new MarkerDecorations(model);
            this._markerDecorations.set(MODEL_ID(model.uri), markerDecorations);
            const delayer = markerDecorations.register(new async_1.Delayer(100));
            markerDecorations.register(model.onDidChangeContent(() => delayer.trigger(() => this._updateDecorations(markerDecorations))));
            this._updateDecorations(markerDecorations);
        }
        _onModelRemoved(model) {
            const markerDecorations = this._markerDecorations.get(MODEL_ID(model.uri));
            if (markerDecorations) {
                markerDecorations.dispose();
                this._markerDecorations.delete(MODEL_ID(model.uri));
            }
            // clean up markers for internal, transient models
            if (model.uri.scheme === network_1.Schemas.inMemory
                || model.uri.scheme === network_1.Schemas.internal
                || model.uri.scheme === network_1.Schemas.vscode) {
                if (this._markerService) {
                    this._markerService.read({ resource: model.uri }).map(marker => marker.owner).forEach(owner => this._markerService.remove(owner, [model.uri]));
                }
            }
        }
        _updateDecorations(markerDecorations) {
            // Limit to the first 500 errors/warnings
            const markers = this._markerService.read({ resource: markerDecorations.model.uri, take: 500 });
            let newModelDecorations = markers.map((marker) => {
                return {
                    range: this._createDecorationRange(markerDecorations.model, marker),
                    options: this._createDecorationOption(marker)
                };
            });
            if (markerDecorations.update(markers, newModelDecorations)) {
                this._onDidChangeMarker.fire(markerDecorations.model);
            }
        }
        _createDecorationRange(model, rawMarker) {
            let ret = range_1.Range.lift(rawMarker);
            if (rawMarker.severity === markers_1.MarkerSeverity.Hint && !this._hasMarkerTag(rawMarker, 1 /* Unnecessary */) && !this._hasMarkerTag(rawMarker, 2 /* Deprecated */)) {
                // * never render hints on multiple lines
                // * make enough space for three dots
                ret = ret.setEndPosition(ret.startLineNumber, ret.startColumn + 2);
            }
            ret = model.validateRange(ret);
            if (ret.isEmpty()) {
                let word = model.getWordAtPosition(ret.getStartPosition());
                if (word) {
                    ret = new range_1.Range(ret.startLineNumber, word.startColumn, ret.endLineNumber, word.endColumn);
                }
                else {
                    let maxColumn = model.getLineLastNonWhitespaceColumn(ret.startLineNumber) ||
                        model.getLineMaxColumn(ret.startLineNumber);
                    if (maxColumn === 1) {
                        // empty line
                        // console.warn('marker on empty line:', marker);
                    }
                    else if (ret.endColumn >= maxColumn) {
                        // behind eol
                        ret = new range_1.Range(ret.startLineNumber, maxColumn - 1, ret.endLineNumber, maxColumn);
                    }
                    else {
                        // extend marker to width = 1
                        ret = new range_1.Range(ret.startLineNumber, ret.startColumn, ret.endLineNumber, ret.endColumn + 1);
                    }
                }
            }
            else if (rawMarker.endColumn === Number.MAX_VALUE && rawMarker.startColumn === 1 && ret.startLineNumber === ret.endLineNumber) {
                let minColumn = model.getLineFirstNonWhitespaceColumn(rawMarker.startLineNumber);
                if (minColumn < ret.endColumn) {
                    ret = new range_1.Range(ret.startLineNumber, minColumn, ret.endLineNumber, ret.endColumn);
                    rawMarker.startColumn = minColumn;
                }
            }
            return ret;
        }
        _createDecorationOption(marker) {
            let className;
            let color = undefined;
            let zIndex;
            let inlineClassName = undefined;
            let minimap;
            switch (marker.severity) {
                case markers_1.MarkerSeverity.Hint:
                    if (this._hasMarkerTag(marker, 2 /* Deprecated */)) {
                        className = undefined;
                    }
                    else if (this._hasMarkerTag(marker, 1 /* Unnecessary */)) {
                        className = "squiggly-unnecessary" /* EditorUnnecessaryDecoration */;
                    }
                    else {
                        className = "squiggly-hint" /* EditorHintDecoration */;
                    }
                    zIndex = 0;
                    break;
                case markers_1.MarkerSeverity.Warning:
                    className = "squiggly-warning" /* EditorWarningDecoration */;
                    color = themeService_1.themeColorFromId(editorColorRegistry_1.overviewRulerWarning);
                    zIndex = 20;
                    minimap = {
                        color: themeService_1.themeColorFromId(colorRegistry_1.minimapWarning),
                        position: model_1.MinimapPosition.Inline
                    };
                    break;
                case markers_1.MarkerSeverity.Info:
                    className = "squiggly-info" /* EditorInfoDecoration */;
                    color = themeService_1.themeColorFromId(editorColorRegistry_1.overviewRulerInfo);
                    zIndex = 10;
                    break;
                case markers_1.MarkerSeverity.Error:
                default:
                    className = "squiggly-error" /* EditorErrorDecoration */;
                    color = themeService_1.themeColorFromId(editorColorRegistry_1.overviewRulerError);
                    zIndex = 30;
                    minimap = {
                        color: themeService_1.themeColorFromId(colorRegistry_1.minimapError),
                        position: model_1.MinimapPosition.Inline
                    };
                    break;
            }
            if (marker.tags) {
                if (marker.tags.indexOf(1 /* Unnecessary */) !== -1) {
                    inlineClassName = "squiggly-inline-unnecessary" /* EditorUnnecessaryInlineDecoration */;
                }
                if (marker.tags.indexOf(2 /* Deprecated */) !== -1) {
                    inlineClassName = "squiggly-inline-deprecated" /* EditorDeprecatedInlineDecoration */;
                }
            }
            return {
                stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
                className,
                showIfCollapsed: true,
                overviewRuler: {
                    color,
                    position: model_1.OverviewRulerLane.Right
                },
                minimap,
                zIndex,
                inlineClassName,
            };
        }
        _hasMarkerTag(marker, tag) {
            if (marker.tags) {
                return marker.tags.indexOf(tag) >= 0;
            }
            return false;
        }
    };
    MarkerDecorationsService = __decorate([
        __param(0, modelService_1.IModelService),
        __param(1, markers_1.IMarkerService)
    ], MarkerDecorationsService);
    exports.MarkerDecorationsService = MarkerDecorationsService;
});
//# __sourceMappingURL=markerDecorationsServiceImpl.js.map