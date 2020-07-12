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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/base/common/event", "vs/base/common/resources", "vs/nls", "vs/base/common/map", "vs/base/common/arrays", "vs/base/common/labels", "vs/platform/log/common/log", "vs/base/common/buffer", "vs/base/common/stream", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/network", "vs/platform/files/common/io"], function (require, exports, lifecycle_1, files_1, event_1, resources_1, nls_1, map_1, arrays_1, labels_1, log_1, buffer_1, stream_1, async_1, cancellation_1, network_1, io_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileService = void 0;
    let FileService = class FileService extends lifecycle_1.Disposable {
        constructor(logService) {
            super();
            this.logService = logService;
            this.BUFFER_SIZE = 64 * 1024;
            //#region File System Provider
            this._onDidChangeFileSystemProviderRegistrations = this._register(new event_1.Emitter());
            this.onDidChangeFileSystemProviderRegistrations = this._onDidChangeFileSystemProviderRegistrations.event;
            this._onWillActivateFileSystemProvider = this._register(new event_1.Emitter());
            this.onWillActivateFileSystemProvider = this._onWillActivateFileSystemProvider.event;
            this._onDidChangeFileSystemProviderCapabilities = this._register(new event_1.Emitter());
            this.onDidChangeFileSystemProviderCapabilities = this._onDidChangeFileSystemProviderCapabilities.event;
            this.provider = new Map();
            //#endregion
            this._onDidRunOperation = this._register(new event_1.Emitter());
            this.onDidRunOperation = this._onDidRunOperation.event;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            //#endregion
            //#region File Watching
            this._onDidFilesChange = this._register(new event_1.Emitter());
            this.onDidFilesChange = this._onDidFilesChange.event;
            this.activeWatchers = new Map();
            //#endregion
            //#region Helpers
            this.writeQueues = new Map();
        }
        registerProvider(scheme, provider) {
            if (this.provider.has(scheme)) {
                throw new Error(`A filesystem provider for the scheme '${scheme}' is already registered.`);
            }
            // Add provider with event
            this.provider.set(scheme, provider);
            this._onDidChangeFileSystemProviderRegistrations.fire({ added: true, scheme, provider });
            // Forward events from provider
            const providerDisposables = new lifecycle_1.DisposableStore();
            providerDisposables.add(provider.onDidChangeFile(changes => this._onDidFilesChange.fire(new files_1.FileChangesEvent(changes, this.getExtUri(provider).extUri))));
            providerDisposables.add(provider.onDidChangeCapabilities(() => this._onDidChangeFileSystemProviderCapabilities.fire({ provider, scheme })));
            if (typeof provider.onDidErrorOccur === 'function') {
                providerDisposables.add(provider.onDidErrorOccur(error => this._onError.fire(new Error(error))));
            }
            return lifecycle_1.toDisposable(() => {
                this._onDidChangeFileSystemProviderRegistrations.fire({ added: false, scheme, provider });
                this.provider.delete(scheme);
                lifecycle_1.dispose(providerDisposables);
            });
        }
        async activateProvider(scheme) {
            // Emit an event that we are about to activate a provider with the given scheme.
            // Listeners can participate in the activation by registering a provider for it.
            const joiners = [];
            this._onWillActivateFileSystemProvider.fire({
                scheme,
                join(promise) {
                    if (promise) {
                        joiners.push(promise);
                    }
                },
            });
            if (this.provider.has(scheme)) {
                return; // provider is already here so we can return directly
            }
            // If the provider is not yet there, make sure to join on the listeners assuming
            // that it takes a bit longer to register the file system provider.
            await Promise.all(joiners);
        }
        canHandleResource(resource) {
            return this.provider.has(resource.scheme);
        }
        hasCapability(resource, capability) {
            const provider = this.provider.get(resource.scheme);
            return !!(provider && (provider.capabilities & capability));
        }
        async withProvider(resource) {
            // Assert path is absolute
            if (!resources_1.isAbsolutePath(resource)) {
                throw new files_1.FileOperationError(nls_1.localize('invalidPath', "Unable to resolve filesystem provider with relative file path '{0}'", this.resourceForError(resource)), 8 /* FILE_INVALID_PATH */);
            }
            // Activate provider
            await this.activateProvider(resource.scheme);
            // Assert provider
            const provider = this.provider.get(resource.scheme);
            if (!provider) {
                const error = new Error();
                error.name = 'ENOPRO';
                error.message = nls_1.localize('noProviderFound', "No file system provider found for resource '{0}'", resource.toString());
                throw error;
            }
            return provider;
        }
        async withReadProvider(resource) {
            const provider = await this.withProvider(resource);
            if (files_1.hasOpenReadWriteCloseCapability(provider) || files_1.hasReadWriteCapability(provider) || files_1.hasFileReadStreamCapability(provider)) {
                return provider;
            }
            throw new Error(`Filesystem provider for scheme '${resource.scheme}' neither has FileReadWrite, FileReadStream nor FileOpenReadWriteClose capability which is needed for the read operation.`);
        }
        async withWriteProvider(resource) {
            const provider = await this.withProvider(resource);
            if (files_1.hasOpenReadWriteCloseCapability(provider) || files_1.hasReadWriteCapability(provider)) {
                return provider;
            }
            throw new Error(`Filesystem provider for scheme '${resource.scheme}' neither has FileReadWrite nor FileOpenReadWriteClose capability which is needed for the write operation.`);
        }
        async resolve(resource, options) {
            try {
                return await this.doResolveFile(resource, options);
            }
            catch (error) {
                // Specially handle file not found case as file operation result
                if (files_1.toFileSystemProviderErrorCode(error) === files_1.FileSystemProviderErrorCode.FileNotFound) {
                    throw new files_1.FileOperationError(nls_1.localize('fileNotFoundError', "Unable to resolve non-existing file '{0}'", this.resourceForError(resource)), 1 /* FILE_NOT_FOUND */);
                }
                // Bubble up any other error as is
                throw files_1.ensureFileSystemProviderError(error);
            }
        }
        async doResolveFile(resource, options) {
            const provider = await this.withProvider(resource);
            const resolveTo = options === null || options === void 0 ? void 0 : options.resolveTo;
            const resolveSingleChildDescendants = options === null || options === void 0 ? void 0 : options.resolveSingleChildDescendants;
            const resolveMetadata = options === null || options === void 0 ? void 0 : options.resolveMetadata;
            const stat = await provider.stat(resource);
            let trie;
            return this.toFileStat(provider, resource, stat, undefined, !!resolveMetadata, (stat, siblings) => {
                // lazy trie to check for recursive resolving
                if (!trie) {
                    trie = map_1.TernarySearchTree.forUris();
                    trie.set(resource, true);
                    if (arrays_1.isNonEmptyArray(resolveTo)) {
                        resolveTo.forEach(uri => trie.set(uri, true));
                    }
                }
                // check for recursive resolving
                if (Boolean(trie.findSuperstr(stat.resource) || trie.get(stat.resource))) {
                    return true;
                }
                // check for resolving single child folders
                if (stat.isDirectory && resolveSingleChildDescendants) {
                    return siblings === 1;
                }
                return false;
            });
        }
        async toFileStat(provider, resource, stat, siblings, resolveMetadata, recurse) {
            // convert to file stat
            const fileStat = {
                resource,
                name: labels_1.getBaseLabel(resource),
                isFile: (stat.type & files_1.FileType.File) !== 0,
                isDirectory: (stat.type & files_1.FileType.Directory) !== 0,
                isSymbolicLink: (stat.type & files_1.FileType.SymbolicLink) !== 0,
                mtime: stat.mtime,
                ctime: stat.ctime,
                size: stat.size,
                etag: files_1.etag({ mtime: stat.mtime, size: stat.size })
            };
            // check to recurse for directories
            if (fileStat.isDirectory && recurse(fileStat, siblings)) {
                try {
                    const entries = await provider.readdir(resource);
                    const resolvedEntries = await Promise.all(entries.map(async ([name, type]) => {
                        try {
                            const childResource = resources_1.joinPath(resource, name);
                            const childStat = resolveMetadata ? await provider.stat(childResource) : { type };
                            return await this.toFileStat(provider, childResource, childStat, entries.length, resolveMetadata, recurse);
                        }
                        catch (error) {
                            this.logService.trace(error);
                            return null; // can happen e.g. due to permission errors
                        }
                    }));
                    // make sure to get rid of null values that signal a failure to resolve a particular entry
                    fileStat.children = arrays_1.coalesce(resolvedEntries);
                }
                catch (error) {
                    this.logService.trace(error);
                    fileStat.children = []; // gracefully handle errors, we may not have permissions to read
                }
                return fileStat;
            }
            return fileStat;
        }
        async resolveAll(toResolve) {
            return Promise.all(toResolve.map(async (entry) => {
                try {
                    return { stat: await this.doResolveFile(entry.resource, entry.options), success: true };
                }
                catch (error) {
                    this.logService.trace(error);
                    return { stat: undefined, success: false };
                }
            }));
        }
        async exists(resource) {
            const provider = await this.withProvider(resource);
            try {
                const stat = await provider.stat(resource);
                return !!stat;
            }
            catch (error) {
                return false;
            }
        }
        //#endregion
        //#region File Reading/Writing
        async createFile(resource, bufferOrReadableOrStream = buffer_1.VSBuffer.fromString(''), options) {
            // validate overwrite
            if (!(options === null || options === void 0 ? void 0 : options.overwrite) && await this.exists(resource)) {
                throw new files_1.FileOperationError(nls_1.localize('fileExists', "Unable to create file '{0}' that already exists when overwrite flag is not set", this.resourceForError(resource)), 3 /* FILE_MODIFIED_SINCE */, options);
            }
            // do write into file (this will create it too)
            const fileStat = await this.writeFile(resource, bufferOrReadableOrStream);
            // events
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(resource, 0 /* CREATE */, fileStat));
            return fileStat;
        }
        async writeFile(resource, bufferOrReadableOrStream, options) {
            const provider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(resource), resource);
            try {
                // validate write
                const stat = await this.validateWriteFile(provider, resource, options);
                // mkdir recursively as needed
                if (!stat) {
                    await this.mkdirp(provider, resources_1.dirname(resource));
                }
                // optimization: if the provider has unbuffered write capability and the data
                // to write is a Readable, we consume up to 3 chunks and try to write the data
                // unbuffered to reduce the overhead. If the Readable has more data to provide
                // we continue to write buffered.
                let bufferOrReadableOrStreamOrBufferedStream;
                if (files_1.hasReadWriteCapability(provider) && !(bufferOrReadableOrStream instanceof buffer_1.VSBuffer)) {
                    if (stream_1.isReadableStream(bufferOrReadableOrStream)) {
                        const bufferedStream = await stream_1.peekStream(bufferOrReadableOrStream, 3);
                        if (bufferedStream.ended) {
                            bufferOrReadableOrStreamOrBufferedStream = buffer_1.VSBuffer.concat(bufferedStream.buffer);
                        }
                        else {
                            bufferOrReadableOrStreamOrBufferedStream = bufferedStream;
                        }
                    }
                    else {
                        bufferOrReadableOrStreamOrBufferedStream = stream_1.peekReadable(bufferOrReadableOrStream, data => buffer_1.VSBuffer.concat(data), 3);
                    }
                }
                else {
                    bufferOrReadableOrStreamOrBufferedStream = bufferOrReadableOrStream;
                }
                // write file: unbuffered (only if data to write is a buffer, or the provider has no buffered write capability)
                if (!files_1.hasOpenReadWriteCloseCapability(provider) || (files_1.hasReadWriteCapability(provider) && bufferOrReadableOrStreamOrBufferedStream instanceof buffer_1.VSBuffer)) {
                    await this.doWriteUnbuffered(provider, resource, bufferOrReadableOrStreamOrBufferedStream);
                }
                // write file: buffered
                else {
                    await this.doWriteBuffered(provider, resource, bufferOrReadableOrStreamOrBufferedStream instanceof buffer_1.VSBuffer ? buffer_1.bufferToReadable(bufferOrReadableOrStreamOrBufferedStream) : bufferOrReadableOrStreamOrBufferedStream);
                }
            }
            catch (error) {
                throw new files_1.FileOperationError(nls_1.localize('err.write', "Unable to write file '{0}' ({1})", this.resourceForError(resource), files_1.ensureFileSystemProviderError(error).toString()), files_1.toFileOperationResult(error), options);
            }
            return this.resolve(resource, { resolveMetadata: true });
        }
        async validateWriteFile(provider, resource, options) {
            let stat = undefined;
            try {
                stat = await provider.stat(resource);
            }
            catch (error) {
                return undefined; // file might not exist
            }
            // file cannot be directory
            if ((stat.type & files_1.FileType.Directory) !== 0) {
                throw new files_1.FileOperationError(nls_1.localize('fileIsDirectoryWriteError', "Unable to write file '{0}' that is actually a directory", this.resourceForError(resource)), 0 /* FILE_IS_DIRECTORY */, options);
            }
            // Dirty write prevention: if the file on disk has been changed and does not match our expected
            // mtime and etag, we bail out to prevent dirty writing.
            //
            // First, we check for a mtime that is in the future before we do more checks. The assumption is
            // that only the mtime is an indicator for a file that has changed on disk.
            //
            // Second, if the mtime has advanced, we compare the size of the file on disk with our previous
            // one using the etag() function. Relying only on the mtime check has prooven to produce false
            // positives due to file system weirdness (especially around remote file systems). As such, the
            // check for size is a weaker check because it can return a false negative if the file has changed
            // but to the same length. This is a compromise we take to avoid having to produce checksums of
            // the file content for comparison which would be much slower to compute.
            if (options && typeof options.mtime === 'number' && typeof options.etag === 'string' && options.etag !== files_1.ETAG_DISABLED &&
                typeof stat.mtime === 'number' && typeof stat.size === 'number' &&
                options.mtime < stat.mtime && options.etag !== files_1.etag({ mtime: options.mtime /* not using stat.mtime for a reason, see above */, size: stat.size })) {
                throw new files_1.FileOperationError(nls_1.localize('fileModifiedError', "File Modified Since"), 3 /* FILE_MODIFIED_SINCE */, options);
            }
            return stat;
        }
        async readFile(resource, options) {
            const provider = await this.withReadProvider(resource);
            const stream = await this.doReadAsFileStream(provider, resource, Object.assign(Object.assign({}, options), { 
                // optimization: since we know that the caller does not
                // care about buffering, we indicate this to the reader.
                // this reduces all the overhead the buffered reading
                // has (open, read, close) if the provider supports
                // unbuffered reading.
                preferUnbuffered: true }));
            return Object.assign(Object.assign({}, stream), { value: await buffer_1.streamToBuffer(stream.value) });
        }
        async readFileStream(resource, options) {
            const provider = await this.withReadProvider(resource);
            return this.doReadAsFileStream(provider, resource, options);
        }
        async doReadAsFileStream(provider, resource, options) {
            // install a cancellation token that gets cancelled
            // when any error occurs. this allows us to resolve
            // the content of the file while resolving metadata
            // but still cancel the operation in certain cases.
            const cancellableSource = new cancellation_1.CancellationTokenSource();
            // validate read operation
            const statPromise = this.validateReadFile(resource, options).then(stat => stat, error => {
                cancellableSource.cancel();
                throw error;
            });
            try {
                // if the etag is provided, we await the result of the validation
                // due to the likelyhood of hitting a NOT_MODIFIED_SINCE result.
                // otherwise, we let it run in parallel to the file reading for
                // optimal startup performance.
                if (options && typeof options.etag === 'string' && options.etag !== files_1.ETAG_DISABLED) {
                    await statPromise;
                }
                let fileStreamPromise;
                // read unbuffered (only if either preferred, or the provider has no buffered read capability)
                if (!(files_1.hasOpenReadWriteCloseCapability(provider) || files_1.hasFileReadStreamCapability(provider)) || (files_1.hasReadWriteCapability(provider) && (options === null || options === void 0 ? void 0 : options.preferUnbuffered))) {
                    fileStreamPromise = this.readFileUnbuffered(provider, resource, options);
                }
                // read streamed (always prefer over primitive buffered read)
                else if (files_1.hasFileReadStreamCapability(provider)) {
                    fileStreamPromise = Promise.resolve(this.readFileStreamed(provider, resource, cancellableSource.token, options));
                }
                // read buffered
                else {
                    fileStreamPromise = Promise.resolve(this.readFileBuffered(provider, resource, cancellableSource.token, options));
                }
                const [fileStat, fileStream] = await Promise.all([statPromise, fileStreamPromise]);
                return Object.assign(Object.assign({}, fileStat), { value: fileStream });
            }
            catch (error) {
                throw new files_1.FileOperationError(nls_1.localize('err.read', "Unable to read file '{0}' ({1})", this.resourceForError(resource), files_1.ensureFileSystemProviderError(error).toString()), files_1.toFileOperationResult(error), options);
            }
        }
        readFileStreamed(provider, resource, token, options = Object.create(null)) {
            const fileStream = provider.readFileStream(resource, options, token);
            return stream_1.transform(fileStream, {
                data: data => data instanceof buffer_1.VSBuffer ? data : buffer_1.VSBuffer.wrap(data),
                error: error => new files_1.FileOperationError(nls_1.localize('err.read', "Unable to read file '{0}' ({1})", this.resourceForError(resource), files_1.ensureFileSystemProviderError(error).toString()), files_1.toFileOperationResult(error), options)
            }, data => buffer_1.VSBuffer.concat(data));
        }
        readFileBuffered(provider, resource, token, options = Object.create(null)) {
            const stream = buffer_1.newWriteableBufferStream();
            io_1.readFileIntoStream(provider, resource, stream, data => data, Object.assign(Object.assign({}, options), { bufferSize: this.BUFFER_SIZE, errorTransformer: error => new files_1.FileOperationError(nls_1.localize('err.read', "Unable to read file '{0}' ({1})", this.resourceForError(resource), files_1.ensureFileSystemProviderError(error).toString()), files_1.toFileOperationResult(error), options) }), token);
            return stream;
        }
        async readFileUnbuffered(provider, resource, options) {
            let buffer = await provider.readFile(resource);
            // respect position option
            if (options && typeof options.position === 'number') {
                buffer = buffer.slice(options.position);
            }
            // respect length option
            if (options && typeof options.length === 'number') {
                buffer = buffer.slice(0, options.length);
            }
            // Throw if file is too large to load
            this.validateReadFileLimits(resource, buffer.byteLength, options);
            return buffer_1.bufferToStream(buffer_1.VSBuffer.wrap(buffer));
        }
        async validateReadFile(resource, options) {
            const stat = await this.resolve(resource, { resolveMetadata: true });
            // Throw if resource is a directory
            if (stat.isDirectory) {
                throw new files_1.FileOperationError(nls_1.localize('fileIsDirectoryReadError', "Unable to read file '{0}' that is actually a directory", this.resourceForError(resource)), 0 /* FILE_IS_DIRECTORY */, options);
            }
            // Throw if file not modified since (unless disabled)
            if (options && typeof options.etag === 'string' && options.etag !== files_1.ETAG_DISABLED && options.etag === stat.etag) {
                throw new files_1.FileOperationError(nls_1.localize('fileNotModifiedError', "File not modified since"), 2 /* FILE_NOT_MODIFIED_SINCE */, options);
            }
            // Throw if file is too large to load
            this.validateReadFileLimits(resource, stat.size, options);
            return stat;
        }
        validateReadFileLimits(resource, size, options) {
            if (options === null || options === void 0 ? void 0 : options.limits) {
                let tooLargeErrorResult = undefined;
                if (typeof options.limits.memory === 'number' && size > options.limits.memory) {
                    tooLargeErrorResult = 9 /* FILE_EXCEEDS_MEMORY_LIMIT */;
                }
                if (typeof options.limits.size === 'number' && size > options.limits.size) {
                    tooLargeErrorResult = 7 /* FILE_TOO_LARGE */;
                }
                if (typeof tooLargeErrorResult === 'number') {
                    throw new files_1.FileOperationError(nls_1.localize('fileTooLargeError', "Unable to read file '{0}' that is too large to open", this.resourceForError(resource)), tooLargeErrorResult);
                }
            }
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        async canMove(source, target, overwrite) {
            return this.doCanMoveCopy(source, target, 'move', overwrite);
        }
        async canCopy(source, target, overwrite) {
            return this.doCanMoveCopy(source, target, 'copy', overwrite);
        }
        async doCanMoveCopy(source, target, mode, overwrite) {
            if (source.toString() !== target.toString()) {
                try {
                    const sourceProvider = mode === 'move' ? this.throwIfFileSystemIsReadonly(await this.withWriteProvider(source), source) : await this.withReadProvider(source);
                    const targetProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(target), target);
                    await this.doValidateMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite);
                }
                catch (error) {
                    return error;
                }
            }
            return true;
        }
        async move(source, target, overwrite) {
            const sourceProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(source), source);
            const targetProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(target), target);
            // move
            const mode = await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'move', !!overwrite);
            // resolve and send events
            const fileStat = await this.resolve(target, { resolveMetadata: true });
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(source, mode === 'move' ? 2 /* MOVE */ : 3 /* COPY */, fileStat));
            return fileStat;
        }
        async copy(source, target, overwrite) {
            const sourceProvider = await this.withReadProvider(source);
            const targetProvider = this.throwIfFileSystemIsReadonly(await this.withWriteProvider(target), target);
            // copy
            const mode = await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'copy', !!overwrite);
            // resolve and send events
            const fileStat = await this.resolve(target, { resolveMetadata: true });
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(source, mode === 'copy' ? 3 /* COPY */ : 2 /* MOVE */, fileStat));
            return fileStat;
        }
        async doMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite) {
            if (source.toString() === target.toString()) {
                return mode; // simulate node.js behaviour here and do a no-op if paths match
            }
            // validation
            const { exists, isSameResourceWithDifferentPathCase } = await this.doValidateMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite);
            // delete as needed (unless target is same resurce with different path case)
            if (exists && !isSameResourceWithDifferentPathCase && overwrite) {
                await this.del(target, { recursive: true });
            }
            // create parent folders
            await this.mkdirp(targetProvider, resources_1.dirname(target));
            // copy source => target
            if (mode === 'copy') {
                // same provider with fast copy: leverage copy() functionality
                if (sourceProvider === targetProvider && files_1.hasFileFolderCopyCapability(sourceProvider)) {
                    await sourceProvider.copy(source, target, { overwrite });
                }
                // when copying via buffer/unbuffered, we have to manually
                // traverse the source if it is a folder and not a file
                else {
                    const sourceFile = await this.resolve(source);
                    if (sourceFile.isDirectory) {
                        await this.doCopyFolder(sourceProvider, sourceFile, targetProvider, target);
                    }
                    else {
                        await this.doCopyFile(sourceProvider, source, targetProvider, target);
                    }
                }
                return mode;
            }
            // move source => target
            else {
                // same provider: leverage rename() functionality
                if (sourceProvider === targetProvider) {
                    await sourceProvider.rename(source, target, { overwrite });
                    return mode;
                }
                // across providers: copy to target & delete at source
                else {
                    await this.doMoveCopy(sourceProvider, source, targetProvider, target, 'copy', overwrite);
                    await this.del(source, { recursive: true });
                    return 'copy';
                }
            }
        }
        async doCopyFile(sourceProvider, source, targetProvider, target) {
            // copy: source (buffered) => target (buffered)
            if (files_1.hasOpenReadWriteCloseCapability(sourceProvider) && files_1.hasOpenReadWriteCloseCapability(targetProvider)) {
                return this.doPipeBuffered(sourceProvider, source, targetProvider, target);
            }
            // copy: source (buffered) => target (unbuffered)
            if (files_1.hasOpenReadWriteCloseCapability(sourceProvider) && files_1.hasReadWriteCapability(targetProvider)) {
                return this.doPipeBufferedToUnbuffered(sourceProvider, source, targetProvider, target);
            }
            // copy: source (unbuffered) => target (buffered)
            if (files_1.hasReadWriteCapability(sourceProvider) && files_1.hasOpenReadWriteCloseCapability(targetProvider)) {
                return this.doPipeUnbufferedToBuffered(sourceProvider, source, targetProvider, target);
            }
            // copy: source (unbuffered) => target (unbuffered)
            if (files_1.hasReadWriteCapability(sourceProvider) && files_1.hasReadWriteCapability(targetProvider)) {
                return this.doPipeUnbuffered(sourceProvider, source, targetProvider, target);
            }
        }
        async doCopyFolder(sourceProvider, sourceFolder, targetProvider, targetFolder) {
            // create folder in target
            await targetProvider.mkdir(targetFolder);
            // create children in target
            if (Array.isArray(sourceFolder.children)) {
                await Promise.all(sourceFolder.children.map(async (sourceChild) => {
                    const targetChild = resources_1.joinPath(targetFolder, sourceChild.name);
                    if (sourceChild.isDirectory) {
                        return this.doCopyFolder(sourceProvider, await this.resolve(sourceChild.resource), targetProvider, targetChild);
                    }
                    else {
                        return this.doCopyFile(sourceProvider, sourceChild.resource, targetProvider, targetChild);
                    }
                }));
            }
        }
        async doValidateMoveCopy(sourceProvider, source, targetProvider, target, mode, overwrite) {
            let isSameResourceWithDifferentPathCase = false;
            // Check if source is equal or parent to target (requires providers to be the same)
            if (sourceProvider === targetProvider) {
                const { extUri, isPathCaseSensitive } = this.getExtUri(sourceProvider);
                if (!isPathCaseSensitive) {
                    isSameResourceWithDifferentPathCase = extUri.isEqual(source, target);
                }
                if (isSameResourceWithDifferentPathCase && mode === 'copy') {
                    throw new Error(nls_1.localize('unableToMoveCopyError1', "Unable to copy when source '{0}' is same as target '{1}' with different path case on a case insensitive file system", this.resourceForError(source), this.resourceForError(target)));
                }
                if (!isSameResourceWithDifferentPathCase && extUri.isEqualOrParent(target, source)) {
                    throw new Error(nls_1.localize('unableToMoveCopyError2', "Unable to move/copy when source '{0}' is parent of target '{1}'.", this.resourceForError(source), this.resourceForError(target)));
                }
            }
            // Extra checks if target exists and this is not a rename
            const exists = await this.exists(target);
            if (exists && !isSameResourceWithDifferentPathCase) {
                // Bail out if target exists and we are not about to overwrite
                if (!overwrite) {
                    throw new files_1.FileOperationError(nls_1.localize('unableToMoveCopyError3', "Unable to move/copy '{0}' because target '{1}' already exists at destination.", this.resourceForError(source), this.resourceForError(target)), 4 /* FILE_MOVE_CONFLICT */);
                }
                // Special case: if the target is a parent of the source, we cannot delete
                // it as it would delete the source as well. In this case we have to throw
                if (sourceProvider === targetProvider) {
                    const { extUri } = this.getExtUri(sourceProvider);
                    if (extUri.isEqualOrParent(source, target)) {
                        throw new Error(nls_1.localize('unableToMoveCopyError4', "Unable to move/copy '{0}' into '{1}' since a file would replace the folder it is contained in.", this.resourceForError(source), this.resourceForError(target)));
                    }
                }
            }
            return { exists, isSameResourceWithDifferentPathCase };
        }
        getExtUri(provider) {
            const isPathCaseSensitive = !!(provider.capabilities & 1024 /* PathCaseSensitive */);
            return {
                extUri: isPathCaseSensitive ? resources_1.extUri : resources_1.extUriIgnorePathCase,
                isPathCaseSensitive
            };
        }
        async createFolder(resource) {
            const provider = this.throwIfFileSystemIsReadonly(await this.withProvider(resource), resource);
            // mkdir recursively
            await this.mkdirp(provider, resource);
            // events
            const fileStat = await this.resolve(resource, { resolveMetadata: true });
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(resource, 0 /* CREATE */, fileStat));
            return fileStat;
        }
        async mkdirp(provider, directory) {
            const directoriesToCreate = [];
            // mkdir until we reach root
            const { extUri } = this.getExtUri(provider);
            while (!extUri.isEqual(directory, resources_1.dirname(directory))) {
                try {
                    const stat = await provider.stat(directory);
                    if ((stat.type & files_1.FileType.Directory) === 0) {
                        throw new Error(nls_1.localize('mkdirExistsError', "Unable to create folder '{0}' that already exists but is not a directory", this.resourceForError(directory)));
                    }
                    break; // we have hit a directory that exists -> good
                }
                catch (error) {
                    // Bubble up any other error that is not file not found
                    if (files_1.toFileSystemProviderErrorCode(error) !== files_1.FileSystemProviderErrorCode.FileNotFound) {
                        throw error;
                    }
                    // Upon error, remember directories that need to be created
                    directoriesToCreate.push(resources_1.basename(directory));
                    // Continue up
                    directory = resources_1.dirname(directory);
                }
            }
            // Create directories as needed
            for (let i = directoriesToCreate.length - 1; i >= 0; i--) {
                directory = resources_1.joinPath(directory, directoriesToCreate[i]);
                try {
                    await provider.mkdir(directory);
                }
                catch (error) {
                    if (files_1.toFileSystemProviderErrorCode(error) !== files_1.FileSystemProviderErrorCode.FileExists) {
                        // For mkdirp() we tolerate that the mkdir() call fails
                        // in case the folder already exists. This follows node.js
                        // own implementation of fs.mkdir({ recursive: true }) and
                        // reduces the chances of race conditions leading to errors
                        // if multiple calls try to create the same folders
                        // As such, we only throw an error here if it is other than
                        // the fact that the file already exists.
                        // (see also https://github.com/microsoft/vscode/issues/89834)
                        throw error;
                    }
                }
            }
        }
        async canDelete(resource, options) {
            try {
                await this.doValidateDelete(resource, options);
            }
            catch (error) {
                return error;
            }
            return true;
        }
        async doValidateDelete(resource, options) {
            const provider = this.throwIfFileSystemIsReadonly(await this.withProvider(resource), resource);
            // Validate trash support
            const useTrash = !!(options === null || options === void 0 ? void 0 : options.useTrash);
            if (useTrash && !(provider.capabilities & 4096 /* Trash */)) {
                throw new Error(nls_1.localize('deleteFailedTrashUnsupported', "Unable to delete file '{0}' via trash because provider does not support it.", this.resourceForError(resource)));
            }
            // Validate delete
            const exists = await this.exists(resource);
            if (!exists) {
                throw new files_1.FileOperationError(nls_1.localize('deleteFailedNotFound', "Unable to delete non-existing file '{0}'", this.resourceForError(resource)), 1 /* FILE_NOT_FOUND */);
            }
            // Validate recursive
            const recursive = !!(options === null || options === void 0 ? void 0 : options.recursive);
            if (!recursive && exists) {
                const stat = await this.resolve(resource);
                if (stat.isDirectory && Array.isArray(stat.children) && stat.children.length > 0) {
                    throw new Error(nls_1.localize('deleteFailedNonEmptyFolder', "Unable to delete non-empty folder '{0}'.", this.resourceForError(resource)));
                }
            }
            return provider;
        }
        async del(resource, options) {
            const provider = await this.doValidateDelete(resource, options);
            const useTrash = !!(options === null || options === void 0 ? void 0 : options.useTrash);
            const recursive = !!(options === null || options === void 0 ? void 0 : options.recursive);
            // Delete through provider
            await provider.delete(resource, { recursive, useTrash });
            // Events
            this._onDidRunOperation.fire(new files_1.FileOperationEvent(resource, 1 /* DELETE */));
        }
        watch(resource, options = { recursive: false, excludes: [] }) {
            let watchDisposed = false;
            let watchDisposable = lifecycle_1.toDisposable(() => watchDisposed = true);
            // Watch and wire in disposable which is async but
            // check if we got disposed meanwhile and forward
            this.doWatch(resource, options).then(disposable => {
                if (watchDisposed) {
                    lifecycle_1.dispose(disposable);
                }
                else {
                    watchDisposable = disposable;
                }
            }, error => this.logService.error(error));
            return lifecycle_1.toDisposable(() => lifecycle_1.dispose(watchDisposable));
        }
        async doWatch(resource, options) {
            const provider = await this.withProvider(resource);
            const key = this.toWatchKey(provider, resource, options);
            // Only start watching if we are the first for the given key
            const watcher = this.activeWatchers.get(key) || { count: 0, disposable: provider.watch(resource, options) };
            if (!this.activeWatchers.has(key)) {
                this.activeWatchers.set(key, watcher);
            }
            // Increment usage counter
            watcher.count += 1;
            return lifecycle_1.toDisposable(() => {
                // Unref
                watcher.count--;
                // Dispose only when last user is reached
                if (watcher.count === 0) {
                    lifecycle_1.dispose(watcher.disposable);
                    this.activeWatchers.delete(key);
                }
            });
        }
        toWatchKey(provider, resource, options) {
            const { extUri } = this.getExtUri(provider);
            return [
                extUri.getComparisonKey(resource),
                String(options.recursive),
                options.excludes.join() // use excludes as part of the key
            ].join();
        }
        dispose() {
            super.dispose();
            this.activeWatchers.forEach(watcher => lifecycle_1.dispose(watcher.disposable));
            this.activeWatchers.clear();
        }
        ensureWriteQueue(provider, resource) {
            const { extUri } = this.getExtUri(provider);
            const queueKey = extUri.getComparisonKey(resource);
            // ensure to never write to the same resource without finishing
            // the one write. this ensures a write finishes consistently
            // (even with error) before another write is done.
            let writeQueue = this.writeQueues.get(queueKey);
            if (!writeQueue) {
                writeQueue = new async_1.Queue();
                this.writeQueues.set(queueKey, writeQueue);
                const onFinish = event_1.Event.once(writeQueue.onFinished);
                onFinish(() => {
                    this.writeQueues.delete(queueKey);
                    lifecycle_1.dispose(writeQueue);
                });
            }
            return writeQueue;
        }
        async doWriteBuffered(provider, resource, readableOrStreamOrBufferedStream) {
            return this.ensureWriteQueue(provider, resource).queue(async () => {
                // open handle
                const handle = await provider.open(resource, { create: true });
                // write into handle until all bytes from buffer have been written
                try {
                    if (stream_1.isReadableStream(readableOrStreamOrBufferedStream) || stream_1.isReadableBufferedStream(readableOrStreamOrBufferedStream)) {
                        await this.doWriteStreamBufferedQueued(provider, handle, readableOrStreamOrBufferedStream);
                    }
                    else {
                        await this.doWriteReadableBufferedQueued(provider, handle, readableOrStreamOrBufferedStream);
                    }
                }
                catch (error) {
                    throw files_1.ensureFileSystemProviderError(error);
                }
                finally {
                    // close handle always
                    await provider.close(handle);
                }
            });
        }
        async doWriteStreamBufferedQueued(provider, handle, streamOrBufferedStream) {
            let posInFile = 0;
            let stream;
            // Buffered stream: consume the buffer first by writing
            // it to the target before reading from the stream.
            if (stream_1.isReadableBufferedStream(streamOrBufferedStream)) {
                if (streamOrBufferedStream.buffer.length > 0) {
                    const chunk = buffer_1.VSBuffer.concat(streamOrBufferedStream.buffer);
                    await this.doWriteBuffer(provider, handle, chunk, chunk.byteLength, posInFile, 0);
                    posInFile += chunk.byteLength;
                }
                // If the stream has been consumed, return early
                if (streamOrBufferedStream.ended) {
                    return;
                }
                stream = streamOrBufferedStream.stream;
            }
            // Unbuffered stream - just take as is
            else {
                stream = streamOrBufferedStream;
            }
            return new Promise(async (resolve, reject) => {
                stream.on('data', async (chunk) => {
                    // pause stream to perform async write operation
                    stream.pause();
                    try {
                        await this.doWriteBuffer(provider, handle, chunk, chunk.byteLength, posInFile, 0);
                    }
                    catch (error) {
                        return reject(error);
                    }
                    posInFile += chunk.byteLength;
                    // resume stream now that we have successfully written
                    // run this on the next tick to prevent increasing the
                    // execution stack because resume() may call the event
                    // handler again before finishing.
                    setTimeout(() => stream.resume());
                });
                stream.on('error', error => reject(error));
                stream.on('end', () => resolve());
            });
        }
        async doWriteReadableBufferedQueued(provider, handle, readable) {
            let posInFile = 0;
            let chunk;
            while ((chunk = readable.read()) !== null) {
                await this.doWriteBuffer(provider, handle, chunk, chunk.byteLength, posInFile, 0);
                posInFile += chunk.byteLength;
            }
        }
        async doWriteBuffer(provider, handle, buffer, length, posInFile, posInBuffer) {
            let totalBytesWritten = 0;
            while (totalBytesWritten < length) {
                // Write through the provider
                const bytesWritten = await provider.write(handle, posInFile + totalBytesWritten, buffer.buffer, posInBuffer + totalBytesWritten, length - totalBytesWritten);
                totalBytesWritten += bytesWritten;
            }
        }
        async doWriteUnbuffered(provider, resource, bufferOrReadableOrStreamOrBufferedStream) {
            return this.ensureWriteQueue(provider, resource).queue(() => this.doWriteUnbufferedQueued(provider, resource, bufferOrReadableOrStreamOrBufferedStream));
        }
        async doWriteUnbufferedQueued(provider, resource, bufferOrReadableOrStreamOrBufferedStream) {
            let buffer;
            if (bufferOrReadableOrStreamOrBufferedStream instanceof buffer_1.VSBuffer) {
                buffer = bufferOrReadableOrStreamOrBufferedStream;
            }
            else if (stream_1.isReadableStream(bufferOrReadableOrStreamOrBufferedStream)) {
                buffer = await buffer_1.streamToBuffer(bufferOrReadableOrStreamOrBufferedStream);
            }
            else if (stream_1.isReadableBufferedStream(bufferOrReadableOrStreamOrBufferedStream)) {
                buffer = await buffer_1.bufferedStreamToBuffer(bufferOrReadableOrStreamOrBufferedStream);
            }
            else {
                buffer = buffer_1.readableToBuffer(bufferOrReadableOrStreamOrBufferedStream);
            }
            // Write through the provider
            await provider.writeFile(resource, buffer.buffer, { create: true, overwrite: true });
        }
        async doPipeBuffered(sourceProvider, source, targetProvider, target) {
            return this.ensureWriteQueue(targetProvider, target).queue(() => this.doPipeBufferedQueued(sourceProvider, source, targetProvider, target));
        }
        async doPipeBufferedQueued(sourceProvider, source, targetProvider, target) {
            let sourceHandle = undefined;
            let targetHandle = undefined;
            try {
                // Open handles
                sourceHandle = await sourceProvider.open(source, { create: false });
                targetHandle = await targetProvider.open(target, { create: true });
                const buffer = buffer_1.VSBuffer.alloc(this.BUFFER_SIZE);
                let posInFile = 0;
                let posInBuffer = 0;
                let bytesRead = 0;
                do {
                    // read from source (sourceHandle) at current position (posInFile) into buffer (buffer) at
                    // buffer position (posInBuffer) up to the size of the buffer (buffer.byteLength).
                    bytesRead = await sourceProvider.read(sourceHandle, posInFile, buffer.buffer, posInBuffer, buffer.byteLength - posInBuffer);
                    // write into target (targetHandle) at current position (posInFile) from buffer (buffer) at
                    // buffer position (posInBuffer) all bytes we read (bytesRead).
                    await this.doWriteBuffer(targetProvider, targetHandle, buffer, bytesRead, posInFile, posInBuffer);
                    posInFile += bytesRead;
                    posInBuffer += bytesRead;
                    // when buffer full, fill it again from the beginning
                    if (posInBuffer === buffer.byteLength) {
                        posInBuffer = 0;
                    }
                } while (bytesRead > 0);
            }
            catch (error) {
                throw files_1.ensureFileSystemProviderError(error);
            }
            finally {
                await Promise.all([
                    typeof sourceHandle === 'number' ? sourceProvider.close(sourceHandle) : Promise.resolve(),
                    typeof targetHandle === 'number' ? targetProvider.close(targetHandle) : Promise.resolve(),
                ]);
            }
        }
        async doPipeUnbuffered(sourceProvider, source, targetProvider, target) {
            return this.ensureWriteQueue(targetProvider, target).queue(() => this.doPipeUnbufferedQueued(sourceProvider, source, targetProvider, target));
        }
        async doPipeUnbufferedQueued(sourceProvider, source, targetProvider, target) {
            return targetProvider.writeFile(target, await sourceProvider.readFile(source), { create: true, overwrite: true });
        }
        async doPipeUnbufferedToBuffered(sourceProvider, source, targetProvider, target) {
            return this.ensureWriteQueue(targetProvider, target).queue(() => this.doPipeUnbufferedToBufferedQueued(sourceProvider, source, targetProvider, target));
        }
        async doPipeUnbufferedToBufferedQueued(sourceProvider, source, targetProvider, target) {
            // Open handle
            const targetHandle = await targetProvider.open(target, { create: true });
            // Read entire buffer from source and write buffered
            try {
                const buffer = await sourceProvider.readFile(source);
                await this.doWriteBuffer(targetProvider, targetHandle, buffer_1.VSBuffer.wrap(buffer), buffer.byteLength, 0, 0);
            }
            catch (error) {
                throw files_1.ensureFileSystemProviderError(error);
            }
            finally {
                await targetProvider.close(targetHandle);
            }
        }
        async doPipeBufferedToUnbuffered(sourceProvider, source, targetProvider, target) {
            // Read buffer via stream buffered
            const buffer = await buffer_1.streamToBuffer(this.readFileBuffered(sourceProvider, source, cancellation_1.CancellationToken.None));
            // Write buffer into target at once
            await this.doWriteUnbuffered(targetProvider, target, buffer);
        }
        throwIfFileSystemIsReadonly(provider, resource) {
            if (provider.capabilities & 2048 /* Readonly */) {
                throw new files_1.FileOperationError(nls_1.localize('err.readonly', "Unable to modify readonly file '{0}'", this.resourceForError(resource)), 6 /* FILE_PERMISSION_DENIED */);
            }
            return provider;
        }
        resourceForError(resource) {
            if (resource.scheme === network_1.Schemas.file) {
                return resource.fsPath;
            }
            return resource.toString(true);
        }
    };
    FileService = __decorate([
        __param(0, log_1.ILogService)
    ], FileService);
    exports.FileService = FileService;
});
//# __sourceMappingURL=fileService.js.map