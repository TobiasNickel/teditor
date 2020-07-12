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
define(["require", "exports", "vs/platform/quickinput/common/quickInput", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostCustomers", "vs/base/common/uri", "vs/platform/theme/common/themeService"], function (require, exports, quickInput_1, extHost_protocol_1, extHostCustomers_1, uri_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadQuickOpen = void 0;
    let MainThreadQuickOpen = class MainThreadQuickOpen {
        constructor(extHostContext, quickInputService) {
            this._items = {};
            // ---- QuickInput
            this.sessions = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostQuickOpen);
            this._quickInputService = quickInputService;
        }
        dispose() {
        }
        $show(instance, options, token) {
            const contents = new Promise((resolve, reject) => {
                this._items[instance] = { resolve, reject };
            });
            options = Object.assign(Object.assign({}, options), { onDidFocus: el => {
                    if (el) {
                        this._proxy.$onItemSelected(el.handle);
                    }
                } });
            if (options.canPickMany) {
                return this._quickInputService.pick(contents, options, token).then(items => {
                    if (items) {
                        return items.map(item => item.handle);
                    }
                    return undefined;
                });
            }
            else {
                return this._quickInputService.pick(contents, options, token).then(item => {
                    if (item) {
                        return item.handle;
                    }
                    return undefined;
                });
            }
        }
        $setItems(instance, items) {
            if (this._items[instance]) {
                this._items[instance].resolve(items);
                delete this._items[instance];
            }
            return Promise.resolve();
        }
        $setError(instance, error) {
            if (this._items[instance]) {
                this._items[instance].reject(error);
                delete this._items[instance];
            }
            return Promise.resolve();
        }
        // ---- input
        $input(options, validateInput, token) {
            const inputOptions = Object.create(null);
            if (options) {
                inputOptions.password = options.password;
                inputOptions.placeHolder = options.placeHolder;
                inputOptions.valueSelection = options.valueSelection;
                inputOptions.prompt = options.prompt;
                inputOptions.value = options.value;
                inputOptions.ignoreFocusLost = options.ignoreFocusOut;
            }
            if (validateInput) {
                inputOptions.validateInput = (value) => {
                    return this._proxy.$validateInput(value);
                };
            }
            return this._quickInputService.input(inputOptions, token);
        }
        $createOrUpdate(params) {
            const sessionId = params.id;
            let session = this.sessions.get(sessionId);
            if (!session) {
                if (params.type === 'quickPick') {
                    const input = this._quickInputService.createQuickPick();
                    input.onDidAccept(() => {
                        this._proxy.$onDidAccept(sessionId);
                    });
                    input.onDidChangeActive(items => {
                        this._proxy.$onDidChangeActive(sessionId, items.map(item => item.handle));
                    });
                    input.onDidChangeSelection(items => {
                        this._proxy.$onDidChangeSelection(sessionId, items.map(item => item.handle));
                    });
                    input.onDidTriggerButton(button => {
                        this._proxy.$onDidTriggerButton(sessionId, button.handle);
                    });
                    input.onDidChangeValue(value => {
                        this._proxy.$onDidChangeValue(sessionId, value);
                    });
                    input.onDidHide(() => {
                        this._proxy.$onDidHide(sessionId);
                    });
                    session = {
                        input,
                        handlesToItems: new Map()
                    };
                }
                else {
                    const input = this._quickInputService.createInputBox();
                    input.onDidAccept(() => {
                        this._proxy.$onDidAccept(sessionId);
                    });
                    input.onDidTriggerButton(button => {
                        this._proxy.$onDidTriggerButton(sessionId, button.handle);
                    });
                    input.onDidChangeValue(value => {
                        this._proxy.$onDidChangeValue(sessionId, value);
                    });
                    input.onDidHide(() => {
                        this._proxy.$onDidHide(sessionId);
                    });
                    session = {
                        input,
                        handlesToItems: new Map()
                    };
                }
                this.sessions.set(sessionId, session);
            }
            const { input, handlesToItems } = session;
            for (const param in params) {
                if (param === 'id' || param === 'type') {
                    continue;
                }
                if (param === 'visible') {
                    if (params.visible) {
                        input.show();
                    }
                    else {
                        input.hide();
                    }
                }
                else if (param === 'items') {
                    handlesToItems.clear();
                    params[param].forEach((item) => {
                        handlesToItems.set(item.handle, item);
                    });
                    input[param] = params[param];
                }
                else if (param === 'activeItems' || param === 'selectedItems') {
                    input[param] = params[param]
                        .filter((handle) => handlesToItems.has(handle))
                        .map((handle) => handlesToItems.get(handle));
                }
                else if (param === 'buttons') {
                    input[param] = params.buttons.map(button => {
                        if (button.handle === -1) {
                            return this._quickInputService.backButton;
                        }
                        const { iconPath, tooltip, handle } = button;
                        if ('id' in iconPath) {
                            return {
                                iconClass: themeService_1.ThemeIcon.asClassName(iconPath),
                                tooltip,
                                handle
                            };
                        }
                        else {
                            return {
                                iconPath: {
                                    dark: uri_1.URI.revive(iconPath.dark),
                                    light: iconPath.light && uri_1.URI.revive(iconPath.light)
                                },
                                tooltip,
                                handle
                            };
                        }
                    });
                }
                else {
                    input[param] = params[param];
                }
            }
            return Promise.resolve(undefined);
        }
        $dispose(sessionId) {
            const session = this.sessions.get(sessionId);
            if (session) {
                session.input.dispose();
                this.sessions.delete(sessionId);
            }
            return Promise.resolve(undefined);
        }
    };
    MainThreadQuickOpen = __decorate([
        extHostCustomers_1.extHostNamedCustomer(extHost_protocol_1.MainContext.MainThreadQuickOpen),
        __param(1, quickInput_1.IQuickInputService)
    ], MainThreadQuickOpen);
    exports.MainThreadQuickOpen = MainThreadQuickOpen;
});
//# __sourceMappingURL=mainThreadQuickOpen.js.map