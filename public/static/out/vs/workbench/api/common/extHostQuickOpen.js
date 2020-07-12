/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "./extHost.protocol", "vs/base/common/uri", "vs/workbench/api/common/extHostTypes", "vs/base/common/errors", "vs/base/common/arrays"], function (require, exports, async_1, cancellation_1, event_1, lifecycle_1, extHost_protocol_1, uri_1, extHostTypes_1, errors_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostQuickOpen = void 0;
    class ExtHostQuickOpen {
        constructor(mainContext, workspace, commands) {
            this._sessions = new Map();
            this._instances = 0;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadQuickOpen);
            this._workspace = workspace;
            this._commands = commands;
        }
        showQuickPick(itemsOrItemsPromise, enableProposedApi, options, token = cancellation_1.CancellationToken.None) {
            // clear state from last invocation
            this._onDidSelectItem = undefined;
            const itemsPromise = Promise.resolve(itemsOrItemsPromise);
            const instance = ++this._instances;
            const quickPickWidget = this._proxy.$show(instance, {
                placeHolder: options && options.placeHolder,
                matchOnDescription: options && options.matchOnDescription,
                matchOnDetail: options && options.matchOnDetail,
                ignoreFocusLost: options && options.ignoreFocusOut,
                canPickMany: options && options.canPickMany
            }, token);
            const widgetClosedMarker = {};
            const widgetClosedPromise = quickPickWidget.then(() => widgetClosedMarker);
            return Promise.race([widgetClosedPromise, itemsPromise]).then(result => {
                if (result === widgetClosedMarker) {
                    return undefined;
                }
                return itemsPromise.then(items => {
                    const pickItems = [];
                    for (let handle = 0; handle < items.length; handle++) {
                        const item = items[handle];
                        let label;
                        let description;
                        let detail;
                        let picked;
                        let alwaysShow;
                        if (typeof item === 'string') {
                            label = item;
                        }
                        else {
                            label = item.label;
                            description = item.description;
                            detail = item.detail;
                            picked = item.picked;
                            alwaysShow = item.alwaysShow;
                        }
                        pickItems.push({
                            label,
                            description,
                            handle,
                            detail,
                            picked,
                            alwaysShow
                        });
                    }
                    // handle selection changes
                    if (options && typeof options.onDidSelectItem === 'function') {
                        this._onDidSelectItem = (handle) => {
                            options.onDidSelectItem(items[handle]);
                        };
                    }
                    // show items
                    this._proxy.$setItems(instance, pickItems);
                    return quickPickWidget.then(handle => {
                        if (typeof handle === 'number') {
                            return items[handle];
                        }
                        else if (Array.isArray(handle)) {
                            return handle.map(h => items[h]);
                        }
                        return undefined;
                    });
                });
            }).then(undefined, err => {
                if (errors_1.isPromiseCanceledError(err)) {
                    return undefined;
                }
                this._proxy.$setError(instance, err);
                return Promise.reject(err);
            });
        }
        $onItemSelected(handle) {
            if (this._onDidSelectItem) {
                this._onDidSelectItem(handle);
            }
        }
        // ---- input
        showInput(options, token = cancellation_1.CancellationToken.None) {
            // global validate fn used in callback below
            this._validateInput = options ? options.validateInput : undefined;
            return this._proxy.$input(options, typeof this._validateInput === 'function', token)
                .then(undefined, err => {
                if (errors_1.isPromiseCanceledError(err)) {
                    return undefined;
                }
                return Promise.reject(err);
            });
        }
        $validateInput(input) {
            if (this._validateInput) {
                return async_1.asPromise(() => this._validateInput(input));
            }
            return Promise.resolve(undefined);
        }
        // ---- workspace folder picker
        async showWorkspaceFolderPick(options, token = cancellation_1.CancellationToken.None) {
            const selectedFolder = await this._commands.executeCommand('_workbench.pickWorkspaceFolder', [options]);
            if (!selectedFolder) {
                return undefined;
            }
            const workspaceFolders = await this._workspace.getWorkspaceFolders2();
            if (!workspaceFolders) {
                return undefined;
            }
            return workspaceFolders.find(folder => folder.uri.toString() === selectedFolder.uri.toString());
        }
        // ---- QuickInput
        createQuickPick(extensionId, enableProposedApi) {
            const session = new ExtHostQuickPick(this._proxy, extensionId, enableProposedApi, () => this._sessions.delete(session._id));
            this._sessions.set(session._id, session);
            return session;
        }
        createInputBox(extensionId) {
            const session = new ExtHostInputBox(this._proxy, extensionId, () => this._sessions.delete(session._id));
            this._sessions.set(session._id, session);
            return session;
        }
        $onDidChangeValue(sessionId, value) {
            const session = this._sessions.get(sessionId);
            if (session) {
                session._fireDidChangeValue(value);
            }
        }
        $onDidAccept(sessionId) {
            const session = this._sessions.get(sessionId);
            if (session) {
                session._fireDidAccept();
            }
        }
        $onDidChangeActive(sessionId, handles) {
            const session = this._sessions.get(sessionId);
            if (session instanceof ExtHostQuickPick) {
                session._fireDidChangeActive(handles);
            }
        }
        $onDidChangeSelection(sessionId, handles) {
            const session = this._sessions.get(sessionId);
            if (session instanceof ExtHostQuickPick) {
                session._fireDidChangeSelection(handles);
            }
        }
        $onDidTriggerButton(sessionId, handle) {
            const session = this._sessions.get(sessionId);
            if (session) {
                session._fireDidTriggerButton(handle);
            }
        }
        $onDidHide(sessionId) {
            const session = this._sessions.get(sessionId);
            if (session) {
                session._fireDidHide();
            }
        }
    }
    exports.ExtHostQuickOpen = ExtHostQuickOpen;
    class ExtHostQuickInput {
        constructor(_proxy, _extensionId, _onDidDispose) {
            this._proxy = _proxy;
            this._extensionId = _extensionId;
            this._onDidDispose = _onDidDispose;
            this._id = ExtHostQuickPick._nextId++;
            this._visible = false;
            this._expectingHide = false;
            this._enabled = true;
            this._busy = false;
            this._ignoreFocusOut = true;
            this._value = '';
            this._buttons = [];
            this._handlesToButtons = new Map();
            this._onDidAcceptEmitter = new event_1.Emitter();
            this._onDidChangeValueEmitter = new event_1.Emitter();
            this._onDidTriggerButtonEmitter = new event_1.Emitter();
            this._onDidHideEmitter = new event_1.Emitter();
            this._pendingUpdate = { id: this._id };
            this._disposed = false;
            this._disposables = [
                this._onDidTriggerButtonEmitter,
                this._onDidHideEmitter,
                this._onDidAcceptEmitter,
                this._onDidChangeValueEmitter
            ];
            this.onDidChangeValue = this._onDidChangeValueEmitter.event;
            this.onDidAccept = this._onDidAcceptEmitter.event;
            this.onDidTriggerButton = this._onDidTriggerButtonEmitter.event;
            this.onDidHide = this._onDidHideEmitter.event;
        }
        get title() {
            return this._title;
        }
        set title(title) {
            this._title = title;
            this.update({ title });
        }
        get step() {
            return this._steps;
        }
        set step(step) {
            this._steps = step;
            this.update({ step });
        }
        get totalSteps() {
            return this._totalSteps;
        }
        set totalSteps(totalSteps) {
            this._totalSteps = totalSteps;
            this.update({ totalSteps });
        }
        get enabled() {
            return this._enabled;
        }
        set enabled(enabled) {
            this._enabled = enabled;
            this.update({ enabled });
        }
        get busy() {
            return this._busy;
        }
        set busy(busy) {
            this._busy = busy;
            this.update({ busy });
        }
        get ignoreFocusOut() {
            return this._ignoreFocusOut;
        }
        set ignoreFocusOut(ignoreFocusOut) {
            this._ignoreFocusOut = ignoreFocusOut;
            this.update({ ignoreFocusOut });
        }
        get value() {
            return this._value;
        }
        set value(value) {
            this._value = value;
            this.update({ value });
        }
        get placeholder() {
            return this._placeholder;
        }
        set placeholder(placeholder) {
            this._placeholder = placeholder;
            this.update({ placeholder });
        }
        get buttons() {
            return this._buttons;
        }
        set buttons(buttons) {
            this._buttons = buttons.slice();
            this._handlesToButtons.clear();
            buttons.forEach((button, i) => {
                const handle = button === extHostTypes_1.QuickInputButtons.Back ? -1 : i;
                this._handlesToButtons.set(handle, button);
            });
            this.update({
                buttons: buttons.map((button, i) => ({
                    iconPath: getIconUris(button.iconPath),
                    tooltip: button.tooltip,
                    handle: button === extHostTypes_1.QuickInputButtons.Back ? -1 : i,
                }))
            });
        }
        show() {
            this._visible = true;
            this._expectingHide = true;
            this.update({ visible: true });
        }
        hide() {
            this._visible = false;
            this.update({ visible: false });
        }
        _fireDidAccept() {
            this._onDidAcceptEmitter.fire();
        }
        _fireDidChangeValue(value) {
            this._value = value;
            this._onDidChangeValueEmitter.fire(value);
        }
        _fireDidTriggerButton(handle) {
            const button = this._handlesToButtons.get(handle);
            if (button) {
                this._onDidTriggerButtonEmitter.fire(button);
            }
        }
        _fireDidHide() {
            if (this._expectingHide) {
                this._expectingHide = false;
                this._onDidHideEmitter.fire();
            }
        }
        dispose() {
            if (this._disposed) {
                return;
            }
            this._disposed = true;
            this._fireDidHide();
            this._disposables = lifecycle_1.dispose(this._disposables);
            if (this._updateTimeout) {
                clearTimeout(this._updateTimeout);
                this._updateTimeout = undefined;
            }
            this._onDidDispose();
            this._proxy.$dispose(this._id);
        }
        update(properties) {
            if (this._disposed) {
                return;
            }
            for (const key of Object.keys(properties)) {
                const value = properties[key];
                this._pendingUpdate[key] = value === undefined ? null : value;
            }
            if ('visible' in this._pendingUpdate) {
                if (this._updateTimeout) {
                    clearTimeout(this._updateTimeout);
                    this._updateTimeout = undefined;
                }
                this.dispatchUpdate();
            }
            else if (this._visible && !this._updateTimeout) {
                // Defer the update so that multiple changes to setters dont cause a redraw each
                this._updateTimeout = setTimeout(() => {
                    this._updateTimeout = undefined;
                    this.dispatchUpdate();
                }, 0);
            }
        }
        dispatchUpdate() {
            this._proxy.$createOrUpdate(this._pendingUpdate);
            this._pendingUpdate = { id: this._id };
        }
    }
    ExtHostQuickInput._nextId = 1;
    function getIconUris(iconPath) {
        if (iconPath instanceof extHostTypes_1.ThemeIcon) {
            return { id: iconPath.id };
        }
        const dark = getDarkIconUri(iconPath);
        const light = getLightIconUri(iconPath);
        return { dark, light };
    }
    function getLightIconUri(iconPath) {
        return getIconUri(typeof iconPath === 'object' && 'light' in iconPath ? iconPath.light : iconPath);
    }
    function getDarkIconUri(iconPath) {
        return getIconUri(typeof iconPath === 'object' && 'dark' in iconPath ? iconPath.dark : iconPath);
    }
    function getIconUri(iconPath) {
        if (uri_1.URI.isUri(iconPath)) {
            return iconPath;
        }
        return uri_1.URI.file(iconPath);
    }
    class ExtHostQuickPick extends ExtHostQuickInput {
        constructor(proxy, extensionId, enableProposedApi, onDispose) {
            super(proxy, extensionId, onDispose);
            this._items = [];
            this._handlesToItems = new Map();
            this._itemsToHandles = new Map();
            this._canSelectMany = false;
            this._matchOnDescription = true;
            this._matchOnDetail = true;
            this._sortByLabel = true;
            this._activeItems = [];
            this._onDidChangeActiveEmitter = new event_1.Emitter();
            this._selectedItems = [];
            this._onDidChangeSelectionEmitter = new event_1.Emitter();
            this.onDidChangeActive = this._onDidChangeActiveEmitter.event;
            this.onDidChangeSelection = this._onDidChangeSelectionEmitter.event;
            this._disposables.push(this._onDidChangeActiveEmitter, this._onDidChangeSelectionEmitter);
            this.update({ type: 'quickPick' });
        }
        get items() {
            return this._items;
        }
        set items(items) {
            this._items = items.slice();
            this._handlesToItems.clear();
            this._itemsToHandles.clear();
            items.forEach((item, i) => {
                this._handlesToItems.set(i, item);
                this._itemsToHandles.set(item, i);
            });
            this.update({
                items: items.map((item, i) => ({
                    label: item.label,
                    description: item.description,
                    handle: i,
                    detail: item.detail,
                    picked: item.picked,
                    alwaysShow: item.alwaysShow
                }))
            });
        }
        get canSelectMany() {
            return this._canSelectMany;
        }
        set canSelectMany(canSelectMany) {
            this._canSelectMany = canSelectMany;
            this.update({ canSelectMany });
        }
        get matchOnDescription() {
            return this._matchOnDescription;
        }
        set matchOnDescription(matchOnDescription) {
            this._matchOnDescription = matchOnDescription;
            this.update({ matchOnDescription });
        }
        get matchOnDetail() {
            return this._matchOnDetail;
        }
        set matchOnDetail(matchOnDetail) {
            this._matchOnDetail = matchOnDetail;
            this.update({ matchOnDetail });
        }
        get sortByLabel() {
            return this._sortByLabel;
        }
        set sortByLabel(sortByLabel) {
            this._sortByLabel = sortByLabel;
            this.update({ sortByLabel });
        }
        get activeItems() {
            return this._activeItems;
        }
        set activeItems(activeItems) {
            this._activeItems = activeItems.filter(item => this._itemsToHandles.has(item));
            this.update({ activeItems: this._activeItems.map(item => this._itemsToHandles.get(item)) });
        }
        get selectedItems() {
            return this._selectedItems;
        }
        set selectedItems(selectedItems) {
            this._selectedItems = selectedItems.filter(item => this._itemsToHandles.has(item));
            this.update({ selectedItems: this._selectedItems.map(item => this._itemsToHandles.get(item)) });
        }
        _fireDidChangeActive(handles) {
            const items = arrays_1.coalesce(handles.map(handle => this._handlesToItems.get(handle)));
            this._activeItems = items;
            this._onDidChangeActiveEmitter.fire(items);
        }
        _fireDidChangeSelection(handles) {
            const items = arrays_1.coalesce(handles.map(handle => this._handlesToItems.get(handle)));
            this._selectedItems = items;
            this._onDidChangeSelectionEmitter.fire(items);
        }
    }
    class ExtHostInputBox extends ExtHostQuickInput {
        constructor(proxy, extensionId, onDispose) {
            super(proxy, extensionId, onDispose);
            this._password = false;
            this.update({ type: 'inputBox' });
        }
        get password() {
            return this._password;
        }
        set password(password) {
            this._password = password;
            this.update({ password });
        }
        get prompt() {
            return this._prompt;
        }
        set prompt(prompt) {
            this._prompt = prompt;
            this.update({ prompt });
        }
        get validationMessage() {
            return this._validationMessage;
        }
        set validationMessage(validationMessage) {
            this._validationMessage = validationMessage;
            this.update({ validationMessage });
        }
    }
});
//# __sourceMappingURL=extHostQuickOpen.js.map