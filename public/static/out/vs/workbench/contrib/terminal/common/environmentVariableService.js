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
define(["require", "exports", "vs/base/common/event", "vs/base/common/decorators", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/workbench/contrib/terminal/common/environmentVariableCollection", "vs/workbench/contrib/terminal/common/environmentVariableShared"], function (require, exports, event_1, decorators_1, storage_1, extensions_1, environmentVariableCollection_1, environmentVariableShared_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EnvironmentVariableService = void 0;
    const ENVIRONMENT_VARIABLE_COLLECTIONS_KEY = 'terminal.integrated.environmentVariableCollections';
    /**
     * Tracks and persists environment variable collections as defined by extensions.
     */
    let EnvironmentVariableService = class EnvironmentVariableService {
        constructor(_extensionService, _storageService) {
            this._extensionService = _extensionService;
            this._storageService = _storageService;
            this.collections = new Map();
            this._onDidChangeCollections = new event_1.Emitter();
            const serializedPersistedCollections = this._storageService.get(ENVIRONMENT_VARIABLE_COLLECTIONS_KEY, 1 /* WORKSPACE */);
            if (serializedPersistedCollections) {
                const collectionsJson = JSON.parse(serializedPersistedCollections);
                collectionsJson.forEach(c => this.collections.set(c.extensionIdentifier, {
                    persistent: true,
                    map: environmentVariableShared_1.deserializeEnvironmentVariableCollection(c.collection)
                }));
                // Asynchronously invalidate collections where extensions have been uninstalled, this is
                // async to avoid making all functions on the service synchronous and because extensions
                // being uninstalled is rare.
                this._invalidateExtensionCollections();
            }
            this.mergedCollection = this._resolveMergedCollection();
            // Listen for uninstalled/disabled extensions
            this._extensionService.onDidChangeExtensions(() => this._invalidateExtensionCollections());
        }
        get onDidChangeCollections() { return this._onDidChangeCollections.event; }
        set(extensionIdentifier, collection) {
            this.collections.set(extensionIdentifier, collection);
            this._updateCollections();
        }
        delete(extensionIdentifier) {
            this.collections.delete(extensionIdentifier);
            this._updateCollections();
        }
        _updateCollections() {
            this._persistCollectionsEventually();
            this.mergedCollection = this._resolveMergedCollection();
            this._notifyCollectionUpdatesEventually();
        }
        _persistCollectionsEventually() {
            this._persistCollections();
        }
        _persistCollections() {
            const collectionsJson = [];
            this.collections.forEach((collection, extensionIdentifier) => {
                if (collection.persistent) {
                    collectionsJson.push({
                        extensionIdentifier,
                        collection: environmentVariableShared_1.serializeEnvironmentVariableCollection(this.collections.get(extensionIdentifier).map)
                    });
                }
            });
            const stringifiedJson = JSON.stringify(collectionsJson);
            this._storageService.store(ENVIRONMENT_VARIABLE_COLLECTIONS_KEY, stringifiedJson, 1 /* WORKSPACE */);
        }
        _notifyCollectionUpdatesEventually() {
            this._notifyCollectionUpdates();
        }
        _notifyCollectionUpdates() {
            this._onDidChangeCollections.fire(this.mergedCollection);
        }
        _resolveMergedCollection() {
            return new environmentVariableCollection_1.MergedEnvironmentVariableCollection(this.collections);
        }
        async _invalidateExtensionCollections() {
            await this._extensionService.whenInstalledExtensionsRegistered();
            const registeredExtensions = await this._extensionService.getExtensions();
            let changes = false;
            this.collections.forEach((_, extensionIdentifier) => {
                const isExtensionRegistered = registeredExtensions.some(r => r.identifier.value === extensionIdentifier);
                if (!isExtensionRegistered) {
                    this.collections.delete(extensionIdentifier);
                    changes = true;
                }
            });
            if (changes) {
                this._updateCollections();
            }
        }
    };
    __decorate([
        decorators_1.throttle(1000)
    ], EnvironmentVariableService.prototype, "_persistCollectionsEventually", null);
    __decorate([
        decorators_1.debounce(1000)
    ], EnvironmentVariableService.prototype, "_notifyCollectionUpdatesEventually", null);
    EnvironmentVariableService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, storage_1.IStorageService)
    ], EnvironmentVariableService);
    exports.EnvironmentVariableService = EnvironmentVariableService;
});
//# __sourceMappingURL=environmentVariableService.js.map