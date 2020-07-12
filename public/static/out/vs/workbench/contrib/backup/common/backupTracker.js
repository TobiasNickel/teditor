/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BackupTracker = void 0;
    class BackupTracker extends lifecycle_1.Disposable {
        constructor(backupFileService, filesConfigurationService, workingCopyService, logService, lifecycleService) {
            super();
            this.backupFileService = backupFileService;
            this.filesConfigurationService = filesConfigurationService;
            this.workingCopyService = workingCopyService;
            this.logService = logService;
            this.lifecycleService = lifecycleService;
            // A map from working copy to a version ID we compute on each content
            // change. This version ID allows to e.g. ask if a backup for a specific
            // content has been made before closing.
            this.mapWorkingCopyToContentVersion = new Map();
            this.backupsDisabledForAutoSaveables = false;
            // A map of scheduled pending backups for working copies
            this.pendingBackups = new Map();
            // Figure out initial auto save config
            this.onAutoSaveConfigurationChange(filesConfigurationService.getAutoSaveConfiguration());
            // Fill in initial dirty working copies
            this.workingCopyService.dirtyWorkingCopies.forEach(workingCopy => this.onDidRegister(workingCopy));
            this.registerListeners();
        }
        registerListeners() {
            // Working Copy events
            this._register(this.workingCopyService.onDidRegister(workingCopy => this.onDidRegister(workingCopy)));
            this._register(this.workingCopyService.onDidUnregister(workingCopy => this.onDidUnregister(workingCopy)));
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => this.onDidChangeDirty(workingCopy)));
            this._register(this.workingCopyService.onDidChangeContent(workingCopy => this.onDidChangeContent(workingCopy)));
            // Listen to auto save config changes
            this._register(this.filesConfigurationService.onAutoSaveConfigurationChange(c => this.onAutoSaveConfigurationChange(c)));
            // Lifecycle (handled in subclasses)
            this.lifecycleService.onBeforeShutdown(event => event.veto(this.onBeforeShutdown(event.reason)));
        }
        onDidRegister(workingCopy) {
            if (workingCopy.isDirty()) {
                this.scheduleBackup(workingCopy);
            }
        }
        onDidUnregister(workingCopy) {
            // Remove from content version map
            this.mapWorkingCopyToContentVersion.delete(workingCopy);
            // Discard backup
            this.discardBackup(workingCopy);
        }
        onDidChangeDirty(workingCopy) {
            if (workingCopy.isDirty()) {
                this.scheduleBackup(workingCopy);
            }
            else {
                this.discardBackup(workingCopy);
            }
        }
        onDidChangeContent(workingCopy) {
            // Increment content version ID
            const contentVersionId = this.getContentVersion(workingCopy);
            this.mapWorkingCopyToContentVersion.set(workingCopy, contentVersionId + 1);
            // Schedule backup if dirty
            if (workingCopy.isDirty()) {
                // this listener will make sure that the backup is
                // pushed out for as long as the user is still changing
                // the content of the working copy.
                this.scheduleBackup(workingCopy);
            }
        }
        onAutoSaveConfigurationChange(configuration) {
            this.backupsDisabledForAutoSaveables = typeof configuration.autoSaveDelay === 'number' && configuration.autoSaveDelay < BackupTracker.DISABLE_BACKUP_AUTO_SAVE_THRESHOLD;
        }
        scheduleBackup(workingCopy) {
            if (this.backupsDisabledForAutoSaveables && !(workingCopy.capabilities & 2 /* Untitled */)) {
                return; // skip if auto save is enabled with a short delay
            }
            // Clear any running backup operation
            lifecycle_1.dispose(this.pendingBackups.get(workingCopy));
            this.pendingBackups.delete(workingCopy);
            this.logService.trace(`[backup tracker] scheduling backup`, workingCopy.resource.toString());
            // Schedule new backup
            const handle = setTimeout(async () => {
                // Clear disposable
                this.pendingBackups.delete(workingCopy);
                // Backup if dirty
                if (workingCopy.isDirty()) {
                    this.logService.trace(`[backup tracker] running backup`, workingCopy.resource.toString());
                    const backup = await workingCopy.backup();
                    this.backupFileService.backup(workingCopy.resource, backup.content, this.getContentVersion(workingCopy), backup.meta);
                }
            }, BackupTracker.BACKUP_FROM_CONTENT_CHANGE_DELAY);
            // Keep in map for disposal as needed
            this.pendingBackups.set(workingCopy, lifecycle_1.toDisposable(() => {
                this.logService.trace(`[backup tracker] clearing pending backup`, workingCopy.resource.toString());
                clearTimeout(handle);
            }));
        }
        getContentVersion(workingCopy) {
            return this.mapWorkingCopyToContentVersion.get(workingCopy) || 0;
        }
        discardBackup(workingCopy) {
            this.logService.trace(`[backup tracker] discarding backup`, workingCopy.resource.toString());
            // Clear any running backup operation
            lifecycle_1.dispose(this.pendingBackups.get(workingCopy));
            this.pendingBackups.delete(workingCopy);
            // Forward to backup file service
            this.backupFileService.discardBackup(workingCopy.resource);
        }
    }
    exports.BackupTracker = BackupTracker;
    // Disable backup for when a short auto-save delay is configured with
    // the rationale that the auto save will trigger a save periodically
    // anway and thus creating frequent backups is not useful
    //
    // This will only apply to working copies that are not untitled where
    // auto save is actually saving.
    BackupTracker.DISABLE_BACKUP_AUTO_SAVE_THRESHOLD = 1500;
    // Delay creation of backups when content changes to avoid too much
    // load on the backup service when the user is typing into the editor
    BackupTracker.BACKUP_FROM_CONTENT_CHANGE_DELAY = 1000;
});
//# __sourceMappingURL=backupTracker.js.map