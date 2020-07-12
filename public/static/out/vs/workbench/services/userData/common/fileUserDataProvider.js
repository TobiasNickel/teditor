/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/strings", "vs/platform/environment/common/environment", "vs/base/common/resources"], function (require, exports, event_1, lifecycle_1, files_1, strings_1, environment_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileUserDataProvider = void 0;
    class FileUserDataProvider extends lifecycle_1.Disposable {
        constructor(fileSystemUserDataHome, fileSystemBackupsHome, fileSystemProvider, environmentService, logService) {
            super();
            this.fileSystemUserDataHome = fileSystemUserDataHome;
            this.fileSystemBackupsHome = fileSystemBackupsHome;
            this.fileSystemProvider = fileSystemProvider;
            this.logService = logService;
            this.capabilities = this.fileSystemProvider.capabilities;
            this.onDidChangeCapabilities = this.fileSystemProvider.onDidChangeCapabilities;
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this.userDataHome = environmentService.userRoamingDataHome;
            this.extUri = !!(this.capabilities & 1024 /* PathCaseSensitive */) ? resources_1.extUri : resources_1.extUriIgnorePathCase;
            // update extUri as capabilites might change.
            this._register(this.onDidChangeCapabilities(() => this.extUri = !!(this.capabilities & 1024 /* PathCaseSensitive */) ? resources_1.extUri : resources_1.extUriIgnorePathCase));
            // Assumption: This path always exists
            this._register(this.fileSystemProvider.watch(this.fileSystemUserDataHome, { recursive: false, excludes: [] }));
            this._register(this.fileSystemProvider.onDidChangeFile(e => this.handleFileChanges(e)));
        }
        watch(resource, opts) {
            return this.fileSystemProvider.watch(this.toFileSystemResource(resource), opts);
        }
        stat(resource) {
            return this.fileSystemProvider.stat(this.toFileSystemResource(resource));
        }
        mkdir(resource) {
            return this.fileSystemProvider.mkdir(this.toFileSystemResource(resource));
        }
        rename(from, to, opts) {
            return this.fileSystemProvider.rename(this.toFileSystemResource(from), this.toFileSystemResource(to), opts);
        }
        readFile(resource) {
            if (files_1.hasReadWriteCapability(this.fileSystemProvider)) {
                return this.fileSystemProvider.readFile(this.toFileSystemResource(resource));
            }
            throw new Error('not supported');
        }
        readFileStream(resource, opts, token) {
            if (files_1.hasFileReadStreamCapability(this.fileSystemProvider)) {
                return this.fileSystemProvider.readFileStream(this.toFileSystemResource(resource), opts, token);
            }
            throw new Error('not supported');
        }
        readdir(resource) {
            return this.fileSystemProvider.readdir(this.toFileSystemResource(resource));
        }
        writeFile(resource, content, opts) {
            if (files_1.hasReadWriteCapability(this.fileSystemProvider)) {
                return this.fileSystemProvider.writeFile(this.toFileSystemResource(resource), content, opts);
            }
            throw new Error('not supported');
        }
        open(resource, opts) {
            if (files_1.hasOpenReadWriteCloseCapability(this.fileSystemProvider)) {
                return this.fileSystemProvider.open(this.toFileSystemResource(resource), opts);
            }
            throw new Error('not supported');
        }
        close(fd) {
            if (files_1.hasOpenReadWriteCloseCapability(this.fileSystemProvider)) {
                return this.fileSystemProvider.close(fd);
            }
            throw new Error('not supported');
        }
        read(fd, pos, data, offset, length) {
            if (files_1.hasOpenReadWriteCloseCapability(this.fileSystemProvider)) {
                return this.fileSystemProvider.read(fd, pos, data, offset, length);
            }
            throw new Error('not supported');
        }
        write(fd, pos, data, offset, length) {
            if (files_1.hasOpenReadWriteCloseCapability(this.fileSystemProvider)) {
                return this.fileSystemProvider.write(fd, pos, data, offset, length);
            }
            throw new Error('not supported');
        }
        delete(resource, opts) {
            return this.fileSystemProvider.delete(this.toFileSystemResource(resource), opts);
        }
        handleFileChanges(changes) {
            const userDataChanges = [];
            for (const change of changes) {
                const userDataResource = this.toUserDataResource(change.resource);
                if (userDataResource) {
                    userDataChanges.push({
                        resource: userDataResource,
                        type: change.type
                    });
                }
            }
            if (userDataChanges.length) {
                this.logService.debug('User data changed');
                this._onDidChangeFile.fire(userDataChanges);
            }
        }
        toFileSystemResource(userDataResource) {
            const relativePath = this.extUri.relativePath(this.userDataHome, userDataResource);
            if (strings_1.startsWith(relativePath, environment_1.BACKUPS)) {
                return this.extUri.joinPath(this.extUri.dirname(this.fileSystemBackupsHome), relativePath);
            }
            return this.extUri.joinPath(this.fileSystemUserDataHome, relativePath);
        }
        toUserDataResource(fileSystemResource) {
            if (this.extUri.isEqualOrParent(fileSystemResource, this.fileSystemUserDataHome)) {
                const relativePath = this.extUri.relativePath(this.fileSystemUserDataHome, fileSystemResource);
                return relativePath ? this.extUri.joinPath(this.userDataHome, relativePath) : this.userDataHome;
            }
            if (this.extUri.isEqualOrParent(fileSystemResource, this.fileSystemBackupsHome)) {
                const relativePath = this.extUri.relativePath(this.fileSystemBackupsHome, fileSystemResource);
                return relativePath ? this.extUri.joinPath(this.userDataHome, environment_1.BACKUPS, relativePath) : this.extUri.joinPath(this.userDataHome, environment_1.BACKUPS);
            }
            return null;
        }
    }
    exports.FileUserDataProvider = FileUserDataProvider;
});
//# __sourceMappingURL=fileUserDataProvider.js.map