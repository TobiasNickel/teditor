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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/files/common/files", "vs/workbench/api/common/extHostCustomers", "../common/extHost.protocol", "vs/base/common/buffer"], function (require, exports, event_1, lifecycle_1, uri_1, files_1, extHostCustomers_1, extHost_protocol_1, buffer_1) {
    "use strict";
    var MainThreadFileSystem_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadFileSystem = void 0;
    let MainThreadFileSystem = MainThreadFileSystem_1 = class MainThreadFileSystem {
        constructor(extHostContext, _fileService) {
            this._fileService = _fileService;
            this._fileProvider = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostFileSystem);
        }
        dispose() {
            lifecycle_1.dispose(this._fileProvider.values());
            this._fileProvider.clear();
        }
        $registerFileSystemProvider(handle, scheme, capabilities) {
            this._fileProvider.set(handle, new RemoteFileSystemProvider(this._fileService, scheme, capabilities, handle, this._proxy));
        }
        $unregisterProvider(handle) {
            lifecycle_1.dispose(this._fileProvider.get(handle));
            this._fileProvider.delete(handle);
        }
        $onFileSystemChange(handle, changes) {
            const fileProvider = this._fileProvider.get(handle);
            if (!fileProvider) {
                throw new Error('Unknown file provider');
            }
            fileProvider.$onFileSystemChange(changes);
        }
        // --- consumer fs, vscode.workspace.fs
        $stat(uri) {
            return this._fileService.resolve(uri_1.URI.revive(uri), { resolveMetadata: true }).then(stat => {
                return {
                    ctime: stat.ctime,
                    mtime: stat.mtime,
                    size: stat.size,
                    type: MainThreadFileSystem_1._asFileType(stat)
                };
            }).catch(MainThreadFileSystem_1._handleError);
        }
        $readdir(uri) {
            return this._fileService.resolve(uri_1.URI.revive(uri), { resolveMetadata: false }).then(stat => {
                if (!stat.isDirectory) {
                    const err = new Error(stat.name);
                    err.name = files_1.FileSystemProviderErrorCode.FileNotADirectory;
                    throw err;
                }
                return !stat.children ? [] : stat.children.map(child => [child.name, MainThreadFileSystem_1._asFileType(child)]);
            }).catch(MainThreadFileSystem_1._handleError);
        }
        static _asFileType(stat) {
            let res = 0;
            if (stat.isFile) {
                res += files_1.FileType.File;
            }
            else if (stat.isDirectory) {
                res += files_1.FileType.Directory;
            }
            if (stat.isSymbolicLink) {
                res += files_1.FileType.SymbolicLink;
            }
            return res;
        }
        $readFile(uri) {
            return this._fileService.readFile(uri_1.URI.revive(uri)).then(file => file.value).catch(MainThreadFileSystem_1._handleError);
        }
        $writeFile(uri, content) {
            return this._fileService.writeFile(uri_1.URI.revive(uri), content)
                .then(() => undefined).catch(MainThreadFileSystem_1._handleError);
        }
        $rename(source, target, opts) {
            return this._fileService.move(uri_1.URI.revive(source), uri_1.URI.revive(target), opts.overwrite)
                .then(() => undefined).catch(MainThreadFileSystem_1._handleError);
        }
        $copy(source, target, opts) {
            return this._fileService.copy(uri_1.URI.revive(source), uri_1.URI.revive(target), opts.overwrite)
                .then(() => undefined).catch(MainThreadFileSystem_1._handleError);
        }
        $mkdir(uri) {
            return this._fileService.createFolder(uri_1.URI.revive(uri))
                .then(() => undefined).catch(MainThreadFileSystem_1._handleError);
        }
        $delete(uri, opts) {
            return this._fileService.del(uri_1.URI.revive(uri), opts).catch(MainThreadFileSystem_1._handleError);
        }
        static _handleError(err) {
            if (err instanceof files_1.FileOperationError) {
                switch (err.fileOperationResult) {
                    case 1 /* FILE_NOT_FOUND */:
                        err.name = files_1.FileSystemProviderErrorCode.FileNotFound;
                        break;
                    case 0 /* FILE_IS_DIRECTORY */:
                        err.name = files_1.FileSystemProviderErrorCode.FileIsADirectory;
                        break;
                    case 6 /* FILE_PERMISSION_DENIED */:
                        err.name = files_1.FileSystemProviderErrorCode.NoPermissions;
                        break;
                    case 4 /* FILE_MOVE_CONFLICT */:
                        err.name = files_1.FileSystemProviderErrorCode.FileExists;
                        break;
                }
            }
            throw err;
        }
    };
    MainThreadFileSystem = MainThreadFileSystem_1 = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadFileSystem),
        __param(1, files_1.IFileService)
    ], MainThreadFileSystem);
    exports.MainThreadFileSystem = MainThreadFileSystem;
    class RemoteFileSystemProvider {
        constructor(fileService, scheme, capabilities, _handle, _proxy) {
            this._handle = _handle;
            this._proxy = _proxy;
            this._onDidChange = new event_1.Emitter();
            this.onDidChangeFile = this._onDidChange.event;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.capabilities = capabilities;
            this._registration = fileService.registerProvider(scheme, this);
        }
        dispose() {
            this._registration.dispose();
            this._onDidChange.dispose();
        }
        watch(resource, opts) {
            const session = Math.random();
            this._proxy.$watch(this._handle, session, resource, opts);
            return lifecycle_1.toDisposable(() => {
                this._proxy.$unwatch(this._handle, session);
            });
        }
        $onFileSystemChange(changes) {
            this._onDidChange.fire(changes.map(RemoteFileSystemProvider._createFileChange));
        }
        static _createFileChange(dto) {
            return { resource: uri_1.URI.revive(dto.resource), type: dto.type };
        }
        // --- forwarding calls
        stat(resource) {
            return this._proxy.$stat(this._handle, resource).then(undefined, err => {
                throw err;
            });
        }
        readFile(resource) {
            return this._proxy.$readFile(this._handle, resource).then(buffer => buffer.buffer);
        }
        writeFile(resource, content, opts) {
            return this._proxy.$writeFile(this._handle, resource, buffer_1.VSBuffer.wrap(content), opts);
        }
        delete(resource, opts) {
            return this._proxy.$delete(this._handle, resource, opts);
        }
        mkdir(resource) {
            return this._proxy.$mkdir(this._handle, resource);
        }
        readdir(resource) {
            return this._proxy.$readdir(this._handle, resource);
        }
        rename(resource, target, opts) {
            return this._proxy.$rename(this._handle, resource, target, opts);
        }
        copy(resource, target, opts) {
            return this._proxy.$copy(this._handle, resource, target, opts);
        }
        open(resource, opts) {
            return this._proxy.$open(this._handle, resource, opts);
        }
        close(fd) {
            return this._proxy.$close(this._handle, fd);
        }
        read(fd, pos, data, offset, length) {
            return this._proxy.$read(this._handle, fd, pos, length).then(readData => {
                data.set(readData.buffer, offset);
                return readData.byteLength;
            });
        }
        write(fd, pos, data, offset, length) {
            return this._proxy.$write(this._handle, fd, pos, buffer_1.VSBuffer.wrap(data).slice(offset, offset + length));
        }
    }
});
//# __sourceMappingURL=mainThreadFileSystem.js.map