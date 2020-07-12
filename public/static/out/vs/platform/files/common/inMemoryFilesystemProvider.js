/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/platform/files/common/files"], function (require, exports, event_1, lifecycle_1, resources, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryFileSystemProvider = void 0;
    class File {
        constructor(name) {
            this.type = files_1.FileType.File;
            this.ctime = Date.now();
            this.mtime = Date.now();
            this.size = 0;
            this.name = name;
        }
    }
    class Directory {
        constructor(name) {
            this.type = files_1.FileType.Directory;
            this.ctime = Date.now();
            this.mtime = Date.now();
            this.size = 0;
            this.name = name;
            this.entries = new Map();
        }
    }
    class InMemoryFileSystemProvider extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.capabilities = 2 /* FileReadWrite */
                | 1024 /* PathCaseSensitive */;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.root = new Directory('');
            // --- manage file events
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this._bufferedChanges = [];
        }
        // --- manage file metadata
        async stat(resource) {
            return this._lookup(resource, false);
        }
        async readdir(resource) {
            const entry = this._lookupAsDirectory(resource, false);
            let result = [];
            entry.entries.forEach((child, name) => result.push([name, child.type]));
            return result;
        }
        // --- manage file contents
        async readFile(resource) {
            const data = this._lookupAsFile(resource, false).data;
            if (data) {
                return data;
            }
            throw new files_1.FileSystemProviderError('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
        }
        async writeFile(resource, content, opts) {
            let basename = resources.basename(resource);
            let parent = this._lookupParentDirectory(resource);
            let entry = parent.entries.get(basename);
            if (entry instanceof Directory) {
                throw new files_1.FileSystemProviderError('file is directory', files_1.FileSystemProviderErrorCode.FileIsADirectory);
            }
            if (!entry && !opts.create) {
                throw new files_1.FileSystemProviderError('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            if (entry && opts.create && !opts.overwrite) {
                throw new files_1.FileSystemProviderError('file exists already', files_1.FileSystemProviderErrorCode.FileExists);
            }
            if (!entry) {
                entry = new File(basename);
                parent.entries.set(basename, entry);
                this._fireSoon({ type: 1 /* ADDED */, resource });
            }
            entry.mtime = Date.now();
            entry.size = content.byteLength;
            entry.data = content;
            this._fireSoon({ type: 0 /* UPDATED */, resource });
        }
        // --- manage files/folders
        async rename(from, to, opts) {
            if (!opts.overwrite && this._lookup(to, true)) {
                throw new files_1.FileSystemProviderError('file exists already', files_1.FileSystemProviderErrorCode.FileExists);
            }
            let entry = this._lookup(from, false);
            let oldParent = this._lookupParentDirectory(from);
            let newParent = this._lookupParentDirectory(to);
            let newName = resources.basename(to);
            oldParent.entries.delete(entry.name);
            entry.name = newName;
            newParent.entries.set(newName, entry);
            this._fireSoon({ type: 2 /* DELETED */, resource: from }, { type: 1 /* ADDED */, resource: to });
        }
        async delete(resource, opts) {
            let dirname = resources.dirname(resource);
            let basename = resources.basename(resource);
            let parent = this._lookupAsDirectory(dirname, false);
            if (parent.entries.has(basename)) {
                parent.entries.delete(basename);
                parent.mtime = Date.now();
                parent.size -= 1;
                this._fireSoon({ type: 0 /* UPDATED */, resource: dirname }, { resource, type: 2 /* DELETED */ });
            }
        }
        async mkdir(resource) {
            let basename = resources.basename(resource);
            let dirname = resources.dirname(resource);
            let parent = this._lookupAsDirectory(dirname, false);
            let entry = new Directory(basename);
            parent.entries.set(entry.name, entry);
            parent.mtime = Date.now();
            parent.size += 1;
            this._fireSoon({ type: 0 /* UPDATED */, resource: dirname }, { type: 1 /* ADDED */, resource });
        }
        _lookup(uri, silent) {
            let parts = uri.path.split('/');
            let entry = this.root;
            for (const part of parts) {
                if (!part) {
                    continue;
                }
                let child;
                if (entry instanceof Directory) {
                    child = entry.entries.get(part);
                }
                if (!child) {
                    if (!silent) {
                        throw new files_1.FileSystemProviderError('file not found', files_1.FileSystemProviderErrorCode.FileNotFound);
                    }
                    else {
                        return undefined;
                    }
                }
                entry = child;
            }
            return entry;
        }
        _lookupAsDirectory(uri, silent) {
            let entry = this._lookup(uri, silent);
            if (entry instanceof Directory) {
                return entry;
            }
            throw new files_1.FileSystemProviderError('file not a directory', files_1.FileSystemProviderErrorCode.FileNotADirectory);
        }
        _lookupAsFile(uri, silent) {
            let entry = this._lookup(uri, silent);
            if (entry instanceof File) {
                return entry;
            }
            throw new files_1.FileSystemProviderError('file is a directory', files_1.FileSystemProviderErrorCode.FileIsADirectory);
        }
        _lookupParentDirectory(uri) {
            const dirname = resources.dirname(uri);
            return this._lookupAsDirectory(dirname, false);
        }
        watch(resource, opts) {
            // ignore, fires for all changes...
            return lifecycle_1.Disposable.None;
        }
        _fireSoon(...changes) {
            this._bufferedChanges.push(...changes);
            if (this._fireSoonHandle) {
                clearTimeout(this._fireSoonHandle);
            }
            this._fireSoonHandle = setTimeout(() => {
                this._onDidChangeFile.fire(this._bufferedChanges);
                this._bufferedChanges.length = 0;
            }, 5);
        }
    }
    exports.InMemoryFileSystemProvider = InMemoryFileSystemProvider;
});
//# __sourceMappingURL=inMemoryFilesystemProvider.js.map