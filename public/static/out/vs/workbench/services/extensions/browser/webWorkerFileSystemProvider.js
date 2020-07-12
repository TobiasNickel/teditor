/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/files/common/files", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/errors"], function (require, exports, files_1, event_1, lifecycle_1, errors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });


    // 2: "FileReadWrite"
    // 4: "FileOpenReadWriteClose"
    // 8: "FileFolderCopy"
    // 16: "FileReadStream"
    // 1024: "PathCaseSensitive"
    // 2048: "Readonly"
    window.files_1 = files_1
    const filePaths = [
        '/fs/.vscode/settings.json',
        '/fs/.vscode/tasks.json',
        '/fs/.vscode/launch.json',
    ];

    class FetchFileSystemProvider {
        constructor() {
            this.capabilities = 2 + 4 + 8 + 16 + 1014;// 2048 /* Readonly */ + 2 /* FileReadWrite */ + 1024 /* PathCaseSensitive */;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.onDidChangeFile = event_1.Event.None;
            this.openFiles = {};
            this.nextId = 0;
        }
        // working implementations
        async readFile(resource) {
            // console.log('FS.readFile', resource)
            try {
                const res = await fetch(resource.toString(true));
                if (res.status === 200) {
                    return new Uint8Array(await res.arrayBuffer());
                }
                throw new files_1.FileSystemProviderError(res.statusText, files_1.FileSystemProviderErrorCode.Unknown);
            }
            catch (err) {
                throw new files_1.FileSystemProviderError(err, files_1.FileSystemProviderErrorCode.Unknown);
            }
        }
        // fake implementations
        async stat(resource, ...other) {
            // console.log('FS.stat', resource, other)
            if (filePaths.includes(resource.path) || resource.path.includes('/static-extension/')) {
                return {
                    type: files_1.FileType.File,
                    size: 0,
                    mtime: 0,
                    ctime: 0
                }
            }
            if (resource.path == '/fs') {
                return {
                    type: files_1.FileType.Directory,
                    size: 0,
                    mtime: 0,
                    ctime: 0
                }
            }
            const res = await fetch('/fileStat' + resource.path);// resource.toString(true)
            if (res.status === 200) {
                const r = await res.json();
                console.log('stat:', resource.path, r)
                if (r == null) {
                    throw new files_1.FileSystemProviderError(res.statusText, files_1.FileSystemProviderErrorCode.FileNotFound);
                    // throw vscode_1.FileSystemError.FileNotFound(uri);
                    //throw new files_1.FileSystemProviderError(res.statusText, files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                return r;
                // {
                //     type: files_1.FileType.File,
                //     size: 0,
                //     mtime: 0,
                //     ctime: 0
                // }
            }
            throw new files_1.FileSystemProviderError(res.statusText, files_1.FileSystemProviderErrorCode.Unknown);
        }
        watch(...args) {
            // console.log('FS.watch', ...args)
            return lifecycle_1.Disposable.None;
        }
        // error implementations
        writeFile(resource, _content, _opts) {
            // console.log('FS.writeFile', resource.path)
            throw new errors_1.NotImplementedError();
        }
        async readdir(resource) {
            // console.log('FS.readdir', resource.path)
            try {
                const res = await fetch('/readdir' + resource.path);// resource.toString(true)
                if (res.status === 200) {
                    const r = await res.json();
                    return r || []
                }
                throw new files_1.FileSystemProviderError(res.statusText, files_1.FileSystemProviderErrorCode.Unknown);
            }
            catch (err) {
                throw new files_1.FileSystemProviderError(err, files_1.FileSystemProviderErrorCode.Unknown);
            }
        }
        readFileStream(resource) {
            const listenerMap = {}
            var stream = {
                on: (name, handler) => {
                    //console.log('readFileStream,on:',name)
                    if (!listenerMap[name]) { listenerMap[name] = []; }
                    listenerMap[name].push(handler)
                },
                trigger: (name, data) => {
                    listenerMap[name].forEach(handler => handler(data));
                }
            };
            (async () => {
                // console.log('FS.readFileStream', resource.path);
                try {
                    const res = await fetch(resource.toString(true));
                    if (res.status === 200) {
                        const data = new Uint8Array(await res.arrayBuffer());
                        stream.trigger('data', data);
                        stream.trigger('end');
                        return;
                    }
                    throw new files_1.FileSystemProviderError(res.statusText, files_1.FileSystemProviderErrorCode.Unknown);
                }
                catch (err) {
                    // console.log(err)
                    stream.trigger('error', err)
                    throw new files_1.FileSystemProviderError(err, files_1.FileSystemProviderErrorCode.Unknown);
                }

            })()
            return stream;
        }
        async mkdir(resource) {
            // console.log('FS.mkdir', resource.path)
            await fetch('/mkdir',{
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resource,
                })
            })
        }
        async delete(resource, opts) {
            await fetch('/deletefile', {
                method: 'delete',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resource, opts
                })
            })
            return;
        }
        async rename(from, to, opts) {
            // console.log('FS.rename', from, to)
            await fetch('/rename', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from, to, opts
                })
            });
            // throw new errors_1.NotImplementedError();
        }
        async open(resource, mode) {
            var id = this.nextId++;
            // console.log('FS.open', { resource, mode })
            this.openFiles[id] = {
                resource,
                mode,
            }
            return id;
        }
        async write(id, a, content, b, c) {
            // console.log('FS.write', id, a, content, b, c)
            this.openFiles[id].written = true;
            await fetch('/writefile/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ... this.openFiles[id],
                    content: new TextDecoder("utf-8").decode(content)
                })
            });
            // console.log('FS.write',...args)
        }
        async close(id) {
            // console.log('FS.close', id, this.openFiles[id])
            if (!this.openFiles[id].written) {
                await fetch('/writefile/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ... this.openFiles[id],
                        content: ''
                    })
                });
            }
            delete this.openFiles[id];
            return 1;
        }
    }
    exports.FetchFileSystemProvider = FetchFileSystemProvider;
});
//# __sourceMappingURL=webWorkerFileSystemProvider.js.map

//Unable to open 'testFile.js (read-only)': Unable to read file 'http:/fs/testFile.js' (TypeError: provider.readFileStream is not a function).