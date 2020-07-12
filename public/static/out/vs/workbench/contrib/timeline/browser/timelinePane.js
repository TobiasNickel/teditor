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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/cancellation", "vs/base/common/date", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/strings", "vs/base/common/uri", "vs/base/browser/ui/iconLabel/iconLabel", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/list/browser/listService", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/timeline/common/timeline", "vs/workbench/services/editor/common/editorService", "vs/workbench/common/editor", "vs/platform/commands/common/commands", "vs/platform/theme/common/themeService", "vs/workbench/common/views", "vs/platform/progress/common/progress", "vs/platform/opener/common/opener", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/telemetry/common/telemetry", "vs/css!./media/timelinePane"], function (require, exports, nls_1, DOM, actions_1, cancellation_1, date_1, decorators_1, event_1, filters_1, iterator_1, lifecycle_1, network_1, path_1, strings_1, uri_1, iconLabel_1, viewPaneContainer_1, listService_1, keybinding_1, contextView_1, contextkey_1, configuration_1, instantiation_1, timeline_1, editorService_1, editor_1, commands_1, themeService_1, views_1, progress_1, opener_1, actionbar_1, menuEntryActionViewItem_1, actions_2, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimelineListVirtualDelegate = exports.TimelineKeyboardNavigationLabelProvider = exports.TimelineIdentityProvider = exports.TimelineElementTemplate = exports.TimelinePane = exports.TimelineFollowActiveEditorContext = void 0;
    const ItemHeight = 22;
    function isLoadMoreCommand(item) {
        return item instanceof LoadMoreCommand;
    }
    function isTimelineItem(item) {
        var _a;
        return (_a = !(item === null || item === void 0 ? void 0 : item.handle.startsWith('vscode-command:'))) !== null && _a !== void 0 ? _a : false;
    }
    function updateRelativeTime(item, lastRelativeTime) {
        item.relativeTime = isTimelineItem(item) ? date_1.fromNow(item.timestamp) : undefined;
        if (lastRelativeTime === undefined || item.relativeTime !== lastRelativeTime) {
            lastRelativeTime = item.relativeTime;
            item.hideRelativeTime = false;
        }
        else {
            item.hideRelativeTime = true;
        }
        return lastRelativeTime;
    }
    class TimelineAggregate {
        constructor(timeline) {
            var _a;
            this._stale = false;
            this._requiresReset = false;
            this.source = timeline.source;
            this.items = timeline.items;
            this._cursor = (_a = timeline.paging) === null || _a === void 0 ? void 0 : _a.cursor;
            this.lastRenderedIndex = -1;
        }
        get cursor() {
            return this._cursor;
        }
        get more() {
            return this._cursor !== undefined;
        }
        get newest() {
            return this.items[0];
        }
        get oldest() {
            return this.items[this.items.length - 1];
        }
        add(timeline, options) {
            var _a, _b, _c, _d, _e;
            let updated = false;
            if (timeline.items.length !== 0 && this.items.length !== 0) {
                updated = true;
                const ids = new Set();
                const timestamps = new Set();
                for (const item of timeline.items) {
                    if (item.id === undefined) {
                        timestamps.add(item.timestamp);
                    }
                    else {
                        ids.add(item.id);
                    }
                }
                // Remove any duplicate items
                let i = this.items.length;
                let item;
                while (i--) {
                    item = this.items[i];
                    if ((item.id !== undefined && ids.has(item.id)) || timestamps.has(item.timestamp)) {
                        this.items.splice(i, 1);
                    }
                }
                if (((_b = (_a = timeline.items[timeline.items.length - 1]) === null || _a === void 0 ? void 0 : _a.timestamp) !== null && _b !== void 0 ? _b : 0) >= ((_d = (_c = this.newest) === null || _c === void 0 ? void 0 : _c.timestamp) !== null && _d !== void 0 ? _d : 0)) {
                    this.items.splice(0, 0, ...timeline.items);
                }
                else {
                    this.items.push(...timeline.items);
                }
            }
            else if (timeline.items.length !== 0) {
                updated = true;
                this.items.push(...timeline.items);
            }
            // If we are not requesting more recent items than we have, then update the cursor
            if (options.cursor !== undefined || typeof options.limit !== 'object') {
                this._cursor = (_e = timeline.paging) === null || _e === void 0 ? void 0 : _e.cursor;
            }
            if (updated) {
                this.items.sort((a, b) => (b.timestamp - a.timestamp) ||
                    (a.source === undefined
                        ? b.source === undefined ? 0 : 1
                        : b.source === undefined ? -1 : b.source.localeCompare(a.source, undefined, { numeric: true, sensitivity: 'base' })));
            }
            return updated;
        }
        get stale() {
            return this._stale;
        }
        get requiresReset() {
            return this._requiresReset;
        }
        invalidate(requiresReset) {
            this._stale = true;
            this._requiresReset = requiresReset;
        }
    }
    class LoadMoreCommand {
        constructor(loading) {
            this.handle = 'vscode-command:loadMore';
            this.timestamp = 0;
            this.description = undefined;
            this.detail = undefined;
            this.contextValue = undefined;
            // Make things easier for duck typing
            this.id = undefined;
            this.icon = undefined;
            this.iconDark = undefined;
            this.source = undefined;
            this.relativeTime = undefined;
            this.hideRelativeTime = undefined;
            this._loading = false;
            this._loading = loading;
        }
        get loading() {
            return this._loading;
        }
        set loading(value) {
            this._loading = value;
        }
        get ariaLabel() {
            return this.label;
        }
        get label() {
            return this.loading ? nls_1.localize('timeline.loadingMore', "Loading...") : nls_1.localize('timeline.loadMore', "Load more");
        }
        get themeIcon() {
            return undefined; //this.loading ? { id: 'sync~spin' } : undefined;
        }
    }
    exports.TimelineFollowActiveEditorContext = new contextkey_1.RawContextKey('timelineFollowActiveEditor', true);
    let TimelinePane = class TimelinePane extends viewPaneContainer_1.ViewPane {
        constructor(options, keybindingService, contextMenuService, contextKeyService, configurationService, viewDescriptorService, instantiationService, editorService, commandService, progressService, timelineService, openerService, themeService, telemetryService) {
            super(Object.assign(Object.assign({}, options), { titleMenuId: actions_2.MenuId.TimelineTitle }), keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.keybindingService = keybindingService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.commandService = commandService;
            this.progressService = progressService;
            this.timelineService = timelineService;
            this.pendingRequests = new Map();
            this.timelinesBySource = new Map();
            this._followActiveEditor = true;
            this._isEmpty = true;
            this._maxItemCount = 0;
            this._visibleItemCount = 0;
            this._pendingRefresh = false;
            this.commands = this._register(this.instantiationService.createInstance(TimelinePaneCommands, this));
            this.followActiveEditorContext = exports.TimelineFollowActiveEditorContext.bindTo(this.contextKeyService);
            this.excludedSources = new Set(configurationService.getValue('timeline.excludeSources'));
            configurationService.onDidChangeConfiguration(this.onConfigurationChanged, this);
            this._register(timelineService.onDidChangeProviders(this.onProvidersChanged, this));
            this._register(timelineService.onDidChangeTimeline(this.onTimelineChanged, this));
            this._register(timelineService.onDidChangeUri(uri => this.setUri(uri), this));
        }
        get followActiveEditor() {
            return this._followActiveEditor;
        }
        set followActiveEditor(value) {
            if (this._followActiveEditor === value) {
                return;
            }
            this._followActiveEditor = value;
            this.followActiveEditorContext.set(value);
            this.titleDescription = this.titleDescription;
            if (value) {
                this.onActiveEditorChanged();
            }
        }
        get pageOnScroll() {
            var _a;
            if (this._pageOnScroll === undefined) {
                this._pageOnScroll = (_a = this.configurationService.getValue('timeline.pageOnScroll')) !== null && _a !== void 0 ? _a : false;
            }
            return this._pageOnScroll;
        }
        get pageSize() {
            let pageSize = this.configurationService.getValue('timeline.pageSize');
            // eslint-disable-next-line eqeqeq
            if (pageSize == null) {
                // If we are paging when scrolling, then add an extra item to the end to make sure the "Load more" item is out of view
                pageSize = Math.max(20, Math.floor((this.tree.renderHeight / ItemHeight) + (this.pageOnScroll ? 1 : -1)));
            }
            return pageSize;
        }
        reset() {
            this.loadTimeline(true);
        }
        setUri(uri) {
            this.setUriCore(uri, true);
        }
        setUriCore(uri, disableFollowing) {
            var _a;
            if (disableFollowing) {
                this.followActiveEditor = false;
            }
            this.uri = uri;
            this.titleDescription = uri ? path_1.basename(uri.fsPath) : '';
            (_a = this.treeRenderer) === null || _a === void 0 ? void 0 : _a.setUri(uri);
            this.loadTimeline(true);
        }
        onConfigurationChanged(e) {
            if (e.affectsConfiguration('timeline.pageOnScroll')) {
                this._pageOnScroll = undefined;
            }
            if (e.affectsConfiguration('timeline.excludeSources')) {
                this.excludedSources = new Set(this.configurationService.getValue('timeline.excludeSources'));
                const missing = this.timelineService.getSources()
                    .filter(({ id }) => !this.excludedSources.has(id) && !this.timelinesBySource.has(id));
                if (missing.length !== 0) {
                    this.loadTimeline(true, missing.map(({ id }) => id));
                }
                else {
                    this.refresh();
                }
            }
        }
        onActiveEditorChanged() {
            var _a, _b, _c, _d;
            if (!this.followActiveEditor) {
                return;
            }
            let uri;
            const editor = this.editorService.activeEditor;
            if (editor) {
                uri = editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            }
            if (((uri === null || uri === void 0 ? void 0 : uri.toString(true)) === ((_a = this.uri) === null || _a === void 0 ? void 0 : _a.toString(true)) && uri !== undefined) ||
                // Fallback to match on fsPath if we are dealing with files or git schemes
                ((uri === null || uri === void 0 ? void 0 : uri.fsPath) === ((_b = this.uri) === null || _b === void 0 ? void 0 : _b.fsPath) && ((uri === null || uri === void 0 ? void 0 : uri.scheme) === 'file' || (uri === null || uri === void 0 ? void 0 : uri.scheme) === 'git') && (((_c = this.uri) === null || _c === void 0 ? void 0 : _c.scheme) === 'file' || ((_d = this.uri) === null || _d === void 0 ? void 0 : _d.scheme) === 'git'))) {
                // If the uri hasn't changed, make sure we have valid caches
                for (const source of this.timelineService.getSources()) {
                    if (this.excludedSources.has(source.id)) {
                        continue;
                    }
                    const timeline = this.timelinesBySource.get(source.id);
                    if (timeline !== undefined && !timeline.stale) {
                        continue;
                    }
                    if (timeline !== undefined) {
                        this.updateTimeline(timeline, timeline.requiresReset);
                    }
                    else {
                        this.loadTimelineForSource(source.id, uri, true);
                    }
                }
                return;
            }
            this.setUriCore(uri, false);
        }
        onProvidersChanged(e) {
            if (e.removed) {
                for (const source of e.removed) {
                    this.timelinesBySource.delete(source);
                }
                this.refresh();
            }
            if (e.added) {
                this.loadTimeline(true, e.added);
            }
        }
        onTimelineChanged(e) {
            var _a;
            if ((e === null || e === void 0 ? void 0 : e.uri) === undefined || e.uri.toString(true) !== ((_a = this.uri) === null || _a === void 0 ? void 0 : _a.toString(true))) {
                const timeline = this.timelinesBySource.get(e.id);
                if (timeline === undefined) {
                    return;
                }
                if (this.isBodyVisible()) {
                    this.updateTimeline(timeline, e.reset);
                }
                else {
                    timeline.invalidate(e.reset);
                }
            }
        }
        get titleDescription() {
            return this._titleDescription;
        }
        set titleDescription(description) {
            this._titleDescription = description;
            if (this.followActiveEditor || !description) {
                this.$titleDescription.textContent = description !== null && description !== void 0 ? description : '';
            }
            else {
                this.$titleDescription.textContent = `${description} (pinned)`;
            }
        }
        get message() {
            return this._message;
        }
        set message(message) {
            this._message = message;
            this.updateMessage();
        }
        updateMessage() {
            if (this._message !== undefined) {
                this.showMessage(this._message);
            }
            else {
                this.hideMessage();
            }
        }
        showMessage(message) {
            DOM.removeClass(this.$message, 'hide');
            this.resetMessageElement();
            this.$message.textContent = message;
        }
        hideMessage() {
            this.resetMessageElement();
            DOM.addClass(this.$message, 'hide');
        }
        resetMessageElement() {
            DOM.clearNode(this.$message);
        }
        get hasVisibleItems() {
            return this._visibleItemCount > 0;
        }
        clear(cancelPending) {
            this._visibleItemCount = 0;
            this._maxItemCount = this.pageSize;
            this.timelinesBySource.clear();
            if (cancelPending) {
                for (const { tokenSource } of this.pendingRequests.values()) {
                    tokenSource.dispose(true);
                }
                this.pendingRequests.clear();
                if (!this.isBodyVisible()) {
                    this.tree.setChildren(null, undefined);
                    this._isEmpty = true;
                }
            }
        }
        async loadTimeline(reset, sources) {
            var _a, _b, _c;
            // If we have no source, we are reseting all sources, so cancel everything in flight and reset caches
            if (sources === undefined) {
                if (reset) {
                    this.clear(true);
                }
                // TODO@eamodio: Are these the right the list of schemes to exclude? Is there a better way?
                if (((_a = this.uri) === null || _a === void 0 ? void 0 : _a.scheme) === network_1.Schemas.vscodeSettings || ((_b = this.uri) === null || _b === void 0 ? void 0 : _b.scheme) === network_1.Schemas.webviewPanel || ((_c = this.uri) === null || _c === void 0 ? void 0 : _c.scheme) === network_1.Schemas.walkThrough) {
                    this.uri = undefined;
                    this.clear(false);
                    this.refresh();
                    return;
                }
                if (this._isEmpty && this.uri !== undefined) {
                    this.setLoadingUriMessage();
                }
            }
            if (this.uri === undefined) {
                this.clear(false);
                this.refresh();
                return;
            }
            if (!this.isBodyVisible()) {
                return;
            }
            let hasPendingRequests = false;
            for (const source of sources !== null && sources !== void 0 ? sources : this.timelineService.getSources().map(s => s.id)) {
                const requested = this.loadTimelineForSource(source, this.uri, reset);
                if (requested) {
                    hasPendingRequests = true;
                }
            }
            if (!hasPendingRequests) {
                this.refresh();
            }
            else if (this._isEmpty) {
                this.setLoadingUriMessage();
            }
        }
        loadTimelineForSource(source, uri, reset, options) {
            if (this.excludedSources.has(source)) {
                return false;
            }
            const timeline = this.timelinesBySource.get(source);
            // If we are paging, and there are no more items or we have enough cached items to cover the next page,
            // don't bother querying for more
            if (!reset &&
                (options === null || options === void 0 ? void 0 : options.cursor) !== undefined &&
                timeline !== undefined &&
                (!(timeline === null || timeline === void 0 ? void 0 : timeline.more) || timeline.items.length > timeline.lastRenderedIndex + this.pageSize)) {
                return false;
            }
            if (options === undefined) {
                options = { cursor: reset ? undefined : timeline === null || timeline === void 0 ? void 0 : timeline.cursor, limit: this.pageSize };
            }
            let request = this.pendingRequests.get(source);
            if (request !== undefined) {
                options.cursor = request.options.cursor;
                // TODO@eamodio deal with concurrent requests better
                if (typeof options.limit === 'number') {
                    if (typeof request.options.limit === 'number') {
                        options.limit += request.options.limit;
                    }
                    else {
                        options.limit = request.options.limit;
                    }
                }
            }
            request === null || request === void 0 ? void 0 : request.tokenSource.dispose(true);
            request = this.timelineService.getTimeline(source, uri, options, new cancellation_1.CancellationTokenSource(), { cacheResults: true, resetCache: reset });
            if (request === undefined) {
                return false;
            }
            this.pendingRequests.set(source, request);
            request.tokenSource.token.onCancellationRequested(() => this.pendingRequests.delete(source));
            this.handleRequest(request);
            return true;
        }
        updateTimeline(timeline, reset) {
            if (reset) {
                this.timelinesBySource.delete(timeline.source);
                // Override the limit, to re-query for all our existing cached (possibly visible) items to keep visual continuity
                const { oldest } = timeline;
                this.loadTimelineForSource(timeline.source, this.uri, true, oldest !== undefined ? { limit: { timestamp: oldest.timestamp, id: oldest.id } } : undefined);
            }
            else {
                // Override the limit, to query for any newer items
                const { newest } = timeline;
                this.loadTimelineForSource(timeline.source, this.uri, false, newest !== undefined ? { limit: { timestamp: newest.timestamp, id: newest.id } } : { limit: this.pageSize });
            }
        }
        async handleRequest(request) {
            let response;
            try {
                response = await this.progressService.withProgress({ location: this.id }, () => request.result);
            }
            finally {
                this.pendingRequests.delete(request.source);
            }
            if (response === undefined ||
                request.tokenSource.token.isCancellationRequested ||
                request.uri !== this.uri) {
                if (this.pendingRequests.size === 0 && this._pendingRefresh) {
                    this.refresh();
                }
                return;
            }
            const source = request.source;
            let updated = false;
            const timeline = this.timelinesBySource.get(source);
            if (timeline === undefined) {
                this.timelinesBySource.set(source, new TimelineAggregate(response));
                updated = true;
            }
            else {
                updated = timeline.add(response, request.options);
            }
            if (updated) {
                this._pendingRefresh = true;
                // If we have visible items already and there are other pending requests, debounce for a bit to wait for other requests
                if (this.hasVisibleItems && this.pendingRequests.size !== 0) {
                    this.refreshDebounced();
                }
                else {
                    this.refresh();
                }
            }
            else if (this.pendingRequests.size === 0) {
                if (this._pendingRefresh) {
                    this.refresh();
                }
                else {
                    this.tree.rerender();
                }
            }
        }
        *getItems() {
            let more = false;
            if (this.uri === undefined || this.timelinesBySource.size === 0) {
                this._visibleItemCount = 0;
                return;
            }
            const maxCount = this._maxItemCount;
            let count = 0;
            if (this.timelinesBySource.size === 1) {
                const [source, timeline] = iterator_1.Iterable.first(this.timelinesBySource);
                timeline.lastRenderedIndex = -1;
                if (this.excludedSources.has(source)) {
                    this._visibleItemCount = 0;
                    return;
                }
                if (timeline.items.length !== 0) {
                    // If we have any items, just say we have one for now -- the real count will be updated below
                    this._visibleItemCount = 1;
                }
                more = timeline.more;
                let lastRelativeTime;
                for (const item of timeline.items) {
                    item.relativeTime = undefined;
                    item.hideRelativeTime = undefined;
                    count++;
                    if (count > maxCount) {
                        more = true;
                        break;
                    }
                    lastRelativeTime = updateRelativeTime(item, lastRelativeTime);
                    yield { element: item };
                }
                timeline.lastRenderedIndex = count - 1;
            }
            else {
                const sources = [];
                let hasAnyItems = false;
                let mostRecentEnd = 0;
                for (const [source, timeline] of this.timelinesBySource) {
                    timeline.lastRenderedIndex = -1;
                    if (this.excludedSources.has(source) || timeline.stale) {
                        continue;
                    }
                    if (timeline.items.length !== 0) {
                        hasAnyItems = true;
                    }
                    if (timeline.more) {
                        more = true;
                        const last = timeline.items[Math.min(maxCount, timeline.items.length - 1)];
                        if (last.timestamp > mostRecentEnd) {
                            mostRecentEnd = last.timestamp;
                        }
                    }
                    const iterator = timeline.items[Symbol.iterator]();
                    sources.push({ timeline: timeline, iterator: iterator, nextItem: iterator.next() });
                }
                this._visibleItemCount = hasAnyItems ? 1 : 0;
                function getNextMostRecentSource() {
                    return sources
                        .filter(source => !source.nextItem.done)
                        .reduce((previous, current) => (previous === undefined || current.nextItem.value.timestamp >= previous.nextItem.value.timestamp) ? current : previous, undefined);
                }
                let lastRelativeTime;
                let nextSource;
                while (nextSource = getNextMostRecentSource()) {
                    nextSource.timeline.lastRenderedIndex++;
                    const item = nextSource.nextItem.value;
                    item.relativeTime = undefined;
                    item.hideRelativeTime = undefined;
                    if (item.timestamp >= mostRecentEnd) {
                        count++;
                        if (count > maxCount) {
                            more = true;
                            break;
                        }
                        lastRelativeTime = updateRelativeTime(item, lastRelativeTime);
                        yield { element: item };
                    }
                    nextSource.nextItem = nextSource.iterator.next();
                }
            }
            this._visibleItemCount = count;
            if (more) {
                yield {
                    element: new LoadMoreCommand(this.pendingRequests.size !== 0)
                };
            }
            else if (this.pendingRequests.size !== 0) {
                yield {
                    element: new LoadMoreCommand(true)
                };
            }
        }
        refresh() {
            if (!this.isBodyVisible()) {
                return;
            }
            this.tree.setChildren(null, this.getItems());
            this._isEmpty = !this.hasVisibleItems;
            if (this.uri === undefined) {
                this.titleDescription = undefined;
                this.message = nls_1.localize('timeline.editorCannotProvideTimeline', "The active editor cannot provide timeline information.");
            }
            else if (this._isEmpty) {
                if (this.pendingRequests.size !== 0) {
                    this.setLoadingUriMessage();
                }
                else {
                    this.titleDescription = path_1.basename(this.uri.fsPath);
                    this.message = nls_1.localize('timeline.noTimelineInfo', "No timeline information was provided.");
                }
            }
            else {
                this.titleDescription = path_1.basename(this.uri.fsPath);
                this.message = undefined;
            }
            this._pendingRefresh = false;
        }
        refreshDebounced() {
            this.refresh();
        }
        focus() {
            super.focus();
            this.tree.domFocus();
        }
        setExpanded(expanded) {
            const changed = super.setExpanded(expanded);
            if (changed && this.isBodyVisible()) {
                if (!this.followActiveEditor) {
                    this.setUriCore(this.uri, true);
                }
                else {
                    this.onActiveEditorChanged();
                }
            }
            return changed;
        }
        setVisible(visible) {
            var _a;
            if (visible) {
                this.visibilityDisposables = new lifecycle_1.DisposableStore();
                this.editorService.onDidActiveEditorChange(this.onActiveEditorChanged, this, this.visibilityDisposables);
                // Refresh the view on focus to update the relative timestamps
                this.onDidFocus(() => this.refreshDebounced(), this, this.visibilityDisposables);
                super.setVisible(visible);
                this.onActiveEditorChanged();
            }
            else {
                (_a = this.visibilityDisposables) === null || _a === void 0 ? void 0 : _a.dispose();
                super.setVisible(visible);
            }
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
        renderHeaderTitle(container) {
            var _a;
            super.renderHeaderTitle(container, this.title);
            DOM.addClass(container, 'timeline-view');
            this.$titleDescription = DOM.append(container, DOM.$('span.description', undefined, (_a = this.titleDescription) !== null && _a !== void 0 ? _a : ''));
        }
        renderBody(container) {
            super.renderBody(container);
            this.$container = container;
            DOM.addClasses(container, 'tree-explorer-viewlet-tree-view', 'timeline-tree-view');
            this.$message = DOM.append(this.$container, DOM.$('.message'));
            DOM.addClass(this.$message, 'timeline-subtle');
            this.message = nls_1.localize('timeline.editorCannotProvideTimeline', "The active editor cannot provide timeline information.");
            this.$tree = document.createElement('div');
            DOM.addClasses(this.$tree, 'customview-tree', 'file-icon-themable-tree', 'hide-arrows');
            // DOM.addClass(this.treeElement, 'show-file-icons');
            container.appendChild(this.$tree);
            this.treeRenderer = this.instantiationService.createInstance(TimelineTreeRenderer, this.commands);
            this.treeRenderer.onDidScrollToEnd(item => {
                if (this.pageOnScroll) {
                    this.loadMore(item);
                }
            });
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchObjectTree, 'TimelinePane', this.$tree, new TimelineListVirtualDelegate(), [this.treeRenderer], {
                identityProvider: new TimelineIdentityProvider(),
                accessibilityProvider: {
                    getAriaLabel(element) {
                        var _a;
                        if (isLoadMoreCommand(element)) {
                            return element.ariaLabel;
                        }
                        return element.accessibilityInformation ? element.accessibilityInformation.label : nls_1.localize('timeline.aria.item', "{0}: {1}", (_a = element.relativeTime) !== null && _a !== void 0 ? _a : '', element.label);
                    },
                    getWidgetAriaLabel() {
                        return nls_1.localize('timeline', "Timeline");
                    }
                },
                keyboardNavigationLabelProvider: new TimelineKeyboardNavigationLabelProvider(),
                overrideStyles: {
                    listBackground: this.getBackgroundColor(),
                }
            });
            this._register(this.tree.onContextMenu(e => this.onContextMenu(this.commands, e)));
            this._register(this.tree.onDidChangeSelection(e => this.ensureValidItems()));
            this._register(this.tree.onDidOpen(e => {
                if (!e.browserEvent || !this.ensureValidItems()) {
                    return;
                }
                const item = e.element;
                // eslint-disable-next-line eqeqeq
                if (item == null) {
                    return;
                }
                if (isTimelineItem(item)) {
                    if (item.command) {
                        this.commandService.executeCommand(item.command.id, ...(item.command.arguments || []));
                    }
                }
                else if (isLoadMoreCommand(item)) {
                    this.loadMore(item);
                }
            }));
        }
        loadMore(item) {
            if (item.loading) {
                return;
            }
            item.loading = true;
            this.tree.rerender(item);
            if (this.pendingRequests.size !== 0) {
                return;
            }
            this._maxItemCount = this._visibleItemCount + this.pageSize;
            this.loadTimeline(false);
        }
        ensureValidItems() {
            // If we don't have any non-excluded timelines, clear the tree and show the loading message
            if (!this.hasVisibleItems || !this.timelineService.getSources().some(({ id }) => !this.excludedSources.has(id) && this.timelinesBySource.has(id))) {
                this.tree.setChildren(null, undefined);
                this._isEmpty = true;
                this.setLoadingUriMessage();
                return false;
            }
            return true;
        }
        setLoadingUriMessage() {
            const file = this.uri && path_1.basename(this.uri.fsPath);
            this.titleDescription = file !== null && file !== void 0 ? file : '';
            this.message = file ? nls_1.localize('timeline.loading', "Loading timeline for {0}...", file) : '';
        }
        onContextMenu(commands, treeEvent) {
            const item = treeEvent.element;
            if (item === null) {
                return;
            }
            const event = treeEvent.browserEvent;
            event.preventDefault();
            event.stopPropagation();
            if (!this.ensureValidItems()) {
                return;
            }
            this.tree.setFocus([item]);
            const actions = commands.getItemContextActions(item);
            if (!actions.length) {
                return;
            }
            this.contextMenuService.showContextMenu({
                getAnchor: () => treeEvent.anchor,
                getActions: () => actions,
                getActionViewItem: (action) => {
                    const keybinding = this.keybindingService.lookupKeybinding(action.id);
                    if (keybinding) {
                        return new actionbar_1.ActionViewItem(action, action, { label: true, keybinding: keybinding.getLabel() });
                    }
                    return undefined;
                },
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        this.tree.domFocus();
                    }
                },
                getActionsContext: () => ({ uri: this.uri, item: item }),
                actionRunner: new TimelineActionRunner()
            });
        }
    };
    TimelinePane.TITLE = nls_1.localize('timeline', "Timeline");
    __decorate([
        decorators_1.debounce(500)
    ], TimelinePane.prototype, "refreshDebounced", null);
    TimelinePane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, editorService_1.IEditorService),
        __param(8, commands_1.ICommandService),
        __param(9, progress_1.IProgressService),
        __param(10, timeline_1.ITimelineService),
        __param(11, opener_1.IOpenerService),
        __param(12, themeService_1.IThemeService),
        __param(13, telemetry_1.ITelemetryService)
    ], TimelinePane);
    exports.TimelinePane = TimelinePane;
    class TimelineElementTemplate {
        constructor(container, actionViewItemProvider) {
            this.container = container;
            DOM.addClass(container, 'custom-view-tree-node-item');
            this.icon = DOM.append(container, DOM.$('.custom-view-tree-node-item-icon'));
            this.iconLabel = new iconLabel_1.IconLabel(container, { supportHighlights: true, supportCodicons: true });
            const timestampContainer = DOM.append(this.iconLabel.element, DOM.$('.timeline-timestamp-container'));
            this.timestamp = DOM.append(timestampContainer, DOM.$('span.timeline-timestamp'));
            const actionsContainer = DOM.append(this.iconLabel.element, DOM.$('.actions'));
            this.actionBar = new actionbar_1.ActionBar(actionsContainer, { actionViewItemProvider: actionViewItemProvider });
        }
        dispose() {
            this.iconLabel.dispose();
            this.actionBar.dispose();
        }
        reset() {
            this.icon.className = '';
            this.icon.style.backgroundImage = '';
            this.actionBar.clear();
        }
    }
    exports.TimelineElementTemplate = TimelineElementTemplate;
    TimelineElementTemplate.id = 'TimelineElementTemplate';
    class TimelineIdentityProvider {
        getId(item) {
            return item.handle;
        }
    }
    exports.TimelineIdentityProvider = TimelineIdentityProvider;
    class TimelineActionRunner extends actions_1.ActionRunner {
        runAction(action, { uri, item }) {
            if (!isTimelineItem(item)) {
                // TODO@eamodio do we need to do anything else?
                return action.run();
            }
            return action.run(...[
                {
                    $mid: 11,
                    handle: item.handle,
                    source: item.source,
                    uri: uri
                },
                uri,
                item.source,
            ]);
        }
    }
    class TimelineKeyboardNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            return element.label;
        }
    }
    exports.TimelineKeyboardNavigationLabelProvider = TimelineKeyboardNavigationLabelProvider;
    class TimelineListVirtualDelegate {
        getHeight(_element) {
            return ItemHeight;
        }
        getTemplateId(element) {
            return TimelineElementTemplate.id;
        }
    }
    exports.TimelineListVirtualDelegate = TimelineListVirtualDelegate;
    let TimelineTreeRenderer = class TimelineTreeRenderer {
        constructor(commands, instantiationService, themeService) {
            this.commands = commands;
            this.instantiationService = instantiationService;
            this.themeService = themeService;
            this._onDidScrollToEnd = new event_1.Emitter();
            this.onDidScrollToEnd = this._onDidScrollToEnd.event;
            this.templateId = TimelineElementTemplate.id;
            this.actionViewItemProvider = (action) => action instanceof actions_2.MenuItemAction
                ? this.instantiationService.createInstance(menuEntryActionViewItem_1.ContextAwareMenuEntryActionViewItem, action)
                : undefined;
        }
        setUri(uri) {
            this.uri = uri;
        }
        renderTemplate(container) {
            return new TimelineElementTemplate(container, this.actionViewItemProvider);
        }
        renderElement(node, index, template, height) {
            var _a;
            template.reset();
            const { element: item } = node;
            const icon = this.themeService.getColorTheme().type === themeService_1.LIGHT ? item.icon : item.iconDark;
            const iconUrl = icon ? uri_1.URI.revive(icon) : null;
            if (iconUrl) {
                template.icon.className = 'custom-view-tree-node-item-icon';
                template.icon.style.backgroundImage = DOM.asCSSUrl(iconUrl);
            }
            else {
                let iconClass;
                if (item.themeIcon /*&& !this.isFileKindThemeIcon(element.themeIcon)*/) {
                    iconClass = themeService_1.ThemeIcon.asClassName(item.themeIcon);
                }
                template.icon.className = iconClass ? `custom-view-tree-node-item-icon ${iconClass}` : '';
            }
            template.iconLabel.setLabel(item.label, item.description, {
                title: item.detail,
                matches: filters_1.createMatches(node.filterData)
            });
            template.timestamp.textContent = (_a = item.relativeTime) !== null && _a !== void 0 ? _a : '';
            DOM.toggleClass(template.timestamp.parentElement, 'timeline-timestamp--duplicate', isTimelineItem(item) && item.hideRelativeTime);
            template.actionBar.context = { uri: this.uri, item: item };
            template.actionBar.actionRunner = new TimelineActionRunner();
            template.actionBar.push(this.commands.getItemActions(item), { icon: true, label: false });
            // If we are rendering the load more item, we've scrolled to the end, so trigger an event
            if (isLoadMoreCommand(item)) {
                setTimeout(() => this._onDidScrollToEnd.fire(item), 0);
            }
        }
        disposeTemplate(template) {
            template.iconLabel.dispose();
        }
    };
    TimelineTreeRenderer = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService)
    ], TimelineTreeRenderer);
    let TimelinePaneCommands = class TimelinePaneCommands extends lifecycle_1.Disposable {
        constructor(pane, timelineService, configurationService, contextKeyService, menuService, contextMenuService) {
            super();
            this.pane = pane;
            this.timelineService = timelineService;
            this.configurationService = configurationService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
            this._register(this.sourceDisposables = new lifecycle_1.DisposableStore());
            this._register(actions_2.registerAction2(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'timeline.refresh',
                        title: { value: nls_1.localize('refresh', "Refresh"), original: 'Refresh' },
                        icon: { id: 'codicon/refresh' },
                        category: { value: nls_1.localize('timeline', "Timeline"), original: 'Timeline' },
                        menu: {
                            id: actions_2.MenuId.TimelineTitle,
                            group: 'navigation',
                            order: 99,
                        }
                    });
                }
                run(accessor, ...args) {
                    pane.reset();
                }
            }));
            this._register(commands_1.CommandsRegistry.registerCommand('timeline.toggleFollowActiveEditor', (accessor, ...args) => pane.followActiveEditor = !pane.followActiveEditor));
            this._register(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TimelineTitle, ({
                command: {
                    id: 'timeline.toggleFollowActiveEditor',
                    title: { value: nls_1.localize('timeline.toggleFollowActiveEditorCommand.follow', "Pin the Current Timeline"), original: 'Pin the Current Timeline' },
                    icon: { id: 'codicon/pin' },
                    category: { value: nls_1.localize('timeline', "Timeline"), original: 'Timeline' },
                },
                group: 'navigation',
                order: 98,
                when: exports.TimelineFollowActiveEditorContext
            })));
            this._register(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TimelineTitle, ({
                command: {
                    id: 'timeline.toggleFollowActiveEditor',
                    title: { value: nls_1.localize('timeline.toggleFollowActiveEditorCommand.unfollow', "Unpin the Current Timeline"), original: 'Unpin the Current Timeline' },
                    icon: { id: 'codicon/pinned' },
                    category: { value: nls_1.localize('timeline', "Timeline"), original: 'Timeline' },
                },
                group: 'navigation',
                order: 98,
                when: exports.TimelineFollowActiveEditorContext.toNegated()
            })));
            this._register(timelineService.onDidChangeProviders(() => this.updateTimelineSourceFilters()));
            this.updateTimelineSourceFilters();
        }
        getItemActions(element) {
            return this.getActions(actions_2.MenuId.TimelineItemContext, { key: 'timelineItem', value: element.contextValue }).primary;
        }
        getItemContextActions(element) {
            return this.getActions(actions_2.MenuId.TimelineItemContext, { key: 'timelineItem', value: element.contextValue }).secondary;
        }
        getActions(menuId, context) {
            const scoped = this.contextKeyService.createScoped();
            scoped.createKey('view', this.pane.id);
            scoped.createKey(context.key, context.value);
            const menu = this.menuService.createMenu(menuId, scoped);
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            menuEntryActionViewItem_1.createAndFillInContextMenuActions(menu, { shouldForwardArgs: true }, result, this.contextMenuService, g => /^inline/.test(g));
            menu.dispose();
            scoped.dispose();
            return result;
        }
        updateTimelineSourceFilters() {
            var _a;
            this.sourceDisposables.clear();
            const excluded = new Set((_a = this.configurationService.getValue('timeline.excludeSources')) !== null && _a !== void 0 ? _a : []);
            for (const source of this.timelineService.getSources()) {
                this.sourceDisposables.add(actions_2.registerAction2(class extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: `timeline.toggleExcludeSource:${source.id}`,
                            title: { value: nls_1.localize('timeline.filterSource', "Include: {0}", source.label), original: `Include: ${source.label}` },
                            category: { value: nls_1.localize('timeline', "Timeline"), original: 'Timeline' },
                            menu: {
                                id: actions_2.MenuId.TimelineTitle,
                                group: '2_sources',
                            },
                            toggled: contextkey_1.ContextKeyExpr.regex(`config.timeline.excludeSources`, new RegExp(`\\b${strings_1.escapeRegExpCharacters(source.id)}\\b`)).negate()
                        });
                    }
                    run(accessor, ...args) {
                        if (excluded.has(source.id)) {
                            excluded.delete(source.id);
                        }
                        else {
                            excluded.add(source.id);
                        }
                        const configurationService = accessor.get(configuration_1.IConfigurationService);
                        configurationService.updateValue('timeline.excludeSources', [...excluded.keys()]);
                    }
                }));
            }
        }
    };
    TimelinePaneCommands = __decorate([
        __param(1, timeline_1.ITimelineService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, actions_2.IMenuService),
        __param(5, contextView_1.IContextMenuService)
    ], TimelinePaneCommands);
});
//# __sourceMappingURL=timelinePane.js.map