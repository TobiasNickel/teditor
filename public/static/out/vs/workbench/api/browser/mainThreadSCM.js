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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/lifecycle", "vs/workbench/contrib/scm/common/scm", "../common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/base/common/sequence", "vs/base/common/cancellation"], function (require, exports, uri_1, event_1, objects_1, lifecycle_1, scm_1, extHost_protocol_1, extHostCustomers_1, sequence_1, cancellation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadSCM = void 0;
    class MainThreadSCMResourceGroup {
        constructor(sourceControlHandle, handle, provider, features, label, id) {
            this.sourceControlHandle = sourceControlHandle;
            this.handle = handle;
            this.provider = provider;
            this.features = features;
            this.label = label;
            this.id = id;
            this.elements = [];
            this._onDidSplice = new event_1.Emitter();
            this.onDidSplice = this._onDidSplice.event;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        get hideWhenEmpty() { return !!this.features.hideWhenEmpty; }
        toJSON() {
            return {
                $mid: 4,
                sourceControlHandle: this.sourceControlHandle,
                groupHandle: this.handle
            };
        }
        splice(start, deleteCount, toInsert) {
            this.elements.splice(start, deleteCount, ...toInsert);
            this._onDidSplice.fire({ start, deleteCount, toInsert });
        }
        $updateGroup(features) {
            this.features = objects_1.assign(this.features, features);
            this._onDidChange.fire();
        }
        $updateGroupLabel(label) {
            this.label = label;
            this._onDidChange.fire();
        }
    }
    class MainThreadSCMResource {
        constructor(proxy, sourceControlHandle, groupHandle, handle, sourceUri, resourceGroup, decorations) {
            this.proxy = proxy;
            this.sourceControlHandle = sourceControlHandle;
            this.groupHandle = groupHandle;
            this.handle = handle;
            this.sourceUri = sourceUri;
            this.resourceGroup = resourceGroup;
            this.decorations = decorations;
        }
        open(preserveFocus) {
            return this.proxy.$executeResourceCommand(this.sourceControlHandle, this.groupHandle, this.handle, preserveFocus);
        }
        toJSON() {
            return {
                $mid: 3,
                sourceControlHandle: this.sourceControlHandle,
                groupHandle: this.groupHandle,
                handle: this.handle
            };
        }
    }
    let MainThreadSCMProvider = class MainThreadSCMProvider {
        constructor(proxy, _handle, _contextValue, _label, _rootUri, scmService) {
            this.proxy = proxy;
            this._handle = _handle;
            this._contextValue = _contextValue;
            this._label = _label;
            this._rootUri = _rootUri;
            this._id = `scm${MainThreadSCMProvider.ID_HANDLE++}`;
            this.groups = new sequence_1.Sequence();
            this._groupsByHandle = Object.create(null);
            // get groups(): ISequence<ISCMResourceGroup> {
            // 	return {
            // 		elements: this._groups,
            // 		onDidSplice: this._onDidSplice.event
            // 	};
            // 	// return this._groups
            // 	// 	.filter(g => g.resources.elements.length > 0 || !g.features.hideWhenEmpty);
            // }
            this._onDidChangeResources = new event_1.Emitter();
            this.onDidChangeResources = this._onDidChangeResources.event;
            this.features = {};
            this._onDidChangeCommitTemplate = new event_1.Emitter();
            this.onDidChangeCommitTemplate = this._onDidChangeCommitTemplate.event;
            this._onDidChangeStatusBarCommands = new event_1.Emitter();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        get id() { return this._id; }
        get handle() { return this._handle; }
        get label() { return this._label; }
        get rootUri() { return this._rootUri; }
        get contextValue() { return this._contextValue; }
        get commitTemplate() { return this.features.commitTemplate || ''; }
        get acceptInputCommand() { return this.features.acceptInputCommand; }
        get statusBarCommands() { return this.features.statusBarCommands; }
        get count() { return this.features.count; }
        get onDidChangeStatusBarCommands() { return this._onDidChangeStatusBarCommands.event; }
        $updateSourceControl(features) {
            this.features = objects_1.assign(this.features, features);
            this._onDidChange.fire();
            if (typeof features.commitTemplate !== 'undefined') {
                this._onDidChangeCommitTemplate.fire(this.commitTemplate);
            }
            if (typeof features.statusBarCommands !== 'undefined') {
                this._onDidChangeStatusBarCommands.fire(this.statusBarCommands);
            }
        }
        $registerGroup(handle, id, label) {
            const group = new MainThreadSCMResourceGroup(this.handle, handle, this, {}, label, id);
            this._groupsByHandle[handle] = group;
            this.groups.splice(this.groups.elements.length, 0, [group]);
        }
        $updateGroup(handle, features) {
            const group = this._groupsByHandle[handle];
            if (!group) {
                return;
            }
            group.$updateGroup(features);
        }
        $updateGroupLabel(handle, label) {
            const group = this._groupsByHandle[handle];
            if (!group) {
                return;
            }
            group.$updateGroupLabel(label);
        }
        $spliceGroupResourceStates(splices) {
            for (const [groupHandle, groupSlices] of splices) {
                const group = this._groupsByHandle[groupHandle];
                if (!group) {
                    console.warn(`SCM group ${groupHandle} not found in provider ${this.label}`);
                    continue;
                }
                // reverse the splices sequence in order to apply them correctly
                groupSlices.reverse();
                for (const [start, deleteCount, rawResources] of groupSlices) {
                    const resources = rawResources.map(rawResource => {
                        const [handle, sourceUri, icons, tooltip, strikeThrough, faded] = rawResource;
                        const icon = icons[0];
                        const iconDark = icons[1] || icon;
                        const decorations = {
                            icon: icon ? uri_1.URI.revive(icon) : undefined,
                            iconDark: iconDark ? uri_1.URI.revive(iconDark) : undefined,
                            tooltip,
                            strikeThrough,
                            faded
                        };
                        return new MainThreadSCMResource(this.proxy, this.handle, groupHandle, handle, uri_1.URI.revive(sourceUri), group, decorations);
                    });
                    group.splice(start, deleteCount, resources);
                }
            }
            this._onDidChangeResources.fire();
        }
        $unregisterGroup(handle) {
            const group = this._groupsByHandle[handle];
            if (!group) {
                return;
            }
            delete this._groupsByHandle[handle];
            this.groups.splice(this.groups.elements.indexOf(group), 1);
        }
        async getOriginalResource(uri) {
            if (!this.features.hasQuickDiffProvider) {
                return null;
            }
            const result = await this.proxy.$provideOriginalResource(this.handle, uri, cancellation_1.CancellationToken.None);
            return result && uri_1.URI.revive(result);
        }
        toJSON() {
            return {
                $mid: 5,
                handle: this.handle
            };
        }
        dispose() {
        }
    };
    MainThreadSCMProvider.ID_HANDLE = 0;
    MainThreadSCMProvider = __decorate([
        __param(5, scm_1.ISCMService)
    ], MainThreadSCMProvider);
    let MainThreadSCM = class MainThreadSCM {
        constructor(extHostContext, scmService) {
            this.scmService = scmService;
            this._repositories = new Map();
            this._inputDisposables = new Map();
            this._disposables = new lifecycle_1.DisposableStore();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostSCM);
            event_1.Event.debounce(scmService.onDidChangeSelectedRepositories, (_, e) => e, 100)(this.onDidChangeSelectedRepositories, this, this._disposables);
        }
        dispose() {
            this._repositories.forEach(r => r.dispose());
            this._repositories.clear();
            this._inputDisposables.forEach(d => d.dispose());
            this._inputDisposables.clear();
            this._disposables.dispose();
        }
        $registerSourceControl(handle, id, label, rootUri) {
            const provider = new MainThreadSCMProvider(this._proxy, handle, id, label, rootUri ? uri_1.URI.revive(rootUri) : undefined, this.scmService);
            const repository = this.scmService.registerSCMProvider(provider);
            this._repositories.set(handle, repository);
            const inputDisposable = repository.input.onDidChange(value => this._proxy.$onInputBoxValueChange(handle, value));
            this._inputDisposables.set(handle, inputDisposable);
        }
        $updateSourceControl(handle, features) {
            const repository = this._repositories.get(handle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$updateSourceControl(features);
        }
        $unregisterSourceControl(handle) {
            const repository = this._repositories.get(handle);
            if (!repository) {
                return;
            }
            this._inputDisposables.get(handle).dispose();
            this._inputDisposables.delete(handle);
            repository.dispose();
            this._repositories.delete(handle);
        }
        $registerGroup(sourceControlHandle, groupHandle, id, label) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$registerGroup(groupHandle, id, label);
        }
        $updateGroup(sourceControlHandle, groupHandle, features) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$updateGroup(groupHandle, features);
        }
        $updateGroupLabel(sourceControlHandle, groupHandle, label) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$updateGroupLabel(groupHandle, label);
        }
        $spliceResourceStates(sourceControlHandle, splices) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$spliceGroupResourceStates(splices);
        }
        $unregisterGroup(sourceControlHandle, handle) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            const provider = repository.provider;
            provider.$unregisterGroup(handle);
        }
        $setInputBoxValue(sourceControlHandle, value) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            repository.input.value = value;
        }
        $setInputBoxPlaceholder(sourceControlHandle, placeholder) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            repository.input.placeholder = placeholder;
        }
        $setInputBoxVisibility(sourceControlHandle, visible) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            repository.input.visible = visible;
        }
        $setValidationProviderIsEnabled(sourceControlHandle, enabled) {
            const repository = this._repositories.get(sourceControlHandle);
            if (!repository) {
                return;
            }
            if (enabled) {
                repository.input.validateInput = async (value, pos) => {
                    const result = await this._proxy.$validateInput(sourceControlHandle, value, pos);
                    return result && { message: result[0], type: result[1] };
                };
            }
            else {
                repository.input.validateInput = async () => undefined;
            }
        }
        onDidChangeSelectedRepositories(repositories) {
            const handles = repositories
                .filter(r => r.provider instanceof MainThreadSCMProvider)
                .map(r => r.provider.handle);
            this._proxy.$setSelectedSourceControls(handles);
        }
    };
    MainThreadSCM = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadSCM),
        __param(1, scm_1.ISCMService)
    ], MainThreadSCM);
    exports.MainThreadSCM = MainThreadSCM;
});
//# __sourceMappingURL=mainThreadSCM.js.map