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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/workbench/common/theme", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/registry/common/platform", "vs/base/browser/ui/toolbar/toolbar", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/base/browser/ui/splitview/paneview", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService", "vs/base/browser/mouseEvent", "vs/workbench/common/views", "vs/platform/storage/common/storage", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/common/component", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/workbench/browser/parts/views/viewMenuActions", "vs/base/common/linkedText", "vs/platform/opener/common/opener", "vs/base/browser/ui/button/button", "vs/platform/opener/browser/link", "vs/workbench/browser/dnd", "vs/base/browser/ui/progressbar/progressbar", "vs/workbench/services/progress/browser/progressIndicator", "vs/base/common/async", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/uri", "vs/base/common/keyCodes", "vs/css!./media/paneviewlet"], function (require, exports, nls, event_1, colorRegistry_1, styler_1, theme_1, dom_1, lifecycle_1, arrays_1, actionbar_1, platform_1, toolbar_1, keybinding_1, contextView_1, telemetry_1, themeService_1, paneview_1, configuration_1, layoutService_1, mouseEvent_1, views_1, storage_1, contextkey_1, types_1, instantiation_1, extensions_1, workspace_1, component_1, actions_1, menuEntryActionViewItem_1, viewMenuActions_1, linkedText_1, opener_1, button_1, link_1, dnd_1, progressbar_1, progressIndicator_1, async_1, scrollableElement_1, uri_1, keyCodes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewPaneContainer = exports.ViewPane = void 0;
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    let ViewWelcomeController = class ViewWelcomeController {
        constructor(id, contextKeyService) {
            this.id = id;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.items = [];
            this.disposables = new lifecycle_1.DisposableStore();
            this.contextKeyService = contextKeyService.createScoped();
            this.disposables.add(this.contextKeyService);
            contextKeyService.onDidChangeContext(this.onDidChangeContext, this, this.disposables);
            event_1.Event.filter(viewsRegistry.onDidChangeViewWelcomeContent, id => id === this.id)(this.onDidChangeViewWelcomeContent, this, this.disposables);
            this.onDidChangeViewWelcomeContent();
        }
        get contents() {
            const visibleItems = this.items.filter(v => v.visible);
            if (visibleItems.length === 0 && this.defaultItem) {
                return [this.defaultItem.descriptor];
            }
            return visibleItems.map(v => v.descriptor);
        }
        onDidChangeViewWelcomeContent() {
            const descriptors = viewsRegistry.getViewWelcomeContent(this.id);
            this.items = [];
            for (const descriptor of descriptors) {
                if (descriptor.when === 'default') {
                    this.defaultItem = { descriptor, visible: true };
                }
                else {
                    const visible = descriptor.when ? this.contextKeyService.contextMatchesRules(descriptor.when) : true;
                    this.items.push({ descriptor, visible });
                }
            }
            this._onDidChange.fire();
        }
        onDidChangeContext() {
            let didChange = false;
            for (const item of this.items) {
                if (!item.descriptor.when || item.descriptor.when === 'default') {
                    continue;
                }
                const visible = this.contextKeyService.contextMatchesRules(item.descriptor.when);
                if (item.visible === visible) {
                    continue;
                }
                item.visible = visible;
                didChange = true;
            }
            if (didChange) {
                this._onDidChange.fire();
            }
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    ViewWelcomeController = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], ViewWelcomeController);
    let ViewPane = class ViewPane extends paneview_1.Pane {
        constructor(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService) {
            super(Object.assign(Object.assign({}, options), { orientation: viewDescriptorService.getViewLocationById(options.id) === views_1.ViewContainerLocation.Panel ? 1 /* HORIZONTAL */ : 0 /* VERTICAL */ }));
            this.keybindingService = keybindingService;
            this.contextMenuService = contextMenuService;
            this.configurationService = configurationService;
            this.contextKeyService = contextKeyService;
            this.viewDescriptorService = viewDescriptorService;
            this.instantiationService = instantiationService;
            this.openerService = openerService;
            this.themeService = themeService;
            this.telemetryService = telemetryService;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._onDidChangeBodyVisibility = this._register(new event_1.Emitter());
            this.onDidChangeBodyVisibility = this._onDidChangeBodyVisibility.event;
            this._onDidChangeTitleArea = this._register(new event_1.Emitter());
            this.onDidChangeTitleArea = this._onDidChangeTitleArea.event;
            this._onDidChangeViewWelcomeState = this._register(new event_1.Emitter());
            this.onDidChangeViewWelcomeState = this._onDidChangeViewWelcomeState.event;
            this._isVisible = false;
            this.showActionsAlways = false;
            this.viewWelcomeDisposable = lifecycle_1.Disposable.None;
            this.id = options.id;
            this._title = options.title;
            this.showActionsAlways = !!options.showActionsAlways;
            this.focusedViewContextKey = views_1.FocusedViewContext.bindTo(contextKeyService);
            this.menuActions = this._register(instantiationService.createInstance(viewMenuActions_1.ViewMenuActions, this.id, options.titleMenuId || actions_1.MenuId.ViewTitle, actions_1.MenuId.ViewTitleContext));
            this._register(this.menuActions.onDidChangeTitle(() => this.updateActions()));
            this.viewWelcomeController = new ViewWelcomeController(this.id, contextKeyService);
        }
        get title() {
            return this._title;
        }
        get headerVisible() {
            return super.headerVisible;
        }
        set headerVisible(visible) {
            super.headerVisible = visible;
            dom_1.toggleClass(this.element, 'merged-header', !visible);
        }
        setVisible(visible) {
            if (this._isVisible !== visible) {
                this._isVisible = visible;
                if (this.isExpanded()) {
                    this._onDidChangeBodyVisibility.fire(visible);
                }
            }
        }
        isVisible() {
            return this._isVisible;
        }
        isBodyVisible() {
            return this._isVisible && this.isExpanded();
        }
        setExpanded(expanded) {
            const changed = super.setExpanded(expanded);
            if (changed) {
                this._onDidChangeBodyVisibility.fire(expanded);
            }
            return changed;
        }
        render() {
            super.render();
            const focusTracker = dom_1.trackFocus(this.element);
            this._register(focusTracker);
            this._register(focusTracker.onDidFocus(() => {
                this.focusedViewContextKey.set(this.id);
                this._onDidFocus.fire();
            }));
            this._register(focusTracker.onDidBlur(() => {
                if (this.focusedViewContextKey.get() === this.id) {
                    this.focusedViewContextKey.reset();
                }
                this._onDidBlur.fire();
            }));
        }
        renderHeader(container) {
            this.headerContainer = container;
            this.renderTwisties(container);
            this.renderHeaderTitle(container, this.title);
            const actions = dom_1.append(container, dom_1.$('.actions'));
            dom_1.toggleClass(actions, 'show', this.showActionsAlways);
            this.toolbar = new toolbar_1.ToolBar(actions, this.contextMenuService, {
                orientation: 0 /* HORIZONTAL */,
                actionViewItemProvider: action => this.getActionViewItem(action),
                ariaLabel: nls.localize('viewToolbarAriaLabel', "{0} actions", this.title),
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
            });
            this._register(this.toolbar);
            this.setActions();
            this._register(this.viewDescriptorService.getViewContainerModel(this.viewDescriptorService.getViewContainerByViewId(this.id)).onDidChangeContainerInfo(({ title }) => {
                this.updateTitle(this.title);
            }));
            const onDidRelevantConfigurationChange = event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration(ViewPane.AlwaysShowActionsConfig));
            this._register(onDidRelevantConfigurationChange(this.updateActionsVisibility, this));
            this.updateActionsVisibility();
        }
        renderTwisties(container) {
            this.twistiesContainer = dom_1.append(container, dom_1.$('.twisties.codicon.codicon-chevron-right'));
        }
        style(styles) {
            super.style(styles);
            const icon = this.getIcon();
            if (this.iconContainer) {
                const fgColor = styles.headerForeground || this.themeService.getColorTheme().getColor(colorRegistry_1.foreground);
                if (uri_1.URI.isUri(icon)) {
                    // Apply background color to activity bar item provided with iconUrls
                    this.iconContainer.style.backgroundColor = fgColor ? fgColor.toString() : '';
                    this.iconContainer.style.color = '';
                }
                else {
                    // Apply foreground color to activity bar items provided with codicons
                    this.iconContainer.style.color = fgColor ? fgColor.toString() : '';
                    this.iconContainer.style.backgroundColor = '';
                }
            }
        }
        getIcon() {
            var _a;
            return ((_a = this.viewDescriptorService.getViewDescriptorById(this.id)) === null || _a === void 0 ? void 0 : _a.containerIcon) || 'codicon-window';
        }
        renderHeaderTitle(container, title) {
            this.iconContainer = dom_1.append(container, dom_1.$('.icon', undefined));
            const icon = this.getIcon();
            let cssClass = undefined;
            if (uri_1.URI.isUri(icon)) {
                cssClass = `view-${this.id.replace(/[\.\:]/g, '-')}`;
                const iconClass = `.pane-header .icon.${cssClass}`;
                dom_1.createCSSRule(iconClass, `
				mask: ${dom_1.asCSSUrl(icon)} no-repeat 50% 50%;
				mask-size: 24px;
				-webkit-mask: ${dom_1.asCSSUrl(icon)} no-repeat 50% 50%;
				-webkit-mask-size: 16px;
			`);
            }
            else if (types_1.isString(icon)) {
                dom_1.addClass(this.iconContainer, 'codicon');
                cssClass = icon;
            }
            if (cssClass) {
                dom_1.addClasses(this.iconContainer, cssClass);
            }
            const calculatedTitle = this.calculateTitle(title);
            this.titleContainer = dom_1.append(container, dom_1.$('h3.title', undefined, calculatedTitle));
            this.iconContainer.title = calculatedTitle;
            this.iconContainer.setAttribute('aria-label', calculatedTitle);
        }
        updateTitle(title) {
            const calculatedTitle = this.calculateTitle(title);
            if (this.titleContainer) {
                this.titleContainer.textContent = calculatedTitle;
            }
            if (this.iconContainer) {
                this.iconContainer.title = calculatedTitle;
                this.iconContainer.setAttribute('aria-label', calculatedTitle);
            }
            this._title = title;
            this._onDidChangeTitleArea.fire();
        }
        calculateTitle(title) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(this.id);
            const model = this.viewDescriptorService.getViewContainerModel(viewContainer);
            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(this.id);
            const isDefault = this.viewDescriptorService.getDefaultContainerById(this.id) === viewContainer;
            if (!isDefault && (viewDescriptor === null || viewDescriptor === void 0 ? void 0 : viewDescriptor.containerTitle) && model.title !== viewDescriptor.containerTitle) {
                return `${viewDescriptor.containerTitle}: ${title}`;
            }
            return title;
        }
        renderBody(container) {
            this.bodyContainer = container;
            const viewWelcomeContainer = dom_1.append(container, dom_1.$('.welcome-view'));
            this.viewWelcomeContainer = dom_1.$('.welcome-view-content', { tabIndex: 0 });
            this.scrollableElement = this._register(new scrollableElement_1.DomScrollableElement(this.viewWelcomeContainer, {
                alwaysConsumeMouseWheel: true,
                horizontal: 2 /* Hidden */,
                vertical: 3 /* Visible */,
            }));
            dom_1.append(viewWelcomeContainer, this.scrollableElement.getDomNode());
            const onViewWelcomeChange = event_1.Event.any(this.viewWelcomeController.onDidChange, this.onDidChangeViewWelcomeState);
            this._register(onViewWelcomeChange(this.updateViewWelcome, this));
            this.updateViewWelcome();
        }
        layoutBody(height, width) {
            this.viewWelcomeContainer.style.height = `${height}px`;
            this.viewWelcomeContainer.style.width = `${width}px`;
            this.scrollableElement.scanDomNode();
        }
        getProgressIndicator() {
            if (this.progressBar === undefined) {
                // Progress bar
                this.progressBar = this._register(new progressbar_1.ProgressBar(this.element));
                this._register(styler_1.attachProgressBarStyler(this.progressBar, this.themeService));
                this.progressBar.hide();
            }
            if (this.progressIndicator === undefined) {
                this.progressIndicator = this.instantiationService.createInstance(progressIndicator_1.CompositeProgressIndicator, types_1.assertIsDefined(this.progressBar), this.id, this.isBodyVisible());
            }
            return this.progressIndicator;
        }
        getProgressLocation() {
            return this.viewDescriptorService.getViewContainerByViewId(this.id).id;
        }
        getBackgroundColor() {
            return this.viewDescriptorService.getViewLocationById(this.id) === views_1.ViewContainerLocation.Panel ? theme_1.PANEL_BACKGROUND : theme_1.SIDE_BAR_BACKGROUND;
        }
        focus() {
            if (this.shouldShowWelcome()) {
                this.viewWelcomeContainer.focus();
            }
            else if (this.element) {
                this.element.focus();
                this._onDidFocus.fire();
            }
        }
        setActions() {
            if (this.toolbar) {
                this.toolbar.setActions(actionbar_1.prepareActions(this.getActions()), actionbar_1.prepareActions(this.getSecondaryActions()))();
                this.toolbar.context = this.getActionsContext();
            }
        }
        updateActionsVisibility() {
            if (!this.headerContainer) {
                return;
            }
            const shouldAlwaysShowActions = this.configurationService.getValue('workbench.view.alwaysShowHeaderActions');
            dom_1.toggleClass(this.headerContainer, 'actions-always-visible', shouldAlwaysShowActions);
        }
        updateActions() {
            this.setActions();
            this._onDidChangeTitleArea.fire();
        }
        getActions() {
            return this.menuActions.getPrimaryActions();
        }
        getSecondaryActions() {
            return this.menuActions.getSecondaryActions();
        }
        getContextMenuActions() {
            return this.menuActions.getContextMenuActions();
        }
        getActionViewItem(action) {
            if (action instanceof actions_1.MenuItemAction) {
                return this.instantiationService.createInstance(menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem, action);
            }
            return undefined;
        }
        getActionsContext() {
            return undefined;
        }
        getOptimalWidth() {
            return 0;
        }
        saveState() {
            // Subclasses to implement for saving state
        }
        updateViewWelcome() {
            this.viewWelcomeDisposable.dispose();
            if (!this.shouldShowWelcome()) {
                dom_1.removeClass(this.bodyContainer, 'welcome');
                this.viewWelcomeContainer.innerHTML = '';
                this.scrollableElement.scanDomNode();
                return;
            }
            const contents = this.viewWelcomeController.contents;
            if (contents.length === 0) {
                dom_1.removeClass(this.bodyContainer, 'welcome');
                this.viewWelcomeContainer.innerHTML = '';
                this.scrollableElement.scanDomNode();
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            dom_1.addClass(this.bodyContainer, 'welcome');
            this.viewWelcomeContainer.innerHTML = '';
            let buttonIndex = 0;
            for (const { content, preconditions } of contents) {
                const lines = content.split('\n');
                for (let line of lines) {
                    line = line.trim();
                    if (!line) {
                        continue;
                    }
                    const linkedText = linkedText_1.parseLinkedText(line);
                    if (linkedText.nodes.length === 1 && typeof linkedText.nodes[0] !== 'string') {
                        const node = linkedText.nodes[0];
                        const button = new button_1.Button(this.viewWelcomeContainer, { title: node.title, supportCodicons: true });
                        button.label = node.label;
                        button.onDidClick(_ => {
                            this.telemetryService.publicLog2('views.welcomeAction', { viewId: this.id, uri: node.href });
                            this.openerService.open(node.href);
                        }, null, disposables);
                        disposables.add(button);
                        disposables.add(styler_1.attachButtonStyler(button, this.themeService));
                        if (preconditions) {
                            const precondition = preconditions[buttonIndex];
                            if (precondition) {
                                const updateEnablement = () => button.enabled = this.contextKeyService.contextMatchesRules(precondition);
                                updateEnablement();
                                const keys = new Set();
                                precondition.keys().forEach(key => keys.add(key));
                                const onDidChangeContext = event_1.Event.filter(this.contextKeyService.onDidChangeContext, e => e.affectsSome(keys));
                                onDidChangeContext(updateEnablement, null, disposables);
                            }
                        }
                        buttonIndex++;
                    }
                    else {
                        const p = dom_1.append(this.viewWelcomeContainer, dom_1.$('p'));
                        for (const node of linkedText.nodes) {
                            if (typeof node === 'string') {
                                dom_1.append(p, document.createTextNode(node));
                            }
                            else {
                                const link = this.instantiationService.createInstance(link_1.Link, node);
                                dom_1.append(p, link.el);
                                disposables.add(link);
                                disposables.add(styler_1.attachLinkStyler(link, this.themeService));
                            }
                        }
                    }
                }
            }
            this.scrollableElement.scanDomNode();
            this.viewWelcomeDisposable = disposables;
        }
        shouldShowWelcome() {
            return false;
        }
    };
    ViewPane.AlwaysShowActionsConfig = 'workbench.view.alwaysShowHeaderActions';
    ViewPane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, opener_1.IOpenerService),
        __param(8, themeService_1.IThemeService),
        __param(9, telemetry_1.ITelemetryService)
    ], ViewPane);
    exports.ViewPane = ViewPane;
    var DropDirection;
    (function (DropDirection) {
        DropDirection[DropDirection["UP"] = 0] = "UP";
        DropDirection[DropDirection["DOWN"] = 1] = "DOWN";
        DropDirection[DropDirection["LEFT"] = 2] = "LEFT";
        DropDirection[DropDirection["RIGHT"] = 3] = "RIGHT";
    })(DropDirection || (DropDirection = {}));
    class ViewPaneDropOverlay extends themeService_1.Themable {
        constructor(paneElement, orientation, location, themeService) {
            super(themeService);
            this.paneElement = paneElement;
            this.orientation = orientation;
            this.location = location;
            this.themeService = themeService;
            this.cleanupOverlayScheduler = this._register(new async_1.RunOnceScheduler(() => this.dispose(), 300));
            this.create();
        }
        get currentDropOperation() {
            return this._currentDropOperation;
        }
        get disposed() {
            return !!this._disposed;
        }
        create() {
            // Container
            this.container = document.createElement('div');
            this.container.id = ViewPaneDropOverlay.OVERLAY_ID;
            this.container.style.top = '0px';
            // Parent
            this.paneElement.appendChild(this.container);
            dom_1.addClass(this.paneElement, 'dragged-over');
            this._register(lifecycle_1.toDisposable(() => {
                this.paneElement.removeChild(this.container);
                dom_1.removeClass(this.paneElement, 'dragged-over');
            }));
            // Overlay
            this.overlay = document.createElement('div');
            dom_1.addClass(this.overlay, 'pane-overlay-indicator');
            this.container.appendChild(this.overlay);
            // Overlay Event Handling
            this.registerListeners();
            // Styles
            this.updateStyles();
        }
        updateStyles() {
            // Overlay drop background
            this.overlay.style.backgroundColor = this.getColor(this.location === views_1.ViewContainerLocation.Panel ? theme_1.PANEL_SECTION_DRAG_AND_DROP_BACKGROUND : theme_1.SIDE_BAR_DRAG_AND_DROP_BACKGROUND) || '';
            // Overlay contrast border (if any)
            const activeContrastBorderColor = this.getColor(colorRegistry_1.activeContrastBorder);
            this.overlay.style.outlineColor = activeContrastBorderColor || '';
            this.overlay.style.outlineOffset = activeContrastBorderColor ? '-2px' : '';
            this.overlay.style.outlineStyle = activeContrastBorderColor ? 'dashed' : '';
            this.overlay.style.outlineWidth = activeContrastBorderColor ? '2px' : '';
            this.overlay.style.borderColor = activeContrastBorderColor || '';
            this.overlay.style.borderStyle = 'solid' || '';
            this.overlay.style.borderWidth = '0px';
        }
        registerListeners() {
            this._register(new dnd_1.DragAndDropObserver(this.container, {
                onDragEnter: e => undefined,
                onDragOver: e => {
                    // Position overlay
                    this.positionOverlay(e.offsetX, e.offsetY);
                    // Make sure to stop any running cleanup scheduler to remove the overlay
                    if (this.cleanupOverlayScheduler.isScheduled()) {
                        this.cleanupOverlayScheduler.cancel();
                    }
                },
                onDragLeave: e => this.dispose(),
                onDragEnd: e => this.dispose(),
                onDrop: e => {
                    // Dispose overlay
                    this.dispose();
                }
            }));
            this._register(dom_1.addDisposableListener(this.container, dom_1.EventType.MOUSE_OVER, () => {
                // Under some circumstances we have seen reports where the drop overlay is not being
                // cleaned up and as such the editor area remains under the overlay so that you cannot
                // type into the editor anymore. This seems related to using VMs and DND via host and
                // guest OS, though some users also saw it without VMs.
                // To protect against this issue we always destroy the overlay as soon as we detect a
                // mouse event over it. The delay is used to guarantee we are not interfering with the
                // actual DROP event that can also trigger a mouse over event.
                if (!this.cleanupOverlayScheduler.isScheduled()) {
                    this.cleanupOverlayScheduler.schedule();
                }
            }));
        }
        positionOverlay(mousePosX, mousePosY) {
            const paneWidth = this.paneElement.clientWidth;
            const paneHeight = this.paneElement.clientHeight;
            const splitWidthThreshold = paneWidth / 2;
            const splitHeightThreshold = paneHeight / 2;
            let dropDirection;
            if (this.orientation === 0 /* VERTICAL */) {
                if (mousePosY < splitHeightThreshold) {
                    dropDirection = 0 /* UP */;
                }
                else if (mousePosY >= splitHeightThreshold) {
                    dropDirection = 1 /* DOWN */;
                }
            }
            else if (this.orientation === 1 /* HORIZONTAL */) {
                if (mousePosX < splitWidthThreshold) {
                    dropDirection = 2 /* LEFT */;
                }
                else if (mousePosX >= splitWidthThreshold) {
                    dropDirection = 3 /* RIGHT */;
                }
            }
            // Draw overlay based on split direction
            switch (dropDirection) {
                case 0 /* UP */:
                    this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '50%' });
                    break;
                case 1 /* DOWN */:
                    this.doPositionOverlay({ bottom: '0', left: '0', width: '100%', height: '50%' });
                    break;
                case 2 /* LEFT */:
                    this.doPositionOverlay({ top: '0', left: '0', width: '50%', height: '100%' });
                    break;
                case 3 /* RIGHT */:
                    this.doPositionOverlay({ top: '0', right: '0', width: '50%', height: '100%' });
                    break;
                default:
                    this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '100%' });
            }
            if ((this.orientation === 0 /* VERTICAL */ && paneHeight <= 25) ||
                (this.orientation === 1 /* HORIZONTAL */ && paneWidth <= 25)) {
                this.doUpdateOverlayBorder(dropDirection);
            }
            else {
                this.doUpdateOverlayBorder(undefined);
            }
            // Make sure the overlay is visible now
            this.overlay.style.opacity = '1';
            // Enable transition after a timeout to prevent initial animation
            setTimeout(() => dom_1.addClass(this.overlay, 'overlay-move-transition'), 0);
            // Remember as current split direction
            this._currentDropOperation = dropDirection;
        }
        doUpdateOverlayBorder(direction) {
            this.overlay.style.borderTopWidth = direction === 0 /* UP */ ? '2px' : '0px';
            this.overlay.style.borderLeftWidth = direction === 2 /* LEFT */ ? '2px' : '0px';
            this.overlay.style.borderBottomWidth = direction === 1 /* DOWN */ ? '2px' : '0px';
            this.overlay.style.borderRightWidth = direction === 3 /* RIGHT */ ? '2px' : '0px';
        }
        doPositionOverlay(options) {
            // Container
            this.container.style.height = '100%';
            // Overlay
            this.overlay.style.top = options.top || '';
            this.overlay.style.left = options.left || '';
            this.overlay.style.bottom = options.bottom || '';
            this.overlay.style.right = options.right || '';
            this.overlay.style.width = options.width;
            this.overlay.style.height = options.height;
        }
        contains(element) {
            return element === this.container || element === this.overlay;
        }
        dispose() {
            super.dispose();
            this._disposed = true;
        }
    }
    ViewPaneDropOverlay.OVERLAY_ID = 'monaco-workbench-pane-drop-overlay';
    let ViewPaneContainer = class ViewPaneContainer extends component_1.Component {
        constructor(id, options, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService) {
            super(id, themeService, storageService);
            this.options = options;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.layoutService = layoutService;
            this.contextMenuService = contextMenuService;
            this.telemetryService = telemetryService;
            this.extensionService = extensionService;
            this.themeService = themeService;
            this.storageService = storageService;
            this.contextService = contextService;
            this.viewDescriptorService = viewDescriptorService;
            this.paneItems = [];
            this.visible = false;
            this.areExtensionsReady = false;
            this.didLayout = false;
            this.viewDisposables = [];
            this._onTitleAreaUpdate = this._register(new event_1.Emitter());
            this.onTitleAreaUpdate = this._onTitleAreaUpdate.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDidAddViews = this._register(new event_1.Emitter());
            this.onDidAddViews = this._onDidAddViews.event;
            this._onDidRemoveViews = this._register(new event_1.Emitter());
            this.onDidRemoveViews = this._onDidRemoveViews.event;
            this._onDidChangeViewVisibility = this._register(new event_1.Emitter());
            this.onDidChangeViewVisibility = this._onDidChangeViewVisibility.event;
            const container = this.viewDescriptorService.getViewContainerById(id);
            if (!container) {
                throw new Error('Could not find container');
            }
            this.viewContainer = container;
            this.visibleViewsStorageId = `${id}.numberOfVisibleViews`;
            this.visibleViewsCountFromCache = this.storageService.getNumber(this.visibleViewsStorageId, 1 /* WORKSPACE */, undefined);
            this._register(lifecycle_1.toDisposable(() => this.viewDisposables = lifecycle_1.dispose(this.viewDisposables)));
            this.viewContainerModel = this.viewDescriptorService.getViewContainerModel(container);
        }
        get onDidSashChange() {
            return types_1.assertIsDefined(this.paneview).onDidSashChange;
        }
        get panes() {
            return this.paneItems.map(i => i.pane);
        }
        get views() {
            return this.panes;
        }
        get length() {
            return this.paneItems.length;
        }
        create(parent) {
            const options = this.options;
            options.orientation = this.orientation;
            this.paneview = this._register(new paneview_1.PaneView(parent, this.options));
            this._register(this.paneview.onDidDrop(({ from, to }) => this.movePane(from, to)));
            this._register(dom_1.addDisposableListener(parent, dom_1.EventType.CONTEXT_MENU, (e) => this.showContextMenu(new mouseEvent_1.StandardMouseEvent(e))));
            let overlay;
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(parent, {
                onDragEnter: (e) => {
                    if (!overlay && this.panes.length === 0) {
                        const dropData = e.dragAndDropData.getData();
                        if (dropData.type === 'view') {
                            const oldViewContainer = this.viewDescriptorService.getViewContainerByViewId(dropData.id);
                            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(dropData.id);
                            if (oldViewContainer !== this.viewContainer && (!viewDescriptor || !viewDescriptor.canMoveView || this.viewContainer.rejectAddedViews)) {
                                return;
                            }
                            overlay = new ViewPaneDropOverlay(parent, undefined, this.viewDescriptorService.getViewContainerLocation(this.viewContainer), this.themeService);
                        }
                        if (dropData.type === 'composite' && dropData.id !== this.viewContainer.id) {
                            const container = this.viewDescriptorService.getViewContainerById(dropData.id);
                            const viewsToMove = this.viewDescriptorService.getViewContainerModel(container).allViewDescriptors;
                            if (!viewsToMove.some(v => !v.canMoveView) && viewsToMove.length > 0) {
                                overlay = new ViewPaneDropOverlay(parent, undefined, this.viewDescriptorService.getViewContainerLocation(this.viewContainer), this.themeService);
                            }
                        }
                    }
                },
                onDragOver: (e) => {
                    if (this.panes.length === 0) {
                        dnd_1.toggleDropEffect(e.eventData.dataTransfer, 'move', overlay !== undefined);
                    }
                },
                onDragLeave: (e) => {
                    overlay === null || overlay === void 0 ? void 0 : overlay.dispose();
                    overlay = undefined;
                },
                onDrop: (e) => {
                    if (overlay) {
                        const dropData = e.dragAndDropData.getData();
                        const viewsToMove = [];
                        if (dropData.type === 'composite' && dropData.id !== this.viewContainer.id) {
                            const container = this.viewDescriptorService.getViewContainerById(dropData.id);
                            const allViews = this.viewDescriptorService.getViewContainerModel(container).allViewDescriptors;
                            if (!allViews.some(v => !v.canMoveView)) {
                                viewsToMove.push(...allViews);
                            }
                        }
                        else if (dropData.type === 'view') {
                            const oldViewContainer = this.viewDescriptorService.getViewContainerByViewId(dropData.id);
                            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(dropData.id);
                            if (oldViewContainer !== this.viewContainer && viewDescriptor && viewDescriptor.canMoveView) {
                                this.viewDescriptorService.moveViewsToContainer([viewDescriptor], this.viewContainer);
                            }
                        }
                        if (viewsToMove.length > 0) {
                            this.viewDescriptorService.moveViewsToContainer(viewsToMove, this.viewContainer);
                        }
                    }
                    overlay === null || overlay === void 0 ? void 0 : overlay.dispose();
                    overlay = undefined;
                }
            }));
            this._register(this.onDidSashChange(() => this.saveViewSizes()));
            this._register(this.viewContainerModel.onDidAddVisibleViewDescriptors(added => this.onDidAddViewDescriptors(added)));
            this._register(this.viewContainerModel.onDidRemoveVisibleViewDescriptors(removed => this.onDidRemoveViewDescriptors(removed)));
            const addedViews = this.viewContainerModel.visibleViewDescriptors.map((viewDescriptor, index) => {
                const size = this.viewContainerModel.getSize(viewDescriptor.id);
                const collapsed = this.viewContainerModel.isCollapsed(viewDescriptor.id);
                return ({ viewDescriptor, index, size, collapsed });
            });
            if (addedViews.length) {
                this.onDidAddViewDescriptors(addedViews);
            }
            // Update headers after and title contributed views after available, since we read from cache in the beginning to know if the viewlet has single view or not. Ref #29609
            this.extensionService.whenInstalledExtensionsRegistered().then(() => {
                this.areExtensionsReady = true;
                if (this.panes.length) {
                    this.updateTitleArea();
                    this.updateViewHeaders();
                }
            });
        }
        getTitle() {
            const containerTitle = this.viewContainerModel.title;
            if (this.isViewMergedWithContainer()) {
                const paneItemTitle = this.paneItems[0].pane.title;
                if (containerTitle === paneItemTitle) {
                    return this.paneItems[0].pane.title;
                }
                return paneItemTitle ? `${containerTitle}: ${paneItemTitle}` : containerTitle;
            }
            return containerTitle;
        }
        showContextMenu(event) {
            for (const paneItem of this.paneItems) {
                // Do not show context menu if target is coming from inside pane views
                if (dom_1.isAncestor(event.target, paneItem.pane.element)) {
                    return;
                }
            }
            event.stopPropagation();
            event.preventDefault();
            let anchor = { x: event.posx, y: event.posy };
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => this.getContextMenuActions()
            });
        }
        getContextMenuActions(viewDescriptor) {
            const result = [];
            let showHide = true;
            if (!viewDescriptor && this.isViewMergedWithContainer()) {
                viewDescriptor = this.viewDescriptorService.getViewDescriptorById(this.panes[0].id) || undefined;
                showHide = false;
            }
            if (viewDescriptor) {
                if (showHide) {
                    result.push({
                        id: `${viewDescriptor.id}.removeView`,
                        label: nls.localize('hideView', "Hide"),
                        enabled: viewDescriptor.canToggleVisibility,
                        run: () => this.toggleViewVisibility(viewDescriptor.id)
                    });
                }
                const view = this.getView(viewDescriptor.id);
                if (view) {
                    result.push(...view.getContextMenuActions());
                }
            }
            const viewToggleActions = this.viewContainerModel.activeViewDescriptors.map(viewDescriptor => ({
                id: `${viewDescriptor.id}.toggleVisibility`,
                label: viewDescriptor.name,
                checked: this.viewContainerModel.isVisible(viewDescriptor.id),
                enabled: viewDescriptor.canToggleVisibility && (!this.viewContainerModel.isVisible(viewDescriptor.id) || this.viewContainerModel.visibleViewDescriptors.length > 1),
                run: () => this.toggleViewVisibility(viewDescriptor.id)
            }));
            if (result.length && viewToggleActions.length) {
                result.push(new actionbar_1.Separator());
            }
            result.push(...viewToggleActions);
            return result;
        }
        getActions() {
            if (this.isViewMergedWithContainer()) {
                return this.paneItems[0].pane.getActions();
            }
            return [];
        }
        getSecondaryActions() {
            if (this.isViewMergedWithContainer()) {
                return this.paneItems[0].pane.getSecondaryActions();
            }
            return [];
        }
        getActionViewItem(action) {
            if (this.isViewMergedWithContainer()) {
                return this.paneItems[0].pane.getActionViewItem(action);
            }
            return undefined;
        }
        focus() {
            if (this.lastFocusedPane) {
                this.lastFocusedPane.focus();
            }
            else if (this.paneItems.length > 0) {
                for (const { pane: pane } of this.paneItems) {
                    if (pane.isExpanded()) {
                        pane.focus();
                        return;
                    }
                }
            }
        }
        get orientation() {
            if (this.viewDescriptorService.getViewContainerLocation(this.viewContainer) === views_1.ViewContainerLocation.Sidebar) {
                return 0 /* VERTICAL */;
            }
            else {
                return this.layoutService.getPanelPosition() === 2 /* BOTTOM */ ? 1 /* HORIZONTAL */ : 0 /* VERTICAL */;
            }
        }
        layout(dimension) {
            if (this.paneview) {
                if (this.paneview.orientation !== this.orientation) {
                    this.paneview.flipOrientation(dimension.height, dimension.width);
                }
                this.paneview.layout(dimension.height, dimension.width);
            }
            this.dimension = dimension;
            if (this.didLayout) {
                this.saveViewSizes();
            }
            else {
                this.didLayout = true;
                this.restoreViewSizes();
            }
        }
        getOptimalWidth() {
            const additionalMargin = 16;
            const optimalWidth = Math.max(...this.panes.map(view => view.getOptimalWidth() || 0));
            return optimalWidth + additionalMargin;
        }
        addPanes(panes) {
            const wasMerged = this.isViewMergedWithContainer();
            for (const { pane: pane, size, index } of panes) {
                this.addPane(pane, size, index);
            }
            this.updateViewHeaders();
            if (this.isViewMergedWithContainer() !== wasMerged) {
                this.updateTitleArea();
            }
            this._onDidAddViews.fire(panes.map(({ pane }) => pane));
        }
        setVisible(visible) {
            if (this.visible !== !!visible) {
                this.visible = visible;
                this._onDidChangeVisibility.fire(visible);
            }
            this.panes.filter(view => view.isVisible() !== visible)
                .map((view) => view.setVisible(visible));
        }
        isVisible() {
            return this.visible;
        }
        updateTitleArea() {
            this._onTitleAreaUpdate.fire();
        }
        createView(viewDescriptor, options) {
            return this.instantiationService.createInstance(viewDescriptor.ctorDescriptor.ctor, ...(viewDescriptor.ctorDescriptor.staticArguments || []), options);
        }
        getView(id) {
            return this.panes.filter(view => view.id === id)[0];
        }
        saveViewSizes() {
            // Save size only when the layout has happened
            if (this.didLayout) {
                for (const view of this.panes) {
                    this.viewContainerModel.setSize(view.id, this.getPaneSize(view));
                }
            }
        }
        restoreViewSizes() {
            // Restore sizes only when the layout has happened
            if (this.didLayout) {
                let initialSizes;
                for (let i = 0; i < this.viewContainerModel.visibleViewDescriptors.length; i++) {
                    const pane = this.panes[i];
                    const viewDescriptor = this.viewContainerModel.visibleViewDescriptors[i];
                    const size = this.viewContainerModel.getSize(viewDescriptor.id);
                    if (typeof size === 'number') {
                        this.resizePane(pane, size);
                    }
                    else {
                        initialSizes = initialSizes ? initialSizes : this.computeInitialSizes();
                        this.resizePane(pane, initialSizes.get(pane.id) || 200);
                    }
                }
            }
        }
        computeInitialSizes() {
            const sizes = new Map();
            if (this.dimension) {
                const totalWeight = this.viewContainerModel.visibleViewDescriptors.reduce((totalWeight, { weight }) => totalWeight + (weight || 20), 0);
                for (const viewDescriptor of this.viewContainerModel.visibleViewDescriptors) {
                    if (this.orientation === 0 /* VERTICAL */) {
                        sizes.set(viewDescriptor.id, this.dimension.height * (viewDescriptor.weight || 20) / totalWeight);
                    }
                    else {
                        sizes.set(viewDescriptor.id, this.dimension.width * (viewDescriptor.weight || 20) / totalWeight);
                    }
                }
            }
            return sizes;
        }
        saveState() {
            this.panes.forEach((view) => view.saveState());
            this.storageService.store(this.visibleViewsStorageId, this.length, 1 /* WORKSPACE */);
        }
        onContextMenu(event, viewDescriptor) {
            event.stopPropagation();
            event.preventDefault();
            const actions = this.getContextMenuActions(viewDescriptor);
            let anchor = { x: event.posx, y: event.posy };
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions
            });
        }
        openView(id, focus) {
            let view = this.getView(id);
            if (!view) {
                this.toggleViewVisibility(id);
            }
            view = this.getView(id);
            if (view) {
                view.setExpanded(true);
                if (focus) {
                    view.focus();
                }
            }
            return view;
        }
        onDidAddViewDescriptors(added) {
            const panesToAdd = [];
            for (const { viewDescriptor, collapsed, index, size } of added) {
                const pane = this.createView(viewDescriptor, {
                    id: viewDescriptor.id,
                    title: viewDescriptor.name,
                    expanded: !collapsed
                });
                pane.render();
                const contextMenuDisposable = dom_1.addDisposableListener(pane.draggableElement, 'contextmenu', e => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.onContextMenu(new mouseEvent_1.StandardMouseEvent(e), viewDescriptor);
                });
                const collapseDisposable = event_1.Event.latch(event_1.Event.map(pane.onDidChange, () => !pane.isExpanded()))(collapsed => {
                    this.viewContainerModel.setCollapsed(viewDescriptor.id, collapsed);
                });
                this.viewDisposables.splice(index, 0, lifecycle_1.combinedDisposable(contextMenuDisposable, collapseDisposable));
                panesToAdd.push({ pane, size: size || pane.minimumSize, index });
            }
            this.addPanes(panesToAdd);
            this.restoreViewSizes();
            const panes = [];
            for (const { pane } of panesToAdd) {
                pane.setVisible(this.isVisible());
                panes.push(pane);
            }
            return panes;
        }
        onDidRemoveViewDescriptors(removed) {
            removed = removed.sort((a, b) => b.index - a.index);
            const panesToRemove = [];
            for (const { index } of removed) {
                const [disposable] = this.viewDisposables.splice(index, 1);
                disposable.dispose();
                panesToRemove.push(this.panes[index]);
            }
            this.removePanes(panesToRemove);
            for (const pane of panesToRemove) {
                pane.setVisible(false);
            }
        }
        toggleViewVisibility(viewId) {
            // Check if view is active
            if (this.viewContainerModel.activeViewDescriptors.some(viewDescriptor => viewDescriptor.id === viewId)) {
                const visible = !this.viewContainerModel.isVisible(viewId);
                this.telemetryService.publicLog2('views.toggleVisibility', { viewId, visible });
                this.viewContainerModel.setVisible(viewId, visible);
            }
        }
        addPane(pane, size, index = this.paneItems.length - 1) {
            const onDidFocus = pane.onDidFocus(() => this.lastFocusedPane = pane);
            const onDidChangeTitleArea = pane.onDidChangeTitleArea(() => {
                if (this.isViewMergedWithContainer()) {
                    this.updateTitleArea();
                }
            });
            const onDidChangeVisibility = pane.onDidChangeBodyVisibility(() => this._onDidChangeViewVisibility.fire(pane));
            const onDidChange = pane.onDidChange(() => {
                if (pane === this.lastFocusedPane && !pane.isExpanded()) {
                    this.lastFocusedPane = undefined;
                }
            });
            const isPanel = this.viewDescriptorService.getViewContainerLocation(this.viewContainer) === views_1.ViewContainerLocation.Panel;
            const paneStyler = styler_1.attachStyler(this.themeService, {
                headerForeground: isPanel ? theme_1.PANEL_SECTION_HEADER_FOREGROUND : theme_1.SIDE_BAR_SECTION_HEADER_FOREGROUND,
                headerBackground: isPanel ? theme_1.PANEL_SECTION_HEADER_BACKGROUND : theme_1.SIDE_BAR_SECTION_HEADER_BACKGROUND,
                headerBorder: isPanel ? theme_1.PANEL_SECTION_HEADER_BORDER : theme_1.SIDE_BAR_SECTION_HEADER_BORDER,
                dropBackground: isPanel ? theme_1.PANEL_SECTION_DRAG_AND_DROP_BACKGROUND : theme_1.SIDE_BAR_DRAG_AND_DROP_BACKGROUND,
                leftBorder: isPanel ? theme_1.PANEL_SECTION_BORDER : undefined
            }, pane);
            const disposable = lifecycle_1.combinedDisposable(pane, onDidFocus, onDidChangeTitleArea, paneStyler, onDidChange, onDidChangeVisibility);
            const paneItem = { pane, disposable };
            this.paneItems.splice(index, 0, paneItem);
            types_1.assertIsDefined(this.paneview).addPane(pane, size, index);
            let overlay;
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerDraggable(pane.draggableElement, () => { return { type: 'view', id: pane.id }; }, {}));
            this._register(dnd_1.CompositeDragAndDropObserver.INSTANCE.registerTarget(pane.dropTargetElement, {
                onDragEnter: (e) => {
                    var _a, _b;
                    if (!overlay) {
                        const dropData = e.dragAndDropData.getData();
                        if (dropData.type === 'view' && dropData.id !== pane.id) {
                            const oldViewContainer = this.viewDescriptorService.getViewContainerByViewId(dropData.id);
                            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(dropData.id);
                            if (oldViewContainer !== this.viewContainer && (!viewDescriptor || !viewDescriptor.canMoveView || this.viewContainer.rejectAddedViews)) {
                                return;
                            }
                            overlay = new ViewPaneDropOverlay(pane.dropTargetElement, (_a = this.orientation) !== null && _a !== void 0 ? _a : 0 /* VERTICAL */, this.viewDescriptorService.getViewContainerLocation(this.viewContainer), this.themeService);
                        }
                        if (dropData.type === 'composite' && dropData.id !== this.viewContainer.id && !this.viewContainer.rejectAddedViews) {
                            const container = this.viewDescriptorService.getViewContainerById(dropData.id);
                            const viewsToMove = this.viewDescriptorService.getViewContainerModel(container).allViewDescriptors;
                            if (!viewsToMove.some(v => !v.canMoveView) && viewsToMove.length > 0) {
                                overlay = new ViewPaneDropOverlay(pane.dropTargetElement, (_b = this.orientation) !== null && _b !== void 0 ? _b : 0 /* VERTICAL */, this.viewDescriptorService.getViewContainerLocation(this.viewContainer), this.themeService);
                            }
                        }
                    }
                },
                onDragOver: (e) => {
                    dnd_1.toggleDropEffect(e.eventData.dataTransfer, 'move', overlay !== undefined);
                },
                onDragLeave: (e) => {
                    overlay === null || overlay === void 0 ? void 0 : overlay.dispose();
                    overlay = undefined;
                },
                onDrop: (e) => {
                    if (overlay) {
                        const dropData = e.dragAndDropData.getData();
                        const viewsToMove = [];
                        let anchorView;
                        if (dropData.type === 'composite' && dropData.id !== this.viewContainer.id && !this.viewContainer.rejectAddedViews) {
                            const container = this.viewDescriptorService.getViewContainerById(dropData.id);
                            const allViews = this.viewDescriptorService.getViewContainerModel(container).allViewDescriptors;
                            if (allViews.length > 0 && !allViews.some(v => !v.canMoveView)) {
                                viewsToMove.push(...allViews);
                                anchorView = allViews[0];
                            }
                        }
                        else if (dropData.type === 'view') {
                            const oldViewContainer = this.viewDescriptorService.getViewContainerByViewId(dropData.id);
                            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(dropData.id);
                            if (oldViewContainer !== this.viewContainer && viewDescriptor && viewDescriptor.canMoveView && !this.viewContainer.rejectAddedViews) {
                                viewsToMove.push(viewDescriptor);
                            }
                            if (viewDescriptor) {
                                anchorView = viewDescriptor;
                            }
                        }
                        if (viewsToMove) {
                            this.viewDescriptorService.moveViewsToContainer(viewsToMove, this.viewContainer);
                        }
                        if (anchorView) {
                            if (overlay.currentDropOperation === 1 /* DOWN */ ||
                                overlay.currentDropOperation === 3 /* RIGHT */) {
                                const fromIndex = this.panes.findIndex(p => p.id === anchorView.id);
                                let toIndex = this.panes.findIndex(p => p.id === pane.id);
                                if (fromIndex >= 0 && toIndex >= 0) {
                                    if (fromIndex > toIndex) {
                                        toIndex++;
                                    }
                                    if (toIndex < this.panes.length && toIndex !== fromIndex) {
                                        this.movePane(this.panes[fromIndex], this.panes[toIndex]);
                                    }
                                }
                            }
                            if (overlay.currentDropOperation === 0 /* UP */ ||
                                overlay.currentDropOperation === 2 /* LEFT */) {
                                const fromIndex = this.panes.findIndex(p => p.id === anchorView.id);
                                let toIndex = this.panes.findIndex(p => p.id === pane.id);
                                if (fromIndex >= 0 && toIndex >= 0) {
                                    if (fromIndex < toIndex) {
                                        toIndex--;
                                    }
                                    if (toIndex >= 0 && toIndex !== fromIndex) {
                                        this.movePane(this.panes[fromIndex], this.panes[toIndex]);
                                    }
                                }
                            }
                            if (viewsToMove.length > 1) {
                                viewsToMove.slice(1).forEach(view => {
                                    let toIndex = this.panes.findIndex(p => p.id === anchorView.id);
                                    let fromIndex = this.panes.findIndex(p => p.id === view.id);
                                    if (fromIndex >= 0 && toIndex >= 0) {
                                        if (fromIndex > toIndex) {
                                            toIndex++;
                                        }
                                        if (toIndex < this.panes.length && toIndex !== fromIndex) {
                                            this.movePane(this.panes[fromIndex], this.panes[toIndex]);
                                            anchorView = view;
                                        }
                                    }
                                });
                            }
                        }
                    }
                    overlay === null || overlay === void 0 ? void 0 : overlay.dispose();
                    overlay = undefined;
                }
            }));
        }
        removePanes(panes) {
            const wasMerged = this.isViewMergedWithContainer();
            panes.forEach(pane => this.removePane(pane));
            this.updateViewHeaders();
            if (wasMerged !== this.isViewMergedWithContainer()) {
                this.updateTitleArea();
            }
            this._onDidRemoveViews.fire(panes);
        }
        removePane(pane) {
            const index = arrays_1.firstIndex(this.paneItems, i => i.pane === pane);
            if (index === -1) {
                return;
            }
            if (this.lastFocusedPane === pane) {
                this.lastFocusedPane = undefined;
            }
            types_1.assertIsDefined(this.paneview).removePane(pane);
            const [paneItem] = this.paneItems.splice(index, 1);
            paneItem.disposable.dispose();
        }
        movePane(from, to) {
            const fromIndex = arrays_1.firstIndex(this.paneItems, item => item.pane === from);
            const toIndex = arrays_1.firstIndex(this.paneItems, item => item.pane === to);
            const fromViewDescriptor = this.viewContainerModel.visibleViewDescriptors[fromIndex];
            const toViewDescriptor = this.viewContainerModel.visibleViewDescriptors[toIndex];
            if (fromIndex < 0 || fromIndex >= this.paneItems.length) {
                return;
            }
            if (toIndex < 0 || toIndex >= this.paneItems.length) {
                return;
            }
            const [paneItem] = this.paneItems.splice(fromIndex, 1);
            this.paneItems.splice(toIndex, 0, paneItem);
            types_1.assertIsDefined(this.paneview).movePane(from, to);
            this.viewContainerModel.move(fromViewDescriptor.id, toViewDescriptor.id);
            this.updateTitleArea();
        }
        resizePane(pane, size) {
            types_1.assertIsDefined(this.paneview).resizePane(pane, size);
        }
        getPaneSize(pane) {
            return types_1.assertIsDefined(this.paneview).getPaneSize(pane);
        }
        updateViewHeaders() {
            if (this.isViewMergedWithContainer()) {
                this.paneItems[0].pane.setExpanded(true);
                this.paneItems[0].pane.headerVisible = false;
            }
            else {
                this.paneItems.forEach(i => i.pane.headerVisible = true);
            }
        }
        isViewMergedWithContainer() {
            if (!(this.options.mergeViewWithContainerWhenSingleView && this.paneItems.length === 1)) {
                return false;
            }
            if (!this.areExtensionsReady) {
                if (this.visibleViewsCountFromCache === undefined) {
                    // TODO @sbatten fix hack for #91367
                    return this.viewDescriptorService.getViewContainerLocation(this.viewContainer) === views_1.ViewContainerLocation.Panel;
                }
                // Check in cache so that view do not jump. See #29609
                return this.visibleViewsCountFromCache === 1;
            }
            return true;
        }
        dispose() {
            super.dispose();
            this.paneItems.forEach(i => i.disposable.dispose());
            if (this.paneview) {
                this.paneview.dispose();
            }
        }
    };
    ViewPaneContainer = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, extensions_1.IExtensionService),
        __param(8, themeService_1.IThemeService),
        __param(9, storage_1.IStorageService),
        __param(10, workspace_1.IWorkspaceContextService),
        __param(11, views_1.IViewDescriptorService)
    ], ViewPaneContainer);
    exports.ViewPaneContainer = ViewPaneContainer;
    class MoveViewPosition extends actions_1.Action2 {
        constructor(desc, offset) {
            super(desc);
            this.offset = offset;
        }
        async run(accessor) {
            const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const viewId = views_1.FocusedViewContext.getValue(contextKeyService);
            if (viewId === undefined) {
                return;
            }
            const viewContainer = viewDescriptorService.getViewContainerByViewId(viewId);
            const model = viewDescriptorService.getViewContainerModel(viewContainer);
            const viewDescriptor = model.visibleViewDescriptors.find(vd => vd.id === viewId);
            const currentIndex = model.visibleViewDescriptors.indexOf(viewDescriptor);
            if (currentIndex + this.offset < 0 || currentIndex + this.offset >= model.visibleViewDescriptors.length) {
                return;
            }
            const newPosition = model.visibleViewDescriptors[currentIndex + this.offset];
            model.move(viewDescriptor.id, newPosition.id);
        }
    }
    actions_1.registerAction2(class MoveViewUp extends MoveViewPosition {
        constructor() {
            super({
                id: 'views.moveViewUp',
                title: nls.localize('viewMoveUp', "Move View Up"),
                keybinding: {
                    primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ + 41 /* KEY_K */, 16 /* UpArrow */),
                    weight: 200 /* WorkbenchContrib */ + 1,
                    when: views_1.FocusedViewContext.notEqualsTo('')
                }
            }, -1);
        }
    });
    actions_1.registerAction2(class MoveViewLeft extends MoveViewPosition {
        constructor() {
            super({
                id: 'views.moveViewLeft',
                title: nls.localize('viewMoveLeft', "Move View Left"),
                keybinding: {
                    primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ + 41 /* KEY_K */, 15 /* LeftArrow */),
                    weight: 200 /* WorkbenchContrib */ + 1,
                    when: views_1.FocusedViewContext.notEqualsTo('')
                }
            }, -1);
        }
    });
    actions_1.registerAction2(class MoveViewDown extends MoveViewPosition {
        constructor() {
            super({
                id: 'views.moveViewDown',
                title: nls.localize('viewMoveDown', "Move View Down"),
                keybinding: {
                    primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ + 41 /* KEY_K */, 18 /* DownArrow */),
                    weight: 200 /* WorkbenchContrib */ + 1,
                    when: views_1.FocusedViewContext.notEqualsTo('')
                }
            }, 1);
        }
    });
    actions_1.registerAction2(class MoveViewRight extends MoveViewPosition {
        constructor() {
            super({
                id: 'views.moveViewRight',
                title: nls.localize('viewMoveRight', "Move View Right"),
                keybinding: {
                    primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ + 41 /* KEY_K */, 17 /* RightArrow */),
                    weight: 200 /* WorkbenchContrib */ + 1,
                    when: views_1.FocusedViewContext.notEqualsTo('')
                }
            }, 1);
        }
    });
});
//# __sourceMappingURL=viewPaneContainer.js.map