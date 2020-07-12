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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/decorators", "vs/base/common/lifecycle", "vs/base/common/async", "./extHost.protocol", "vs/base/common/arrays", "vs/base/common/comparers", "vs/platform/log/common/log", "vs/platform/extensions/common/extensions"], function (require, exports, uri_1, event_1, decorators_1, lifecycle_1, async_1, extHost_protocol_1, arrays_1, comparers_1, log_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostSCM = exports.ExtHostSCMInputBox = void 0;
    function getIconResource(decorations) {
        if (!decorations) {
            return undefined;
        }
        else if (typeof decorations.iconPath === 'string') {
            return uri_1.URI.file(decorations.iconPath);
        }
        else {
            return decorations.iconPath;
        }
    }
    function compareResourceThemableDecorations(a, b) {
        if (!a.iconPath && !b.iconPath) {
            return 0;
        }
        else if (!a.iconPath) {
            return -1;
        }
        else if (!b.iconPath) {
            return 1;
        }
        const aPath = typeof a.iconPath === 'string' ? a.iconPath : a.iconPath.fsPath;
        const bPath = typeof b.iconPath === 'string' ? b.iconPath : b.iconPath.fsPath;
        return comparers_1.comparePaths(aPath, bPath);
    }
    function compareResourceStatesDecorations(a, b) {
        let result = 0;
        if (a.strikeThrough !== b.strikeThrough) {
            return a.strikeThrough ? 1 : -1;
        }
        if (a.faded !== b.faded) {
            return a.faded ? 1 : -1;
        }
        if (a.tooltip !== b.tooltip) {
            return (a.tooltip || '').localeCompare(b.tooltip || '');
        }
        result = compareResourceThemableDecorations(a, b);
        if (result !== 0) {
            return result;
        }
        if (a.light && b.light) {
            result = compareResourceThemableDecorations(a.light, b.light);
        }
        else if (a.light) {
            return 1;
        }
        else if (b.light) {
            return -1;
        }
        if (result !== 0) {
            return result;
        }
        if (a.dark && b.dark) {
            result = compareResourceThemableDecorations(a.dark, b.dark);
        }
        else if (a.dark) {
            return 1;
        }
        else if (b.dark) {
            return -1;
        }
        return result;
    }
    function compareResourceStates(a, b) {
        let result = comparers_1.comparePaths(a.resourceUri.fsPath, b.resourceUri.fsPath, true);
        if (result !== 0) {
            return result;
        }
        if (a.decorations && b.decorations) {
            result = compareResourceStatesDecorations(a.decorations, b.decorations);
        }
        else if (a.decorations) {
            return 1;
        }
        else if (b.decorations) {
            return -1;
        }
        return result;
    }
    function compareArgs(a, b) {
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }
    function commandEquals(a, b) {
        return a.command === b.command
            && a.title === b.title
            && a.tooltip === b.tooltip
            && (a.arguments && b.arguments ? compareArgs(a.arguments, b.arguments) : a.arguments === b.arguments);
    }
    function commandListEquals(a, b) {
        return arrays_1.equals(a, b, commandEquals);
    }
    class ExtHostSCMInputBox {
        constructor(_extension, _proxy, _sourceControlHandle) {
            this._extension = _extension;
            this._proxy = _proxy;
            this._sourceControlHandle = _sourceControlHandle;
            this._value = '';
            this._onDidChange = new event_1.Emitter();
            this._placeholder = '';
            this._visible = true;
            // noop
        }
        get value() {
            return this._value;
        }
        set value(value) {
            this._proxy.$setInputBoxValue(this._sourceControlHandle, value);
            this.updateValue(value);
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        get placeholder() {
            return this._placeholder;
        }
        set placeholder(placeholder) {
            this._proxy.$setInputBoxPlaceholder(this._sourceControlHandle, placeholder);
            this._placeholder = placeholder;
        }
        get validateInput() {
            if (!this._extension.enableProposedApi) {
                throw new Error(`[${this._extension.identifier.value}]: Proposed API is only available when running out of dev or with the following command line switch: --enable-proposed-api ${this._extension.identifier.value}`);
            }
            return this._validateInput;
        }
        set validateInput(fn) {
            if (!this._extension.enableProposedApi) {
                throw new Error(`[${this._extension.identifier.value}]: Proposed API is only available when running out of dev or with the following command line switch: --enable-proposed-api ${this._extension.identifier.value}`);
            }
            if (fn && typeof fn !== 'function') {
                throw new Error(`[${this._extension.identifier.value}]: Invalid SCM input box validation function`);
            }
            this._validateInput = fn;
            this._proxy.$setValidationProviderIsEnabled(this._sourceControlHandle, !!fn);
        }
        get visible() {
            return this._visible;
        }
        set visible(visible) {
            visible = !!visible;
            if (this._visible === visible) {
                return;
            }
            this._visible = visible;
            this._proxy.$setInputBoxVisibility(this._sourceControlHandle, visible);
        }
        $onInputBoxValueChange(value) {
            this.updateValue(value);
        }
        updateValue(value) {
            this._value = value;
            this._onDidChange.fire(value);
        }
    }
    exports.ExtHostSCMInputBox = ExtHostSCMInputBox;
    class ExtHostSourceControlResourceGroup {
        constructor(_proxy, _commands, _sourceControlHandle, _id, _label) {
            this._proxy = _proxy;
            this._commands = _commands;
            this._sourceControlHandle = _sourceControlHandle;
            this._id = _id;
            this._label = _label;
            this._resourceHandlePool = 0;
            this._resourceStates = [];
            this._resourceStatesMap = new Map();
            this._resourceStatesCommandsMap = new Map();
            this._onDidUpdateResourceStates = new event_1.Emitter();
            this.onDidUpdateResourceStates = this._onDidUpdateResourceStates.event;
            this._onDidDispose = new event_1.Emitter();
            this.onDidDispose = this._onDidDispose.event;
            this._handlesSnapshot = [];
            this._resourceSnapshot = [];
            this._hideWhenEmpty = undefined;
            this.handle = ExtHostSourceControlResourceGroup._handlePool++;
            this._proxy.$registerGroup(_sourceControlHandle, this.handle, _id, _label);
        }
        get id() { return this._id; }
        get label() { return this._label; }
        set label(label) {
            this._label = label;
            this._proxy.$updateGroupLabel(this._sourceControlHandle, this.handle, label);
        }
        get hideWhenEmpty() { return this._hideWhenEmpty; }
        set hideWhenEmpty(hideWhenEmpty) {
            this._hideWhenEmpty = hideWhenEmpty;
            this._proxy.$updateGroup(this._sourceControlHandle, this.handle, { hideWhenEmpty });
        }
        get resourceStates() { return [...this._resourceStates]; }
        set resourceStates(resources) {
            this._resourceStates = [...resources];
            this._onDidUpdateResourceStates.fire();
        }
        getResourceState(handle) {
            return this._resourceStatesMap.get(handle);
        }
        $executeResourceCommand(handle, preserveFocus) {
            const command = this._resourceStatesCommandsMap.get(handle);
            if (!command) {
                return Promise.resolve(undefined);
            }
            return async_1.asPromise(() => this._commands.executeCommand(command.command, ...(command.arguments || []), preserveFocus));
        }
        _takeResourceStateSnapshot() {
            const snapshot = [...this._resourceStates].sort(compareResourceStates);
            const diffs = arrays_1.sortedDiff(this._resourceSnapshot, snapshot, compareResourceStates);
            const splices = diffs.map(diff => {
                const toInsert = diff.toInsert.map(r => {
                    const handle = this._resourceHandlePool++;
                    this._resourceStatesMap.set(handle, r);
                    const sourceUri = r.resourceUri;
                    const iconUri = getIconResource(r.decorations);
                    const lightIconUri = r.decorations && getIconResource(r.decorations.light) || iconUri;
                    const darkIconUri = r.decorations && getIconResource(r.decorations.dark) || iconUri;
                    const icons = [];
                    if (r.command) {
                        this._resourceStatesCommandsMap.set(handle, r.command);
                    }
                    if (lightIconUri) {
                        icons.push(lightIconUri);
                    }
                    if (darkIconUri && (darkIconUri.toString() !== (lightIconUri === null || lightIconUri === void 0 ? void 0 : lightIconUri.toString()))) {
                        icons.push(darkIconUri);
                    }
                    const tooltip = (r.decorations && r.decorations.tooltip) || '';
                    const strikeThrough = r.decorations && !!r.decorations.strikeThrough;
                    const faded = r.decorations && !!r.decorations.faded;
                    const rawResource = [handle, sourceUri, icons, tooltip, strikeThrough, faded];
                    return { rawResource, handle };
                });
                return { start: diff.start, deleteCount: diff.deleteCount, toInsert };
            });
            const rawResourceSplices = splices
                .map(({ start, deleteCount, toInsert }) => [start, deleteCount, toInsert.map(i => i.rawResource)]);
            const reverseSplices = splices.reverse();
            for (const { start, deleteCount, toInsert } of reverseSplices) {
                const handles = toInsert.map(i => i.handle);
                const handlesToDelete = this._handlesSnapshot.splice(start, deleteCount, ...handles);
                for (const handle of handlesToDelete) {
                    this._resourceStatesMap.delete(handle);
                    this._resourceStatesCommandsMap.delete(handle);
                }
            }
            this._resourceSnapshot = snapshot;
            return rawResourceSplices;
        }
        dispose() {
            this._proxy.$unregisterGroup(this._sourceControlHandle, this.handle);
            this._onDidDispose.fire();
        }
    }
    ExtHostSourceControlResourceGroup._handlePool = 0;
    class ExtHostSourceControl {
        constructor(_extension, _proxy, _commands, _id, _label, _rootUri) {
            this._proxy = _proxy;
            this._commands = _commands;
            this._id = _id;
            this._label = _label;
            this._rootUri = _rootUri;
            this._groups = new Map();
            this._count = undefined;
            this._quickDiffProvider = undefined;
            this._commitTemplate = undefined;
            this._acceptInputDisposables = new lifecycle_1.MutableDisposable();
            this._acceptInputCommand = undefined;
            this._statusBarDisposables = new lifecycle_1.MutableDisposable();
            this._statusBarCommands = undefined;
            this._selected = false;
            this._onDidChangeSelection = new event_1.Emitter();
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this.handle = ExtHostSourceControl._handlePool++;
            this.updatedResourceGroups = new Set();
            this._inputBox = new ExtHostSCMInputBox(_extension, this._proxy, this.handle);
            this._proxy.$registerSourceControl(this.handle, _id, _label, _rootUri);
        }
        get id() {
            return this._id;
        }
        get label() {
            return this._label;
        }
        get rootUri() {
            return this._rootUri;
        }
        get inputBox() { return this._inputBox; }
        get count() {
            return this._count;
        }
        set count(count) {
            if (this._count === count) {
                return;
            }
            this._count = count;
            this._proxy.$updateSourceControl(this.handle, { count });
        }
        get quickDiffProvider() {
            return this._quickDiffProvider;
        }
        set quickDiffProvider(quickDiffProvider) {
            this._quickDiffProvider = quickDiffProvider;
            this._proxy.$updateSourceControl(this.handle, { hasQuickDiffProvider: !!quickDiffProvider });
        }
        get commitTemplate() {
            return this._commitTemplate;
        }
        set commitTemplate(commitTemplate) {
            if (commitTemplate === this._commitTemplate) {
                return;
            }
            this._commitTemplate = commitTemplate;
            this._proxy.$updateSourceControl(this.handle, { commitTemplate });
        }
        get acceptInputCommand() {
            return this._acceptInputCommand;
        }
        set acceptInputCommand(acceptInputCommand) {
            this._acceptInputDisposables.value = new lifecycle_1.DisposableStore();
            this._acceptInputCommand = acceptInputCommand;
            const internal = this._commands.converter.toInternal(acceptInputCommand, this._acceptInputDisposables.value);
            this._proxy.$updateSourceControl(this.handle, { acceptInputCommand: internal });
        }
        get statusBarCommands() {
            return this._statusBarCommands;
        }
        set statusBarCommands(statusBarCommands) {
            if (this._statusBarCommands && statusBarCommands && commandListEquals(this._statusBarCommands, statusBarCommands)) {
                return;
            }
            this._statusBarDisposables.value = new lifecycle_1.DisposableStore();
            this._statusBarCommands = statusBarCommands;
            const internal = (statusBarCommands || []).map(c => this._commands.converter.toInternal(c, this._statusBarDisposables.value));
            this._proxy.$updateSourceControl(this.handle, { statusBarCommands: internal });
        }
        get selected() {
            return this._selected;
        }
        createResourceGroup(id, label) {
            const group = new ExtHostSourceControlResourceGroup(this._proxy, this._commands, this.handle, id, label);
            const updateListener = group.onDidUpdateResourceStates(() => {
                this.updatedResourceGroups.add(group);
                this.eventuallyUpdateResourceStates();
            });
            event_1.Event.once(group.onDidDispose)(() => {
                this.updatedResourceGroups.delete(group);
                updateListener.dispose();
                this._groups.delete(group.handle);
            });
            this._groups.set(group.handle, group);
            return group;
        }
        eventuallyUpdateResourceStates() {
            const splices = [];
            this.updatedResourceGroups.forEach(group => {
                const snapshot = group._takeResourceStateSnapshot();
                if (snapshot.length === 0) {
                    return;
                }
                splices.push([group.handle, snapshot]);
            });
            if (splices.length > 0) {
                this._proxy.$spliceResourceStates(this.handle, splices);
            }
            this.updatedResourceGroups.clear();
        }
        getResourceGroup(handle) {
            return this._groups.get(handle);
        }
        setSelectionState(selected) {
            this._selected = selected;
            this._onDidChangeSelection.fire(selected);
        }
        dispose() {
            this._acceptInputDisposables.dispose();
            this._statusBarDisposables.dispose();
            this._groups.forEach(group => group.dispose());
            this._proxy.$unregisterSourceControl(this.handle);
        }
    }
    ExtHostSourceControl._handlePool = 0;
    __decorate([
        decorators_1.debounce(100)
    ], ExtHostSourceControl.prototype, "eventuallyUpdateResourceStates", null);
    let ExtHostSCM = class ExtHostSCM {
        constructor(mainContext, _commands, logService) {
            this._commands = _commands;
            this.logService = logService;
            this._sourceControls = new Map();
            this._sourceControlsByExtension = new Map();
            this._onDidChangeActiveProvider = new event_1.Emitter();
            this._selectedSourceControlHandles = new Set();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadSCM);
            this._telemetry = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadTelemetry);
            _commands.registerArgumentProcessor({
                processArgument: arg => {
                    if (arg && arg.$mid === 3) {
                        const sourceControl = this._sourceControls.get(arg.sourceControlHandle);
                        if (!sourceControl) {
                            return arg;
                        }
                        const group = sourceControl.getResourceGroup(arg.groupHandle);
                        if (!group) {
                            return arg;
                        }
                        return group.getResourceState(arg.handle);
                    }
                    else if (arg && arg.$mid === 4) {
                        const sourceControl = this._sourceControls.get(arg.sourceControlHandle);
                        if (!sourceControl) {
                            return arg;
                        }
                        return sourceControl.getResourceGroup(arg.groupHandle);
                    }
                    else if (arg && arg.$mid === 5) {
                        const sourceControl = this._sourceControls.get(arg.handle);
                        if (!sourceControl) {
                            return arg;
                        }
                        return sourceControl;
                    }
                    return arg;
                }
            });
        }
        get onDidChangeActiveProvider() { return this._onDidChangeActiveProvider.event; }
        createSourceControl(extension, id, label, rootUri) {
            this.logService.trace('ExtHostSCM#createSourceControl', extension.identifier.value, id, label, rootUri);
            this._telemetry.$publicLog2('api/scm/createSourceControl', {
                extensionId: extension.identifier.value,
            });
            const handle = ExtHostSCM._handlePool++;
            const sourceControl = new ExtHostSourceControl(extension, this._proxy, this._commands, id, label, rootUri);
            this._sourceControls.set(handle, sourceControl);
            const sourceControls = this._sourceControlsByExtension.get(extensions_1.ExtensionIdentifier.toKey(extension.identifier)) || [];
            sourceControls.push(sourceControl);
            this._sourceControlsByExtension.set(extensions_1.ExtensionIdentifier.toKey(extension.identifier), sourceControls);
            return sourceControl;
        }
        // Deprecated
        getLastInputBox(extension) {
            this.logService.trace('ExtHostSCM#getLastInputBox', extension.identifier.value);
            const sourceControls = this._sourceControlsByExtension.get(extensions_1.ExtensionIdentifier.toKey(extension.identifier));
            const sourceControl = sourceControls && sourceControls[sourceControls.length - 1];
            return sourceControl && sourceControl.inputBox;
        }
        $provideOriginalResource(sourceControlHandle, uriComponents, token) {
            const uri = uri_1.URI.revive(uriComponents);
            this.logService.trace('ExtHostSCM#$provideOriginalResource', sourceControlHandle, uri.toString());
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl || !sourceControl.quickDiffProvider || !sourceControl.quickDiffProvider.provideOriginalResource) {
                return Promise.resolve(null);
            }
            return async_1.asPromise(() => sourceControl.quickDiffProvider.provideOriginalResource(uri, token))
                .then(r => r || null);
        }
        $onInputBoxValueChange(sourceControlHandle, value) {
            this.logService.trace('ExtHostSCM#$onInputBoxValueChange', sourceControlHandle);
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl) {
                return Promise.resolve(undefined);
            }
            sourceControl.inputBox.$onInputBoxValueChange(value);
            return Promise.resolve(undefined);
        }
        $executeResourceCommand(sourceControlHandle, groupHandle, handle, preserveFocus) {
            this.logService.trace('ExtHostSCM#$executeResourceCommand', sourceControlHandle, groupHandle, handle);
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl) {
                return Promise.resolve(undefined);
            }
            const group = sourceControl.getResourceGroup(groupHandle);
            if (!group) {
                return Promise.resolve(undefined);
            }
            return group.$executeResourceCommand(handle, preserveFocus);
        }
        $validateInput(sourceControlHandle, value, cursorPosition) {
            this.logService.trace('ExtHostSCM#$validateInput', sourceControlHandle);
            const sourceControl = this._sourceControls.get(sourceControlHandle);
            if (!sourceControl) {
                return Promise.resolve(undefined);
            }
            if (!sourceControl.inputBox.validateInput) {
                return Promise.resolve(undefined);
            }
            return async_1.asPromise(() => sourceControl.inputBox.validateInput(value, cursorPosition)).then(result => {
                if (!result) {
                    return Promise.resolve(undefined);
                }
                return Promise.resolve([result.message, result.type]);
            });
        }
        $setSelectedSourceControls(selectedSourceControlHandles) {
            this.logService.trace('ExtHostSCM#$setSelectedSourceControls', selectedSourceControlHandles);
            const set = new Set();
            for (const handle of selectedSourceControlHandles) {
                set.add(handle);
            }
            set.forEach(handle => {
                if (!this._selectedSourceControlHandles.has(handle)) {
                    const sourceControl = this._sourceControls.get(handle);
                    if (!sourceControl) {
                        return;
                    }
                    sourceControl.setSelectionState(true);
                }
            });
            this._selectedSourceControlHandles.forEach(handle => {
                if (!set.has(handle)) {
                    const sourceControl = this._sourceControls.get(handle);
                    if (!sourceControl) {
                        return;
                    }
                    sourceControl.setSelectionState(false);
                }
            });
            this._selectedSourceControlHandles = set;
            return Promise.resolve(undefined);
        }
    };
    ExtHostSCM._handlePool = 0;
    ExtHostSCM = __decorate([
        __param(2, log_1.ILogService)
    ], ExtHostSCM);
    exports.ExtHostSCM = ExtHostSCM;
});
//# __sourceMappingURL=extHostSCM.js.map