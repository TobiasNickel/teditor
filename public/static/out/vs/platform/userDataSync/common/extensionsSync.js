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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/event", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/files/common/files", "vs/platform/configuration/common/configuration", "vs/platform/userDataSync/common/extensionsMerge", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/telemetry/common/telemetry", "vs/base/common/uri", "vs/base/common/resources", "vs/base/common/jsonFormatter", "vs/base/common/jsonEdit", "vs/base/common/strings", "vs/platform/storage/common/storage"], function (require, exports, userDataSync_1, event_1, environment_1, extensionManagement_1, extensionManagementUtil_1, files_1, configuration_1, extensionsMerge_1, abstractSynchronizer_1, telemetry_1, uri_1, resources_1, jsonFormatter_1, jsonEdit_1, strings_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsSynchroniser = void 0;
    let ExtensionsSynchroniser = class ExtensionsSynchroniser extends abstractSynchronizer_1.AbstractSynchroniser {
        constructor(environmentService, fileService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, extensionManagementService, extensionEnablementService, logService, extensionGalleryService, configurationService, userDataSyncResourceEnablementService, telemetryService) {
            super("extensions" /* Extensions */, fileService, environmentService, storageService, userDataSyncStoreService, userDataSyncBackupStoreService, userDataSyncResourceEnablementService, telemetryService, logService, configurationService);
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.extensionGalleryService = extensionGalleryService;
            /*
                Version 3 - Introduce installed property to skip installing built in extensions
            */
            this.version = 3;
            this._register(event_1.Event.debounce(event_1.Event.any(event_1.Event.filter(this.extensionManagementService.onDidInstallExtension, (e => !!e.gallery)), event_1.Event.filter(this.extensionManagementService.onDidUninstallExtension, (e => !e.error)), this.extensionEnablementService.onDidChangeEnablement), () => undefined, 500)(() => this.triggerLocalChange()));
        }
        isEnabled() { return super.isEnabled() && this.extensionGalleryService.isEnabled(); }
        async generatePullPreview(remoteUserData, lastSyncUserData, token) {
            const installedExtensions = await this.extensionManagementService.getInstalled();
            const localExtensions = this.getLocalExtensions(installedExtensions);
            const ignoredExtensions = extensionsMerge_1.getIgnoredExtensions(installedExtensions, this.configurationService);
            if (remoteUserData.syncData !== null) {
                const remoteExtensions = await this.parseAndMigrateExtensions(remoteUserData.syncData);
                const { added, updated, remote, removed } = extensionsMerge_1.merge(localExtensions, remoteExtensions, localExtensions, [], ignoredExtensions);
                return {
                    remoteUserData, lastSyncUserData,
                    added, removed, updated, remote, localExtensions, skippedExtensions: [],
                    hasLocalChanged: added.length > 0 || removed.length > 0 || updated.length > 0,
                    hasRemoteChanged: remote !== null,
                    hasConflicts: false,
                    isLastSyncFromCurrentMachine: false,
                };
            }
            else {
                return {
                    remoteUserData, lastSyncUserData,
                    added: [], removed: [], updated: [], remote: null, localExtensions, skippedExtensions: [],
                    hasLocalChanged: false,
                    hasRemoteChanged: false,
                    hasConflicts: false,
                    isLastSyncFromCurrentMachine: false,
                };
            }
        }
        async generatePushPreview(remoteUserData, lastSyncUserData, token) {
            const installedExtensions = await this.extensionManagementService.getInstalled();
            const localExtensions = this.getLocalExtensions(installedExtensions);
            const ignoredExtensions = extensionsMerge_1.getIgnoredExtensions(installedExtensions, this.configurationService);
            const { added, removed, updated, remote } = extensionsMerge_1.merge(localExtensions, null, null, [], ignoredExtensions);
            return {
                added, removed, updated, remote, remoteUserData, localExtensions, skippedExtensions: [], lastSyncUserData,
                hasLocalChanged: added.length > 0 || removed.length > 0 || updated.length > 0,
                hasRemoteChanged: remote !== null,
                isLastSyncFromCurrentMachine: false,
                hasConflicts: false,
            };
        }
        async generateReplacePreview(syncData, remoteUserData, lastSyncUserData) {
            const installedExtensions = await this.extensionManagementService.getInstalled();
            const localExtensions = this.getLocalExtensions(installedExtensions);
            const syncExtensions = await this.parseAndMigrateExtensions(syncData);
            const ignoredExtensions = extensionsMerge_1.getIgnoredExtensions(installedExtensions, this.configurationService);
            const { added, updated, removed } = extensionsMerge_1.merge(localExtensions, syncExtensions, localExtensions, [], ignoredExtensions);
            return {
                added, removed, updated, remote: syncExtensions, remoteUserData, localExtensions, skippedExtensions: [], lastSyncUserData,
                hasLocalChanged: added.length > 0 || removed.length > 0 || updated.length > 0,
                hasRemoteChanged: true,
                isLastSyncFromCurrentMachine: false,
                hasConflicts: false,
            };
        }
        async generatePreview(remoteUserData, lastSyncUserData) {
            const remoteExtensions = remoteUserData.syncData ? await this.parseAndMigrateExtensions(remoteUserData.syncData) : null;
            const skippedExtensions = lastSyncUserData ? lastSyncUserData.skippedExtensions || [] : [];
            const isLastSyncFromCurrentMachine = await this.isLastSyncFromCurrentMachine(remoteUserData);
            let lastSyncExtensions = null;
            if (lastSyncUserData === null) {
                if (isLastSyncFromCurrentMachine) {
                    lastSyncExtensions = await this.parseAndMigrateExtensions(remoteUserData.syncData);
                }
            }
            else {
                lastSyncExtensions = await this.parseAndMigrateExtensions(lastSyncUserData.syncData);
            }
            const installedExtensions = await this.extensionManagementService.getInstalled();
            const localExtensions = this.getLocalExtensions(installedExtensions);
            const ignoredExtensions = extensionsMerge_1.getIgnoredExtensions(installedExtensions, this.configurationService);
            if (remoteExtensions) {
                this.logService.trace(`${this.syncResourceLogLabel}: Merging remote extensions with local extensions...`);
            }
            else {
                this.logService.trace(`${this.syncResourceLogLabel}: Remote extensions does not exist. Synchronizing extensions for the first time.`);
            }
            const { added, removed, updated, remote } = extensionsMerge_1.merge(localExtensions, remoteExtensions, lastSyncExtensions, skippedExtensions, ignoredExtensions);
            return {
                added,
                removed,
                updated,
                remote,
                skippedExtensions,
                remoteUserData,
                localExtensions,
                lastSyncUserData,
                hasLocalChanged: added.length > 0 || removed.length > 0 || updated.length > 0,
                hasRemoteChanged: remote !== null,
                isLastSyncFromCurrentMachine,
                hasConflicts: false
            };
        }
        async updatePreviewWithConflict(preview, conflictResource, content, token) {
            throw new Error(`${this.syncResourceLogLabel}: Conflicts should not occur`);
        }
        async applyPreview({ added, removed, updated, remote, remoteUserData, skippedExtensions, lastSyncUserData, localExtensions, hasLocalChanged, hasRemoteChanged }, forcePush) {
            if (!hasLocalChanged && !hasRemoteChanged) {
                this.logService.info(`${this.syncResourceLogLabel}: No changes found during synchronizing extensions.`);
            }
            if (hasLocalChanged) {
                await this.backupLocal(JSON.stringify(localExtensions));
                skippedExtensions = await this.updateLocalExtensions(added, removed, updated, skippedExtensions);
            }
            if (remote) {
                // update remote
                this.logService.trace(`${this.syncResourceLogLabel}: Updating remote extensions...`);
                const content = JSON.stringify(remote);
                remoteUserData = await this.updateRemoteUserData(content, forcePush ? null : remoteUserData.ref);
                this.logService.info(`${this.syncResourceLogLabel}: Updated remote extensions`);
            }
            if ((lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref) !== remoteUserData.ref) {
                // update last sync
                this.logService.trace(`${this.syncResourceLogLabel}: Updating last synchronized extensions...`);
                await this.updateLastSyncUserData(remoteUserData, { skippedExtensions });
                this.logService.info(`${this.syncResourceLogLabel}: Updated last synchronized extensions`);
            }
        }
        async getAssociatedResources({ uri }) {
            return [{ resource: resources_1.joinPath(uri, 'extensions.json'), comparableResource: ExtensionsSynchroniser.EXTENSIONS_DATA_URI }];
        }
        async resolveContent(uri) {
            if (resources_1.isEqual(uri, ExtensionsSynchroniser.EXTENSIONS_DATA_URI)) {
                const installedExtensions = await this.extensionManagementService.getInstalled();
                const localExtensions = this.getLocalExtensions(installedExtensions);
                return this.format(localExtensions);
            }
            let content = await super.resolveContent(uri);
            if (content) {
                return content;
            }
            content = await super.resolveContent(resources_1.dirname(uri));
            if (content) {
                const syncData = this.parseSyncData(content);
                if (syncData) {
                    switch (resources_1.basename(uri)) {
                        case 'extensions.json':
                            return this.format(this.parseExtensions(syncData));
                    }
                }
            }
            return null;
        }
        format(extensions) {
            extensions.sort((e1, e2) => {
                if (!e1.identifier.uuid && e2.identifier.uuid) {
                    return -1;
                }
                if (e1.identifier.uuid && !e2.identifier.uuid) {
                    return 1;
                }
                return strings_1.compare(e1.identifier.id, e2.identifier.id);
            });
            const content = JSON.stringify(extensions);
            const edits = jsonFormatter_1.format(content, undefined, {});
            return jsonEdit_1.applyEdits(content, edits);
        }
        async hasLocalData() {
            try {
                const installedExtensions = await this.extensionManagementService.getInstalled();
                const localExtensions = this.getLocalExtensions(installedExtensions);
                if (localExtensions.some(e => e.installed || e.disabled)) {
                    return true;
                }
            }
            catch (error) {
                /* ignore error */
            }
            return false;
        }
        async updateLocalExtensions(added, removed, updated, skippedExtensions) {
            const removeFromSkipped = [];
            const addToSkipped = [];
            if (removed.length) {
                const installedExtensions = await this.extensionManagementService.getInstalled(1 /* User */);
                const extensionsToRemove = installedExtensions.filter(({ identifier }) => removed.some(r => extensionManagementUtil_1.areSameExtensions(identifier, r)));
                await Promise.all(extensionsToRemove.map(async (extensionToRemove) => {
                    this.logService.trace(`${this.syncResourceLogLabel}: Uninstalling local extension...`, extensionToRemove.identifier.id);
                    await this.extensionManagementService.uninstall(extensionToRemove);
                    this.logService.info(`${this.syncResourceLogLabel}: Uninstalled local extension.`, extensionToRemove.identifier.id);
                    removeFromSkipped.push(extensionToRemove.identifier);
                }));
            }
            if (added.length || updated.length) {
                await Promise.all([...added, ...updated].map(async (e) => {
                    const installedExtensions = await this.extensionManagementService.getInstalled();
                    const installedExtension = installedExtensions.filter(installed => extensionManagementUtil_1.areSameExtensions(installed.identifier, e.identifier))[0];
                    // Builtin Extension: Sync only enablement state
                    if (installedExtension && installedExtension.type === 0 /* System */) {
                        if (e.disabled) {
                            this.logService.trace(`${this.syncResourceLogLabel}: Disabling extension...`, e.identifier.id);
                            await this.extensionEnablementService.disableExtension(e.identifier);
                            this.logService.info(`${this.syncResourceLogLabel}: Disabled extension`, e.identifier.id);
                        }
                        else {
                            this.logService.trace(`${this.syncResourceLogLabel}: Enabling extension...`, e.identifier.id);
                            await this.extensionEnablementService.enableExtension(e.identifier);
                            this.logService.info(`${this.syncResourceLogLabel}: Enabled extension`, e.identifier.id);
                        }
                        removeFromSkipped.push(e.identifier);
                        return;
                    }
                    const extension = await this.extensionGalleryService.getCompatibleExtension(e.identifier, e.version);
                    if (extension) {
                        try {
                            if (e.disabled) {
                                this.logService.trace(`${this.syncResourceLogLabel}: Disabling extension...`, e.identifier.id, extension.version);
                                await this.extensionEnablementService.disableExtension(extension.identifier);
                                this.logService.info(`${this.syncResourceLogLabel}: Disabled extension`, e.identifier.id, extension.version);
                            }
                            else {
                                this.logService.trace(`${this.syncResourceLogLabel}: Enabling extension...`, e.identifier.id, extension.version);
                                await this.extensionEnablementService.enableExtension(extension.identifier);
                                this.logService.info(`${this.syncResourceLogLabel}: Enabled extension`, e.identifier.id, extension.version);
                            }
                            // Install only if the extension does not exist
                            if (!installedExtension || installedExtension.manifest.version !== extension.version) {
                                this.logService.trace(`${this.syncResourceLogLabel}: Installing extension...`, e.identifier.id, extension.version);
                                await this.extensionManagementService.installFromGallery(extension);
                                this.logService.info(`${this.syncResourceLogLabel}: Installed extension.`, e.identifier.id, extension.version);
                                removeFromSkipped.push(extension.identifier);
                            }
                        }
                        catch (error) {
                            addToSkipped.push(e);
                            this.logService.error(error);
                            this.logService.info(`${this.syncResourceLogLabel}: Skipped synchronizing extension`, extension.displayName || extension.identifier.id);
                        }
                    }
                    else {
                        addToSkipped.push(e);
                    }
                }));
            }
            const newSkippedExtensions = [];
            for (const skippedExtension of skippedExtensions) {
                if (!removeFromSkipped.some(e => extensionManagementUtil_1.areSameExtensions(e, skippedExtension.identifier))) {
                    newSkippedExtensions.push(skippedExtension);
                }
            }
            for (const skippedExtension of addToSkipped) {
                if (!newSkippedExtensions.some(e => extensionManagementUtil_1.areSameExtensions(e.identifier, skippedExtension.identifier))) {
                    newSkippedExtensions.push(skippedExtension);
                }
            }
            return newSkippedExtensions;
        }
        async parseAndMigrateExtensions(syncData) {
            const extensions = this.parseExtensions(syncData);
            if (syncData.version === 1
                || syncData.version === 2) {
                const systemExtensions = await this.extensionManagementService.getInstalled(0 /* System */);
                for (const extension of extensions) {
                    // #region Migration from v1 (enabled -> disabled)
                    if (syncData.version === 1) {
                        if (extension.enabled === false) {
                            extension.disabled = true;
                        }
                        delete extension.enabled;
                    }
                    // #endregion
                    // #region Migration from v2 (set installed property on extension)
                    if (syncData.version === 2) {
                        if (systemExtensions.every(installed => !extensionManagementUtil_1.areSameExtensions(installed.identifier, extension.identifier))) {
                            extension.installed = true;
                        }
                    }
                    // #endregion
                }
            }
            return extensions;
        }
        parseExtensions(syncData) {
            return JSON.parse(syncData.content);
        }
        getLocalExtensions(installedExtensions) {
            const disabledExtensions = this.extensionEnablementService.getDisabledExtensions();
            return installedExtensions
                .map(({ identifier, type }) => {
                const syncExntesion = { identifier };
                if (disabledExtensions.some(disabledExtension => extensionManagementUtil_1.areSameExtensions(disabledExtension, identifier))) {
                    syncExntesion.disabled = true;
                }
                if (type === 1 /* User */) {
                    syncExntesion.installed = true;
                }
                return syncExntesion;
            });
        }
    };
    ExtensionsSynchroniser.EXTENSIONS_DATA_URI = uri_1.URI.from({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'extensions', path: `/current.json` });
    ExtensionsSynchroniser = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, storage_1.IStorageService),
        __param(3, userDataSync_1.IUserDataSyncStoreService),
        __param(4, userDataSync_1.IUserDataSyncBackupStoreService),
        __param(5, extensionManagement_1.IExtensionManagementService),
        __param(6, extensionManagement_1.IGlobalExtensionEnablementService),
        __param(7, userDataSync_1.IUserDataSyncLogService),
        __param(8, extensionManagement_1.IExtensionGalleryService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, userDataSync_1.IUserDataSyncResourceEnablementService),
        __param(11, telemetry_1.ITelemetryService)
    ], ExtensionsSynchroniser);
    exports.ExtensionsSynchroniser = ExtensionsSynchroniser;
});
//# __sourceMappingURL=extensionsSync.js.map