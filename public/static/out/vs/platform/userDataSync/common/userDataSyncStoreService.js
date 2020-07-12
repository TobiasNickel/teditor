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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/userDataSync/common/userDataSync", "vs/platform/request/common/request", "vs/base/common/resources", "vs/base/common/cancellation", "vs/platform/configuration/common/configuration", "vs/platform/product/common/productService", "vs/platform/serviceMachineId/common/serviceMachineId", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/storage/common/storage", "vs/base/common/objects", "vs/base/common/uuid", "vs/base/common/platform", "vs/base/common/event"], function (require, exports, lifecycle_1, userDataSync_1, request_1, resources_1, cancellation_1, configuration_1, productService_1, serviceMachineId_1, environment_1, files_1, storage_1, objects_1, uuid_1, platform_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RequestsSession = exports.UserDataSyncStoreService = void 0;
    const USER_SESSION_ID_KEY = 'sync.user-session-id';
    const MACHINE_SESSION_ID_KEY = 'sync.machine-session-id';
    const REQUEST_SESSION_LIMIT = 100;
    const REQUEST_SESSION_INTERVAL = 1000 * 60 * 5; /* 5 minutes */
    let UserDataSyncStoreService = class UserDataSyncStoreService extends lifecycle_1.Disposable {
        constructor(productService, configurationService, requestService, logService, environmentService, fileService, storageService) {
            super();
            this.requestService = requestService;
            this.logService = logService;
            this.storageService = storageService;
            this._onTokenFailed = this._register(new event_1.Emitter());
            this.onTokenFailed = this._onTokenFailed.event;
            this._onTokenSucceed = this._register(new event_1.Emitter());
            this.onTokenSucceed = this._onTokenSucceed.event;
            this.userDataSyncStore = userDataSync_1.getUserDataSyncStore(productService, configurationService);
            this.commonHeadersPromise = serviceMachineId_1.getServiceMachineId(environmentService, fileService, storageService)
                .then(uuid => {
                const headers = {
                    'X-Client-Name': `${productService.applicationName}${platform_1.isWeb ? '-web' : ''}`,
                    'X-Client-Version': productService.version,
                    'X-Machine-Id': uuid
                };
                if (productService.commit) {
                    headers['X-Client-Commit'] = productService.commit;
                }
                return headers;
            });
            /* A requests session that limits requests per sessions */
            this.session = new RequestsSession(REQUEST_SESSION_LIMIT, REQUEST_SESSION_INTERVAL, this.requestService);
        }
        setAuthToken(token, type) {
            this.authToken = { token, type };
        }
        async getAllRefs(resource) {
            if (!this.userDataSyncStore) {
                throw new Error('No settings sync store url configured.');
            }
            const uri = resources_1.joinPath(this.userDataSyncStore.url, 'resource', resource);
            const headers = {};
            const context = await this.request({ type: 'GET', url: uri.toString(), headers }, cancellation_1.CancellationToken.None);
            if (!request_1.isSuccess(context)) {
                throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, userDataSync_1.UserDataSyncErrorCode.Unknown);
            }
            const result = await request_1.asJson(context) || [];
            return result.map(({ url, created }) => ({ ref: resources_1.relativePath(uri, uri.with({ path: url })), created: created * 1000 /* Server returns in seconds */ }));
        }
        async resolveContent(resource, ref) {
            if (!this.userDataSyncStore) {
                throw new Error('No settings sync store url configured.');
            }
            const url = resources_1.joinPath(this.userDataSyncStore.url, 'resource', resource, ref).toString();
            const headers = {};
            headers['Cache-Control'] = 'no-cache';
            const context = await this.request({ type: 'GET', url, headers }, cancellation_1.CancellationToken.None);
            if (!request_1.isSuccess(context)) {
                throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, userDataSync_1.UserDataSyncErrorCode.Unknown);
            }
            const content = await request_1.asText(context);
            return content;
        }
        async delete(resource) {
            if (!this.userDataSyncStore) {
                throw new Error('No settings sync store url configured.');
            }
            const url = resources_1.joinPath(this.userDataSyncStore.url, 'resource', resource).toString();
            const headers = {};
            const context = await this.request({ type: 'DELETE', url, headers }, cancellation_1.CancellationToken.None);
            if (!request_1.isSuccess(context)) {
                throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, userDataSync_1.UserDataSyncErrorCode.Unknown);
            }
        }
        async read(resource, oldValue, headers = {}) {
            if (!this.userDataSyncStore) {
                throw new Error('No settings sync store url configured.');
            }
            const url = resources_1.joinPath(this.userDataSyncStore.url, 'resource', resource, 'latest').toString();
            headers = Object.assign({}, headers);
            // Disable caching as they are cached by synchronisers
            headers['Cache-Control'] = 'no-cache';
            if (oldValue) {
                headers['If-None-Match'] = oldValue.ref;
            }
            const context = await this.request({ type: 'GET', url, headers }, cancellation_1.CancellationToken.None);
            if (context.res.statusCode === 304) {
                // There is no new value. Hence return the old value.
                return oldValue;
            }
            if (!request_1.isSuccess(context)) {
                throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, userDataSync_1.UserDataSyncErrorCode.Unknown);
            }
            const ref = context.res.headers['etag'];
            if (!ref) {
                throw new userDataSync_1.UserDataSyncStoreError('Server did not return the ref', userDataSync_1.UserDataSyncErrorCode.NoRef);
            }
            const content = await request_1.asText(context);
            return { ref, content };
        }
        async write(resource, data, ref, headers = {}) {
            if (!this.userDataSyncStore) {
                throw new Error('No settings sync store url configured.');
            }
            const url = resources_1.joinPath(this.userDataSyncStore.url, 'resource', resource).toString();
            headers = Object.assign({}, headers);
            headers['Content-Type'] = 'text/plain';
            if (ref) {
                headers['If-Match'] = ref;
            }
            const context = await this.request({ type: 'POST', url, data, headers }, cancellation_1.CancellationToken.None);
            if (!request_1.isSuccess(context)) {
                throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, userDataSync_1.UserDataSyncErrorCode.Unknown);
            }
            const newRef = context.res.headers['etag'];
            if (!newRef) {
                throw new userDataSync_1.UserDataSyncStoreError('Server did not return the ref', userDataSync_1.UserDataSyncErrorCode.NoRef);
            }
            return newRef;
        }
        async manifest(headers = {}) {
            if (!this.userDataSyncStore) {
                throw new Error('No settings sync store url configured.');
            }
            const url = resources_1.joinPath(this.userDataSyncStore.url, 'manifest').toString();
            headers = Object.assign({}, headers);
            headers['Content-Type'] = 'application/json';
            const context = await this.request({ type: 'GET', url, headers }, cancellation_1.CancellationToken.None);
            if (!request_1.isSuccess(context)) {
                throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, userDataSync_1.UserDataSyncErrorCode.Unknown);
            }
            const manifest = await request_1.asJson(context);
            const currentSessionId = this.storageService.get(USER_SESSION_ID_KEY, 0 /* GLOBAL */);
            if (currentSessionId && manifest && currentSessionId !== manifest.session) {
                // Server session is different from client session so clear cached session.
                this.clearSession();
            }
            if (manifest === null && currentSessionId) {
                // server session is cleared so clear cached session.
                this.clearSession();
            }
            if (manifest) {
                // update session
                this.storageService.store(USER_SESSION_ID_KEY, manifest.session, 0 /* GLOBAL */);
            }
            return manifest;
        }
        async clear() {
            if (!this.userDataSyncStore) {
                throw new Error('No settings sync store url configured.');
            }
            const url = resources_1.joinPath(this.userDataSyncStore.url, 'resource').toString();
            const headers = { 'Content-Type': 'text/plain' };
            const context = await this.request({ type: 'DELETE', url, headers }, cancellation_1.CancellationToken.None);
            if (!request_1.isSuccess(context)) {
                throw new userDataSync_1.UserDataSyncStoreError('Server returned ' + context.res.statusCode, userDataSync_1.UserDataSyncErrorCode.Unknown);
            }
            // clear cached session.
            this.clearSession();
        }
        clearSession() {
            this.storageService.remove(USER_SESSION_ID_KEY, 0 /* GLOBAL */);
            this.storageService.remove(MACHINE_SESSION_ID_KEY, 0 /* GLOBAL */);
        }
        async request(options, token) {
            var _a, _b, _c, _d, _e, _f, _g;
            if (!this.authToken) {
                throw new userDataSync_1.UserDataSyncStoreError('No Auth Token Available', userDataSync_1.UserDataSyncErrorCode.Unauthorized);
            }
            const commonHeaders = await this.commonHeadersPromise;
            options.headers = objects_1.assign(options.headers || {}, commonHeaders, {
                'X-Account-Type': this.authToken.type,
                'authorization': `Bearer ${this.authToken.token}`,
            });
            // Add session headers
            this.addSessionHeaders(options.headers);
            this.logService.trace('Sending request to server', { url: options.url, type: options.type, headers: Object.assign(Object.assign({}, options.headers), { authorization: undefined }) });
            let context;
            try {
                context = await this.session.request(options, token);
                this.logService.trace('Request finished', { url: options.url, status: context.res.statusCode });
            }
            catch (e) {
                if (!(e instanceof userDataSync_1.UserDataSyncStoreError)) {
                    e = new userDataSync_1.UserDataSyncStoreError(`Connection refused for the request '${(_a = options.url) === null || _a === void 0 ? void 0 : _a.toString()}'.`, userDataSync_1.UserDataSyncErrorCode.ConnectionRefused);
                }
                throw e;
            }
            if (context.res.statusCode === 401) {
                this.authToken = undefined;
                this._onTokenFailed.fire();
                throw new userDataSync_1.UserDataSyncStoreError(`Request '${(_b = options.url) === null || _b === void 0 ? void 0 : _b.toString()}' failed because of Unauthorized (401).`, userDataSync_1.UserDataSyncErrorCode.Unauthorized);
            }
            this._onTokenSucceed.fire();
            if (context.res.statusCode === 410) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${(_c = options.url) === null || _c === void 0 ? void 0 : _c.toString()}' failed because the requested resource is not longer available (410).`, userDataSync_1.UserDataSyncErrorCode.Gone);
            }
            if (context.res.statusCode === 412) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${(_d = options.url) === null || _d === void 0 ? void 0 : _d.toString()}' failed because of Precondition Failed (412). There is new data exists for this resource. Make the request again with latest data.`, userDataSync_1.UserDataSyncErrorCode.PreconditionFailed);
            }
            if (context.res.statusCode === 413) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${(_e = options.url) === null || _e === void 0 ? void 0 : _e.toString()}' failed because of too large payload (413).`, userDataSync_1.UserDataSyncErrorCode.TooLarge);
            }
            if (context.res.statusCode === 426) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${(_f = options.url) === null || _f === void 0 ? void 0 : _f.toString()}' failed with status Upgrade Required (426). Please upgrade the client and try again.`, userDataSync_1.UserDataSyncErrorCode.UpgradeRequired);
            }
            if (context.res.statusCode === 429) {
                throw new userDataSync_1.UserDataSyncStoreError(`${options.type} request '${(_g = options.url) === null || _g === void 0 ? void 0 : _g.toString()}' failed because of too many requests (429).`, userDataSync_1.UserDataSyncErrorCode.TooManyRequests);
            }
            return context;
        }
        addSessionHeaders(headers) {
            let machineSessionId = this.storageService.get(MACHINE_SESSION_ID_KEY, 0 /* GLOBAL */);
            if (machineSessionId === undefined) {
                machineSessionId = uuid_1.generateUuid();
                this.storageService.store(MACHINE_SESSION_ID_KEY, machineSessionId, 0 /* GLOBAL */);
            }
            headers['X-Machine-Session-Id'] = machineSessionId;
            const userSessionId = this.storageService.get(USER_SESSION_ID_KEY, 0 /* GLOBAL */);
            if (userSessionId !== undefined) {
                headers['X-User-Session-Id'] = userSessionId;
            }
        }
    };
    UserDataSyncStoreService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, request_1.IRequestService),
        __param(3, userDataSync_1.IUserDataSyncLogService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, files_1.IFileService),
        __param(6, storage_1.IStorageService)
    ], UserDataSyncStoreService);
    exports.UserDataSyncStoreService = UserDataSyncStoreService;
    class RequestsSession {
        constructor(limit, interval, /* in ms */ requestService) {
            this.limit = limit;
            this.interval = interval;
            this.requestService = requestService;
            this.count = 0;
            this.startTime = undefined;
        }
        request(options, token) {
            if (this.isExpired()) {
                this.reset();
            }
            if (this.count >= this.limit) {
                throw new userDataSync_1.UserDataSyncStoreError(`Too many requests. Allowed only ${this.limit} requests in ${this.interval / (1000 * 60)} minutes.`, userDataSync_1.UserDataSyncErrorCode.LocalTooManyRequests);
            }
            this.startTime = this.startTime || new Date();
            this.count++;
            return this.requestService.request(options, token);
        }
        isExpired() {
            return this.startTime !== undefined && new Date().getTime() - this.startTime.getTime() > this.interval;
        }
        reset() {
            this.count = 0;
            this.startTime = undefined;
        }
    }
    exports.RequestsSession = RequestsSession;
});
//# __sourceMappingURL=userDataSyncStoreService.js.map