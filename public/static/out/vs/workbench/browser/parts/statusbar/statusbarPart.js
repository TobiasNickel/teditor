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
define(["require", "exports", "vs/nls", "vs/base/common/errorMessage", "vs/base/common/lifecycle", "vs/base/browser/ui/codicons/codiconLabel", "vs/platform/commands/common/commands", "vs/workbench/browser/part", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/statusbar/common/statusbar", "vs/platform/contextview/browser/contextView", "vs/base/common/actions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/workspace/common/workspace", "vs/platform/theme/common/colorRegistry", "vs/editor/common/editorCommon", "vs/base/common/color", "vs/base/browser/dom", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/extensions", "vs/base/common/arrays", "vs/base/browser/mouseEvent", "vs/workbench/browser/actions/layoutActions", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/types", "vs/base/common/event", "vs/platform/userDataSync/common/storageKeys", "vs/base/browser/keyboardEvent", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/contextkey/common/contextkey", "vs/css!./media/statusbarpart"], function (require, exports, nls, errorMessage_1, lifecycle_1, codiconLabel_1, commands_1, part_1, instantiation_1, telemetry_1, statusbar_1, contextView_1, actions_1, themeService_1, theme_1, workspace_1, colorRegistry_1, editorCommon_1, color_1, dom_1, notification_1, storage_1, layoutService_1, extensions_1, arrays_1, mouseEvent_1, layoutActions_1, actionbar_1, types_1, event_1, storageKeys_1, keyboardEvent_1, keybindingsRegistry_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatusbarPart = void 0;
    const CONTEXT_STATUS_BAR_FOCUSED = new contextkey_1.RawContextKey('statusBarFocused', false);
    class StatusbarViewModel extends lifecycle_1.Disposable {
        constructor(storageService) {
            super();
            this.storageService = storageService;
            this._entries = [];
            this._onDidChangeEntryVisibility = this._register(new event_1.Emitter());
            this.onDidChangeEntryVisibility = this._onDidChangeEntryVisibility.event;
            this.restoreState();
            this.registerListeners();
        }
        get entries() { return this._entries; }
        get lastFocusedEntry() {
            return this._lastFocusedEntry && !this.isHidden(this._lastFocusedEntry.id) ? this._lastFocusedEntry : undefined;
        }
        restoreState() {
            const hiddenRaw = this.storageService.get(StatusbarViewModel.HIDDEN_ENTRIES_KEY, 0 /* GLOBAL */);
            if (hiddenRaw) {
                try {
                    const hiddenArray = JSON.parse(hiddenRaw);
                    this.hidden = new Set(hiddenArray);
                }
                catch (error) {
                    // ignore parsing errors
                }
            }
            if (!this.hidden) {
                this.hidden = new Set();
            }
        }
        registerListeners() {
            this._register(this.storageService.onDidChangeStorage(e => this.onDidStorageChange(e)));
        }
        onDidStorageChange(event) {
            if (event.key === StatusbarViewModel.HIDDEN_ENTRIES_KEY && event.scope === 0 /* GLOBAL */) {
                // Keep current hidden entries
                const currentlyHidden = new Set(this.hidden);
                // Load latest state of hidden entries
                this.hidden.clear();
                this.restoreState();
                const changed = new Set();
                // Check for each entry that is now visible
                currentlyHidden.forEach(id => {
                    if (!this.hidden.has(id)) {
                        changed.add(id);
                    }
                });
                // Check for each entry that is now hidden
                this.hidden.forEach(id => {
                    if (!currentlyHidden.has(id)) {
                        changed.add(id);
                    }
                });
                // Update visibility for entries have changed
                if (changed.size > 0) {
                    this._entries.forEach(entry => {
                        if (changed.has(entry.id)) {
                            this.updateVisibility(entry.id, true);
                            changed.delete(entry.id);
                        }
                    });
                }
            }
        }
        add(entry) {
            this._entries.push(entry); // intentionally not using a map here since multiple entries can have the same ID!
            // Update visibility directly
            this.updateVisibility(entry, false);
            // Sort according to priority
            this.sort();
            // Mark first/last visible entry
            this.markFirstLastVisibleEntry();
            return lifecycle_1.toDisposable(() => this.remove(entry));
        }
        remove(entry) {
            const index = this._entries.indexOf(entry);
            if (index >= 0) {
                this._entries.splice(index, 1);
                // Mark first/last visible entry
                this.markFirstLastVisibleEntry();
            }
        }
        isHidden(id) {
            return this.hidden.has(id);
        }
        hide(id) {
            if (!this.hidden.has(id)) {
                this.hidden.add(id);
                this.updateVisibility(id, true);
                this.saveState();
            }
        }
        show(id) {
            if (this.hidden.has(id)) {
                this.hidden.delete(id);
                this.updateVisibility(id, true);
                this.saveState();
            }
        }
        findEntry(container) {
            return this._entries.find(entry => entry.container === container);
        }
        getEntries(alignment) {
            return this._entries.filter(entry => entry.alignment === alignment);
        }
        focusNextEntry() {
            this.focusEntry(+1, 0);
        }
        focusPreviousEntry() {
            this.focusEntry(-1, this.entries.length - 1);
        }
        focusEntry(delta, restartPosition) {
            const getVisibleEntry = (start) => {
                let indexToFocus = start;
                let entry = (indexToFocus >= 0 && indexToFocus < this._entries.length) ? this._entries[indexToFocus] : undefined;
                while (entry && this.isHidden(entry.id)) {
                    indexToFocus += delta;
                    entry = (indexToFocus >= 0 && indexToFocus < this._entries.length) ? this._entries[indexToFocus] : undefined;
                }
                return entry;
            };
            const focused = this._entries.find(entry => dom_1.isAncestor(document.activeElement, entry.container));
            if (focused) {
                const entry = getVisibleEntry(this._entries.indexOf(focused) + delta);
                if (entry) {
                    this._lastFocusedEntry = entry;
                    entry.labelContainer.focus();
                    return;
                }
            }
            const entry = getVisibleEntry(restartPosition);
            if (entry) {
                this._lastFocusedEntry = entry;
                entry.labelContainer.focus();
            }
        }
        updateVisibility(arg1, trigger) {
            // By identifier
            if (typeof arg1 === 'string') {
                const id = arg1;
                for (const entry of this._entries) {
                    if (entry.id === id) {
                        this.updateVisibility(entry, trigger);
                    }
                }
            }
            // By entry
            else {
                const entry = arg1;
                const isHidden = this.isHidden(entry.id);
                // Use CSS to show/hide item container
                if (isHidden) {
                    dom_1.hide(entry.container);
                }
                else {
                    dom_1.show(entry.container);
                }
                if (trigger) {
                    this._onDidChangeEntryVisibility.fire({ id: entry.id, visible: !isHidden });
                }
                // Mark first/last visible entry
                this.markFirstLastVisibleEntry();
            }
        }
        saveState() {
            if (this.hidden.size > 0) {
                this.storageService.store(StatusbarViewModel.HIDDEN_ENTRIES_KEY, JSON.stringify(Array.from(this.hidden.values())), 0 /* GLOBAL */);
            }
            else {
                this.storageService.remove(StatusbarViewModel.HIDDEN_ENTRIES_KEY, 0 /* GLOBAL */);
            }
        }
        sort() {
            const mapEntryToIndex = new Map();
            this._entries.forEach((entry, index) => mapEntryToIndex.set(entry, index));
            this._entries.sort((entryA, entryB) => {
                if (entryA.alignment === entryB.alignment) {
                    if (entryA.priority !== entryB.priority) {
                        return entryB.priority - entryA.priority; // higher priority towards the left
                    }
                    const indexA = mapEntryToIndex.get(entryA);
                    const indexB = mapEntryToIndex.get(entryB);
                    return indexA - indexB; // otherwise maintain stable order (both values known to be in map)
                }
                if (entryA.alignment === 0 /* LEFT */) {
                    return -1;
                }
                if (entryB.alignment === 0 /* LEFT */) {
                    return 1;
                }
                return 0;
            });
        }
        markFirstLastVisibleEntry() {
            this.doMarkFirstLastVisibleStatusbarItem(this.getEntries(0 /* LEFT */));
            this.doMarkFirstLastVisibleStatusbarItem(this.getEntries(1 /* RIGHT */));
        }
        doMarkFirstLastVisibleStatusbarItem(entries) {
            let firstVisibleItem;
            let lastVisibleItem;
            for (const entry of entries) {
                // Clear previous first
                dom_1.removeClasses(entry.container, 'first-visible-item', 'last-visible-item');
                const isVisible = !this.isHidden(entry.id);
                if (isVisible) {
                    if (!firstVisibleItem) {
                        firstVisibleItem = entry;
                    }
                    lastVisibleItem = entry;
                }
            }
            // Mark: first visible item
            if (firstVisibleItem) {
                dom_1.addClass(firstVisibleItem.container, 'first-visible-item');
            }
            // Mark: last visible item
            if (lastVisibleItem) {
                dom_1.addClass(lastVisibleItem.container, 'last-visible-item');
            }
        }
    }
    StatusbarViewModel.HIDDEN_ENTRIES_KEY = 'workbench.statusbar.hidden';
    class ToggleStatusbarEntryVisibilityAction extends actions_1.Action {
        constructor(id, label, model) {
            super(id, label, undefined, true);
            this.model = model;
            this.checked = !model.isHidden(id);
        }
        async run() {
            if (this.model.isHidden(this.id)) {
                this.model.show(this.id);
            }
            else {
                this.model.hide(this.id);
            }
        }
    }
    class HideStatusbarEntryAction extends actions_1.Action {
        constructor(id, name, model) {
            super(id, nls.localize('hide', "Hide '{0}'", name), undefined, true);
            this.model = model;
        }
        async run() {
            this.model.hide(this.id);
        }
    }
    let StatusbarPart = class StatusbarPart extends part_1.Part {
        constructor(instantiationService, themeService, contextService, storageService, layoutService, contextMenuService, contextKeyService, storageKeysSyncRegistryService) {
            super("workbench.parts.statusbar" /* STATUSBAR_PART */, { hasTitle: false }, themeService, storageService, layoutService);
            this.instantiationService = instantiationService;
            this.contextService = contextService;
            this.storageService = storageService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            //#region IView
            this.minimumWidth = 0;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = 22;
            this.maximumHeight = 22;
            this.pendingEntries = [];
            this.viewModel = this._register(new StatusbarViewModel(this.storageService));
            this.onDidChangeEntryVisibility = this.viewModel.onDidChangeEntryVisibility;
            storageKeysSyncRegistryService.registerStorageKey({ key: StatusbarViewModel.HIDDEN_ENTRIES_KEY, version: 1 });
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateStyles()));
        }
        addEntry(entry, id, name, alignment, priority = 0) {
            // As long as we have not been created into a container yet, record all entries
            // that are pending so that they can get created at a later point
            if (!this.element) {
                return this.doAddPendingEntry(entry, id, name, alignment, priority);
            }
            // Otherwise add to view
            return this.doAddEntry(entry, id, name, alignment, priority);
        }
        doAddPendingEntry(entry, id, name, alignment, priority) {
            const pendingEntry = { entry, id, name, alignment, priority };
            this.pendingEntries.push(pendingEntry);
            const accessor = {
                update: (entry) => {
                    if (pendingEntry.accessor) {
                        pendingEntry.accessor.update(entry);
                    }
                    else {
                        pendingEntry.entry = entry;
                    }
                },
                dispose: () => {
                    if (pendingEntry.accessor) {
                        pendingEntry.accessor.dispose();
                    }
                    else {
                        this.pendingEntries = this.pendingEntries.filter(entry => entry !== pendingEntry);
                    }
                }
            };
            return accessor;
        }
        doAddEntry(entry, id, name, alignment, priority) {
            // Create item
            const itemContainer = this.doCreateStatusItem(id, alignment, ...arrays_1.coalesce([entry.showBeak ? 'has-beak' : undefined]));
            const item = this.instantiationService.createInstance(StatusbarEntryItem, itemContainer, entry);
            // Append to parent
            this.appendOneStatusbarEntry(itemContainer, alignment, priority);
            // Add to view model
            const viewModelEntry = { id, name, alignment, priority, container: itemContainer, labelContainer: item.labelContainer };
            const viewModelEntryDispose = this.viewModel.add(viewModelEntry);
            return {
                update: entry => {
                    item.update(entry);
                },
                dispose: () => {
                    lifecycle_1.dispose(viewModelEntryDispose);
                    itemContainer.remove();
                    lifecycle_1.dispose(item);
                }
            };
        }
        isEntryVisible(id) {
            return !this.viewModel.isHidden(id);
        }
        updateEntryVisibility(id, visible) {
            if (visible) {
                this.viewModel.show(id);
            }
            else {
                this.viewModel.hide(id);
            }
        }
        focusNextEntry() {
            this.viewModel.focusNextEntry();
        }
        focusPreviousEntry() {
            this.viewModel.focusPreviousEntry();
        }
        focus(preserveEntryFocus = true) {
            var _a;
            (_a = this.getContainer()) === null || _a === void 0 ? void 0 : _a.focus();
            const lastFocusedEntry = this.viewModel.lastFocusedEntry;
            if (preserveEntryFocus && lastFocusedEntry) {
                // Need a timeout, for some reason without it the inner label container will not get focused
                setTimeout(() => lastFocusedEntry.labelContainer.focus(), 0);
            }
        }
        createContentArea(parent) {
            this.element = parent;
            // Track focus within container
            const scopedContextKeyService = this.contextKeyService.createScoped(this.element);
            CONTEXT_STATUS_BAR_FOCUSED.bindTo(scopedContextKeyService).set(true);
            // Left items container
            this.leftItemsContainer = document.createElement('div');
            dom_1.addClasses(this.leftItemsContainer, 'left-items', 'items-container');
            this.element.appendChild(this.leftItemsContainer);
            this.element.tabIndex = -1;
            // Right items container
            this.rightItemsContainer = document.createElement('div');
            dom_1.addClasses(this.rightItemsContainer, 'right-items', 'items-container');
            this.element.appendChild(this.rightItemsContainer);
            // Context menu support
            this._register(dom_1.addDisposableListener(parent, dom_1.EventType.CONTEXT_MENU, e => this.showContextMenu(e)));
            // Initial status bar entries
            this.createInitialStatusbarEntries();
            return this.element;
        }
        createInitialStatusbarEntries() {
            // Add items in order according to alignment
            this.appendAllStatusbarEntries();
            // Fill in pending entries if any
            while (this.pendingEntries.length) {
                const pending = this.pendingEntries.shift();
                if (pending) {
                    pending.accessor = this.addEntry(pending.entry, pending.id, pending.name, pending.alignment, pending.priority);
                }
            }
        }
        appendAllStatusbarEntries() {
            // Append in order of priority
            [
                ...this.viewModel.getEntries(0 /* LEFT */),
                ...this.viewModel.getEntries(1 /* RIGHT */).reverse() // reversing due to flex: row-reverse
            ].forEach(entry => {
                const target = types_1.assertIsDefined(entry.alignment === 0 /* LEFT */ ? this.leftItemsContainer : this.rightItemsContainer);
                target.appendChild(entry.container);
            });
        }
        appendOneStatusbarEntry(itemContainer, alignment, priority) {
            const entries = this.viewModel.getEntries(alignment);
            if (alignment === 1 /* RIGHT */) {
                entries.reverse(); // reversing due to flex: row-reverse
            }
            const target = types_1.assertIsDefined(alignment === 0 /* LEFT */ ? this.leftItemsContainer : this.rightItemsContainer);
            // find an entry that has lower priority than the new one
            // and then insert the item before that one
            let appended = false;
            for (const entry of entries) {
                if (alignment === 0 /* LEFT */ && entry.priority < priority ||
                    alignment === 1 /* RIGHT */ && entry.priority > priority // reversing due to flex: row-reverse
                ) {
                    target.insertBefore(itemContainer, entry.container);
                    appended = true;
                    break;
                }
            }
            // Fallback to just appending otherwise
            if (!appended) {
                target.appendChild(itemContainer);
            }
        }
        showContextMenu(e) {
            dom_1.EventHelper.stop(e, true);
            const event = new mouseEvent_1.StandardMouseEvent(e);
            let actions = undefined;
            this.contextMenuService.showContextMenu({
                getAnchor: () => ({ x: event.posx, y: event.posy }),
                getActions: () => {
                    actions = this.getContextMenuActions(event);
                    return actions;
                },
                onHide: () => {
                    if (actions) {
                        lifecycle_1.dispose(actions);
                    }
                }
            });
        }
        getContextMenuActions(event) {
            const actions = [];
            // Provide an action to hide the status bar at last
            actions.push(this.instantiationService.createInstance(layoutActions_1.ToggleStatusbarVisibilityAction, layoutActions_1.ToggleStatusbarVisibilityAction.ID, nls.localize('hideStatusBar', "Hide Status Bar")));
            actions.push(new actionbar_1.Separator());
            // Show an entry per known status entry
            // Note: even though entries have an identifier, there can be multiple entries
            // having the same identifier (e.g. from extensions). So we make sure to only
            // show a single entry per identifier we handled.
            const handledEntries = new Set();
            this.viewModel.entries.forEach(entry => {
                if (!handledEntries.has(entry.id)) {
                    actions.push(new ToggleStatusbarEntryVisibilityAction(entry.id, entry.name, this.viewModel));
                    handledEntries.add(entry.id);
                }
            });
            // Figure out if mouse is over an entry
            let statusEntryUnderMouse = undefined;
            for (let element = event.target; element; element = element.parentElement) {
                const entry = this.viewModel.findEntry(element);
                if (entry) {
                    statusEntryUnderMouse = entry;
                    break;
                }
            }
            if (statusEntryUnderMouse) {
                actions.push(new actionbar_1.Separator());
                actions.push(new HideStatusbarEntryAction(statusEntryUnderMouse.id, statusEntryUnderMouse.name, this.viewModel));
            }
            return actions;
        }
        updateStyles() {
            super.updateStyles();
            const container = types_1.assertIsDefined(this.getContainer());
            // Background colors
            const backgroundColor = this.getColor(this.contextService.getWorkbenchState() !== 1 /* EMPTY */ ? theme_1.STATUS_BAR_BACKGROUND : theme_1.STATUS_BAR_NO_FOLDER_BACKGROUND) || '';
            container.style.backgroundColor = backgroundColor;
            container.style.color = this.getColor(this.contextService.getWorkbenchState() !== 1 /* EMPTY */ ? theme_1.STATUS_BAR_FOREGROUND : theme_1.STATUS_BAR_NO_FOLDER_FOREGROUND) || '';
            // Border color
            const borderColor = this.getColor(this.contextService.getWorkbenchState() !== 1 /* EMPTY */ ? theme_1.STATUS_BAR_BORDER : theme_1.STATUS_BAR_NO_FOLDER_BORDER) || this.getColor(colorRegistry_1.contrastBorder);
            if (borderColor) {
                dom_1.addClass(container, 'status-border-top');
                container.style.setProperty('--status-border-top-color', borderColor.toString());
            }
            else {
                dom_1.removeClass(container, 'status-border-top');
                container.style.removeProperty('--status-border-top-color');
            }
            // Notification Beak
            if (!this.styleElement) {
                this.styleElement = dom_1.createStyleSheet(container);
            }
            this.styleElement.innerHTML = `.monaco-workbench .part.statusbar > .items-container > .statusbar-item.has-beak:before { border-bottom-color: ${backgroundColor}; }`;
        }
        doCreateStatusItem(id, alignment, ...extraClasses) {
            const itemContainer = document.createElement('div');
            itemContainer.id = id;
            dom_1.addClass(itemContainer, 'statusbar-item');
            if (extraClasses) {
                dom_1.addClasses(itemContainer, ...extraClasses);
            }
            if (alignment === 1 /* RIGHT */) {
                dom_1.addClass(itemContainer, 'right');
            }
            else {
                dom_1.addClass(itemContainer, 'left');
            }
            return itemContainer;
        }
        layout(width, height) {
            super.layout(width, height);
            super.layoutContents(width, height);
        }
        toJSON() {
            return {
                type: "workbench.parts.statusbar" /* STATUSBAR_PART */
            };
        }
    };
    StatusbarPart = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, themeService_1.IThemeService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, storageKeys_1.IStorageKeysSyncRegistryService)
    ], StatusbarPart);
    exports.StatusbarPart = StatusbarPart;
    let StatusbarEntryItem = class StatusbarEntryItem extends lifecycle_1.Disposable {
        constructor(container, entry, commandService, notificationService, telemetryService, themeService) {
            super();
            this.container = container;
            this.commandService = commandService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.themeService = themeService;
            this.foregroundListener = this._register(new lifecycle_1.MutableDisposable());
            this.backgroundListener = this._register(new lifecycle_1.MutableDisposable());
            this.commandMouseListener = this._register(new lifecycle_1.MutableDisposable());
            this.commandKeyboardListener = this._register(new lifecycle_1.MutableDisposable());
            this.create();
            this.update(entry);
        }
        create() {
            // Label Container
            this.labelContainer = document.createElement('a');
            this.labelContainer.tabIndex = -1; // allows screen readers to read title, but still prevents tab focus.
            this.labelContainer.setAttribute('role', 'button');
            // Label
            this.label = new codiconLabel_1.CodiconLabel(this.labelContainer);
            // Add to parent
            this.container.appendChild(this.labelContainer);
        }
        update(entry) {
            // Update: Text
            if (!this.entry || entry.text !== this.entry.text) {
                this.label.text = entry.text;
                if (entry.text) {
                    dom_1.show(this.labelContainer);
                }
                else {
                    dom_1.hide(this.labelContainer);
                }
            }
            if (!this.entry || entry.ariaLabel !== this.entry.ariaLabel) {
                // Set the aria label on both elements so screen readers would read the correct thing without duplication #96210
                this.container.setAttribute('aria-label', entry.ariaLabel);
                this.labelContainer.setAttribute('aria-label', entry.ariaLabel);
            }
            // Update: Tooltip (on the container, because label can be disabled)
            if (!this.entry || entry.tooltip !== this.entry.tooltip) {
                if (entry.tooltip) {
                    this.container.title = entry.tooltip;
                }
                else {
                    this.container.title = '';
                }
            }
            // Update: Command
            if (!this.entry || entry.command !== this.entry.command) {
                this.commandMouseListener.clear();
                this.commandKeyboardListener.clear();
                const command = entry.command;
                if (command) {
                    this.commandMouseListener.value = dom_1.addDisposableListener(this.labelContainer, dom_1.EventType.CLICK, () => this.executeCommand(command));
                    this.commandKeyboardListener.value = dom_1.addDisposableListener(this.labelContainer, dom_1.EventType.KEY_DOWN, e => {
                        const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                        if (event.equals(10 /* Space */) || event.equals(3 /* Enter */)) {
                            this.executeCommand(command);
                        }
                    });
                    dom_1.removeClass(this.labelContainer, 'disabled');
                }
                else {
                    dom_1.addClass(this.labelContainer, 'disabled');
                }
            }
            // Update: Beak
            if (!this.entry || entry.showBeak !== this.entry.showBeak) {
                if (entry.showBeak) {
                    dom_1.addClass(this.container, 'has-beak');
                }
                else {
                    dom_1.removeClass(this.container, 'has-beak');
                }
            }
            // Update: Foreground
            if (!this.entry || entry.color !== this.entry.color) {
                this.applyColor(this.labelContainer, entry.color);
            }
            // Update: Background
            if (!this.entry || entry.backgroundColor !== this.entry.backgroundColor) {
                if (entry.backgroundColor) {
                    this.applyColor(this.container, entry.backgroundColor, true);
                    dom_1.addClass(this.container, 'has-background-color');
                }
                else {
                    dom_1.removeClass(this.container, 'has-background-color');
                }
            }
            // Remember for next round
            this.entry = entry;
        }
        async executeCommand(command) {
            var _a;
            const id = typeof command === 'string' ? command : command.id;
            const args = typeof command === 'string' ? [] : (_a = command.arguments) !== null && _a !== void 0 ? _a : [];
            this.telemetryService.publicLog2('workbenchActionExecuted', { id, from: 'status bar' });
            try {
                await this.commandService.executeCommand(id, ...args);
            }
            catch (error) {
                this.notificationService.error(errorMessage_1.toErrorMessage(error));
            }
        }
        applyColor(container, color, isBackground) {
            let colorResult = null;
            if (isBackground) {
                this.backgroundListener.clear();
            }
            else {
                this.foregroundListener.clear();
            }
            if (color) {
                if (editorCommon_1.isThemeColor(color)) {
                    colorResult = (this.themeService.getColorTheme().getColor(color.id) || color_1.Color.transparent).toString();
                    const listener = this.themeService.onDidColorThemeChange(theme => {
                        const colorValue = (theme.getColor(color.id) || color_1.Color.transparent).toString();
                        if (isBackground) {
                            container.style.backgroundColor = colorValue;
                        }
                        else {
                            container.style.color = colorValue;
                        }
                    });
                    if (isBackground) {
                        this.backgroundListener.value = listener;
                    }
                    else {
                        this.foregroundListener.value = listener;
                    }
                }
                else {
                    colorResult = color;
                }
            }
            if (isBackground) {
                container.style.backgroundColor = colorResult || '';
            }
            else {
                container.style.color = colorResult || '';
            }
        }
        dispose() {
            super.dispose();
            lifecycle_1.dispose(this.foregroundListener);
            lifecycle_1.dispose(this.backgroundListener);
            lifecycle_1.dispose(this.commandMouseListener);
            lifecycle_1.dispose(this.commandKeyboardListener);
        }
    };
    StatusbarEntryItem = __decorate([
        __param(2, commands_1.ICommandService),
        __param(3, notification_1.INotificationService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, themeService_1.IThemeService)
    ], StatusbarEntryItem);
    themeService_1.registerThemingParticipant((theme, collector) => {
        if (theme.type !== themeService_1.HIGH_CONTRAST) {
            const statusBarItemHoverBackground = theme.getColor(theme_1.STATUS_BAR_ITEM_HOVER_BACKGROUND);
            if (statusBarItemHoverBackground) {
                collector.addRule(`.monaco-workbench .part.statusbar > .items-container > .statusbar-item a:hover { background-color: ${statusBarItemHoverBackground}; }`);
                collector.addRule(`.monaco-workbench .part.statusbar > .items-container > .statusbar-item a:focus { background-color: ${statusBarItemHoverBackground}; }`);
            }
            const statusBarItemActiveBackground = theme.getColor(theme_1.STATUS_BAR_ITEM_ACTIVE_BACKGROUND);
            if (statusBarItemActiveBackground) {
                collector.addRule(`.monaco-workbench .part.statusbar > .items-container > .statusbar-item a:active { background-color: ${statusBarItemActiveBackground}; }`);
            }
        }
        const activeContrastBorderColor = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (activeContrastBorderColor) {
            collector.addRule(`
			.monaco-workbench .part.statusbar > .items-container > .statusbar-item a:focus,
			.monaco-workbench .part.statusbar > .items-container > .statusbar-item a:active {
				outline: 1px solid ${activeContrastBorderColor} !important;
				outline-offset: -1px;
			}
		`);
            collector.addRule(`
			.monaco-workbench .part.statusbar > .items-container > .statusbar-item a:hover {
				outline: 1px dashed ${activeContrastBorderColor};
				outline-offset: -1px;
			}
		`);
        }
        const statusBarProminentItemForeground = theme.getColor(theme_1.STATUS_BAR_PROMINENT_ITEM_FOREGROUND);
        if (statusBarProminentItemForeground) {
            collector.addRule(`.monaco-workbench .part.statusbar > .items-container > .statusbar-item .status-bar-info { color: ${statusBarProminentItemForeground}; }`);
        }
        const statusBarProminentItemBackground = theme.getColor(theme_1.STATUS_BAR_PROMINENT_ITEM_BACKGROUND);
        if (statusBarProminentItemBackground) {
            collector.addRule(`.monaco-workbench .part.statusbar > .items-container > .statusbar-item .status-bar-info { background-color: ${statusBarProminentItemBackground}; }`);
        }
        const statusBarProminentItemHoverBackground = theme.getColor(theme_1.STATUS_BAR_PROMINENT_ITEM_HOVER_BACKGROUND);
        if (statusBarProminentItemHoverBackground) {
            collector.addRule(`.monaco-workbench .part.statusbar > .items-container > .statusbar-item a.status-bar-info:hover { background-color: ${statusBarProminentItemHoverBackground}; }`);
        }
    });
    extensions_1.registerSingleton(statusbar_1.IStatusbarService, StatusbarPart);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.focusPrevious',
        weight: 200 /* WorkbenchContrib */,
        primary: 15 /* LeftArrow */,
        secondary: [16 /* UpArrow */],
        when: CONTEXT_STATUS_BAR_FOCUSED,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            statusBarService.focusPreviousEntry();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.focusNext',
        weight: 200 /* WorkbenchContrib */,
        primary: 17 /* RightArrow */,
        secondary: [18 /* DownArrow */],
        when: CONTEXT_STATUS_BAR_FOCUSED,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            statusBarService.focusNextEntry();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.focusFirst',
        weight: 200 /* WorkbenchContrib */,
        primary: 14 /* Home */,
        when: CONTEXT_STATUS_BAR_FOCUSED,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            statusBarService.focus(false);
            statusBarService.focusNextEntry();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.focusLast',
        weight: 200 /* WorkbenchContrib */,
        primary: 13 /* End */,
        when: CONTEXT_STATUS_BAR_FOCUSED,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            statusBarService.focus(false);
            statusBarService.focusPreviousEntry();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.clearFocus',
        weight: 200 /* WorkbenchContrib */,
        primary: 9 /* Escape */,
        when: CONTEXT_STATUS_BAR_FOCUSED,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            statusBarService.focus(false);
        }
    });
});
//# __sourceMappingURL=statusbarPart.js.map