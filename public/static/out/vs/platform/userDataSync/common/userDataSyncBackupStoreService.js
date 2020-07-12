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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/userDataSync/common/userDataSync", "vs/base/common/resources", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/environment/common/environment", "vs/base/common/date", "vs/base/common/buffer"], function (require, exports, lifecycle_1, userDataSync_1, resources_1, configuration_1, files_1, environment_1, date_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncBackupStoreService = void 0;
    let UserDataSyncBackupStoreService = class UserDataSyncBackupStoreService extends lifecycle_1.Disposable {
        constructor(environmentService, fileService, configurationService, logService) {
            super();
            this.environmentService = environmentService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.logService = logService;
            userDataSync_1.ALL_SYNC_RESOURCES.forEach(resourceKey => this.cleanUpBackup(resourceKey));
        }
        async getAllRefs(resource) {
            const folder = resources_1.joinPath(this.environmentService.userDataSyncHome, resource);
            const stat = await this.fileService.resolve(folder);
            if (stat.children) {
                const all = stat.children.filter(stat => stat.isFile && /^\d{8}T\d{6}(\.json)?$/.test(stat.name)).sort().reverse();
                return all.map(stat => ({
                    ref: stat.name,
                    created: this.getCreationTime(stat)
                }));
            }
            return [];
        }
        async resolveContent(resource, ref) {
            if (!ref) {
                const refs = await this.getAllRefs(resource);
                if (refs.length) {
                    ref = refs[refs.length - 1].ref;
                }
            }
            if (ref) {
                const file = resources_1.joinPath(this.environmentService.userDataSyncHome, resource, ref);
                const content = await this.fileService.readFile(file);
                return content.value.toString();
            }
            return null;
        }
        async backup(resourceKey, content) {
            const folder = resources_1.joinPath(this.environmentService.userDataSyncHome, resourceKey);
            const resource = resources_1.joinPath(folder, `${date_1.toLocalISOString(new Date()).replace(/-|:|\.\d+Z$/g, '')}.json`);
            try {
                await this.fileService.writeFile(resource, buffer_1.VSBuffer.fromString(content));
            }
            catch (e) {
                this.logService.error(e);
            }
            try {
                this.cleanUpBackup(resourceKey);
            }
            catch (e) { /* Ignore */ }
        }
        async cleanUpBackup(resource) {
            const folder = resources_1.joinPath(this.environmentService.userDataSyncHome, resource);
            try {
                try {
                    if (!(await this.fileService.exists(folder))) {
                        return;
                    }
                }
                catch (e) {
                    return;
                }
                const stat = await this.fileService.resolve(folder);
                if (stat.children) {
                    const all = stat.children.filter(stat => stat.isFile && /^\d{8}T\d{6}(\.json)?$/.test(stat.name)).sort();
                    const backUpMaxAge = 1000 * 60 * 60 * 24 * (this.configurationService.getValue('sync.localBackupDuration') || 30 /* Default 30 days */);
                    let toDelete = all.filter(stat => Date.now() - this.getCreationTime(stat) > backUpMaxAge);
                    const remaining = all.length - toDelete.length;
                    if (remaining < 10) {
                        toDelete = toDelete.slice(10 - remaining);
                    }
                    await Promise.all(toDelete.map(stat => {
                        this.logService.info('Deleting from backup', stat.resource.path);
                        this.fileService.del(stat.resource);
                    }));
                }
            }
            catch (e) {
                this.logService.error(e);
            }
        }
        getCreationTime(stat) {
            return stat.ctime || new Date(parseInt(stat.name.substring(0, 4)), parseInt(stat.name.substring(4, 6)) - 1, parseInt(stat.name.substring(6, 8)), parseInt(stat.name.substring(9, 11)), parseInt(stat.name.substring(11, 13)), parseInt(stat.name.substring(13, 15))).getTime();
        }
    };
    UserDataSyncBackupStoreService = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, userDataSync_1.IUserDataSyncLogService)
    ], UserDataSyncBackupStoreService);
    exports.UserDataSyncBackupStoreService = UserDataSyncBackupStoreService;
});
//# __sourceMappingURL=userDataSyncBackupStoreService.js.map