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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/arrays", "vs/base/common/platform", "vs/base/common/event", "vs/base/common/cache", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/browser/event", "vs/base/browser/dom", "vs/workbench/browser/parts/editor/baseEditor", "vs/workbench/services/viewlet/browser/viewlet", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsWidgets", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/keybinding/common/keybinding", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/platform/opener/common/opener", "vs/platform/theme/common/themeService", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/editor/common/editorService", "vs/base/common/color", "vs/base/common/objects", "vs/platform/notification/common/notification", "vs/workbench/contrib/extensions/browser/extensionsViewer", "vs/workbench/contrib/update/common/update", "vs/base/common/keybindingParser", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/types", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/contrib/webview/browser/webview", "vs/base/browser/keyboardEvent", "vs/base/common/uuid", "vs/base/common/process", "vs/base/common/uri", "vs/base/common/network", "vs/workbench/contrib/markdown/common/markdownDocumentRenderer", "vs/editor/common/services/modeService", "vs/editor/common/modes", "vs/editor/common/modes/supports/tokenization", "vs/platform/theme/common/colorRegistry", "vs/platform/actions/common/actions", "vs/css!./media/extensionEditor"], function (require, exports, nls_1, async_1, arrays, platform_1, event_1, cache_1, actions_1, errors_1, lifecycle_1, event_2, dom_1, baseEditor_1, viewlet_1, telemetry_1, instantiation_1, extensionManagement_1, extensions_1, extensionsWidgets_1, actionbar_1, extensionsActions_1, keybinding_1, scrollableElement_1, opener_1, themeService_1, keybindingLabel_1, contextkey_1, editorService_1, color_1, objects_1, notification_1, extensionsViewer_1, update_1, keybindingParser_1, storage_1, extensions_2, configurationRegistry_1, types_1, workbenchThemeService_1, webview_1, keyboardEvent_1, uuid_1, process_1, uri_1, network_1, markdownDocumentRenderer_1, modeService_1, modes_1, tokenization_1, colorRegistry_1, actions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionEditor = void 0;
    function removeEmbeddedSVGs(documentContent) {
        const newDocument = new DOMParser().parseFromString(documentContent, 'text/html');
        // remove all inline svgs
        const allSVGs = newDocument.documentElement.querySelectorAll('svg');
        if (allSVGs) {
            for (let i = 0; i < allSVGs.length; i++) {
                const svg = allSVGs[i];
                if (svg.parentNode) {
                    svg.parentNode.removeChild(allSVGs[i]);
                }
            }
        }
        return newDocument.documentElement.outerHTML;
    }
    class NavBar extends lifecycle_1.Disposable {
        constructor(container) {
            super();
            this._onChange = this._register(new event_1.Emitter());
            this._currentId = null;
            const element = dom_1.append(container, dom_1.$('.navbar'));
            this.actions = [];
            this.actionbar = this._register(new actionbar_1.ActionBar(element, { animated: false }));
        }
        get onChange() { return this._onChange.event; }
        get currentId() { return this._currentId; }
        push(id, label, tooltip) {
            const action = new actions_1.Action(id, label, undefined, true, () => this._update(id, true));
            action.tooltip = tooltip;
            this.actions.push(action);
            this.actionbar.push(action);
            if (this.actions.length === 1) {
                this._update(id);
            }
        }
        clear() {
            this.actions = lifecycle_1.dispose(this.actions);
            this.actionbar.clear();
        }
        update() {
            this._update(this._currentId);
        }
        _update(id = this._currentId, focus) {
            this._currentId = id;
            this._onChange.fire({ id, focus: !!focus });
            this.actions.forEach(a => a.checked = a.id === id);
            return Promise.resolve(undefined);
        }
    }
    const NavbarSection = {
        Readme: 'readme',
        Contributions: 'contributions',
        Changelog: 'changelog',
        Dependencies: 'dependencies',
    };
    let ExtensionEditor = class ExtensionEditor extends baseEditor_1.BaseEditor {
        constructor(telemetryService, instantiationService, viewletService, extensionsWorkbenchService, themeService, keybindingService, notificationService, openerService, extensionRecommendationsService, storageService, extensionService, workbenchThemeService, webviewService, modeService) {
            super(ExtensionEditor.ID, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.viewletService = viewletService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.themeService = themeService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.openerService = openerService;
            this.extensionRecommendationsService = extensionRecommendationsService;
            this.extensionService = extensionService;
            this.workbenchThemeService = workbenchThemeService;
            this.webviewService = webviewService;
            this.modeService = modeService;
            this.layoutParticipants = [];
            this.contentDisposables = this._register(new lifecycle_1.DisposableStore());
            this.transientDisposables = this._register(new lifecycle_1.DisposableStore());
            this.activeElement = null;
            this.editorLoadComplete = false;
            this.extensionReadme = null;
            this.extensionChangelog = null;
            this.extensionManifest = null;
        }
        createEditor(parent) {
            const root = dom_1.append(parent, dom_1.$('.extension-editor'));
            root.tabIndex = 0; // this is required for the focus tracker on the editor
            root.style.outline = 'none';
            root.setAttribute('role', 'document');
            const header = dom_1.append(root, dom_1.$('.header'));
            const iconContainer = dom_1.append(header, dom_1.$('.icon-container'));
            const icon = dom_1.append(iconContainer, dom_1.$('img.icon', { draggable: false }));
            const details = dom_1.append(header, dom_1.$('.details'));
            const title = dom_1.append(details, dom_1.$('.title'));
            const name = dom_1.append(title, dom_1.$('span.name.clickable', { title: nls_1.localize('name', "Extension name"), role: 'heading', tabIndex: 0 }));
            const identifier = dom_1.append(title, dom_1.$('span.identifier', { title: nls_1.localize('extension id', "Extension identifier") }));
            const preview = dom_1.append(title, dom_1.$('span.preview', { title: nls_1.localize('preview', "Preview") }));
            preview.textContent = nls_1.localize('preview', "Preview");
            const builtin = dom_1.append(title, dom_1.$('span.builtin'));
            builtin.textContent = nls_1.localize('builtin', "Built-in");
            const subtitle = dom_1.append(details, dom_1.$('.subtitle'));
            const publisher = dom_1.append(subtitle, dom_1.$('span.publisher.clickable', { title: nls_1.localize('publisher', "Publisher name"), tabIndex: 0 }));
            const installCount = dom_1.append(subtitle, dom_1.$('span.install', { title: nls_1.localize('install count', "Install count"), tabIndex: 0 }));
            const rating = dom_1.append(subtitle, dom_1.$('span.rating.clickable', { title: nls_1.localize('rating', "Rating"), tabIndex: 0 }));
            const repository = dom_1.append(subtitle, dom_1.$('span.repository.clickable'));
            repository.textContent = nls_1.localize('repository', 'Repository');
            repository.style.display = 'none';
            repository.tabIndex = 0;
            const license = dom_1.append(subtitle, dom_1.$('span.license.clickable'));
            license.textContent = nls_1.localize('license', 'License');
            license.style.display = 'none';
            license.tabIndex = 0;
            const version = dom_1.append(subtitle, dom_1.$('span.version'));
            version.textContent = nls_1.localize('version', 'Version');
            const description = dom_1.append(details, dom_1.$('.description'));
            const extensionActions = dom_1.append(details, dom_1.$('.actions'));
            const extensionActionBar = this._register(new actionbar_1.ActionBar(extensionActions, {
                animated: false,
                actionViewItemProvider: (action) => {
                    if (action instanceof extensionsActions_1.ExtensionEditorDropDownAction) {
                        return action.createActionViewItem();
                    }
                    return undefined;
                }
            }));
            const subtextContainer = dom_1.append(details, dom_1.$('.subtext-container'));
            const subtext = dom_1.append(subtextContainer, dom_1.$('.subtext'));
            const ignoreActionbar = this._register(new actionbar_1.ActionBar(subtextContainer, { animated: false }));
            this._register(event_1.Event.chain(extensionActionBar.onDidRun)
                .map(({ error }) => error)
                .filter(error => !!error)
                .on(this.onError, this));
            this._register(event_1.Event.chain(ignoreActionbar.onDidRun)
                .map(({ error }) => error)
                .filter(error => !!error)
                .on(this.onError, this));
            const body = dom_1.append(root, dom_1.$('.body'));
            const navbar = new NavBar(body);
            const content = dom_1.append(body, dom_1.$('.content'));
            this.template = {
                builtin,
                content,
                description,
                extensionActionBar,
                header,
                icon,
                iconContainer,
                identifier,
                version,
                ignoreActionbar,
                installCount,
                license,
                name,
                navbar,
                preview,
                publisher,
                rating,
                repository,
                subtext,
                subtextContainer
            };
        }
        onClick(element, callback) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(dom_1.addDisposableListener(element, dom_1.EventType.CLICK, dom_1.finalHandler(callback)));
            disposables.add(dom_1.addDisposableListener(element, dom_1.EventType.KEY_UP, e => {
                const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (keyboardEvent.equals(10 /* Space */) || keyboardEvent.equals(3 /* Enter */)) {
                    e.preventDefault();
                    e.stopPropagation();
                    callback();
                }
            }));
            return disposables;
        }
        async setInput(input, options, token) {
            await super.setInput(input, options, token);
            if (this.template) {
                await this.updateTemplate(input, this.template, !!(options === null || options === void 0 ? void 0 : options.preserveFocus));
            }
        }
        async updateTemplate(input, template, preserveFocus) {
            const runningExtensions = await this.extensionService.getExtensions();
            this.activeElement = null;
            this.editorLoadComplete = false;
            const extension = input.extension;
            this.transientDisposables.clear();
            this.extensionReadme = new cache_1.Cache(() => async_1.createCancelablePromise(token => extension.getReadme(token)));
            this.extensionChangelog = new cache_1.Cache(() => async_1.createCancelablePromise(token => extension.getChangelog(token)));
            this.extensionManifest = new cache_1.Cache(() => async_1.createCancelablePromise(token => extension.getManifest(token)));
            const remoteBadge = this.instantiationService.createInstance(extensionsWidgets_1.RemoteBadgeWidget, template.iconContainer, true);
            const onError = event_1.Event.once(event_2.domEvent(template.icon, 'error'));
            onError(() => template.icon.src = extension.iconUrlFallback, null, this.transientDisposables);
            template.icon.src = extension.iconUrl;
            template.name.textContent = extension.displayName;
            template.identifier.textContent = extension.identifier.id;
            template.preview.style.display = extension.preview ? 'inherit' : 'none';
            template.builtin.style.display = extension.type === 0 /* System */ ? 'inherit' : 'none';
            template.publisher.textContent = extension.publisherDisplayName;
            template.version.textContent = `v${extension.version}`;
            template.description.textContent = extension.description;
            const extRecommendations = this.extensionRecommendationsService.getAllRecommendationsWithReason();
            let recommendationsData = {};
            if (extRecommendations[extension.identifier.id.toLowerCase()]) {
                recommendationsData = { recommendationReason: extRecommendations[extension.identifier.id.toLowerCase()].reasonId };
            }
            /* __GDPR__
            "extensionGallery:openExtension" : {
                "recommendationReason": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                "${include}": [
                    "${GalleryExtensionTelemetryData}"
                ]
            }
            */
            this.telemetryService.publicLog('extensionGallery:openExtension', objects_1.assign(extension.telemetryData, recommendationsData));
            dom_1.toggleClass(template.name, 'clickable', !!extension.url);
            dom_1.toggleClass(template.publisher, 'clickable', !!extension.url);
            dom_1.toggleClass(template.rating, 'clickable', !!extension.url);
            if (extension.url) {
                this.transientDisposables.add(this.onClick(template.name, () => this.openerService.open(uri_1.URI.parse(extension.url))));
                this.transientDisposables.add(this.onClick(template.rating, () => this.openerService.open(uri_1.URI.parse(`${extension.url}#review-details`))));
                this.transientDisposables.add(this.onClick(template.publisher, () => {
                    this.viewletService.openViewlet(extensions_1.VIEWLET_ID, true)
                        .then(viewlet => viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer())
                        .then(viewlet => viewlet.search(`publisher:"${extension.publisherDisplayName}"`));
                }));
                if (extension.licenseUrl) {
                    this.transientDisposables.add(this.onClick(template.license, () => this.openerService.open(uri_1.URI.parse(extension.licenseUrl))));
                    template.license.style.display = 'initial';
                }
                else {
                    template.license.style.display = 'none';
                }
            }
            else {
                template.license.style.display = 'none';
            }
            if (extension.repository) {
                this.transientDisposables.add(this.onClick(template.repository, () => this.openerService.open(uri_1.URI.parse(extension.repository))));
                template.repository.style.display = 'initial';
            }
            else {
                template.repository.style.display = 'none';
            }
            const widgets = [
                remoteBadge,
                this.instantiationService.createInstance(extensionsWidgets_1.InstallCountWidget, template.installCount, false),
                this.instantiationService.createInstance(extensionsWidgets_1.RatingsWidget, template.rating, false)
            ];
            const reloadAction = this.instantiationService.createInstance(extensionsActions_1.ReloadAction);
            const combinedInstallAction = this.instantiationService.createInstance(extensionsActions_1.CombinedInstallAction);
            const systemDisabledWarningAction = this.instantiationService.createInstance(extensionsActions_1.SystemDisabledWarningAction);
            const actions = [
                reloadAction,
                this.instantiationService.createInstance(extensionsActions_1.SyncIgnoredIconAction),
                this.instantiationService.createInstance(extensionsActions_1.StatusLabelAction),
                this.instantiationService.createInstance(extensionsActions_1.UpdateAction),
                this.instantiationService.createInstance(extensionsActions_1.SetColorThemeAction, await this.workbenchThemeService.getColorThemes()),
                this.instantiationService.createInstance(extensionsActions_1.SetFileIconThemeAction, await this.workbenchThemeService.getFileIconThemes()),
                this.instantiationService.createInstance(extensionsActions_1.SetProductIconThemeAction, await this.workbenchThemeService.getProductIconThemes()),
                this.instantiationService.createInstance(extensionsActions_1.EnableDropDownAction),
                this.instantiationService.createInstance(extensionsActions_1.DisableDropDownAction, runningExtensions),
                this.instantiationService.createInstance(extensionsActions_1.RemoteInstallAction, false),
                this.instantiationService.createInstance(extensionsActions_1.LocalInstallAction),
                combinedInstallAction,
                systemDisabledWarningAction,
                this.instantiationService.createInstance(extensionsActions_1.ExtensionToolTipAction, systemDisabledWarningAction, reloadAction),
                this.instantiationService.createInstance(extensionsActions_1.MaliciousStatusLabelAction, true),
            ];
            const extensionContainers = this.instantiationService.createInstance(extensions_1.ExtensionContainers, [...actions, ...widgets]);
            extensionContainers.extension = extension;
            template.extensionActionBar.clear();
            template.extensionActionBar.push(actions, { icon: true, label: true });
            for (const disposable of [...actions, ...widgets, extensionContainers]) {
                this.transientDisposables.add(disposable);
            }
            this.setSubText(extension, reloadAction, template);
            template.content.innerHTML = ''; // Clear content before setting navbar actions.
            template.navbar.clear();
            if (extension.hasReadme()) {
                template.navbar.push(NavbarSection.Readme, nls_1.localize('details', "Details"), nls_1.localize('detailstooltip', "Extension details, rendered from the extension's 'README.md' file"));
            }
            const manifest = await this.extensionManifest.get().promise;
            if (manifest) {
                combinedInstallAction.manifest = manifest;
            }
            if (manifest && manifest.contributes) {
                template.navbar.push(NavbarSection.Contributions, nls_1.localize('contributions', "Feature Contributions"), nls_1.localize('contributionstooltip', "Lists contributions to VS Code by this extension"));
            }
            if (extension.hasChangelog()) {
                template.navbar.push(NavbarSection.Changelog, nls_1.localize('changelog', "Changelog"), nls_1.localize('changelogtooltip', "Extension update history, rendered from the extension's 'CHANGELOG.md' file"));
            }
            if (extension.dependencies.length) {
                template.navbar.push(NavbarSection.Dependencies, nls_1.localize('dependencies', "Dependencies"), nls_1.localize('dependenciestooltip', "Lists extensions this extension depends on"));
            }
            if (template.navbar.currentId) {
                this.onNavbarChange(extension, { id: template.navbar.currentId, focus: !preserveFocus }, template);
            }
            template.navbar.onChange(e => this.onNavbarChange(extension, e, template), this, this.transientDisposables);
            this.editorLoadComplete = true;
        }
        setSubText(extension, reloadAction, template) {
            dom_1.hide(template.subtextContainer);
            const ignoreAction = this.instantiationService.createInstance(extensionsActions_1.IgnoreExtensionRecommendationAction, extension);
            const undoIgnoreAction = this.instantiationService.createInstance(extensionsActions_1.UndoIgnoreExtensionRecommendationAction, extension);
            ignoreAction.enabled = false;
            undoIgnoreAction.enabled = false;
            template.ignoreActionbar.clear();
            template.ignoreActionbar.push([ignoreAction, undoIgnoreAction], { icon: true, label: true });
            this.transientDisposables.add(ignoreAction);
            this.transientDisposables.add(undoIgnoreAction);
            const extRecommendations = this.extensionRecommendationsService.getAllRecommendationsWithReason();
            if (extRecommendations[extension.identifier.id.toLowerCase()]) {
                ignoreAction.enabled = true;
                template.subtext.textContent = extRecommendations[extension.identifier.id.toLowerCase()].reasonText;
                dom_1.show(template.subtextContainer);
            }
            else if (this.extensionRecommendationsService.getIgnoredRecommendations().indexOf(extension.identifier.id.toLowerCase()) !== -1) {
                undoIgnoreAction.enabled = true;
                template.subtext.textContent = nls_1.localize('recommendationHasBeenIgnored', "You have chosen not to receive recommendations for this extension.");
                dom_1.show(template.subtextContainer);
            }
            else {
                template.subtext.textContent = '';
            }
            this.extensionRecommendationsService.onRecommendationChange(change => {
                if (change.extensionId.toLowerCase() === extension.identifier.id.toLowerCase()) {
                    if (change.isRecommended) {
                        undoIgnoreAction.enabled = false;
                        const extRecommendations = this.extensionRecommendationsService.getAllRecommendationsWithReason();
                        if (extRecommendations[extension.identifier.id.toLowerCase()]) {
                            ignoreAction.enabled = true;
                            template.subtext.textContent = extRecommendations[extension.identifier.id.toLowerCase()].reasonText;
                        }
                    }
                    else {
                        undoIgnoreAction.enabled = true;
                        ignoreAction.enabled = false;
                        template.subtext.textContent = nls_1.localize('recommendationHasBeenIgnored', "You have chosen not to receive recommendations for this extension.");
                    }
                }
            });
            this.transientDisposables.add(reloadAction.onDidChange(e => {
                if (e.tooltip) {
                    template.subtext.textContent = reloadAction.tooltip;
                    dom_1.show(template.subtextContainer);
                    ignoreAction.enabled = false;
                    undoIgnoreAction.enabled = false;
                }
                if (e.enabled === true) {
                    dom_1.show(template.subtextContainer);
                }
                if (e.enabled === false) {
                    dom_1.hide(template.subtextContainer);
                }
                this.layout();
            }));
        }
        clearInput() {
            this.contentDisposables.clear();
            this.transientDisposables.clear();
            super.clearInput();
        }
        focus() {
            if (this.activeElement) {
                this.activeElement.focus();
            }
        }
        showFind() {
            if (this.activeElement && this.activeElement.showFind) {
                this.activeElement.showFind();
            }
        }
        runFindAction(previous) {
            if (this.activeElement && this.activeElement.runFindAction) {
                this.activeElement.runFindAction(previous);
            }
        }
        onNavbarChange(extension, { id, focus }, template) {
            if (this.editorLoadComplete) {
                /* __GDPR__
                    "extensionEditor:navbarChange" : {
                        "navItem": { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                        "${include}": [
                            "${GalleryExtensionTelemetryData}"
                        ]
                    }
                */
                this.telemetryService.publicLog('extensionEditor:navbarChange', objects_1.assign(extension.telemetryData, { navItem: id }));
            }
            this.contentDisposables.clear();
            template.content.innerHTML = '';
            this.activeElement = null;
            if (id) {
                this.open(id, extension, template)
                    .then(activeElement => {
                    this.activeElement = activeElement;
                    if (focus) {
                        this.focus();
                    }
                });
            }
        }
        open(id, extension, template) {
            switch (id) {
                case NavbarSection.Readme: return this.openReadme(template);
                case NavbarSection.Contributions: return this.openContributions(template);
                case NavbarSection.Changelog: return this.openChangelog(template);
                case NavbarSection.Dependencies: return this.openDependencies(extension, template);
            }
            return Promise.resolve(null);
        }
        async openMarkdown(cacheResult, noContentCopy, template) {
            try {
                const body = await this.renderMarkdown(cacheResult, template);
                const webview = this.contentDisposables.add(this.webviewService.createWebviewOverlay('extensionEditor', {
                    enableFindWidget: true,
                }, {}, undefined));
                webview.claim(this);
                webview.layoutWebviewOverElement(template.content);
                webview.html = body;
                this.contentDisposables.add(webview.onDidFocus(() => this.fireOnDidFocus()));
                const removeLayoutParticipant = arrays.insert(this.layoutParticipants, {
                    layout: () => {
                        webview.layoutWebviewOverElement(template.content);
                    }
                });
                this.contentDisposables.add(lifecycle_1.toDisposable(removeLayoutParticipant));
                let isDisposed = false;
                this.contentDisposables.add(lifecycle_1.toDisposable(() => { isDisposed = true; }));
                this.contentDisposables.add(this.themeService.onDidColorThemeChange(async () => {
                    // Render again since syntax highlighting of code blocks may have changed
                    const body = await this.renderMarkdown(cacheResult, template);
                    if (!isDisposed) { // Make sure we weren't disposed of in the meantime
                        webview.html = body;
                    }
                }));
                this.contentDisposables.add(webview.onDidClickLink(link => {
                    if (!link) {
                        return;
                    }
                    // Only allow links with specific schemes
                    if (opener_1.matchesScheme(link, network_1.Schemas.http) || opener_1.matchesScheme(link, network_1.Schemas.https) || opener_1.matchesScheme(link, network_1.Schemas.mailto)
                        || (opener_1.matchesScheme(link, network_1.Schemas.command) && uri_1.URI.parse(link).path === update_1.ShowCurrentReleaseNotesActionId)) {
                        this.openerService.open(link);
                    }
                }, null, this.contentDisposables));
                return webview;
            }
            catch (e) {
                const p = dom_1.append(template.content, dom_1.$('p.nocontent'));
                p.textContent = noContentCopy;
                return p;
            }
        }
        async renderMarkdown(cacheResult, template) {
            const contents = await this.loadContents(() => cacheResult, template);
            const content = await markdownDocumentRenderer_1.renderMarkdownDocument(contents, this.extensionService, this.modeService);
            const documentContent = await this.renderBody(content);
            return removeEmbeddedSVGs(documentContent);
        }
        async renderBody(body) {
            const nonce = uuid_1.generateUuid();
            const colorMap = modes_1.TokenizationRegistry.getColorMap();
            const css = colorMap ? tokenization_1.generateTokensCSSForColorMap(colorMap) : '';
            return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; media-src https:; script-src 'none'; style-src 'nonce-${nonce}';">
				<style nonce="${nonce}">
					body {
						padding: 10px 20px;
						line-height: 22px;
						max-width: 882px;
						margin: 0 auto;
					}

					img {
						max-width: 100%;
						max-height: 100%;
					}

					a {
						text-decoration: none;
					}

					a:hover {
						text-decoration: underline;
					}

					a:focus,
					input:focus,
					select:focus,
					textarea:focus {
						outline: 1px solid -webkit-focus-ring-color;
						outline-offset: -1px;
					}

					hr {
						border: 0;
						height: 2px;
						border-bottom: 2px solid;
					}

					h1 {
						padding-bottom: 0.3em;
						line-height: 1.2;
						border-bottom-width: 1px;
						border-bottom-style: solid;
					}

					h1, h2, h3 {
						font-weight: normal;
					}

					table {
						border-collapse: collapse;
					}

					table > thead > tr > th {
						text-align: left;
						border-bottom: 1px solid;
					}

					table > thead > tr > th,
					table > thead > tr > td,
					table > tbody > tr > th,
					table > tbody > tr > td {
						padding: 5px 10px;
					}

					table > tbody > tr + tr > td {
						border-top: 1px solid;
					}

					blockquote {
						margin: 0 7px 0 5px;
						padding: 0 16px 0 10px;
						border-left-width: 5px;
						border-left-style: solid;
					}

					code {
						font-family: var(--vscode-editor-font-family);
						font-weight: var(--vscode-editor-font-weight);
						font-size: var(--vscode-editor-font-size);
					}

					code > div {
						padding: 16px;
						border-radius: 3px;
						overflow: auto;
					}

					.monaco-tokenized-source {
							white-space: pre;
					}

					#scroll-to-top {
						position: fixed;
						width: 40px;
						height: 40px;
						right: 25px;
						bottom: 25px;
						background-color:#444444;
						border-radius: 50%;
						cursor: pointer;
						box-shadow: 1px 1px 1px rgba(0,0,0,.25);
						outline: none;
						display: flex;
						justify-content: center;
						align-items: center;
					}

					#scroll-to-top:hover {
						background-color:#007acc;
						box-shadow: 2px 2px 2px rgba(0,0,0,.25);
					}

					body.vscode-light #scroll-to-top {
						background-color: #949494;
					}

					body.vscode-high-contrast #scroll-to-top:hover {
						background-color: #007acc;
					}

					body.vscode-high-contrast #scroll-to-top {
						background-color: black;
						border: 2px solid #6fc3df;
						box-shadow: none;
					}
					body.vscode-high-contrast #scroll-to-top:hover {
						background-color: #007acc;
					}

					#scroll-to-top span.icon::before {
						content: "";
						display: block;
						/* Chevron up icon */
						background:url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCAxNiAxNiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTYgMTY7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojRkZGRkZGO30KCS5zdDF7ZmlsbDpub25lO30KPC9zdHlsZT4KPHRpdGxlPnVwY2hldnJvbjwvdGl0bGU+CjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik04LDUuMWwtNy4zLDcuM0wwLDExLjZsOC04bDgsOGwtMC43LDAuN0w4LDUuMXoiLz4KPHJlY3QgY2xhc3M9InN0MSIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+Cjwvc3ZnPgo=');
						width: 16px;
						height: 16px;
					}

					/** Theming */
					.vscode-light code > div {
						background-color: rgba(220, 220, 220, 0.4);
					}

					.vscode-dark code > div {
						background-color: rgba(10, 10, 10, 0.4);
					}

					.vscode-high-contrast code > div {
						background-color: rgb(0, 0, 0);
					}

					.vscode-high-contrast h1 {
						border-color: rgb(0, 0, 0);
					}

					.vscode-light table > thead > tr > th {
						border-color: rgba(0, 0, 0, 0.69);
					}

					.vscode-dark table > thead > tr > th {
						border-color: rgba(255, 255, 255, 0.69);
					}

					.vscode-light h1,
					.vscode-light hr,
					.vscode-light table > tbody > tr + tr > td {
						border-color: rgba(0, 0, 0, 0.18);
					}

					.vscode-dark h1,
					.vscode-dark hr,
					.vscode-dark table > tbody > tr + tr > td {
						border-color: rgba(255, 255, 255, 0.18);
					}

					${css}
				</style>
			</head>
			<body>
				<a id="scroll-to-top" role="button" aria-label="scroll to top" href="#"><span class="icon"></span></a>
				${body}
			</body>
		</html>`;
        }
        async openReadme(template) {
            const manifest = await this.extensionManifest.get().promise;
            if (manifest && manifest.extensionPack && manifest.extensionPack.length) {
                return this.openExtensionPackReadme(manifest, template);
            }
            return this.openMarkdown(this.extensionReadme.get(), nls_1.localize('noReadme', "No README available."), template);
        }
        async openExtensionPackReadme(manifest, template) {
            const extensionPackReadme = dom_1.append(template.content, dom_1.$('div', { class: 'extension-pack-readme' }));
            extensionPackReadme.style.margin = '0 auto';
            extensionPackReadme.style.maxWidth = '882px';
            const extensionPack = dom_1.append(extensionPackReadme, dom_1.$('div', { class: 'extension-pack' }));
            if (manifest.extensionPack.length <= 3) {
                dom_1.addClass(extensionPackReadme, 'one-row');
            }
            else if (manifest.extensionPack.length <= 6) {
                dom_1.addClass(extensionPackReadme, 'two-rows');
            }
            else if (manifest.extensionPack.length <= 9) {
                dom_1.addClass(extensionPackReadme, 'three-rows');
            }
            else {
                dom_1.addClass(extensionPackReadme, 'more-rows');
            }
            const extensionPackHeader = dom_1.append(extensionPack, dom_1.$('div.header'));
            extensionPackHeader.textContent = nls_1.localize('extension pack', "Extension Pack ({0})", manifest.extensionPack.length);
            const extensionPackContent = dom_1.append(extensionPack, dom_1.$('div', { class: 'extension-pack-content' }));
            extensionPackContent.setAttribute('tabindex', '0');
            dom_1.append(extensionPack, dom_1.$('div.footer'));
            const readmeContent = dom_1.append(extensionPackReadme, dom_1.$('div.readme-content'));
            await Promise.all([
                this.renderExtensionPack(manifest, extensionPackContent),
                this.openMarkdown(this.extensionReadme.get(), nls_1.localize('noReadme', "No README available."), Object.assign(Object.assign({}, template), { content: readmeContent })),
            ]);
            return { focus: () => extensionPackContent.focus() };
        }
        openChangelog(template) {
            return this.openMarkdown(this.extensionChangelog.get(), nls_1.localize('noChangelog', "No Changelog available."), template);
        }
        openContributions(template) {
            const content = dom_1.$('div', { class: 'subcontent', tabindex: '0' });
            return this.loadContents(() => this.extensionManifest.get(), template)
                .then(manifest => {
                if (!manifest) {
                    return content;
                }
                const scrollableContent = new scrollableElement_1.DomScrollableElement(content, {});
                const layout = () => scrollableContent.scanDomNode();
                const removeLayoutParticipant = arrays.insert(this.layoutParticipants, { layout });
                this.contentDisposables.add(lifecycle_1.toDisposable(removeLayoutParticipant));
                const renders = [
                    this.renderSettings(content, manifest, layout),
                    this.renderCommands(content, manifest, layout),
                    this.renderCodeActions(content, manifest, layout),
                    this.renderLanguages(content, manifest, layout),
                    this.renderColorThemes(content, manifest, layout),
                    this.renderIconThemes(content, manifest, layout),
                    this.renderColors(content, manifest, layout),
                    this.renderJSONValidation(content, manifest, layout),
                    this.renderDebuggers(content, manifest, layout),
                    this.renderViewContainers(content, manifest, layout),
                    this.renderViews(content, manifest, layout),
                    this.renderLocalizations(content, manifest, layout),
                    this.renderCustomEditors(content, manifest, layout),
                ];
                scrollableContent.scanDomNode();
                const isEmpty = !renders.some(x => x);
                if (isEmpty) {
                    dom_1.append(content, dom_1.$('p.nocontent')).textContent = nls_1.localize('noContributions', "No Contributions");
                    dom_1.append(template.content, content);
                }
                else {
                    dom_1.append(template.content, scrollableContent.getDomNode());
                    this.contentDisposables.add(scrollableContent);
                }
                return content;
            }, () => {
                dom_1.append(content, dom_1.$('p.nocontent')).textContent = nls_1.localize('noContributions', "No Contributions");
                dom_1.append(template.content, content);
                return content;
            });
        }
        openDependencies(extension, template) {
            if (arrays.isFalsyOrEmpty(extension.dependencies)) {
                dom_1.append(template.content, dom_1.$('p.nocontent')).textContent = nls_1.localize('noDependencies', "No Dependencies");
                return Promise.resolve(template.content);
            }
            const content = dom_1.$('div', { class: 'subcontent' });
            const scrollableContent = new scrollableElement_1.DomScrollableElement(content, {});
            dom_1.append(template.content, scrollableContent.getDomNode());
            this.contentDisposables.add(scrollableContent);
            const dependenciesTree = this.instantiationService.createInstance(extensionsViewer_1.ExtensionsTree, new extensionsViewer_1.ExtensionData(extension, null, extension => extension.dependencies || [], this.extensionsWorkbenchService), content, {
                listBackground: colorRegistry_1.editorBackground
            });
            const layout = () => {
                scrollableContent.scanDomNode();
                const scrollDimensions = scrollableContent.getScrollDimensions();
                dependenciesTree.layout(scrollDimensions.height);
            };
            const removeLayoutParticipant = arrays.insert(this.layoutParticipants, { layout });
            this.contentDisposables.add(lifecycle_1.toDisposable(removeLayoutParticipant));
            this.contentDisposables.add(dependenciesTree);
            scrollableContent.scanDomNode();
            return Promise.resolve({ focus() { dependenciesTree.domFocus(); } });
        }
        async renderExtensionPack(manifest, parent) {
            const content = dom_1.$('div', { class: 'subcontent' });
            const scrollableContent = new scrollableElement_1.DomScrollableElement(content, { useShadows: false });
            dom_1.append(parent, scrollableContent.getDomNode());
            const extensionsGridView = this.instantiationService.createInstance(extensionsViewer_1.ExtensionsGridView, content);
            const extensions = await extensionsViewer_1.getExtensions(manifest.extensionPack, this.extensionsWorkbenchService);
            extensionsGridView.setExtensions(extensions);
            scrollableContent.scanDomNode();
            this.contentDisposables.add(scrollableContent);
            this.contentDisposables.add(extensionsGridView);
            this.contentDisposables.add(lifecycle_1.toDisposable(arrays.insert(this.layoutParticipants, { layout: () => scrollableContent.scanDomNode() })));
        }
        renderSettings(container, manifest, onDetailsToggle) {
            var _a;
            const configuration = (_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.configuration;
            let properties = {};
            if (Array.isArray(configuration)) {
                configuration.forEach(config => {
                    properties = Object.assign(Object.assign({}, properties), config.properties);
                });
            }
            else if (configuration) {
                properties = configuration.properties;
            }
            const contrib = properties ? Object.keys(properties) : [];
            if (!contrib.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', { tabindex: '0' }, nls_1.localize('settings', "Settings ({0})", contrib.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('setting name', "Name")), dom_1.$('th', undefined, nls_1.localize('description', "Description")), dom_1.$('th', undefined, nls_1.localize('default', "Default"))), ...contrib.map(key => dom_1.$('tr', undefined, dom_1.$('td', undefined, dom_1.$('code', undefined, key)), dom_1.$('td', undefined, properties[key].description), dom_1.$('td', undefined, dom_1.$('code', undefined, `${types_1.isUndefined(properties[key].default) ? configurationRegistry_1.getDefaultValue(properties[key].type) : properties[key].default}`))))));
            dom_1.append(container, details);
            return true;
        }
        renderDebuggers(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.debuggers) || [];
            if (!contrib.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', { tabindex: '0' }, nls_1.localize('debuggers', "Debuggers ({0})", contrib.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('debugger name', "Name")), dom_1.$('th', undefined, nls_1.localize('debugger type', "Type"))), ...contrib.map(d => dom_1.$('tr', undefined, dom_1.$('td', undefined, d.label), dom_1.$('td', undefined, d.type)))));
            dom_1.append(container, details);
            return true;
        }
        renderViewContainers(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.viewsContainers) || {};
            const viewContainers = Object.keys(contrib).reduce((result, location) => {
                let viewContainersForLocation = contrib[location];
                result.push(...viewContainersForLocation.map(viewContainer => (Object.assign(Object.assign({}, viewContainer), { location }))));
                return result;
            }, []);
            if (!viewContainers.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', { tabindex: '0' }, nls_1.localize('viewContainers', "View Containers ({0})", viewContainers.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('view container id', "ID")), dom_1.$('th', undefined, nls_1.localize('view container title', "Title")), dom_1.$('th', undefined, nls_1.localize('view container location', "Where"))), ...viewContainers.map(viewContainer => dom_1.$('tr', undefined, dom_1.$('td', undefined, viewContainer.id), dom_1.$('td', undefined, viewContainer.title), dom_1.$('td', undefined, viewContainer.location)))));
            dom_1.append(container, details);
            return true;
        }
        renderViews(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.views) || {};
            const views = Object.keys(contrib).reduce((result, location) => {
                let viewsForLocation = contrib[location];
                result.push(...viewsForLocation.map(view => (Object.assign(Object.assign({}, view), { location }))));
                return result;
            }, []);
            if (!views.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', { tabindex: '0' }, nls_1.localize('views', "Views ({0})", views.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('view id', "ID")), dom_1.$('th', undefined, nls_1.localize('view name', "Name")), dom_1.$('th', undefined, nls_1.localize('view location', "Where"))), ...views.map(view => dom_1.$('tr', undefined, dom_1.$('td', undefined, view.id), dom_1.$('td', undefined, view.name), dom_1.$('td', undefined, view.location)))));
            dom_1.append(container, details);
            return true;
        }
        renderLocalizations(container, manifest, onDetailsToggle) {
            var _a;
            const localizations = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.localizations) || [];
            if (!localizations.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', { tabindex: '0' }, nls_1.localize('localizations', "Localizations ({0})", localizations.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('localizations language id', "Language Id")), dom_1.$('th', undefined, nls_1.localize('localizations language name', "Language Name")), dom_1.$('th', undefined, nls_1.localize('localizations localized language name', "Language Name (Localized)"))), ...localizations.map(localization => dom_1.$('tr', undefined, dom_1.$('td', undefined, localization.languageId), dom_1.$('td', undefined, localization.languageName || ''), dom_1.$('td', undefined, localization.localizedLanguageName || '')))));
            dom_1.append(container, details);
            return true;
        }
        renderCustomEditors(container, manifest, onDetailsToggle) {
            var _a;
            const webviewEditors = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.customEditors) || [];
            if (!webviewEditors.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', { tabindex: '0' }, nls_1.localize('customEditors', "Custom Editors ({0})", webviewEditors.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('customEditors view type', "View Type")), dom_1.$('th', undefined, nls_1.localize('customEditors priority', "Priority")), dom_1.$('th', undefined, nls_1.localize('customEditors filenamePattern', "Filename Pattern"))), ...webviewEditors.map(webviewEditor => dom_1.$('tr', undefined, dom_1.$('td', undefined, webviewEditor.viewType), dom_1.$('td', undefined, webviewEditor.priority), dom_1.$('td', undefined, arrays.coalesce(webviewEditor.selector.map(x => x.filenamePattern)).join(', '))))));
            dom_1.append(container, details);
            return true;
        }
        renderCodeActions(container, manifest, onDetailsToggle) {
            var _a;
            const codeActions = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.codeActions) || [];
            if (!codeActions.length) {
                return false;
            }
            const flatActions = arrays.flatten(codeActions.map(contribution => contribution.actions.map(action => (Object.assign(Object.assign({}, action), { languages: contribution.languages })))));
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', { tabindex: '0' }, nls_1.localize('codeActions', "Code Actions ({0})", flatActions.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('codeActions.title', "Title")), dom_1.$('th', undefined, nls_1.localize('codeActions.kind', "Kind")), dom_1.$('th', undefined, nls_1.localize('codeActions.description', "Description")), dom_1.$('th', undefined, nls_1.localize('codeActions.languages', "Languages"))), ...flatActions.map(action => {
                var _a;
                return dom_1.$('tr', undefined, dom_1.$('td', undefined, action.title), dom_1.$('td', undefined, dom_1.$('code', undefined, action.kind)), dom_1.$('td', undefined, (_a = action.description) !== null && _a !== void 0 ? _a : ''), dom_1.$('td', undefined, ...action.languages.map(language => dom_1.$('code', undefined, language))));
            })));
            dom_1.append(container, details);
            return true;
        }
        renderColorThemes(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.themes) || [];
            if (!contrib.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', { tabindex: '0' }, nls_1.localize('colorThemes', "Color Themes ({0})", contrib.length)), dom_1.$('ul', undefined, ...contrib.map(theme => dom_1.$('li', undefined, theme.label))));
            dom_1.append(container, details);
            return true;
        }
        renderIconThemes(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.iconThemes) || [];
            if (!contrib.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', { tabindex: '0' }, nls_1.localize('iconThemes', "File Icon Themes ({0})", contrib.length)), dom_1.$('ul', undefined, ...contrib.map(theme => dom_1.$('li', undefined, theme.label))));
            dom_1.append(container, details);
            return true;
        }
        renderColors(container, manifest, onDetailsToggle) {
            var _a;
            const colors = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.colors) || [];
            if (!colors.length) {
                return false;
            }
            function colorPreview(colorReference) {
                let result = [];
                if (colorReference && colorReference[0] === '#') {
                    let color = color_1.Color.fromHex(colorReference);
                    if (color) {
                        result.push(dom_1.$('span', { class: 'colorBox', style: 'background-color: ' + color_1.Color.Format.CSS.format(color) }, ''));
                    }
                }
                result.push(dom_1.$('code', undefined, colorReference));
                return result;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', { tabindex: '0' }, nls_1.localize('colors', "Colors ({0})", colors.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('colorId', "Id")), dom_1.$('th', undefined, nls_1.localize('description', "Description")), dom_1.$('th', undefined, nls_1.localize('defaultDark', "Dark Default")), dom_1.$('th', undefined, nls_1.localize('defaultLight', "Light Default")), dom_1.$('th', undefined, nls_1.localize('defaultHC', "High Contrast Default"))), ...colors.map(color => dom_1.$('tr', undefined, dom_1.$('td', undefined, dom_1.$('code', undefined, color.id)), dom_1.$('td', undefined, color.description), dom_1.$('td', undefined, ...colorPreview(color.defaults.dark)), dom_1.$('td', undefined, ...colorPreview(color.defaults.light)), dom_1.$('td', undefined, ...colorPreview(color.defaults.highContrast))))));
            dom_1.append(container, details);
            return true;
        }
        renderJSONValidation(container, manifest, onDetailsToggle) {
            var _a;
            const contrib = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.jsonValidation) || [];
            if (!contrib.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', { tabindex: '0' }, nls_1.localize('JSON Validation', "JSON Validation ({0})", contrib.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('fileMatch', "File Match")), dom_1.$('th', undefined, nls_1.localize('schema', "Schema"))), ...contrib.map(v => dom_1.$('tr', undefined, dom_1.$('td', undefined, dom_1.$('code', undefined, Array.isArray(v.fileMatch) ? v.fileMatch.join(', ') : v.fileMatch)), dom_1.$('td', undefined, v.url)))));
            dom_1.append(container, details);
            return true;
        }
        renderCommands(container, manifest, onDetailsToggle) {
            var _a, _b, _c;
            const rawCommands = ((_a = manifest.contributes) === null || _a === void 0 ? void 0 : _a.commands) || [];
            const commands = rawCommands.map(c => ({
                id: c.command,
                title: c.title,
                keybindings: [],
                menus: []
            }));
            const byId = arrays.index(commands, c => c.id);
            const menus = ((_b = manifest.contributes) === null || _b === void 0 ? void 0 : _b.menus) || {};
            Object.keys(menus).forEach(context => {
                menus[context].forEach(menu => {
                    let command = byId[menu.command];
                    if (command) {
                        command.menus.push(context);
                    }
                    else {
                        command = { id: menu.command, title: '', keybindings: [], menus: [context] };
                        byId[command.id] = command;
                        commands.push(command);
                    }
                });
            });
            const rawKeybindings = ((_c = manifest.contributes) === null || _c === void 0 ? void 0 : _c.keybindings) ? (Array.isArray(manifest.contributes.keybindings) ? manifest.contributes.keybindings : [manifest.contributes.keybindings]) : [];
            rawKeybindings.forEach(rawKeybinding => {
                const keybinding = this.resolveKeybinding(rawKeybinding);
                if (!keybinding) {
                    return;
                }
                let command = byId[rawKeybinding.command];
                if (command) {
                    command.keybindings.push(keybinding);
                }
                else {
                    command = { id: rawKeybinding.command, title: '', keybindings: [keybinding], menus: [] };
                    byId[command.id] = command;
                    commands.push(command);
                }
            });
            if (!commands.length) {
                return false;
            }
            const renderKeybinding = (keybinding) => {
                const element = dom_1.$('');
                new keybindingLabel_1.KeybindingLabel(element, platform_1.OS).set(keybinding);
                return element;
            };
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', { tabindex: '0' }, nls_1.localize('commands', "Commands ({0})", commands.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('command name', "Name")), dom_1.$('th', undefined, nls_1.localize('description', "Description")), dom_1.$('th', undefined, nls_1.localize('keyboard shortcuts', "Keyboard Shortcuts")), dom_1.$('th', undefined, nls_1.localize('menuContexts', "Menu Contexts"))), ...commands.map(c => dom_1.$('tr', undefined, dom_1.$('td', undefined, dom_1.$('code', undefined, c.id)), dom_1.$('td', undefined, c.title), dom_1.$('td', undefined, ...c.keybindings.map(keybinding => renderKeybinding(keybinding))), dom_1.$('td', undefined, ...c.menus.map(context => dom_1.$('code', undefined, context)))))));
            dom_1.append(container, details);
            return true;
        }
        renderLanguages(container, manifest, onDetailsToggle) {
            const contributes = manifest.contributes;
            const rawLanguages = (contributes === null || contributes === void 0 ? void 0 : contributes.languages) || [];
            const languages = rawLanguages.map(l => ({
                id: l.id,
                name: (l.aliases || [])[0] || l.id,
                extensions: l.extensions || [],
                hasGrammar: false,
                hasSnippets: false
            }));
            const byId = arrays.index(languages, l => l.id);
            const grammars = (contributes === null || contributes === void 0 ? void 0 : contributes.grammars) || [];
            grammars.forEach(grammar => {
                let language = byId[grammar.language];
                if (language) {
                    language.hasGrammar = true;
                }
                else {
                    language = { id: grammar.language, name: grammar.language, extensions: [], hasGrammar: true, hasSnippets: false };
                    byId[language.id] = language;
                    languages.push(language);
                }
            });
            const snippets = (contributes === null || contributes === void 0 ? void 0 : contributes.snippets) || [];
            snippets.forEach(snippet => {
                let language = byId[snippet.language];
                if (language) {
                    language.hasSnippets = true;
                }
                else {
                    language = { id: snippet.language, name: snippet.language, extensions: [], hasGrammar: false, hasSnippets: true };
                    byId[language.id] = language;
                    languages.push(language);
                }
            });
            if (!languages.length) {
                return false;
            }
            const details = dom_1.$('details', { open: true, ontoggle: onDetailsToggle }, dom_1.$('summary', { tabindex: '0' }, nls_1.localize('languages', "Languages ({0})", languages.length)), dom_1.$('table', undefined, dom_1.$('tr', undefined, dom_1.$('th', undefined, nls_1.localize('language id', "ID")), dom_1.$('th', undefined, nls_1.localize('language name', "Name")), dom_1.$('th', undefined, nls_1.localize('file extensions', "File Extensions")), dom_1.$('th', undefined, nls_1.localize('grammar', "Grammar")), dom_1.$('th', undefined, nls_1.localize('snippets', "Snippets"))), ...languages.map(l => dom_1.$('tr', undefined, dom_1.$('td', undefined, l.id), dom_1.$('td', undefined, l.name), dom_1.$('td', undefined, ...dom_1.join(l.extensions.map(ext => dom_1.$('code', undefined, ext)), ' ')), dom_1.$('td', undefined, document.createTextNode(l.hasGrammar ? '✔︎' : '—')), dom_1.$('td', undefined, document.createTextNode(l.hasSnippets ? '✔︎' : '—'))))));
            dom_1.append(container, details);
            return true;
        }
        resolveKeybinding(rawKeyBinding) {
            let key;
            switch (process_1.platform) {
                case 'win32':
                    key = rawKeyBinding.win;
                    break;
                case 'linux':
                    key = rawKeyBinding.linux;
                    break;
                case 'darwin':
                    key = rawKeyBinding.mac;
                    break;
            }
            const keyBinding = keybindingParser_1.KeybindingParser.parseKeybinding(key || rawKeyBinding.key, platform_1.OS);
            if (keyBinding) {
                return this.keybindingService.resolveKeybinding(keyBinding)[0];
            }
            return null;
        }
        loadContents(loadingTask, template) {
            dom_1.addClass(template.content, 'loading');
            const result = this.contentDisposables.add(loadingTask());
            const onDone = () => dom_1.removeClass(template.content, 'loading');
            result.promise.then(onDone, onDone);
            return result.promise;
        }
        layout() {
            this.layoutParticipants.forEach(p => p.layout());
        }
        onError(err) {
            if (errors_1.isPromiseCanceledError(err)) {
                return;
            }
            this.notificationService.error(err);
        }
    };
    ExtensionEditor.ID = 'workbench.editor.extension';
    ExtensionEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, viewlet_1.IViewletService),
        __param(3, extensions_1.IExtensionsWorkbenchService),
        __param(4, themeService_1.IThemeService),
        __param(5, keybinding_1.IKeybindingService),
        __param(6, notification_1.INotificationService),
        __param(7, opener_1.IOpenerService),
        __param(8, extensionManagement_1.IExtensionRecommendationsService),
        __param(9, storage_1.IStorageService),
        __param(10, extensions_2.IExtensionService),
        __param(11, workbenchThemeService_1.IWorkbenchThemeService),
        __param(12, webview_1.IWebviewService),
        __param(13, modeService_1.IModeService)
    ], ExtensionEditor);
    exports.ExtensionEditor = ExtensionEditor;
    const contextKeyExpr = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', ExtensionEditor.ID), contextkey_1.ContextKeyExpr.not('editorFocus'));
    actions_2.registerAction2(class ShowExtensionEditorFindAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'editor.action.extensioneditor.showfind',
                title: nls_1.localize('find', "Find"),
                keybinding: {
                    when: contextKeyExpr,
                    weight: 100 /* EditorContrib */,
                    primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */,
                }
            });
        }
        run(accessor) {
            const extensionEditor = getExtensionEditor(accessor);
            if (extensionEditor) {
                extensionEditor.showFind();
            }
        }
    });
    actions_2.registerAction2(class StartExtensionEditorFindNextAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'editor.action.extensioneditor.findNext',
                title: nls_1.localize('find next', "Find Next"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED),
                    primary: 3 /* Enter */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor) {
            const extensionEditor = getExtensionEditor(accessor);
            if (extensionEditor) {
                extensionEditor.runFindAction(false);
            }
        }
    });
    actions_2.registerAction2(class StartExtensionEditorFindPreviousAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'editor.action.extensioneditor.findPrevious',
                title: nls_1.localize('find previous', "Find Previous"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED),
                    primary: 1024 /* Shift */ | 3 /* Enter */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor) {
            const extensionEditor = getExtensionEditor(accessor);
            if (extensionEditor) {
                extensionEditor.runFindAction(true);
            }
        }
    });
    function getExtensionEditor(accessor) {
        const activeEditorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
        if (activeEditorPane instanceof ExtensionEditor) {
            return activeEditorPane;
        }
        return null;
    }
});
//# __sourceMappingURL=extensionEditor.js.map