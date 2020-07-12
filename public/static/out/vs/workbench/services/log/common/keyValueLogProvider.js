/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/buffer", "vs/base/common/resources", "vs/base/common/map", "vs/nls"], function (require, exports, uri_1, files_1, lifecycle_1, event_1, buffer_1, resources_1, map_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeyValueLogProvider = void 0;
    class KeyValueLogProvider extends lifecycle_1.Disposable {
        constructor(scheme) {
            super();
            this.scheme = scheme;
            this.capabilities = 2 /* FileReadWrite */
                | 1024 /* PathCaseSensitive */;
            this.onDidChangeCapabilities = event_1.Event.None;
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this.versions = new Map();
        }
        watch(resource, opts) {
            return lifecycle_1.Disposable.None;
        }
        async mkdir(resource) {
        }
        async stat(resource) {
            try {
                const content = await this.readFile(resource);
                return {
                    type: files_1.FileType.File,
                    ctime: 0,
                    mtime: this.versions.get(resource.toString()) || 0,
                    size: content.byteLength
                };
            }
            catch (e) {
            }
            const files = await this.readdir(resource);
            if (files.length) {
                return {
                    type: files_1.FileType.Directory,
                    ctime: 0,
                    mtime: 0,
                    size: 0
                };
            }
            throw files_1.createFileSystemProviderError(nls_1.localize('fileNotExists', "File does not exist"), files_1.FileSystemProviderErrorCode.FileNotFound);
        }
        async readdir(resource) {
            const hasKey = await this.hasKey(resource.path);
            if (hasKey) {
                throw files_1.createFileSystemProviderError(nls_1.localize('fileNotDirectory', "File is not a directory"), files_1.FileSystemProviderErrorCode.FileNotADirectory);
            }
            const keys = await this.getAllKeys();
            const files = new Map();
            for (const key of keys) {
                const keyResource = this.toResource(key);
                if (resources_1.extUri.isEqualOrParent(keyResource, resource)) {
                    const path = resources_1.extUri.relativePath(resource, keyResource);
                    if (path) {
                        const keySegments = path.split('/');
                        files.set(keySegments[0], [keySegments[0], keySegments.length === 1 ? files_1.FileType.File : files_1.FileType.Directory]);
                    }
                }
            }
            return map_1.values(files);
        }
        async readFile(resource) {
            const hasKey = await this.hasKey(resource.path);
            if (!hasKey) {
                throw files_1.createFileSystemProviderError(nls_1.localize('fileNotFound', "File not found"), files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            const value = await this.getValue(resource.path);
            return buffer_1.VSBuffer.fromString(value).buffer;
        }
        async writeFile(resource, content, opts) {
            const hasKey = await this.hasKey(resource.path);
            if (!hasKey) {
                const files = await this.readdir(resource);
                if (files.length) {
                    throw files_1.createFileSystemProviderError(nls_1.localize('fileIsDirectory', "File is Directory"), files_1.FileSystemProviderErrorCode.FileIsADirectory);
                }
            }
            await this.setValue(resource.path, buffer_1.VSBuffer.wrap(content).toString());
            this.versions.set(resource.toString(), (this.versions.get(resource.toString()) || 0) + 1);
            this._onDidChangeFile.fire([{ resource, type: 0 /* UPDATED */ }]);
        }
        async delete(resource, opts) {
            const hasKey = await this.hasKey(resource.path);
            if (hasKey) {
                await this.deleteKey(resource.path);
                this.versions.delete(resource.path);
                this._onDidChangeFile.fire([{ resource, type: 2 /* DELETED */ }]);
                return;
            }
            if (opts.recursive) {
                const files = await this.readdir(resource);
                await Promise.all(files.map(([key]) => this.delete(resources_1.joinPath(resource, key), opts)));
            }
        }
        rename(from, to, opts) {
            return Promise.reject(new Error('Not Supported'));
        }
        toResource(key) {
            return uri_1.URI.file(key).with({ scheme: this.scheme });
        }
    }
    exports.KeyValueLogProvider = KeyValueLogProvider;
});
//# __sourceMappingURL=keyValueLogProvider.js.map