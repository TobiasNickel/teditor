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
define(["require", "exports", "vs/base/common/errors", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/base/common/objects", "vs/platform/telemetry/common/telemetry", "vs/platform/request/common/request", "vs/platform/extensions/common/extensionValidator", "vs/platform/environment/common/environment", "vs/base/common/map", "vs/base/common/cancellation", "vs/platform/log/common/log", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/serviceMachineId/common/serviceMachineId", "vs/platform/instantiation/common/instantiation"], function (require, exports, errors_1, extensionManagement_1, extensionManagementUtil_1, objects_1, telemetry_1, request_1, extensionValidator_1, environment_1, map_1, cancellation_1, log_1, files_1, productService_1, storage_1, serviceMachineId_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveMarketplaceHeaders = exports.ExtensionGalleryService = void 0;
    var Flags;
    (function (Flags) {
        Flags[Flags["None"] = 0] = "None";
        Flags[Flags["IncludeVersions"] = 1] = "IncludeVersions";
        Flags[Flags["IncludeFiles"] = 2] = "IncludeFiles";
        Flags[Flags["IncludeCategoryAndTags"] = 4] = "IncludeCategoryAndTags";
        Flags[Flags["IncludeSharedAccounts"] = 8] = "IncludeSharedAccounts";
        Flags[Flags["IncludeVersionProperties"] = 16] = "IncludeVersionProperties";
        Flags[Flags["ExcludeNonValidated"] = 32] = "ExcludeNonValidated";
        Flags[Flags["IncludeInstallationTargets"] = 64] = "IncludeInstallationTargets";
        Flags[Flags["IncludeAssetUri"] = 128] = "IncludeAssetUri";
        Flags[Flags["IncludeStatistics"] = 256] = "IncludeStatistics";
        Flags[Flags["IncludeLatestVersionOnly"] = 512] = "IncludeLatestVersionOnly";
        Flags[Flags["Unpublished"] = 4096] = "Unpublished";
    })(Flags || (Flags = {}));
    function flagsToString(...flags) {
        return String(flags.reduce((r, f) => r | f, 0));
    }
    var FilterType;
    (function (FilterType) {
        FilterType[FilterType["Tag"] = 1] = "Tag";
        FilterType[FilterType["ExtensionId"] = 4] = "ExtensionId";
        FilterType[FilterType["Category"] = 5] = "Category";
        FilterType[FilterType["ExtensionName"] = 7] = "ExtensionName";
        FilterType[FilterType["Target"] = 8] = "Target";
        FilterType[FilterType["Featured"] = 9] = "Featured";
        FilterType[FilterType["SearchText"] = 10] = "SearchText";
        FilterType[FilterType["ExcludeWithFlags"] = 12] = "ExcludeWithFlags";
    })(FilterType || (FilterType = {}));
    const AssetType = {
        Icon: 'Microsoft.VisualStudio.Services.Icons.Default',
        Details: 'Microsoft.VisualStudio.Services.Content.Details',
        Changelog: 'Microsoft.VisualStudio.Services.Content.Changelog',
        Manifest: 'Microsoft.VisualStudio.Code.Manifest',
        VSIX: 'Microsoft.VisualStudio.Services.VSIXPackage',
        License: 'Microsoft.VisualStudio.Services.Content.License',
        Repository: 'Microsoft.VisualStudio.Services.Links.Source'
    };
    const PropertyType = {
        Dependency: 'Microsoft.VisualStudio.Code.ExtensionDependencies',
        ExtensionPack: 'Microsoft.VisualStudio.Code.ExtensionPack',
        Engine: 'Microsoft.VisualStudio.Code.Engine',
        LocalizedLanguages: 'Microsoft.VisualStudio.Code.LocalizedLanguages'
    };
    const DefaultPageSize = 10;
    const DefaultQueryState = {
        pageNumber: 1,
        pageSize: DefaultPageSize,
        sortBy: 0 /* NoneOrRelevance */,
        sortOrder: 0 /* Default */,
        flags: Flags.None,
        criteria: [],
        assetTypes: []
    };
    class Query {
        constructor(state = DefaultQueryState) {
            this.state = state;
        }
        get pageNumber() { return this.state.pageNumber; }
        get pageSize() { return this.state.pageSize; }
        get sortBy() { return this.state.sortBy; }
        get sortOrder() { return this.state.sortOrder; }
        get flags() { return this.state.flags; }
        withPage(pageNumber, pageSize = this.state.pageSize) {
            return new Query(objects_1.assign({}, this.state, { pageNumber, pageSize }));
        }
        withFilter(filterType, ...values) {
            const criteria = [
                ...this.state.criteria,
                ...values.map(value => ({ filterType, value }))
            ];
            return new Query(objects_1.assign({}, this.state, { criteria }));
        }
        withSortBy(sortBy) {
            return new Query(objects_1.assign({}, this.state, { sortBy }));
        }
        withSortOrder(sortOrder) {
            return new Query(objects_1.assign({}, this.state, { sortOrder }));
        }
        withFlags(...flags) {
            return new Query(objects_1.assign({}, this.state, { flags: flags.reduce((r, f) => r | f, 0) }));
        }
        withAssetTypes(...assetTypes) {
            return new Query(objects_1.assign({}, this.state, { assetTypes }));
        }
        get raw() {
            const { criteria, pageNumber, pageSize, sortBy, sortOrder, flags, assetTypes } = this.state;
            const filters = [{ criteria, pageNumber, pageSize, sortBy, sortOrder }];
            return { filters, assetTypes, flags };
        }
        get searchText() {
            const criterium = this.state.criteria.filter(criterium => criterium.filterType === FilterType.SearchText)[0];
            return criterium && criterium.value ? criterium.value : '';
        }
    }
    function getStatistic(statistics, name) {
        const result = (statistics || []).filter(s => s.statisticName === name)[0];
        return result ? result.value : 0;
    }
    function getCoreTranslationAssets(version) {
        const coreTranslationAssetPrefix = 'Microsoft.VisualStudio.Code.Translation.';
        const result = version.files.filter(f => f.assetType.indexOf(coreTranslationAssetPrefix) === 0);
        return result.reduce((result, file) => {
            const asset = getVersionAsset(version, file.assetType);
            if (asset) {
                result.push([file.assetType.substring(coreTranslationAssetPrefix.length), asset]);
            }
            return result;
        }, []);
    }
    function getRepositoryAsset(version) {
        if (version.properties) {
            const results = version.properties.filter(p => p.key === AssetType.Repository);
            const gitRegExp = new RegExp('((git|ssh|http(s)?)|(git@[\w.]+))(:(//)?)([\w.@\:/\-~]+)(.git)(/)?');
            const uri = results.filter(r => gitRegExp.test(r.value))[0];
            return uri ? { uri: uri.value, fallbackUri: uri.value } : null;
        }
        return getVersionAsset(version, AssetType.Repository);
    }
    function getDownloadAsset(version) {
        return {
            uri: `${version.fallbackAssetUri}/${AssetType.VSIX}?redirect=true`,
            fallbackUri: `${version.fallbackAssetUri}/${AssetType.VSIX}`
        };
    }
    function getIconAsset(version) {
        const asset = getVersionAsset(version, AssetType.Icon);
        if (asset) {
            return asset;
        }
        const uri = extensionManagement_1.DefaultIconPath;
        return { uri, fallbackUri: uri };
    }
    function getVersionAsset(version, type) {
        const result = version.files.filter(f => f.assetType === type)[0];
        return result ? { uri: `${version.assetUri}/${type}`, fallbackUri: `${version.fallbackAssetUri}/${type}` } : null;
    }
    function getExtensions(version, property) {
        const values = version.properties ? version.properties.filter(p => p.key === property) : [];
        const value = values.length > 0 && values[0].value;
        return value ? value.split(',').map(v => extensionManagementUtil_1.adoptToGalleryExtensionId(v)) : [];
    }
    function getEngine(version) {
        const values = version.properties ? version.properties.filter(p => p.key === PropertyType.Engine) : [];
        return (values.length > 0 && values[0].value) || '';
    }
    function getLocalizedLanguages(version) {
        const values = version.properties ? version.properties.filter(p => p.key === PropertyType.LocalizedLanguages) : [];
        const value = (values.length > 0 && values[0].value) || '';
        return value ? value.split(',') : [];
    }
    function getIsPreview(flags) {
        return flags.indexOf('preview') !== -1;
    }
    function toExtension(galleryExtension, version, index, query, querySource) {
        const assets = {
            manifest: getVersionAsset(version, AssetType.Manifest),
            readme: getVersionAsset(version, AssetType.Details),
            changelog: getVersionAsset(version, AssetType.Changelog),
            license: getVersionAsset(version, AssetType.License),
            repository: getRepositoryAsset(version),
            download: getDownloadAsset(version),
            icon: getIconAsset(version),
            coreTranslations: getCoreTranslationAssets(version)
        };
        return {
            identifier: {
                id: extensionManagementUtil_1.getGalleryExtensionId(galleryExtension.publisher.publisherName, galleryExtension.extensionName),
                uuid: galleryExtension.extensionId
            },
            name: galleryExtension.extensionName,
            version: version.version,
            date: version.lastUpdated,
            displayName: galleryExtension.displayName,
            publisherId: galleryExtension.publisher.publisherId,
            publisher: galleryExtension.publisher.publisherName,
            publisherDisplayName: galleryExtension.publisher.displayName,
            description: galleryExtension.shortDescription || '',
            installCount: getStatistic(galleryExtension.statistics, 'install'),
            rating: getStatistic(galleryExtension.statistics, 'averagerating'),
            ratingCount: getStatistic(galleryExtension.statistics, 'ratingcount'),
            assets,
            properties: {
                dependencies: getExtensions(version, PropertyType.Dependency),
                extensionPack: getExtensions(version, PropertyType.ExtensionPack),
                engine: getEngine(version),
                localizedLanguages: getLocalizedLanguages(version)
            },
            /* __GDPR__FRAGMENT__
                "GalleryExtensionTelemetryData2" : {
                    "index" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                    "searchText": { "classification": "CustomerContent", "purpose": "FeatureInsight" },
                    "querySource": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            telemetryData: {
                index: ((query.pageNumber - 1) * query.pageSize) + index,
                searchText: query.searchText,
                querySource
            },
            preview: getIsPreview(galleryExtension.flags)
        };
    }
    let ExtensionGalleryService = class ExtensionGalleryService {
        constructor(requestService, logService, environmentService, telemetryService, fileService, productService, storageService) {
            this.requestService = requestService;
            this.logService = logService;
            this.environmentService = environmentService;
            this.telemetryService = telemetryService;
            this.fileService = fileService;
            this.productService = productService;
            const config = productService.extensionsGallery;
            this.extensionsGalleryUrl = config && config.serviceUrl;
            this.extensionsControlUrl = config && config.controlUrl;
            this.commonHeadersPromise = resolveMarketplaceHeaders(productService.version, this.environmentService, this.fileService, storageService);
        }
        api(path = '') {
            return `${this.extensionsGalleryUrl}${path}`;
        }
        isEnabled() {
            return !!this.extensionsGalleryUrl;
        }
        getCompatibleExtension(arg1, version) {
            const extension = extensionManagement_1.isIExtensionIdentifier(arg1) ? null : arg1;
            if (extension && extension.properties.engine && extensionValidator_1.isEngineValid(extension.properties.engine, this.productService.version)) {
                return Promise.resolve(extension);
            }
            const { id, uuid } = extension ? extension.identifier : arg1;
            let query = new Query()
                .withFlags(Flags.IncludeAssetUri, Flags.IncludeStatistics, Flags.IncludeFiles, Flags.IncludeVersionProperties)
                .withPage(1, 1)
                .withFilter(FilterType.Target, 'Microsoft.VisualStudio.Code');
            if (uuid) {
                query = query.withFilter(FilterType.ExtensionId, uuid);
            }
            else {
                query = query.withFilter(FilterType.ExtensionName, id);
            }
            return this.queryGallery(query, cancellation_1.CancellationToken.None)
                .then(({ galleryExtensions }) => {
                const [rawExtension] = galleryExtensions;
                if (!rawExtension || !rawExtension.versions.length) {
                    return null;
                }
                if (version) {
                    const versionAsset = rawExtension.versions.filter(v => v.version === version)[0];
                    if (versionAsset) {
                        const extension = toExtension(rawExtension, versionAsset, 0, query);
                        if (extension.properties.engine && extensionValidator_1.isEngineValid(extension.properties.engine, this.productService.version)) {
                            return extension;
                        }
                    }
                    return null;
                }
                return this.getLastValidExtensionVersion(rawExtension, rawExtension.versions)
                    .then(rawVersion => {
                    if (rawVersion) {
                        return toExtension(rawExtension, rawVersion, 0, query);
                    }
                    return null;
                });
            });
        }
        query(arg1, arg2) {
            const options = cancellation_1.CancellationToken.isCancellationToken(arg1) ? {} : arg1;
            const token = cancellation_1.CancellationToken.isCancellationToken(arg1) ? arg1 : arg2;
            if (!this.isEnabled()) {
                return Promise.reject(new Error('No extension gallery service configured.'));
            }
            const type = options.names ? 'ids' : (options.text ? 'text' : 'all');
            let text = options.text || '';
            const pageSize = objects_1.getOrDefault(options, o => o.pageSize, 50);
            this.telemetryService.publicLog2('galleryService:query', { type, text });
            let query = new Query()
                .withFlags(Flags.IncludeLatestVersionOnly, Flags.IncludeAssetUri, Flags.IncludeStatistics, Flags.IncludeFiles, Flags.IncludeVersionProperties)
                .withPage(1, pageSize)
                .withFilter(FilterType.Target, 'Microsoft.VisualStudio.Code');
            if (text) {
                // Use category filter instead of "category:themes"
                text = text.replace(/\bcategory:("([^"]*)"|([^"]\S*))(\s+|\b|$)/g, (_, quotedCategory, category) => {
                    query = query.withFilter(FilterType.Category, category || quotedCategory);
                    return '';
                });
                // Use tag filter instead of "tag:debuggers"
                text = text.replace(/\btag:("([^"]*)"|([^"]\S*))(\s+|\b|$)/g, (_, quotedTag, tag) => {
                    query = query.withFilter(FilterType.Tag, tag || quotedTag);
                    return '';
                });
                text = text.trim();
                if (text) {
                    text = text.length < 200 ? text : text.substring(0, 200);
                    query = query.withFilter(FilterType.SearchText, text);
                }
                query = query.withSortBy(0 /* NoneOrRelevance */);
            }
            else if (options.ids) {
                query = query.withFilter(FilterType.ExtensionId, ...options.ids);
            }
            else if (options.names) {
                query = query.withFilter(FilterType.ExtensionName, ...options.names);
            }
            else {
                query = query.withSortBy(4 /* InstallCount */);
            }
            if (typeof options.sortBy === 'number') {
                query = query.withSortBy(options.sortBy);
            }
            if (typeof options.sortOrder === 'number') {
                query = query.withSortOrder(options.sortOrder);
            }
            return this.queryGallery(query, token).then(({ galleryExtensions, total }) => {
                const extensions = galleryExtensions.map((e, index) => toExtension(e, e.versions[0], index, query, options.source));
                const pageSize = query.pageSize;
                const getPage = (pageIndex, ct) => {
                    if (ct.isCancellationRequested) {
                        return Promise.reject(errors_1.canceled());
                    }
                    const nextPageQuery = query.withPage(pageIndex + 1);
                    return this.queryGallery(nextPageQuery, ct)
                        .then(({ galleryExtensions }) => galleryExtensions.map((e, index) => toExtension(e, e.versions[0], index, nextPageQuery, options.source)));
                };
                return { firstPage: extensions, total, pageSize, getPage };
            });
        }
        queryGallery(query, token) {
            // Always exclude non validated and unpublished extensions
            query = query
                .withFlags(query.flags, Flags.ExcludeNonValidated)
                .withFilter(FilterType.ExcludeWithFlags, flagsToString(Flags.Unpublished));
            if (!this.isEnabled()) {
                return Promise.reject(new Error('No extension gallery service configured.'));
            }
            return this.commonHeadersPromise.then(commonHeaders => {
                const data = JSON.stringify(query.raw);
                const headers = objects_1.assign({}, commonHeaders, {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json;api-version=3.0-preview.1',
                    'Accept-Encoding': 'gzip',
                    'Content-Length': data.length
                });
                return this.requestService.request({
                    type: 'POST',
                    url: this.api('/extensionquery'),
                    data,
                    headers
                }, token).then(context => {
                    if (context.res.statusCode && context.res.statusCode >= 400 && context.res.statusCode < 500) {
                        return { galleryExtensions: [], total: 0 };
                    }
                    return request_1.asJson(context).then(result => {
                        if (result) {
                            const r = result.results[0];
                            const galleryExtensions = r.extensions;
                            const resultCount = r.resultMetadata && r.resultMetadata.filter(m => m.metadataType === 'ResultCount')[0];
                            const total = resultCount && resultCount.metadataItems.filter(i => i.name === 'TotalCount')[0].count || 0;
                            return { galleryExtensions, total };
                        }
                        return { galleryExtensions: [], total: 0 };
                    });
                });
            });
        }
        reportStatistic(publisher, name, version, type) {
            if (!this.isEnabled()) {
                return Promise.resolve(undefined);
            }
            return this.commonHeadersPromise.then(commonHeaders => {
                const headers = Object.assign(Object.assign({}, commonHeaders), { Accept: '*/*;api-version=4.0-preview.1' });
                return this.requestService.request({
                    type: 'POST',
                    url: this.api(`/publishers/${publisher}/extensions/${name}/${version}/stats?statType=${type}`),
                    headers
                }, cancellation_1.CancellationToken.None).then(undefined, () => undefined);
            });
        }
        download(extension, location, operation) {
            this.logService.trace('ExtensionGalleryService#download', extension.identifier.id);
            const data = extensionManagementUtil_1.getGalleryExtensionTelemetryData(extension);
            const startTime = new Date().getTime();
            /* __GDPR__
                "galleryService:downloadVSIX" : {
                    "duration": { "classification": "SystemMetaData", "purpose": "PerformanceAndHealth", "isMeasurement": true },
                    "${include}": [
                        "${GalleryExtensionTelemetryData}"
                    ]
                }
            */
            const log = (duration) => this.telemetryService.publicLog('galleryService:downloadVSIX', objects_1.assign(data, { duration }));
            const operationParam = operation === 1 /* Install */ ? 'install' : operation === 2 /* Update */ ? 'update' : '';
            const downloadAsset = operationParam ? {
                uri: `${extension.assets.download.uri}&${operationParam}=true`,
                fallbackUri: `${extension.assets.download.fallbackUri}?${operationParam}=true`
            } : extension.assets.download;
            return this.getAsset(downloadAsset)
                .then(context => this.fileService.writeFile(location, context.stream))
                .then(() => log(new Date().getTime() - startTime));
        }
        getReadme(extension, token) {
            if (extension.assets.readme) {
                return this.getAsset(extension.assets.readme, {}, token)
                    .then(context => request_1.asText(context))
                    .then(content => content || '');
            }
            return Promise.resolve('');
        }
        getManifest(extension, token) {
            if (extension.assets.manifest) {
                return this.getAsset(extension.assets.manifest, {}, token)
                    .then(request_1.asText)
                    .then(text => text ? JSON.parse(text) : null);
            }
            return Promise.resolve(null);
        }
        getCoreTranslation(extension, languageId) {
            const asset = extension.assets.coreTranslations.filter(t => t[0] === languageId.toUpperCase())[0];
            if (asset) {
                return this.getAsset(asset[1])
                    .then(request_1.asText)
                    .then(text => text ? JSON.parse(text) : null);
            }
            return Promise.resolve(null);
        }
        getChangelog(extension, token) {
            if (extension.assets.changelog) {
                return this.getAsset(extension.assets.changelog, {}, token)
                    .then(context => request_1.asText(context))
                    .then(content => content || '');
            }
            return Promise.resolve('');
        }
        getAllVersions(extension, compatible) {
            let query = new Query()
                .withFlags(Flags.IncludeVersions, Flags.IncludeFiles, Flags.IncludeVersionProperties)
                .withPage(1, 1)
                .withFilter(FilterType.Target, 'Microsoft.VisualStudio.Code');
            if (extension.identifier.uuid) {
                query = query.withFilter(FilterType.ExtensionId, extension.identifier.uuid);
            }
            else {
                query = query.withFilter(FilterType.ExtensionName, extension.identifier.id);
            }
            return this.queryGallery(query, cancellation_1.CancellationToken.None).then(({ galleryExtensions }) => {
                if (galleryExtensions.length) {
                    if (compatible) {
                        return Promise.all(galleryExtensions[0].versions.map(v => this.getEngine(v).then(engine => extensionValidator_1.isEngineValid(engine, this.productService.version) ? v : null)))
                            .then(versions => versions
                            .filter(v => !!v)
                            .map(v => ({ version: v.version, date: v.lastUpdated })));
                    }
                    else {
                        return galleryExtensions[0].versions.map(v => ({ version: v.version, date: v.lastUpdated }));
                    }
                }
                return [];
            });
        }
        getAsset(asset, options = {}, token = cancellation_1.CancellationToken.None) {
            return this.commonHeadersPromise.then(commonHeaders => {
                const baseOptions = { type: 'GET' };
                const headers = objects_1.assign({}, commonHeaders, options.headers || {});
                options = objects_1.assign({}, options, baseOptions, { headers });
                const url = asset.uri;
                const fallbackUrl = asset.fallbackUri;
                const firstOptions = objects_1.assign({}, options, { url });
                return this.requestService.request(firstOptions, token)
                    .then(context => {
                    if (context.res.statusCode === 200) {
                        return Promise.resolve(context);
                    }
                    return request_1.asText(context)
                        .then(message => Promise.reject(new Error(`Expected 200, got back ${context.res.statusCode} instead.\n\n${message}`)));
                })
                    .then(undefined, err => {
                    if (errors_1.isPromiseCanceledError(err)) {
                        return Promise.reject(err);
                    }
                    const message = errors_1.getErrorMessage(err);
                    this.telemetryService.publicLog2('galleryService:cdnFallback', { url, message });
                    const fallbackOptions = objects_1.assign({}, options, { url: fallbackUrl });
                    return this.requestService.request(fallbackOptions, token);
                });
            });
        }
        getLastValidExtensionVersion(extension, versions) {
            const version = this.getLastValidExtensionVersionFromProperties(extension, versions);
            if (version) {
                return version;
            }
            return this.getLastValidExtensionVersionRecursively(extension, versions);
        }
        getLastValidExtensionVersionFromProperties(extension, versions) {
            for (const version of versions) {
                const engine = getEngine(version);
                if (!engine) {
                    return null;
                }
                if (extensionValidator_1.isEngineValid(engine, this.productService.version)) {
                    return Promise.resolve(version);
                }
            }
            return null;
        }
        getEngine(version) {
            const engine = getEngine(version);
            if (engine) {
                return Promise.resolve(engine);
            }
            const manifest = getVersionAsset(version, AssetType.Manifest);
            if (!manifest) {
                return Promise.reject('Manifest was not found');
            }
            const headers = { 'Accept-Encoding': 'gzip' };
            return this.getAsset(manifest, { headers })
                .then(context => request_1.asJson(context))
                .then(manifest => manifest ? manifest.engines.vscode : Promise.reject('Error while reading manifest'));
        }
        getLastValidExtensionVersionRecursively(extension, versions) {
            if (!versions.length) {
                return Promise.resolve(null);
            }
            const version = versions[0];
            return this.getEngine(version)
                .then(engine => {
                if (!extensionValidator_1.isEngineValid(engine, this.productService.version)) {
                    return this.getLastValidExtensionVersionRecursively(extension, versions.slice(1));
                }
                version.properties = version.properties || [];
                version.properties.push({ key: PropertyType.Engine, value: engine });
                return version;
            });
        }
        getExtensionsReport() {
            if (!this.isEnabled()) {
                return Promise.reject(new Error('No extension gallery service configured.'));
            }
            if (!this.extensionsControlUrl) {
                return Promise.resolve([]);
            }
            return this.requestService.request({ type: 'GET', url: this.extensionsControlUrl }, cancellation_1.CancellationToken.None).then(context => {
                if (context.res.statusCode !== 200) {
                    return Promise.reject(new Error('Could not get extensions report.'));
                }
                return request_1.asJson(context).then(result => {
                    const map = new Map();
                    if (result) {
                        for (const id of result.malicious) {
                            const ext = map.get(id) || { id: { id }, malicious: true, slow: false };
                            ext.malicious = true;
                            map.set(id, ext);
                        }
                    }
                    return Promise.resolve(map_1.values(map));
                });
            });
        }
    };
    ExtensionGalleryService = __decorate([
        __param(0, request_1.IRequestService),
        __param(1, log_1.ILogService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, files_1.IFileService),
        __param(5, productService_1.IProductService),
        __param(6, instantiation_1.optional(storage_1.IStorageService))
    ], ExtensionGalleryService);
    exports.ExtensionGalleryService = ExtensionGalleryService;
    async function resolveMarketplaceHeaders(version, environmentService, fileService, storageService) {
        const headers = {
            'X-Market-Client-Id': `VSCode ${version}`,
            'User-Agent': `VSCode ${version}`
        };
        const uuid = await serviceMachineId_1.getServiceMachineId(environmentService, fileService, storageService);
        headers['X-Market-User-Id'] = uuid;
        return headers;
    }
    exports.resolveMarketplaceHeaders = resolveMarketplaceHeaders;
});
//# __sourceMappingURL=extensionGalleryService.js.map