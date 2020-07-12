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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/event", "vs/base/common/errors", "vs/base/common/paging", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/base/browser/dom", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/browser/extensionsList", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/common/extensionQuery", "vs/workbench/services/extensions/common/extensions", "vs/platform/theme/common/themeService", "vs/platform/theme/common/styler", "vs/platform/telemetry/common/telemetry", "vs/base/browser/ui/countBadge/countBadge", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/list/browser/listService", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/workspace/common/workspace", "vs/base/common/arrays", "vs/workbench/contrib/experiments/common/experimentService", "vs/base/browser/ui/aria/aria", "vs/base/common/errorsWithActions", "vs/base/common/actions", "vs/platform/extensions/common/extensions", "vs/base/common/async", "vs/platform/product/common/productService", "vs/platform/severityIcon/common/severityIcon", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/theme", "vs/platform/actions/common/actions", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/workbench/services/preferences/common/preferences"], function (require, exports, nls_1, lifecycle_1, objects_1, event_1, errors_1, paging_1, extensionManagement_1, extensionManagementUtil_1, keybinding_1, contextView_1, dom_1, instantiation_1, extensionsList_1, extensions_1, extensionQuery_1, extensions_2, themeService_1, styler_1, telemetry_1, countBadge_1, actionbar_1, extensionsActions_1, listService_1, configuration_1, notification_1, viewPaneContainer_1, workspace_1, arrays_1, experimentService_1, aria_1, errorsWithActions_1, actions_1, extensions_3, async_1, productService_1, severityIcon_1, contextkey_1, theme_1, actions_2, views_1, opener_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceRecommendedExtensionsView = exports.RecommendedExtensionsView = exports.DefaultRecommendedExtensionsView = exports.BuiltInBasicsExtensionsView = exports.BuiltInThemesExtensionsView = exports.BuiltInExtensionsView = exports.DisabledExtensionsView = exports.EnabledExtensionsView = exports.ServerExtensionsView = exports.ExtensionsListView = void 0;
    // Extensions that are automatically classified as Programming Language extensions, but should be Feature extensions
    const FORCE_FEATURE_EXTENSIONS = ['vscode.git', 'vscode.search-result'];
    class ExtensionsViewState extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onFocus = this._register(new event_1.Emitter());
            this.onFocus = this._onFocus.event;
            this._onBlur = this._register(new event_1.Emitter());
            this.onBlur = this._onBlur.event;
            this.currentlyFocusedItems = [];
        }
        onFocusChange(extensions) {
            this.currentlyFocusedItems.forEach(extension => this._onBlur.fire(extension));
            this.currentlyFocusedItems = extensions;
            this.currentlyFocusedItems.forEach(extension => this._onFocus.fire(extension));
        }
    }
    class ExtensionListViewWarning extends Error {
    }
    let ExtensionsListView = class ExtensionsListView extends viewPaneContainer_1.ViewPane {
        constructor(options, notificationService, keybindingService, contextMenuService, instantiationService, themeService, extensionService, extensionsWorkbenchService, tipsService, telemetryService, configurationService, contextService, experimentService, extensionManagementServerService, productService, contextKeyService, viewDescriptorService, menuService, openerService, preferencesService) {
            super(Object.assign(Object.assign({}, options), { showActionsAlways: true }), keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.notificationService = notificationService;
            this.instantiationService = instantiationService;
            this.extensionService = extensionService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.tipsService = tipsService;
            this.contextService = contextService;
            this.experimentService = experimentService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.productService = productService;
            this.menuService = menuService;
            this.preferencesService = preferencesService;
            this.list = null;
            this.queryRequest = null;
            this.server = options.server;
        }
        renderHeader(container) {
            dom_1.addClass(container, 'extension-view-header');
            super.renderHeader(container);
            this.badge = new countBadge_1.CountBadge(dom_1.append(container, dom_1.$('.count-badge-wrapper')));
            this._register(styler_1.attachBadgeStyler(this.badge, this.themeService));
        }
        renderBody(container) {
            super.renderBody(container);
            const extensionsList = dom_1.append(container, dom_1.$('.extensions-list'));
            const messageContainer = dom_1.append(container, dom_1.$('.message-container'));
            const messageSeverityIcon = dom_1.append(messageContainer, dom_1.$(''));
            const messageBox = dom_1.append(messageContainer, dom_1.$('.message'));
            const delegate = new extensionsList_1.Delegate();
            const extensionsViewState = new ExtensionsViewState();
            const renderer = this.instantiationService.createInstance(extensionsList_1.Renderer, extensionsViewState);
            this.list = this.instantiationService.createInstance(listService_1.WorkbenchPagedList, 'Extensions', extensionsList, delegate, [renderer], {
                multipleSelectionSupport: false,
                setRowLineHeight: false,
                horizontalScrolling: false,
                accessibilityProvider: {
                    getAriaLabel(extension) {
                        return extension ? nls_1.localize('extension-arialabel', "{0}. Press enter for extension details.", extension.displayName) : '';
                    },
                    getWidgetAriaLabel() {
                        return nls_1.localize('extensions', "Extensions");
                    }
                },
                overrideStyles: {
                    listBackground: theme_1.SIDE_BAR_BACKGROUND
                }
            });
            this._register(this.list.onContextMenu(e => this.onContextMenu(e), this));
            this._register(this.list.onDidChangeFocus(e => extensionsViewState.onFocusChange(arrays_1.coalesce(e.elements)), this));
            this._register(this.list);
            this._register(extensionsViewState);
            const resourceNavigator = this._register(new listService_1.ListResourceNavigator(this.list, { openOnSingleClick: true }));
            this._register(event_1.Event.debounce(event_1.Event.filter(resourceNavigator.onDidOpen, e => e.element !== null), (_, event) => event, 75, true)(options => {
                this.openExtension(this.list.model.get(options.element), Object.assign({ sideByside: options.sideBySide }, options.editorOptions));
            }));
            this.bodyTemplate = {
                extensionsList,
                messageBox,
                messageContainer,
                messageSeverityIcon
            };
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            if (this.bodyTemplate) {
                this.bodyTemplate.extensionsList.style.height = height + 'px';
            }
            if (this.list) {
                this.list.layout(height, width);
            }
        }
        async show(query) {
            if (this.queryRequest) {
                if (this.queryRequest.query === query) {
                    return this.queryRequest.request;
                }
                this.queryRequest.request.cancel();
                this.queryRequest = null;
            }
            const parsedQuery = extensionQuery_1.Query.parse(query);
            let options = {
                sortOrder: 0 /* Default */
            };
            switch (parsedQuery.sortBy) {
                case 'installs':
                    options = objects_1.assign(options, { sortBy: 4 /* InstallCount */ });
                    break;
                case 'rating':
                    options = objects_1.assign(options, { sortBy: 12 /* WeightedRating */ });
                    break;
                case 'name':
                    options = objects_1.assign(options, { sortBy: 2 /* Title */ });
                    break;
            }
            const successCallback = (model) => {
                this.queryRequest = null;
                this.setModel(model);
                return model;
            };
            const errorCallback = (e) => {
                const model = new paging_1.PagedModel([]);
                if (!errors_1.isPromiseCanceledError(e)) {
                    this.queryRequest = null;
                    this.setModel(model, e);
                }
                return this.list ? this.list.model : model;
            };
            const request = async_1.createCancelablePromise(token => this.query(parsedQuery, options, token).then(successCallback).catch(errorCallback));
            this.queryRequest = { query, request };
            return request;
        }
        count() {
            return this.list ? this.list.length : 0;
        }
        showEmptyModel() {
            const emptyModel = new paging_1.PagedModel([]);
            this.setModel(emptyModel);
            return Promise.resolve(emptyModel);
        }
        async onContextMenu(e) {
            if (e.element) {
                const runningExtensions = await this.extensionService.getExtensions();
                const manageExtensionAction = this.instantiationService.createInstance(extensionsActions_1.ManageExtensionAction);
                manageExtensionAction.extension = e.element;
                if (manageExtensionAction.enabled) {
                    const groups = await manageExtensionAction.getActionGroups(runningExtensions);
                    let actions = [];
                    for (const menuActions of groups) {
                        actions = [...actions, ...menuActions, new actionbar_1.Separator()];
                    }
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => e.anchor,
                        getActions: () => actions.slice(0, actions.length - 1)
                    });
                }
                else if (e.element) {
                    const groups = extensionsActions_1.getContextMenuActions(this.menuService, this.contextKeyService.createScoped(), this.instantiationService, e.element);
                    groups.forEach(group => group.forEach(extensionAction => extensionAction.extension = e.element));
                    let actions = [];
                    for (const menuActions of groups) {
                        actions = [...actions, ...menuActions, new actionbar_1.Separator()];
                    }
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => e.anchor,
                        getActions: () => actions
                    });
                }
            }
        }
        async query(query, options, token) {
            const idRegex = /@id:(([a-z0-9A-Z][a-z0-9\-A-Z]*)\.([a-z0-9A-Z][a-z0-9\-A-Z]*))/g;
            const ids = [];
            let idMatch;
            while ((idMatch = idRegex.exec(query.value)) !== null) {
                const name = idMatch[1];
                ids.push(name);
            }
            if (ids.length) {
                return this.queryByIds(ids, options, token);
            }
            if (ExtensionsListView.isLocalExtensionsQuery(query.value) || /@builtin/.test(query.value)) {
                return this.queryLocal(query, options);
            }
            return this.queryGallery(query, options, token)
                .then(null, e => {
                console.warn('Error querying extensions gallery', errors_1.getErrorMessage(e));
                return Promise.reject(new ExtensionListViewWarning(nls_1.localize('galleryError', "We cannot connect to the Extensions Marketplace at this time, please try again later.")));
            });
        }
        async queryByIds(ids, options, token) {
            const idsSet = ids.reduce((result, id) => { result.add(id.toLowerCase()); return result; }, new Set());
            const result = (await this.extensionsWorkbenchService.queryLocal(this.server))
                .filter(e => idsSet.has(e.identifier.id.toLowerCase()));
            if (result.length) {
                return this.getPagedModel(this.sortExtensions(result, options));
            }
            return this.extensionsWorkbenchService.queryGallery({ names: ids, source: 'queryById' }, token)
                .then(pager => this.getPagedModel(pager));
        }
        async queryLocal(query, options) {
            let value = query.value;
            if (/@builtin/i.test(value)) {
                const showThemesOnly = /@builtin:themes/i.test(value);
                if (showThemesOnly) {
                    value = value.replace(/@builtin:themes/g, '');
                }
                const showBasicsOnly = /@builtin:basics/i.test(value);
                if (showBasicsOnly) {
                    value = value.replace(/@builtin:basics/g, '');
                }
                const showFeaturesOnly = /@builtin:features/i.test(value);
                if (showFeaturesOnly) {
                    value = value.replace(/@builtin:features/g, '');
                }
                value = value.replace(/@builtin/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase();
                let result = await this.extensionsWorkbenchService.queryLocal(this.server);
                result = result
                    .filter(e => e.type === 0 /* System */ && (e.name.toLowerCase().indexOf(value) > -1 || e.displayName.toLowerCase().indexOf(value) > -1));
                const isThemeExtension = (e) => {
                    var _a, _b, _c, _d, _e, _f;
                    return (Array.isArray((_c = (_b = (_a = e.local) === null || _a === void 0 ? void 0 : _a.manifest) === null || _b === void 0 ? void 0 : _b.contributes) === null || _c === void 0 ? void 0 : _c.themes) && e.local.manifest.contributes.themes.length > 0)
                        || (Array.isArray((_f = (_e = (_d = e.local) === null || _d === void 0 ? void 0 : _d.manifest) === null || _e === void 0 ? void 0 : _e.contributes) === null || _f === void 0 ? void 0 : _f.iconThemes) && e.local.manifest.contributes.iconThemes.length > 0);
                };
                if (showThemesOnly) {
                    const themesExtensions = result.filter(isThemeExtension);
                    return this.getPagedModel(this.sortExtensions(themesExtensions, options));
                }
                const isLangaugeBasicExtension = (e) => {
                    var _a, _b, _c;
                    return FORCE_FEATURE_EXTENSIONS.indexOf(e.identifier.id) === -1
                        && (Array.isArray((_c = (_b = (_a = e.local) === null || _a === void 0 ? void 0 : _a.manifest) === null || _b === void 0 ? void 0 : _b.contributes) === null || _c === void 0 ? void 0 : _c.grammars) && e.local.manifest.contributes.grammars.length > 0);
                };
                if (showBasicsOnly) {
                    const basics = result.filter(isLangaugeBasicExtension);
                    return this.getPagedModel(this.sortExtensions(basics, options));
                }
                if (showFeaturesOnly) {
                    const others = result.filter(e => {
                        return e.local
                            && e.local.manifest
                            && !isThemeExtension(e)
                            && !isLangaugeBasicExtension(e);
                    });
                    return this.getPagedModel(this.sortExtensions(others, options));
                }
                return this.getPagedModel(this.sortExtensions(result, options));
            }
            const categories = [];
            value = value.replace(/\bcategory:("([^"]*)"|([^"]\S*))(\s+|\b|$)/g, (_, quotedCategory, category) => {
                const entry = (category || quotedCategory || '').toLowerCase();
                if (categories.indexOf(entry) === -1) {
                    categories.push(entry);
                }
                return '';
            });
            if (/@installed/i.test(value)) {
                // Show installed extensions
                value = value.replace(/@installed/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase();
                let result = await this.extensionsWorkbenchService.queryLocal(this.server);
                result = result
                    .filter(e => e.type === 1 /* User */
                    && (e.name.toLowerCase().indexOf(value) > -1 || e.displayName.toLowerCase().indexOf(value) > -1)
                    && (!categories.length || categories.some(category => (e.local && e.local.manifest.categories || []).some(c => c.toLowerCase() === category))));
                if (options.sortBy !== undefined) {
                    result = this.sortExtensions(result, options);
                }
                else {
                    const runningExtensions = await this.extensionService.getExtensions();
                    const runningExtensionsById = runningExtensions.reduce((result, e) => { result.set(extensions_3.ExtensionIdentifier.toKey(e.identifier.value), e); return result; }, new Map());
                    result = result.sort((e1, e2) => {
                        const running1 = runningExtensionsById.get(extensions_3.ExtensionIdentifier.toKey(e1.identifier.id));
                        const isE1Running = running1 && this.extensionManagementServerService.getExtensionManagementServer(extensions_2.toExtension(running1)) === e1.server;
                        const running2 = runningExtensionsById.get(extensions_3.ExtensionIdentifier.toKey(e2.identifier.id));
                        const isE2Running = running2 && this.extensionManagementServerService.getExtensionManagementServer(extensions_2.toExtension(running2)) === e2.server;
                        if ((isE1Running && isE2Running)) {
                            return e1.displayName.localeCompare(e2.displayName);
                        }
                        const isE1LanguagePackExtension = e1.local && extensions_3.isLanguagePackExtension(e1.local.manifest);
                        const isE2LanguagePackExtension = e2.local && extensions_3.isLanguagePackExtension(e2.local.manifest);
                        if (!isE1Running && !isE2Running) {
                            if (isE1LanguagePackExtension) {
                                return -1;
                            }
                            if (isE2LanguagePackExtension) {
                                return 1;
                            }
                            return e1.displayName.localeCompare(e2.displayName);
                        }
                        if ((isE1Running && isE2LanguagePackExtension) || (isE2Running && isE1LanguagePackExtension)) {
                            return e1.displayName.localeCompare(e2.displayName);
                        }
                        return isE1Running ? -1 : 1;
                    });
                }
                return this.getPagedModel(result);
            }
            if (/@outdated/i.test(value)) {
                value = value.replace(/@outdated/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase();
                const local = await this.extensionsWorkbenchService.queryLocal(this.server);
                const result = local
                    .sort((e1, e2) => e1.displayName.localeCompare(e2.displayName))
                    .filter(extension => extension.outdated
                    && (extension.name.toLowerCase().indexOf(value) > -1 || extension.displayName.toLowerCase().indexOf(value) > -1)
                    && (!categories.length || categories.some(category => !!extension.local && extension.local.manifest.categories.some(c => c.toLowerCase() === category))));
                return this.getPagedModel(this.sortExtensions(result, options));
            }
            if (/@disabled/i.test(value)) {
                value = value.replace(/@disabled/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase();
                const local = await this.extensionsWorkbenchService.queryLocal(this.server);
                const runningExtensions = await this.extensionService.getExtensions();
                const result = local
                    .sort((e1, e2) => e1.displayName.localeCompare(e2.displayName))
                    .filter(e => runningExtensions.every(r => !extensionManagementUtil_1.areSameExtensions({ id: r.identifier.value, uuid: r.uuid }, e.identifier))
                    && (e.name.toLowerCase().indexOf(value) > -1 || e.displayName.toLowerCase().indexOf(value) > -1)
                    && (!categories.length || categories.some(category => (e.local && e.local.manifest.categories || []).some(c => c.toLowerCase() === category))));
                return this.getPagedModel(this.sortExtensions(result, options));
            }
            if (/@enabled/i.test(value)) {
                value = value ? value.replace(/@enabled/g, '').replace(/@sort:(\w+)(-\w*)?/g, '').trim().toLowerCase() : '';
                const local = (await this.extensionsWorkbenchService.queryLocal(this.server)).filter(e => e.type === 1 /* User */);
                const runningExtensions = await this.extensionService.getExtensions();
                const result = local
                    .sort((e1, e2) => e1.displayName.localeCompare(e2.displayName))
                    .filter(e => runningExtensions.some(r => extensionManagementUtil_1.areSameExtensions({ id: r.identifier.value, uuid: r.uuid }, e.identifier))
                    && (e.name.toLowerCase().indexOf(value) > -1 || e.displayName.toLowerCase().indexOf(value) > -1)
                    && (!categories.length || categories.some(category => (e.local && e.local.manifest.categories || []).some(c => c.toLowerCase() === category))));
                return this.getPagedModel(this.sortExtensions(result, options));
            }
            return new paging_1.PagedModel([]);
        }
        async queryGallery(query, options, token) {
            const hasUserDefinedSortOrder = options.sortBy !== undefined;
            if (!hasUserDefinedSortOrder && !query.value.trim()) {
                options.sortBy = 4 /* InstallCount */;
            }
            if (ExtensionsListView.isWorkspaceRecommendedExtensionsQuery(query.value)) {
                return this.getWorkspaceRecommendationsModel(query, options, token);
            }
            else if (ExtensionsListView.isKeymapsRecommendedExtensionsQuery(query.value)) {
                return this.getKeymapRecommendationsModel(query, options, token);
            }
            else if (/@recommended:all/i.test(query.value) || ExtensionsListView.isSearchRecommendedExtensionsQuery(query.value)) {
                return this.getAllRecommendationsModel(query, options, token);
            }
            else if (ExtensionsListView.isRecommendedExtensionsQuery(query.value)) {
                return this.getRecommendationsModel(query, options, token);
            }
            if (/\bcurated:([^\s]+)\b/.test(query.value)) {
                return this.getCuratedModel(query, options, token);
            }
            const text = query.value;
            if (/\bext:([^\s]+)\b/g.test(text)) {
                options = objects_1.assign(options, { text, source: 'file-extension-tags' });
                return this.extensionsWorkbenchService.queryGallery(options, token).then(pager => this.getPagedModel(pager));
            }
            let preferredResults = [];
            if (text) {
                options = objects_1.assign(options, { text: text.substr(0, 350), source: 'searchText' });
                if (!hasUserDefinedSortOrder) {
                    const searchExperiments = await this.getSearchExperiments();
                    for (const experiment of searchExperiments) {
                        if (experiment.action && text.toLowerCase() === experiment.action.properties['searchText'] && Array.isArray(experiment.action.properties['preferredResults'])) {
                            preferredResults = experiment.action.properties['preferredResults'];
                            options.source += `-experiment-${experiment.id}`;
                            break;
                        }
                    }
                }
            }
            else {
                options.source = 'viewlet';
            }
            const pager = await this.extensionsWorkbenchService.queryGallery(options, token);
            let positionToUpdate = 0;
            for (const preferredResult of preferredResults) {
                for (let j = positionToUpdate; j < pager.firstPage.length; j++) {
                    if (extensionManagementUtil_1.areSameExtensions(pager.firstPage[j].identifier, { id: preferredResult })) {
                        if (positionToUpdate !== j) {
                            const preferredExtension = pager.firstPage.splice(j, 1)[0];
                            pager.firstPage.splice(positionToUpdate, 0, preferredExtension);
                            positionToUpdate++;
                        }
                        break;
                    }
                }
            }
            return this.getPagedModel(pager);
        }
        getSearchExperiments() {
            if (!this._searchExperiments) {
                this._searchExperiments = this.experimentService.getExperimentsByType(experimentService_1.ExperimentActionType.ExtensionSearchResults);
            }
            return this._searchExperiments;
        }
        sortExtensions(extensions, options) {
            switch (options.sortBy) {
                case 4 /* InstallCount */:
                    extensions = extensions.sort((e1, e2) => typeof e2.installCount === 'number' && typeof e1.installCount === 'number' ? e2.installCount - e1.installCount : NaN);
                    break;
                case 6 /* AverageRating */:
                case 12 /* WeightedRating */:
                    extensions = extensions.sort((e1, e2) => typeof e2.rating === 'number' && typeof e1.rating === 'number' ? e2.rating - e1.rating : NaN);
                    break;
                default:
                    extensions = extensions.sort((e1, e2) => e1.displayName.localeCompare(e2.displayName));
                    break;
            }
            if (options.sortOrder === 2 /* Descending */) {
                extensions = extensions.reverse();
            }
            return extensions;
        }
        // Get All types of recommendations, trimmed to show a max of 8 at any given time
        getAllRecommendationsModel(query, options, token) {
            const value = query.value.replace(/@recommended:all/g, '').replace(/@recommended/g, '').trim().toLowerCase();
            return this.extensionsWorkbenchService.queryLocal(this.server)
                .then(result => result.filter(e => e.type === 1 /* User */))
                .then(local => {
                const fileBasedRecommendations = this.tipsService.getFileBasedRecommendations();
                const configBasedRecommendationsPromise = this.tipsService.getConfigBasedRecommendations();
                const othersPromise = this.tipsService.getOtherRecommendations();
                const workspacePromise = this.tipsService.getWorkspaceRecommendations();
                return Promise.all([othersPromise, workspacePromise, configBasedRecommendationsPromise])
                    .then(([others, workspaceRecommendations, configBasedRecommendations]) => {
                    const names = this.getTrimmedRecommendations(local, value, fileBasedRecommendations, configBasedRecommendations, others, workspaceRecommendations);
                    const recommendationsWithReason = this.tipsService.getAllRecommendationsWithReason();
                    /* __GDPR__
                        "extensionAllRecommendations:open" : {
                            "count" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                            "recommendations": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                        }
                    */
                    this.telemetryService.publicLog('extensionAllRecommendations:open', {
                        count: names.length,
                        recommendations: names.map(id => {
                            return {
                                id,
                                recommendationReason: recommendationsWithReason[id.toLowerCase()].reasonId
                            };
                        })
                    });
                    if (!names.length) {
                        return Promise.resolve(new paging_1.PagedModel([]));
                    }
                    options.source = 'recommendations-all';
                    return this.extensionsWorkbenchService.queryGallery(objects_1.assign(options, { names, pageSize: names.length }), token)
                        .then(pager => {
                        this.sortFirstPage(pager, names);
                        return this.getPagedModel(pager || []);
                    });
                });
            });
        }
        async getCuratedModel(query, options, token) {
            const value = query.value.replace(/curated:/g, '').trim();
            const names = await this.experimentService.getCuratedExtensionsList(value);
            if (Array.isArray(names) && names.length) {
                options.source = `curated:${value}`;
                const pager = await this.extensionsWorkbenchService.queryGallery(objects_1.assign(options, { names, pageSize: names.length }), token);
                this.sortFirstPage(pager, names);
                return this.getPagedModel(pager || []);
            }
            return new paging_1.PagedModel([]);
        }
        // Get All types of recommendations other than Workspace recommendations, trimmed to show a max of 8 at any given time
        getRecommendationsModel(query, options, token) {
            const value = query.value.replace(/@recommended/g, '').trim().toLowerCase();
            return this.extensionsWorkbenchService.queryLocal(this.server)
                .then(result => result.filter(e => e.type === 1 /* User */))
                .then(local => {
                let fileBasedRecommendations = this.tipsService.getFileBasedRecommendations();
                const configBasedRecommendationsPromise = this.tipsService.getConfigBasedRecommendations();
                const othersPromise = this.tipsService.getOtherRecommendations();
                const workspacePromise = this.tipsService.getWorkspaceRecommendations();
                return Promise.all([othersPromise, workspacePromise, configBasedRecommendationsPromise])
                    .then(([others, workspaceRecommendations, configBasedRecommendations]) => {
                    configBasedRecommendations = configBasedRecommendations.filter(x => workspaceRecommendations.every(({ extensionId }) => x.extensionId !== extensionId));
                    fileBasedRecommendations = fileBasedRecommendations.filter(x => workspaceRecommendations.every(({ extensionId }) => x.extensionId !== extensionId));
                    others = others.filter(x => workspaceRecommendations.every(({ extensionId }) => x.extensionId !== extensionId));
                    const names = this.getTrimmedRecommendations(local, value, fileBasedRecommendations, configBasedRecommendations, others, []);
                    const recommendationsWithReason = this.tipsService.getAllRecommendationsWithReason();
                    /* __GDPR__
                        "extensionRecommendations:open" : {
                            "count" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                            "recommendations": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                        }
                    */
                    this.telemetryService.publicLog('extensionRecommendations:open', {
                        count: names.length,
                        recommendations: names.map(id => {
                            return {
                                id,
                                recommendationReason: recommendationsWithReason[id.toLowerCase()].reasonId
                            };
                        })
                    });
                    if (!names.length) {
                        return Promise.resolve(new paging_1.PagedModel([]));
                    }
                    options.source = 'recommendations';
                    return this.extensionsWorkbenchService.queryGallery(objects_1.assign(options, { names, pageSize: names.length }), token)
                        .then(pager => {
                        this.sortFirstPage(pager, names);
                        return this.getPagedModel(pager || []);
                    });
                });
            });
        }
        // Given all recommendations, trims and returns recommendations in the relevant order after filtering out installed extensions
        getTrimmedRecommendations(installedExtensions, value, fileBasedRecommendations, configBasedRecommendations, otherRecommendations, workspaceRecommendations) {
            const totalCount = 10;
            workspaceRecommendations = workspaceRecommendations
                .filter(recommendation => {
                return !this.isRecommendationInstalled(recommendation, installedExtensions)
                    && recommendation.extensionId.toLowerCase().indexOf(value) > -1;
            });
            configBasedRecommendations = configBasedRecommendations
                .filter(recommendation => {
                return !this.isRecommendationInstalled(recommendation, installedExtensions)
                    && workspaceRecommendations.every(workspaceRecommendation => workspaceRecommendation.extensionId !== recommendation.extensionId)
                    && recommendation.extensionId.toLowerCase().indexOf(value) > -1;
            });
            fileBasedRecommendations = fileBasedRecommendations.filter(recommendation => {
                return !this.isRecommendationInstalled(recommendation, installedExtensions)
                    && workspaceRecommendations.every(workspaceRecommendation => workspaceRecommendation.extensionId !== recommendation.extensionId)
                    && configBasedRecommendations.every(configBasedRecommendation => configBasedRecommendation.extensionId !== recommendation.extensionId)
                    && recommendation.extensionId.toLowerCase().indexOf(value) > -1;
            });
            otherRecommendations = otherRecommendations.filter(recommendation => {
                return !this.isRecommendationInstalled(recommendation, installedExtensions)
                    && fileBasedRecommendations.every(fileBasedRecommendation => fileBasedRecommendation.extensionId !== recommendation.extensionId)
                    && workspaceRecommendations.every(workspaceRecommendation => workspaceRecommendation.extensionId !== recommendation.extensionId)
                    && configBasedRecommendations.every(configBasedRecommendation => configBasedRecommendation.extensionId !== recommendation.extensionId)
                    && recommendation.extensionId.toLowerCase().indexOf(value) > -1;
            });
            const otherCount = Math.min(2, otherRecommendations.length);
            const fileBasedCount = Math.min(fileBasedRecommendations.length, totalCount - workspaceRecommendations.length - configBasedRecommendations.length - otherCount);
            const recommendations = [...workspaceRecommendations, ...configBasedRecommendations];
            recommendations.push(...fileBasedRecommendations.splice(0, fileBasedCount));
            recommendations.push(...otherRecommendations.splice(0, otherCount));
            return arrays_1.distinct(recommendations.map(({ extensionId }) => extensionId));
        }
        isRecommendationInstalled(recommendation, installed) {
            return installed.some(i => extensionManagementUtil_1.areSameExtensions(i.identifier, { id: recommendation.extensionId }));
        }
        getWorkspaceRecommendationsModel(query, options, token) {
            const value = query.value.replace(/@recommended:workspace/g, '').trim().toLowerCase();
            return this.tipsService.getWorkspaceRecommendations()
                .then(recommendations => {
                const names = recommendations.map(({ extensionId }) => extensionId).filter(name => name.toLowerCase().indexOf(value) > -1);
                /* __GDPR__
                    "extensionWorkspaceRecommendations:open" : {
                        "count" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
                    }
                */
                this.telemetryService.publicLog('extensionWorkspaceRecommendations:open', { count: names.length });
                if (!names.length) {
                    return Promise.resolve(new paging_1.PagedModel([]));
                }
                options.source = 'recommendations-workspace';
                return this.extensionsWorkbenchService.queryGallery(objects_1.assign(options, { names, pageSize: names.length }), token)
                    .then(pager => this.getPagedModel(pager || []));
            });
        }
        getKeymapRecommendationsModel(query, options, token) {
            const value = query.value.replace(/@recommended:keymaps/g, '').trim().toLowerCase();
            const names = this.tipsService.getKeymapRecommendations().map(({ extensionId }) => extensionId)
                .filter(extensionId => extensionId.toLowerCase().indexOf(value) > -1);
            if (!names.length) {
                return Promise.resolve(new paging_1.PagedModel([]));
            }
            options.source = 'recommendations-keymaps';
            return this.extensionsWorkbenchService.queryGallery(objects_1.assign(options, { names, pageSize: names.length }), token)
                .then(result => this.getPagedModel(result));
        }
        // Sorts the firstPage of the pager in the same order as given array of extension ids
        sortFirstPage(pager, ids) {
            ids = ids.map(x => x.toLowerCase());
            pager.firstPage.sort((a, b) => {
                return ids.indexOf(a.identifier.id.toLowerCase()) < ids.indexOf(b.identifier.id.toLowerCase()) ? -1 : 1;
            });
        }
        setModel(model, error) {
            if (this.list) {
                this.list.model = new paging_1.DelayedPagedModel(model);
                this.list.scrollTop = 0;
                const count = this.count();
                if (this.bodyTemplate && this.badge) {
                    dom_1.toggleClass(this.bodyTemplate.extensionsList, 'hidden', count === 0);
                    dom_1.toggleClass(this.bodyTemplate.messageContainer, 'hidden', count > 0);
                    this.badge.setCount(count);
                    if (count === 0 && this.isBodyVisible()) {
                        if (error) {
                            if (error instanceof ExtensionListViewWarning) {
                                this.bodyTemplate.messageSeverityIcon.className = `codicon ${severityIcon_1.SeverityIcon.className(notification_1.Severity.Warning)}`;
                                this.bodyTemplate.messageBox.textContent = errors_1.getErrorMessage(error);
                            }
                            else {
                                this.bodyTemplate.messageSeverityIcon.className = `codicon ${severityIcon_1.SeverityIcon.className(notification_1.Severity.Error)}`;
                                this.bodyTemplate.messageBox.textContent = nls_1.localize('error', "Error while loading extensions. {0}", errors_1.getErrorMessage(error));
                            }
                        }
                        else {
                            this.bodyTemplate.messageSeverityIcon.className = '';
                            this.bodyTemplate.messageBox.textContent = nls_1.localize('no extensions found', "No extensions found.");
                        }
                        aria_1.alert(this.bodyTemplate.messageBox.textContent);
                    }
                }
            }
        }
        openExtension(extension, options) {
            extension = this.extensionsWorkbenchService.local.filter(e => extensionManagementUtil_1.areSameExtensions(e.identifier, extension.identifier))[0] || extension;
            this.extensionsWorkbenchService.open(extension, options).then(undefined, err => this.onError(err));
        }
        onError(err) {
            if (errors_1.isPromiseCanceledError(err)) {
                return;
            }
            const message = err && err.message || '';
            if (/ECONNREFUSED/.test(message)) {
                const error = errorsWithActions_1.createErrorWithActions(nls_1.localize('suggestProxyError', "Marketplace returned 'ECONNREFUSED'. Please check the 'http.proxy' setting."), {
                    actions: [
                        new actions_1.Action('open user settings', nls_1.localize('open user settings', "Open User Settings"), undefined, true, () => this.preferencesService.openGlobalSettings())
                    ]
                });
                this.notificationService.error(error);
                return;
            }
            this.notificationService.error(err);
        }
        getPagedModel(arg) {
            if (Array.isArray(arg)) {
                return new paging_1.PagedModel(arg);
            }
            const pager = {
                total: arg.total,
                pageSize: arg.pageSize,
                firstPage: arg.firstPage,
                getPage: (pageIndex, cancellationToken) => arg.getPage(pageIndex, cancellationToken)
            };
            return new paging_1.PagedModel(pager);
        }
        dispose() {
            super.dispose();
            if (this.queryRequest) {
                this.queryRequest.request.cancel();
                this.queryRequest = null;
            }
            this.list = null;
        }
        static isBuiltInExtensionsQuery(query) {
            return /^\s*@builtin\s*$/i.test(query);
        }
        static isLocalExtensionsQuery(query) {
            return this.isInstalledExtensionsQuery(query)
                || this.isOutdatedExtensionsQuery(query)
                || this.isEnabledExtensionsQuery(query)
                || this.isDisabledExtensionsQuery(query)
                || this.isBuiltInExtensionsQuery(query);
        }
        static isInstalledExtensionsQuery(query) {
            return /@installed/i.test(query);
        }
        static isOutdatedExtensionsQuery(query) {
            return /@outdated/i.test(query);
        }
        static isEnabledExtensionsQuery(query) {
            return /@enabled/i.test(query);
        }
        static isDisabledExtensionsQuery(query) {
            return /@disabled/i.test(query);
        }
        static isRecommendedExtensionsQuery(query) {
            return /^@recommended$/i.test(query.trim());
        }
        static isSearchRecommendedExtensionsQuery(query) {
            return /@recommended/i.test(query) && !ExtensionsListView.isRecommendedExtensionsQuery(query);
        }
        static isWorkspaceRecommendedExtensionsQuery(query) {
            return /@recommended:workspace/i.test(query);
        }
        static isKeymapsRecommendedExtensionsQuery(query) {
            return /@recommended:keymaps/i.test(query);
        }
        focus() {
            super.focus();
            if (!this.list) {
                return;
            }
            if (!(this.list.getFocus().length || this.list.getSelection().length)) {
                this.list.focusNext();
            }
            this.list.domFocus();
        }
    };
    ExtensionsListView = __decorate([
        __param(1, notification_1.INotificationService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, themeService_1.IThemeService),
        __param(6, extensions_2.IExtensionService),
        __param(7, extensions_1.IExtensionsWorkbenchService),
        __param(8, extensionManagement_1.IExtensionRecommendationsService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, workspace_1.IWorkspaceContextService),
        __param(12, experimentService_1.IExperimentService),
        __param(13, extensionManagement_1.IExtensionManagementServerService),
        __param(14, productService_1.IProductService),
        __param(15, contextkey_1.IContextKeyService),
        __param(16, views_1.IViewDescriptorService),
        __param(17, actions_2.IMenuService),
        __param(18, opener_1.IOpenerService),
        __param(19, preferences_1.IPreferencesService)
    ], ExtensionsListView);
    exports.ExtensionsListView = ExtensionsListView;
    let ServerExtensionsView = class ServerExtensionsView extends ExtensionsListView {
        constructor(server, onDidChangeTitle, options, notificationService, keybindingService, contextMenuService, viewDescriptorService, instantiationService, extensionService, tipsService, telemetryService, configurationService, contextService, experimentService, extensionsWorkbenchService, extensionManagementServerService, productService, contextKeyService, menuService, openerService, themeService, preferencesService) {
            options.server = server;
            super(options, notificationService, keybindingService, contextMenuService, instantiationService, themeService, extensionService, extensionsWorkbenchService, tipsService, telemetryService, configurationService, contextService, experimentService, extensionManagementServerService, productService, contextKeyService, viewDescriptorService, menuService, openerService, preferencesService);
            this._register(onDidChangeTitle(title => this.updateTitle(title)));
        }
        async show(query) {
            query = query ? query : '@installed';
            if (!ExtensionsListView.isLocalExtensionsQuery(query) && !ExtensionsListView.isBuiltInExtensionsQuery(query)) {
                query = query += ' @installed';
            }
            return super.show(query.trim());
        }
        getActions() {
            if (this.extensionManagementServerService.remoteExtensionManagementServer && this.extensionManagementServerService.localExtensionManagementServer === this.server) {
                const installLocalExtensionsInRemoteAction = this._register(this.instantiationService.createInstance(extensionsActions_1.InstallLocalExtensionsInRemoteAction));
                installLocalExtensionsInRemoteAction.class = 'codicon codicon-cloud-download';
                return [installLocalExtensionsInRemoteAction];
            }
            return [];
        }
    };
    ServerExtensionsView = __decorate([
        __param(3, notification_1.INotificationService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, views_1.IViewDescriptorService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, extensions_2.IExtensionService),
        __param(9, extensionManagement_1.IExtensionRecommendationsService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, workspace_1.IWorkspaceContextService),
        __param(13, experimentService_1.IExperimentService),
        __param(14, extensions_1.IExtensionsWorkbenchService),
        __param(15, extensionManagement_1.IExtensionManagementServerService),
        __param(16, productService_1.IProductService),
        __param(17, contextkey_1.IContextKeyService),
        __param(18, actions_2.IMenuService),
        __param(19, opener_1.IOpenerService),
        __param(20, themeService_1.IThemeService),
        __param(21, preferences_1.IPreferencesService)
    ], ServerExtensionsView);
    exports.ServerExtensionsView = ServerExtensionsView;
    class EnabledExtensionsView extends ExtensionsListView {
        async show(query) {
            query = query || '@enabled';
            return ExtensionsListView.isEnabledExtensionsQuery(query) ? super.show(query) : this.showEmptyModel();
        }
    }
    exports.EnabledExtensionsView = EnabledExtensionsView;
    class DisabledExtensionsView extends ExtensionsListView {
        async show(query) {
            query = query || '@disabled';
            return ExtensionsListView.isDisabledExtensionsQuery(query) ? super.show(query) : this.showEmptyModel();
        }
    }
    exports.DisabledExtensionsView = DisabledExtensionsView;
    class BuiltInExtensionsView extends ExtensionsListView {
        async show(query) {
            return (query && query.trim() !== '@builtin') ? this.showEmptyModel() : super.show('@builtin:features');
        }
    }
    exports.BuiltInExtensionsView = BuiltInExtensionsView;
    class BuiltInThemesExtensionsView extends ExtensionsListView {
        async show(query) {
            return (query && query.trim() !== '@builtin') ? this.showEmptyModel() : super.show('@builtin:themes');
        }
    }
    exports.BuiltInThemesExtensionsView = BuiltInThemesExtensionsView;
    class BuiltInBasicsExtensionsView extends ExtensionsListView {
        async show(query) {
            return (query && query.trim() !== '@builtin') ? this.showEmptyModel() : super.show('@builtin:basics');
        }
    }
    exports.BuiltInBasicsExtensionsView = BuiltInBasicsExtensionsView;
    class DefaultRecommendedExtensionsView extends ExtensionsListView {
        constructor() {
            super(...arguments);
            this.recommendedExtensionsQuery = '@recommended:all';
        }
        renderBody(container) {
            super.renderBody(container);
            this._register(this.tipsService.onRecommendationChange(() => {
                this.show('');
            }));
        }
        async show(query) {
            if (query && query.trim() !== this.recommendedExtensionsQuery) {
                return this.showEmptyModel();
            }
            const model = await super.show(this.recommendedExtensionsQuery);
            if (!this.extensionsWorkbenchService.local.some(e => e.type === 1 /* User */)) {
                // This is part of popular extensions view. Collapse if no installed extensions.
                this.setExpanded(model.length > 0);
            }
            return model;
        }
    }
    exports.DefaultRecommendedExtensionsView = DefaultRecommendedExtensionsView;
    class RecommendedExtensionsView extends ExtensionsListView {
        constructor() {
            super(...arguments);
            this.recommendedExtensionsQuery = '@recommended';
        }
        renderBody(container) {
            super.renderBody(container);
            this._register(this.tipsService.onRecommendationChange(() => {
                this.show('');
            }));
        }
        async show(query) {
            return (query && query.trim() !== this.recommendedExtensionsQuery) ? this.showEmptyModel() : super.show(this.recommendedExtensionsQuery);
        }
    }
    exports.RecommendedExtensionsView = RecommendedExtensionsView;
    class WorkspaceRecommendedExtensionsView extends ExtensionsListView {
        constructor() {
            super(...arguments);
            this.recommendedExtensionsQuery = '@recommended:workspace';
        }
        renderBody(container) {
            super.renderBody(container);
            this._register(this.tipsService.onRecommendationChange(() => this.update()));
            this._register(this.extensionsWorkbenchService.onChange(() => this.setRecommendationsToInstall()));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.update()));
        }
        getActions() {
            if (!this.installAllAction) {
                this.installAllAction = this._register(this.instantiationService.createInstance(extensionsActions_1.InstallWorkspaceRecommendedExtensionsAction, extensionsActions_1.InstallWorkspaceRecommendedExtensionsAction.ID, extensionsActions_1.InstallWorkspaceRecommendedExtensionsAction.LABEL, []));
                this.installAllAction.class = 'codicon codicon-cloud-download';
            }
            const configureWorkspaceFolderAction = this._register(this.instantiationService.createInstance(extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction, extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction.ID, extensionsActions_1.ConfigureWorkspaceFolderRecommendedExtensionsAction.LABEL));
            configureWorkspaceFolderAction.class = 'codicon codicon-pencil';
            return [this.installAllAction, configureWorkspaceFolderAction];
        }
        async show(query) {
            let shouldShowEmptyView = query && query.trim() !== '@recommended' && query.trim() !== '@recommended:workspace';
            let model = await (shouldShowEmptyView ? this.showEmptyModel() : super.show(this.recommendedExtensionsQuery));
            this.setExpanded(model.length > 0);
            return model;
        }
        update() {
            this.show(this.recommendedExtensionsQuery);
            this.setRecommendationsToInstall();
        }
        async setRecommendationsToInstall() {
            const recommendations = await this.getRecommendationsToInstall();
            if (this.installAllAction) {
                this.installAllAction.recommendations = recommendations.map(({ extensionId }) => extensionId);
            }
        }
        getRecommendationsToInstall() {
            return this.tipsService.getWorkspaceRecommendations()
                .then(recommendations => recommendations.filter(({ extensionId }) => {
                const extension = this.extensionsWorkbenchService.local.filter(i => extensionManagementUtil_1.areSameExtensions({ id: extensionId }, i.identifier))[0];
                if (!extension
                    || !extension.local
                    || extension.state !== 1 /* Installed */
                    || extension.enablementState === 0 /* DisabledByExtensionKind */) {
                    return true;
                }
                return false;
            }));
        }
    }
    exports.WorkspaceRecommendedExtensionsView = WorkspaceRecommendedExtensionsView;
});
//# __sourceMappingURL=extensionsViews.js.map