/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/idGenerator", "vs/editor/common/core/range", "vs/base/common/map", "vs/base/common/errors"], function (require, exports, nls_1, event_1, resources_1, lifecycle_1, strings, idGenerator_1, range_1, map_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReferencesModel = exports.FileReferences = exports.FilePreview = exports.OneReference = void 0;
    class OneReference {
        constructor(isProviderFirst, parent, uri, _range, _rangeCallback) {
            this.isProviderFirst = isProviderFirst;
            this.parent = parent;
            this.uri = uri;
            this._range = _range;
            this._rangeCallback = _rangeCallback;
            this.id = idGenerator_1.defaultGenerator.nextId();
        }
        get range() {
            return this._range;
        }
        set range(value) {
            this._range = value;
            this._rangeCallback(this);
        }
        get ariaMessage() {
            return nls_1.localize('aria.oneReference', "symbol in {0} on line {1} at column {2}", resources_1.basename(this.uri), this.range.startLineNumber, this.range.startColumn);
        }
    }
    exports.OneReference = OneReference;
    class FilePreview {
        constructor(_modelReference) {
            this._modelReference = _modelReference;
        }
        dispose() {
            this._modelReference.dispose();
        }
        preview(range, n = 8) {
            const model = this._modelReference.object.textEditorModel;
            if (!model) {
                return undefined;
            }
            const { startLineNumber, startColumn, endLineNumber, endColumn } = range;
            const word = model.getWordUntilPosition({ lineNumber: startLineNumber, column: startColumn - n });
            const beforeRange = new range_1.Range(startLineNumber, word.startColumn, startLineNumber, startColumn);
            const afterRange = new range_1.Range(endLineNumber, endColumn, endLineNumber, 1073741824 /* MAX_SAFE_SMALL_INTEGER */);
            const before = model.getValueInRange(beforeRange).replace(/^\s+/, '');
            const inside = model.getValueInRange(range);
            const after = model.getValueInRange(afterRange).replace(/\s+$/, '');
            return {
                value: before + inside + after,
                highlight: { start: before.length, end: before.length + inside.length }
            };
        }
    }
    exports.FilePreview = FilePreview;
    class FileReferences {
        constructor(parent, uri) {
            this.parent = parent;
            this.uri = uri;
            this.children = [];
            this._previews = new map_1.ResourceMap();
        }
        dispose() {
            lifecycle_1.dispose(this._previews.values());
            this._previews.clear();
        }
        getPreview(child) {
            return this._previews.get(child.uri);
        }
        get ariaMessage() {
            const len = this.children.length;
            if (len === 1) {
                return nls_1.localize('aria.fileReferences.1', "1 symbol in {0}, full path {1}", resources_1.basename(this.uri), this.uri.fsPath);
            }
            else {
                return nls_1.localize('aria.fileReferences.N', "{0} symbols in {1}, full path {2}", len, resources_1.basename(this.uri), this.uri.fsPath);
            }
        }
        async resolve(textModelResolverService) {
            if (this._previews.size !== 0) {
                return this;
            }
            for (let child of this.children) {
                if (this._previews.has(child.uri)) {
                    continue;
                }
                try {
                    const ref = await textModelResolverService.createModelReference(child.uri);
                    this._previews.set(child.uri, new FilePreview(ref));
                }
                catch (err) {
                    errors_1.onUnexpectedError(err);
                }
            }
            return this;
        }
    }
    exports.FileReferences = FileReferences;
    class ReferencesModel {
        constructor(links, title) {
            this._disposables = new lifecycle_1.DisposableStore();
            this.groups = [];
            this.references = [];
            this._onDidChangeReferenceRange = new event_1.Emitter();
            this.onDidChangeReferenceRange = this._onDidChangeReferenceRange.event;
            this._links = links;
            this._title = title;
            // grouping and sorting
            const [providersFirst] = links;
            links.sort(ReferencesModel._compareReferences);
            let current;
            for (let link of links) {
                if (!current || !resources_1.extUri.isEqual(current.uri, link.uri, true)) {
                    // new group
                    current = new FileReferences(this, link.uri);
                    this.groups.push(current);
                }
                // append, check for equality first!
                if (current.children.length === 0 || ReferencesModel._compareReferences(link, current.children[current.children.length - 1]) !== 0) {
                    const oneRef = new OneReference(providersFirst === link, current, link.uri, link.targetSelectionRange || link.range, ref => this._onDidChangeReferenceRange.fire(ref));
                    this.references.push(oneRef);
                    current.children.push(oneRef);
                }
            }
        }
        dispose() {
            lifecycle_1.dispose(this.groups);
            this._disposables.dispose();
            this._onDidChangeReferenceRange.dispose();
            this.groups.length = 0;
        }
        clone() {
            return new ReferencesModel(this._links, this._title);
        }
        get title() {
            return this._title;
        }
        get isEmpty() {
            return this.groups.length === 0;
        }
        get ariaMessage() {
            if (this.isEmpty) {
                return nls_1.localize('aria.result.0', "No results found");
            }
            else if (this.references.length === 1) {
                return nls_1.localize('aria.result.1', "Found 1 symbol in {0}", this.references[0].uri.fsPath);
            }
            else if (this.groups.length === 1) {
                return nls_1.localize('aria.result.n1', "Found {0} symbols in {1}", this.references.length, this.groups[0].uri.fsPath);
            }
            else {
                return nls_1.localize('aria.result.nm', "Found {0} symbols in {1} files", this.references.length, this.groups.length);
            }
        }
        nextOrPreviousReference(reference, next) {
            let { parent } = reference;
            let idx = parent.children.indexOf(reference);
            let childCount = parent.children.length;
            let groupCount = parent.parent.groups.length;
            if (groupCount === 1 || next && idx + 1 < childCount || !next && idx > 0) {
                // cycling within one file
                if (next) {
                    idx = (idx + 1) % childCount;
                }
                else {
                    idx = (idx + childCount - 1) % childCount;
                }
                return parent.children[idx];
            }
            idx = parent.parent.groups.indexOf(parent);
            if (next) {
                idx = (idx + 1) % groupCount;
                return parent.parent.groups[idx].children[0];
            }
            else {
                idx = (idx + groupCount - 1) % groupCount;
                return parent.parent.groups[idx].children[parent.parent.groups[idx].children.length - 1];
            }
        }
        nearestReference(resource, position) {
            const nearest = this.references.map((ref, idx) => {
                return {
                    idx,
                    prefixLen: strings.commonPrefixLength(ref.uri.toString(), resource.toString()),
                    offsetDist: Math.abs(ref.range.startLineNumber - position.lineNumber) * 100 + Math.abs(ref.range.startColumn - position.column)
                };
            }).sort((a, b) => {
                if (a.prefixLen > b.prefixLen) {
                    return -1;
                }
                else if (a.prefixLen < b.prefixLen) {
                    return 1;
                }
                else if (a.offsetDist < b.offsetDist) {
                    return -1;
                }
                else if (a.offsetDist > b.offsetDist) {
                    return 1;
                }
                else {
                    return 0;
                }
            })[0];
            if (nearest) {
                return this.references[nearest.idx];
            }
            return undefined;
        }
        referenceAt(resource, position) {
            for (const ref of this.references) {
                if (ref.uri.toString() === resource.toString()) {
                    if (range_1.Range.containsPosition(ref.range, position)) {
                        return ref;
                    }
                }
            }
            return undefined;
        }
        firstReference() {
            for (const ref of this.references) {
                if (ref.isProviderFirst) {
                    return ref;
                }
            }
            return this.references[0];
        }
        static _compareReferences(a, b) {
            return resources_1.extUri.compare(a.uri, b.uri) || range_1.Range.compareRangesUsingStarts(a.range, b.range);
        }
    }
    exports.ReferencesModel = ReferencesModel;
});
//# __sourceMappingURL=referencesModel.js.map