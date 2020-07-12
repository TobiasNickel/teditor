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
define(["require", "exports", "vs/base/common/async", "vs/base/browser/dom", "vs/base/common/actions", "vs/platform/contextview/browser/contextView", "vs/workbench/contrib/markers/browser/messages", "vs/workbench/contrib/markers/browser/constants", "vs/platform/theme/common/themeService", "vs/platform/theme/common/styler", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/theme/common/colorRegistry", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/browser/contextScopedHistoryWidget", "vs/platform/contextkey/common/contextkey", "vs/base/common/event", "vs/base/browser/ui/dropdown/dropdown", "vs/workbench/common/views", "vs/base/common/codicons"], function (require, exports, async_1, DOM, actions_1, contextView_1, messages_1, constants_1, themeService_1, styler_1, lifecycle_1, actionbar_1, colorRegistry_1, nls_1, instantiation_1, contextScopedHistoryWidget_1, contextkey_1, event_1, dropdown_1, views_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickFixActionViewItem = exports.QuickFixAction = exports.MarkersFilterActionViewItem = exports.MarkersFilters = exports.ShowProblemsPanelAction = void 0;
    let ShowProblemsPanelAction = class ShowProblemsPanelAction extends actions_1.Action {
        constructor(id, label, viewsService) {
            super(id, label);
            this.viewsService = viewsService;
        }
        run() {
            return this.viewsService.openView(constants_1.default.MARKERS_VIEW_ID, true);
        }
    };
    ShowProblemsPanelAction.ID = 'workbench.action.problems.focus';
    ShowProblemsPanelAction.LABEL = messages_1.default.MARKERS_PANEL_SHOW_LABEL;
    ShowProblemsPanelAction = __decorate([
        __param(2, views_1.IViewsService)
    ], ShowProblemsPanelAction);
    exports.ShowProblemsPanelAction = ShowProblemsPanelAction;
    class MarkersFilters extends lifecycle_1.Disposable {
        constructor(options) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._showWarnings = true;
            this._showErrors = true;
            this._showInfos = true;
            this._layout = new DOM.Dimension(0, 0);
            this._filterText = options.filterText;
            this._showErrors = options.showErrors;
            this._showWarnings = options.showWarnings;
            this._showInfos = options.showInfos;
            this._excludedFiles = options.excludedFiles;
            this._activeFile = options.activeFile;
            this.filterHistory = options.filterHistory;
            this._layout = options.layout;
        }
        get filterText() {
            return this._filterText;
        }
        set filterText(filterText) {
            if (this._filterText !== filterText) {
                this._filterText = filterText;
                this._onDidChange.fire({ filterText: true });
            }
        }
        get excludedFiles() {
            return this._excludedFiles;
        }
        set excludedFiles(filesExclude) {
            if (this._excludedFiles !== filesExclude) {
                this._excludedFiles = filesExclude;
                this._onDidChange.fire({ excludedFiles: true });
            }
        }
        get activeFile() {
            return this._activeFile;
        }
        set activeFile(activeFile) {
            if (this._activeFile !== activeFile) {
                this._activeFile = activeFile;
                this._onDidChange.fire({ activeFile: true });
            }
        }
        get showWarnings() {
            return this._showWarnings;
        }
        set showWarnings(showWarnings) {
            if (this._showWarnings !== showWarnings) {
                this._showWarnings = showWarnings;
                this._onDidChange.fire({ showWarnings: true });
            }
        }
        get showErrors() {
            return this._showErrors;
        }
        set showErrors(showErrors) {
            if (this._showErrors !== showErrors) {
                this._showErrors = showErrors;
                this._onDidChange.fire({ showErrors: true });
            }
        }
        get showInfos() {
            return this._showInfos;
        }
        set showInfos(showInfos) {
            if (this._showInfos !== showInfos) {
                this._showInfos = showInfos;
                this._onDidChange.fire({ showInfos: true });
            }
        }
        get layout() {
            return this._layout;
        }
        set layout(layout) {
            if (this._layout.width !== layout.width || this._layout.height !== layout.height) {
                this._layout = layout;
                this._onDidChange.fire({ layout: true });
            }
        }
    }
    exports.MarkersFilters = MarkersFilters;
    let FiltersDropdownMenuActionViewItem = class FiltersDropdownMenuActionViewItem extends dropdown_1.DropdownMenuActionViewItem {
        constructor(action, filters, actionRunner, contextMenuService) {
            super(action, { getActions: () => this.getActions() }, contextMenuService, action => undefined, actionRunner, undefined, action.class, () => { return 1 /* RIGHT */; });
            this.filters = filters;
        }
        render(container) {
            super.render(container);
            this.updateChecked();
        }
        getActions() {
            return [
                {
                    checked: this.filters.showErrors,
                    class: undefined,
                    enabled: true,
                    id: 'showErrors',
                    label: messages_1.default.MARKERS_PANEL_FILTER_LABEL_SHOW_ERRORS,
                    run: async () => this.filters.showErrors = !this.filters.showErrors,
                    tooltip: '',
                    dispose: () => null
                },
                {
                    checked: this.filters.showWarnings,
                    class: undefined,
                    enabled: true,
                    id: 'showWarnings',
                    label: messages_1.default.MARKERS_PANEL_FILTER_LABEL_SHOW_WARNINGS,
                    run: async () => this.filters.showWarnings = !this.filters.showWarnings,
                    tooltip: '',
                    dispose: () => null
                },
                {
                    checked: this.filters.showInfos,
                    class: undefined,
                    enabled: true,
                    id: 'showInfos',
                    label: messages_1.default.MARKERS_PANEL_FILTER_LABEL_SHOW_INFOS,
                    run: async () => this.filters.showInfos = !this.filters.showInfos,
                    tooltip: '',
                    dispose: () => null
                },
                new actionbar_1.Separator(),
                {
                    checked: this.filters.activeFile,
                    class: undefined,
                    enabled: true,
                    id: 'activeFile',
                    label: messages_1.default.MARKERS_PANEL_FILTER_LABEL_ACTIVE_FILE,
                    run: async () => this.filters.activeFile = !this.filters.activeFile,
                    tooltip: '',
                    dispose: () => null
                },
                {
                    checked: this.filters.excludedFiles,
                    class: undefined,
                    enabled: true,
                    id: 'useFilesExclude',
                    label: messages_1.default.MARKERS_PANEL_FILTER_LABEL_EXCLUDED_FILES,
                    run: async () => this.filters.excludedFiles = !this.filters.excludedFiles,
                    tooltip: '',
                    dispose: () => null
                },
            ];
        }
        updateChecked() {
            DOM.toggleClass(this.element, 'checked', this._action.checked);
        }
    };
    FiltersDropdownMenuActionViewItem = __decorate([
        __param(3, contextView_1.IContextMenuService)
    ], FiltersDropdownMenuActionViewItem);
    let MarkersFilterActionViewItem = class MarkersFilterActionViewItem extends actionbar_1.BaseActionViewItem {
        constructor(action, filterController, instantiationService, contextViewService, themeService, contextKeyService) {
            super(null, action);
            this.filterController = filterController;
            this.instantiationService = instantiationService;
            this.contextViewService = contextViewService;
            this.themeService = themeService;
            this.container = null;
            this.filterInputBox = null;
            this.filterBadge = null;
            this.focusContextKey = constants_1.default.MarkerViewFilterFocusContextKey.bindTo(contextKeyService);
            this.delayedFilterUpdate = new async_1.Delayer(200);
            this._register(lifecycle_1.toDisposable(() => this.delayedFilterUpdate.cancel()));
            this._register(filterController.onDidFocusFilter(() => this.focus()));
            this._register(filterController.onDidClearFilterText(() => this.clearFilterText()));
            this.filtersAction = new actions_1.Action('markersFiltersAction', messages_1.default.MARKERS_PANEL_ACTION_TOOLTIP_MORE_FILTERS, 'markers-filters codicon-filter');
            this.filtersAction.checked = this.hasFiltersChanged();
            this._register(filterController.filters.onDidChange(e => this.onDidFiltersChange(e)));
        }
        render(container) {
            this.container = container;
            DOM.addClass(this.container, 'markers-panel-action-filter-container');
            this.element = DOM.append(this.container, DOM.$(''));
            this.element.className = this.class;
            this.createInput(this.element);
            this.createControls(this.element);
            this.updateClass();
            this.adjustInputBox();
        }
        focus() {
            if (this.filterInputBox) {
                this.filterInputBox.focus();
            }
        }
        clearFilterText() {
            if (this.filterInputBox) {
                this.filterInputBox.value = '';
            }
        }
        onDidFiltersChange(e) {
            this.filtersAction.checked = this.hasFiltersChanged();
            if (e.layout) {
                this.updateClass();
            }
        }
        hasFiltersChanged() {
            return !this.filterController.filters.showErrors || !this.filterController.filters.showWarnings || !this.filterController.filters.showInfos || this.filterController.filters.excludedFiles || this.filterController.filters.activeFile;
        }
        createInput(container) {
            this.filterInputBox = this._register(this.instantiationService.createInstance(contextScopedHistoryWidget_1.ContextScopedHistoryInputBox, container, this.contextViewService, {
                placeholder: messages_1.default.MARKERS_PANEL_FILTER_PLACEHOLDER,
                ariaLabel: messages_1.default.MARKERS_PANEL_FILTER_ARIA_LABEL,
                history: this.filterController.filters.filterHistory
            }));
            this._register(styler_1.attachInputBoxStyler(this.filterInputBox, this.themeService));
            this.filterInputBox.value = this.filterController.filters.filterText;
            this._register(this.filterInputBox.onDidChange(filter => this.delayedFilterUpdate.trigger(() => this.onDidInputChange(this.filterInputBox))));
            this._register(this.filterController.filters.onDidChange((event) => {
                if (event.filterText) {
                    this.filterInputBox.value = this.filterController.filters.filterText;
                }
            }));
            this._register(DOM.addStandardDisposableListener(this.filterInputBox.inputElement, DOM.EventType.KEY_DOWN, (e) => this.onInputKeyDown(e, this.filterInputBox)));
            this._register(DOM.addStandardDisposableListener(container, DOM.EventType.KEY_DOWN, this.handleKeyboardEvent));
            this._register(DOM.addStandardDisposableListener(container, DOM.EventType.KEY_UP, this.handleKeyboardEvent));
            this._register(DOM.addStandardDisposableListener(this.filterInputBox.inputElement, DOM.EventType.CLICK, (e) => {
                e.stopPropagation();
                e.preventDefault();
            }));
            const focusTracker = this._register(DOM.trackFocus(this.filterInputBox.inputElement));
            this._register(focusTracker.onDidFocus(() => this.focusContextKey.set(true)));
            this._register(focusTracker.onDidBlur(() => this.focusContextKey.set(false)));
            this._register(lifecycle_1.toDisposable(() => this.focusContextKey.reset()));
        }
        createControls(container) {
            const controlsContainer = DOM.append(container, DOM.$('.markers-panel-filter-controls'));
            this.createBadge(controlsContainer);
            this.createFilters(controlsContainer);
        }
        createBadge(container) {
            const filterBadge = this.filterBadge = DOM.append(container, DOM.$('.markers-panel-filter-badge'));
            this._register(styler_1.attachStylerCallback(this.themeService, { badgeBackground: colorRegistry_1.badgeBackground, badgeForeground: colorRegistry_1.badgeForeground, contrastBorder: colorRegistry_1.contrastBorder }, colors => {
                const background = colors.badgeBackground ? colors.badgeBackground.toString() : '';
                const foreground = colors.badgeForeground ? colors.badgeForeground.toString() : '';
                const border = colors.contrastBorder ? colors.contrastBorder.toString() : '';
                filterBadge.style.backgroundColor = background;
                filterBadge.style.borderWidth = border ? '1px' : '';
                filterBadge.style.borderStyle = border ? 'solid' : '';
                filterBadge.style.borderColor = border;
                filterBadge.style.color = foreground;
            }));
            this.updateBadge();
            this._register(this.filterController.onDidChangeFilterStats(() => this.updateBadge()));
        }
        createFilters(container) {
            const actionbar = this._register(new actionbar_1.ActionBar(container, {
                actionViewItemProvider: action => {
                    if (action.id === this.filtersAction.id) {
                        return this.instantiationService.createInstance(FiltersDropdownMenuActionViewItem, action, this.filterController.filters, this.actionRunner);
                    }
                    return undefined;
                }
            }));
            actionbar.push(this.filtersAction, { icon: true, label: false });
        }
        onDidInputChange(inputbox) {
            inputbox.addToHistory();
            this.filterController.filters.filterText = inputbox.value;
            this.filterController.filters.filterHistory = inputbox.getHistory();
        }
        updateBadge() {
            if (this.filterBadge) {
                const { total, filtered } = this.filterController.getFilterStats();
                DOM.toggleClass(this.filterBadge, 'hidden', total === filtered || filtered === 0);
                this.filterBadge.textContent = nls_1.localize('showing filtered problems', "Showing {0} of {1}", filtered, total);
                this.adjustInputBox();
            }
        }
        adjustInputBox() {
            if (this.element && this.filterInputBox && this.filterBadge) {
                this.filterInputBox.inputElement.style.paddingRight = DOM.hasClass(this.element, 'small') || DOM.hasClass(this.filterBadge, 'hidden') ? '25px' : '150px';
            }
        }
        // Action toolbar is swallowing some keys for action items which should not be for an input box
        handleKeyboardEvent(event) {
            if (event.equals(10 /* Space */)
                || event.equals(15 /* LeftArrow */)
                || event.equals(17 /* RightArrow */)
                || event.equals(9 /* Escape */)) {
                event.stopPropagation();
            }
        }
        onInputKeyDown(event, filterInputBox) {
            let handled = false;
            if (event.equals(9 /* Escape */)) {
                this.clearFilterText();
                handled = true;
            }
            if (handled) {
                event.stopPropagation();
                event.preventDefault();
            }
        }
        updateClass() {
            if (this.element && this.container) {
                this.element.className = this.class;
                DOM.toggleClass(this.container, 'grow', DOM.hasClass(this.element, 'grow'));
                this.adjustInputBox();
            }
        }
        get class() {
            if (this.filterController.filters.layout.width > 600) {
                return 'markers-panel-action-filter grow';
            }
            else if (this.filterController.filters.layout.width < 400) {
                return 'markers-panel-action-filter small';
            }
            else {
                return 'markers-panel-action-filter';
            }
        }
    };
    MarkersFilterActionViewItem = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, contextView_1.IContextViewService),
        __param(4, themeService_1.IThemeService),
        __param(5, contextkey_1.IContextKeyService)
    ], MarkersFilterActionViewItem);
    exports.MarkersFilterActionViewItem = MarkersFilterActionViewItem;
    class QuickFixAction extends actions_1.Action {
        constructor(marker) {
            super(QuickFixAction.ID, messages_1.default.MARKERS_PANEL_ACTION_TOOLTIP_QUICKFIX, QuickFixAction.CLASS, false);
            this.marker = marker;
            this._onShowQuickFixes = this._register(new event_1.Emitter());
            this.onShowQuickFixes = this._onShowQuickFixes.event;
            this._quickFixes = [];
        }
        get quickFixes() {
            return this._quickFixes;
        }
        set quickFixes(quickFixes) {
            this._quickFixes = quickFixes;
            this.enabled = this._quickFixes.length > 0;
        }
        autoFixable(autofixable) {
            this.class = autofixable ? QuickFixAction.AUTO_FIX_CLASS : QuickFixAction.CLASS;
        }
        run() {
            this._onShowQuickFixes.fire();
            return Promise.resolve();
        }
    }
    exports.QuickFixAction = QuickFixAction;
    QuickFixAction.ID = 'workbench.actions.problems.quickfix';
    QuickFixAction.CLASS = 'markers-panel-action-quickfix ' + codicons_1.Codicon.lightBulb.classNames;
    QuickFixAction.AUTO_FIX_CLASS = QuickFixAction.CLASS + ' autofixable';
    let QuickFixActionViewItem = class QuickFixActionViewItem extends actionbar_1.ActionViewItem {
        constructor(action, contextMenuService) {
            super(null, action, { icon: true, label: false });
            this.contextMenuService = contextMenuService;
        }
        onClick(event) {
            DOM.EventHelper.stop(event, true);
            this.showQuickFixes();
        }
        showQuickFixes() {
            if (!this.element) {
                return;
            }
            if (!this.isEnabled()) {
                return;
            }
            const elementPosition = DOM.getDomNodePagePosition(this.element);
            const quickFixes = this.getAction().quickFixes;
            if (quickFixes.length) {
                this.contextMenuService.showContextMenu({
                    getAnchor: () => ({ x: elementPosition.left + 10, y: elementPosition.top + elementPosition.height + 4 }),
                    getActions: () => quickFixes
                });
            }
        }
    };
    QuickFixActionViewItem = __decorate([
        __param(1, contextView_1.IContextMenuService)
    ], QuickFixActionViewItem);
    exports.QuickFixActionViewItem = QuickFixActionViewItem;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const inputActiveOptionBorderColor = theme.getColor(colorRegistry_1.inputActiveOptionBorder);
        if (inputActiveOptionBorderColor) {
            collector.addRule(`.markers-panel-action-filter > .markers-panel-filter-controls > .monaco-action-bar .action-label.markers-filters.checked { border-color: ${inputActiveOptionBorderColor}; }`);
        }
        const inputActiveOptionForegroundColor = theme.getColor(colorRegistry_1.inputActiveOptionForeground);
        if (inputActiveOptionForegroundColor) {
            collector.addRule(`.markers-panel-action-filter > .markers-panel-filter-controls > .monaco-action-bar .action-label.markers-filters.checked { color: ${inputActiveOptionForegroundColor}; }`);
        }
        const inputActiveOptionBackgroundColor = theme.getColor(colorRegistry_1.inputActiveOptionBackground);
        if (inputActiveOptionBackgroundColor) {
            collector.addRule(`.markers-panel-action-filter > .markers-panel-filter-controls > .monaco-action-bar .action-label.markers-filters.checked { background-color: ${inputActiveOptionBackgroundColor}; }`);
        }
    });
});
//# __sourceMappingURL=markersViewActions.js.map