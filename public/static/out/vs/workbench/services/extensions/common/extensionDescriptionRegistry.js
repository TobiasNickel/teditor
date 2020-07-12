/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/base/common/event", "vs/base/common/path"], function (require, exports, extensions_1, event_1, path) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionDescriptionRegistry = exports.DeltaExtensionsResult = void 0;
    class DeltaExtensionsResult {
        constructor(removedDueToLooping) {
            this.removedDueToLooping = removedDueToLooping;
        }
    }
    exports.DeltaExtensionsResult = DeltaExtensionsResult;
    class ExtensionDescriptionRegistry {
        constructor(extensionDescriptions) {
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._extensionDescriptions = extensionDescriptions;
            this._initialize();
        }
        _initialize() {
            // Ensure extensions are stored in the order: builtin, user, under development
            this._extensionDescriptions.sort(extensionCmp);
            this._extensionsMap = new Map();
            this._extensionsArr = [];
            this._activationMap = new Map();
            for (const extensionDescription of this._extensionDescriptions) {
                if (this._extensionsMap.has(extensions_1.ExtensionIdentifier.toKey(extensionDescription.identifier))) {
                    // No overwriting allowed!
                    console.error('Extension `' + extensionDescription.identifier.value + '` is already registered');
                    continue;
                }
                this._extensionsMap.set(extensions_1.ExtensionIdentifier.toKey(extensionDescription.identifier), extensionDescription);
                this._extensionsArr.push(extensionDescription);
                if (Array.isArray(extensionDescription.activationEvents)) {
                    for (let activationEvent of extensionDescription.activationEvents) {
                        // TODO@joao: there's no easy way to contribute this
                        if (activationEvent === 'onUri') {
                            activationEvent = `onUri:${extensions_1.ExtensionIdentifier.toKey(extensionDescription.identifier)}`;
                        }
                        if (!this._activationMap.has(activationEvent)) {
                            this._activationMap.set(activationEvent, []);
                        }
                        this._activationMap.get(activationEvent).push(extensionDescription);
                    }
                }
            }
        }
        keepOnly(extensionIds) {
            const toKeep = new Set();
            extensionIds.forEach(extensionId => toKeep.add(extensions_1.ExtensionIdentifier.toKey(extensionId)));
            this._extensionDescriptions = this._extensionDescriptions.filter(extension => toKeep.has(extensions_1.ExtensionIdentifier.toKey(extension.identifier)));
            this._initialize();
            this._onDidChange.fire(undefined);
        }
        deltaExtensions(toAdd, toRemove) {
            if (toAdd.length > 0) {
                this._extensionDescriptions = this._extensionDescriptions.concat(toAdd);
            }
            // Immediately remove looping extensions!
            const looping = ExtensionDescriptionRegistry._findLoopingExtensions(this._extensionDescriptions);
            toRemove = toRemove.concat(looping.map(ext => ext.identifier));
            if (toRemove.length > 0) {
                const toRemoveSet = new Set();
                toRemove.forEach(extensionId => toRemoveSet.add(extensions_1.ExtensionIdentifier.toKey(extensionId)));
                this._extensionDescriptions = this._extensionDescriptions.filter(extension => !toRemoveSet.has(extensions_1.ExtensionIdentifier.toKey(extension.identifier)));
            }
            this._initialize();
            this._onDidChange.fire(undefined);
            return new DeltaExtensionsResult(looping);
        }
        static _findLoopingExtensions(extensionDescriptions) {
            const G = new class {
                constructor() {
                    this._arcs = new Map();
                    this._nodesSet = new Set();
                    this._nodesArr = [];
                }
                addNode(id) {
                    if (!this._nodesSet.has(id)) {
                        this._nodesSet.add(id);
                        this._nodesArr.push(id);
                    }
                }
                addArc(from, to) {
                    this.addNode(from);
                    this.addNode(to);
                    if (this._arcs.has(from)) {
                        this._arcs.get(from).push(to);
                    }
                    else {
                        this._arcs.set(from, [to]);
                    }
                }
                getArcs(id) {
                    if (this._arcs.has(id)) {
                        return this._arcs.get(id);
                    }
                    return [];
                }
                hasOnlyGoodArcs(id, good) {
                    const dependencies = G.getArcs(id);
                    for (let i = 0; i < dependencies.length; i++) {
                        if (!good.has(dependencies[i])) {
                            return false;
                        }
                    }
                    return true;
                }
                getNodes() {
                    return this._nodesArr;
                }
            };
            let descs = new Map();
            for (let extensionDescription of extensionDescriptions) {
                const extensionId = extensions_1.ExtensionIdentifier.toKey(extensionDescription.identifier);
                descs.set(extensionId, extensionDescription);
                if (extensionDescription.extensionDependencies) {
                    for (let _depId of extensionDescription.extensionDependencies) {
                        const depId = extensions_1.ExtensionIdentifier.toKey(_depId);
                        G.addArc(extensionId, depId);
                    }
                }
            }
            // initialize with all extensions with no dependencies.
            let good = new Set();
            G.getNodes().filter(id => G.getArcs(id).length === 0).forEach(id => good.add(id));
            // all other extensions will be processed below.
            let nodes = G.getNodes().filter(id => !good.has(id));
            let madeProgress;
            do {
                madeProgress = false;
                // find one extension which has only good deps
                for (let i = 0; i < nodes.length; i++) {
                    const id = nodes[i];
                    if (G.hasOnlyGoodArcs(id, good)) {
                        nodes.splice(i, 1);
                        i--;
                        good.add(id);
                        madeProgress = true;
                    }
                }
            } while (madeProgress);
            // The remaining nodes are bad and have loops
            return nodes.map(id => descs.get(id));
        }
        containsActivationEvent(activationEvent) {
            return this._activationMap.has(activationEvent);
        }
        containsExtension(extensionId) {
            return this._extensionsMap.has(extensions_1.ExtensionIdentifier.toKey(extensionId));
        }
        getExtensionDescriptionsForActivationEvent(activationEvent) {
            const extensions = this._activationMap.get(activationEvent);
            return extensions ? extensions.slice(0) : [];
        }
        getAllExtensionDescriptions() {
            return this._extensionsArr.slice(0);
        }
        getExtensionDescription(extensionId) {
            const extension = this._extensionsMap.get(extensions_1.ExtensionIdentifier.toKey(extensionId));
            return extension ? extension : undefined;
        }
    }
    exports.ExtensionDescriptionRegistry = ExtensionDescriptionRegistry;
    var SortBucket;
    (function (SortBucket) {
        SortBucket[SortBucket["Builtin"] = 0] = "Builtin";
        SortBucket[SortBucket["User"] = 1] = "User";
        SortBucket[SortBucket["Dev"] = 2] = "Dev";
    })(SortBucket || (SortBucket = {}));
    /**
     * Ensure that:
     * - first are builtin extensions
     * - second are user extensions
     * - third are extensions under development
     *
     * In each bucket, extensions must be sorted alphabetically by their folder name.
     */
    function extensionCmp(a, b) {
        const aSortBucket = (a.isBuiltin ? 0 /* Builtin */ : a.isUnderDevelopment ? 2 /* Dev */ : 1 /* User */);
        const bSortBucket = (b.isBuiltin ? 0 /* Builtin */ : b.isUnderDevelopment ? 2 /* Dev */ : 1 /* User */);
        if (aSortBucket !== bSortBucket) {
            return aSortBucket - bSortBucket;
        }
        const aLastSegment = path.posix.basename(a.extensionLocation.path);
        const bLastSegment = path.posix.basename(b.extensionLocation.path);
        if (aLastSegment < bLastSegment) {
            return -1;
        }
        if (aLastSegment > bLastSegment) {
            return 1;
        }
        return 0;
    }
});
//# __sourceMappingURL=extensionDescriptionRegistry.js.map