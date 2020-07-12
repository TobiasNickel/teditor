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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/log/common/log", "vs/base/common/arrays"], function (require, exports, lifecycle_1, event_1, log_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SCMService = void 0;
    class SCMInput {
        constructor() {
            this._value = '';
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._placeholder = '';
            this._onDidChangePlaceholder = new event_1.Emitter();
            this.onDidChangePlaceholder = this._onDidChangePlaceholder.event;
            this._visible = true;
            this._onDidChangeVisibility = new event_1.Emitter();
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._validateInput = () => Promise.resolve(undefined);
            this._onDidChangeValidateInput = new event_1.Emitter();
            this.onDidChangeValidateInput = this._onDidChangeValidateInput.event;
        }
        get value() {
            return this._value;
        }
        set value(value) {
            if (value === this._value) {
                return;
            }
            this._value = value;
            this._onDidChange.fire(value);
        }
        get placeholder() {
            return this._placeholder;
        }
        set placeholder(placeholder) {
            this._placeholder = placeholder;
            this._onDidChangePlaceholder.fire(placeholder);
        }
        get visible() {
            return this._visible;
        }
        set visible(visible) {
            this._visible = visible;
            this._onDidChangeVisibility.fire(visible);
        }
        get validateInput() {
            return this._validateInput;
        }
        set validateInput(validateInput) {
            this._validateInput = validateInput;
            this._onDidChangeValidateInput.fire();
        }
    }
    class SCMRepository {
        constructor(provider, disposable) {
            this.provider = provider;
            this.disposable = disposable;
            this._onDidFocus = new event_1.Emitter();
            this.onDidFocus = this._onDidFocus.event;
            this._selected = false;
            this._onDidChangeSelection = new event_1.Emitter();
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this.input = new SCMInput();
        }
        get selected() {
            return this._selected;
        }
        focus() {
            this._onDidFocus.fire();
        }
        setSelected(selected) {
            if (this._selected === selected) {
                return;
            }
            this._selected = selected;
            this._onDidChangeSelection.fire(selected);
        }
        dispose() {
            this.disposable.dispose();
            this.provider.dispose();
        }
    }
    let SCMService = class SCMService {
        constructor(logService) {
            this.logService = logService;
            this._providerIds = new Set();
            this._repositories = [];
            this._selectedRepositories = [];
            this._onDidChangeSelectedRepositories = new event_1.Emitter();
            this.onDidChangeSelectedRepositories = this._onDidChangeSelectedRepositories.event;
            this._onDidAddProvider = new event_1.Emitter();
            this.onDidAddRepository = this._onDidAddProvider.event;
            this._onDidRemoveProvider = new event_1.Emitter();
            this.onDidRemoveRepository = this._onDidRemoveProvider.event;
        }
        get repositories() { return [...this._repositories]; }
        get selectedRepositories() { return [...this._selectedRepositories]; }
        registerSCMProvider(provider) {
            this.logService.trace('SCMService#registerSCMProvider');
            if (this._providerIds.has(provider.id)) {
                throw new Error(`SCM Provider ${provider.id} already exists.`);
            }
            this._providerIds.add(provider.id);
            const disposable = lifecycle_1.toDisposable(() => {
                const index = this._repositories.indexOf(repository);
                if (index < 0) {
                    return;
                }
                selectedDisposable.dispose();
                this._providerIds.delete(provider.id);
                this._repositories.splice(index, 1);
                this._onDidRemoveProvider.fire(repository);
                this.onDidChangeSelection();
            });
            const repository = new SCMRepository(provider, disposable);
            const selectedDisposable = repository.onDidChangeSelection(this.onDidChangeSelection, this);
            this._repositories.push(repository);
            this._onDidAddProvider.fire(repository);
            return repository;
        }
        onDidChangeSelection() {
            const selectedRepositories = this._repositories.filter(r => r.selected);
            if (arrays_1.equals(this._selectedRepositories, selectedRepositories)) {
                return;
            }
            this._selectedRepositories = this._repositories.filter(r => r.selected);
            this._onDidChangeSelectedRepositories.fire(this.selectedRepositories);
        }
    };
    SCMService = __decorate([
        __param(0, log_1.ILogService)
    ], SCMService);
    exports.SCMService = SCMService;
});
//# __sourceMappingURL=scmService.js.map