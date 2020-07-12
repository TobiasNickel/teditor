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
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/base/browser/event", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/base/browser/keyboardEvent", "vs/base/common/async", "vs/platform/layout/browser/layoutService", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/platform/storage/common/storage", "vs/base/common/numbers", "vs/platform/configuration/common/configurationRegistry", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/css!./media/actions"], function (require, exports, actions_1, nls, keybinding_1, event_1, event_2, lifecycle_1, dom_1, configuration_1, contextkey_1, keyboardEvent_1, async_1, layoutService_1, platform_1, actions_2, actions_3, storage_1, numbers_1, configurationRegistry_1, log_1, workingCopyService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let InspectContextKeysAction = class InspectContextKeysAction extends actions_1.Action {
        constructor(id, label, contextKeyService) {
            super(id, label);
            this.contextKeyService = contextKeyService;
        }
        async run() {
            const disposables = new lifecycle_1.DisposableStore();
            const stylesheet = dom_1.createStyleSheet();
            disposables.add(lifecycle_1.toDisposable(() => {
                if (stylesheet.parentNode) {
                    stylesheet.parentNode.removeChild(stylesheet);
                }
            }));
            dom_1.createCSSRule('*', 'cursor: crosshair !important;', stylesheet);
            const hoverFeedback = document.createElement('div');
            document.body.appendChild(hoverFeedback);
            disposables.add(lifecycle_1.toDisposable(() => document.body.removeChild(hoverFeedback)));
            hoverFeedback.style.position = 'absolute';
            hoverFeedback.style.pointerEvents = 'none';
            hoverFeedback.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
            hoverFeedback.style.zIndex = '1000';
            const onMouseMove = event_1.domEvent(document.body, 'mousemove', true);
            disposables.add(onMouseMove(e => {
                const target = e.target;
                const position = dom_1.getDomNodePagePosition(target);
                hoverFeedback.style.top = `${position.top}px`;
                hoverFeedback.style.left = `${position.left}px`;
                hoverFeedback.style.width = `${position.width}px`;
                hoverFeedback.style.height = `${position.height}px`;
            }));
            const onMouseDown = event_2.Event.once(event_1.domEvent(document.body, 'mousedown', true));
            onMouseDown(e => { e.preventDefault(); e.stopPropagation(); }, null, disposables);
            const onMouseUp = event_2.Event.once(event_1.domEvent(document.body, 'mouseup', true));
            onMouseUp(e => {
                e.preventDefault();
                e.stopPropagation();
                const context = this.contextKeyService.getContext(e.target);
                console.log(context.collectAllValues());
                lifecycle_1.dispose(disposables);
            }, null, disposables);
        }
    };
    InspectContextKeysAction.ID = 'workbench.action.inspectContextKeys';
    InspectContextKeysAction.LABEL = nls.localize('inspect context keys', "Inspect Context Keys");
    InspectContextKeysAction = __decorate([
        __param(2, contextkey_1.IContextKeyService)
    ], InspectContextKeysAction);
    let ToggleScreencastModeAction = class ToggleScreencastModeAction extends actions_1.Action {
        constructor(id, label, keybindingService, layoutService, configurationService) {
            super(id, label);
            this.keybindingService = keybindingService;
            this.layoutService = layoutService;
            this.configurationService = configurationService;
        }
        async run() {
            if (ToggleScreencastModeAction.disposable) {
                ToggleScreencastModeAction.disposable.dispose();
                ToggleScreencastModeAction.disposable = undefined;
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            const container = this.layoutService.container;
            const mouseMarker = dom_1.append(container, dom_1.$('.screencast-mouse'));
            disposables.add(lifecycle_1.toDisposable(() => mouseMarker.remove()));
            const onMouseDown = event_1.domEvent(container, 'mousedown', true);
            const onMouseUp = event_1.domEvent(container, 'mouseup', true);
            const onMouseMove = event_1.domEvent(container, 'mousemove', true);
            disposables.add(onMouseDown(e => {
                mouseMarker.style.top = `${e.clientY - 10}px`;
                mouseMarker.style.left = `${e.clientX - 10}px`;
                mouseMarker.style.display = 'block';
                const mouseMoveListener = onMouseMove(e => {
                    mouseMarker.style.top = `${e.clientY - 10}px`;
                    mouseMarker.style.left = `${e.clientX - 10}px`;
                });
                event_2.Event.once(onMouseUp)(() => {
                    mouseMarker.style.display = 'none';
                    mouseMoveListener.dispose();
                });
            }));
            const keyboardMarker = dom_1.append(container, dom_1.$('.screencast-keyboard'));
            disposables.add(lifecycle_1.toDisposable(() => keyboardMarker.remove()));
            const updateKeyboardFontSize = () => {
                keyboardMarker.style.fontSize = `${numbers_1.clamp(this.configurationService.getValue('screencastMode.fontSize') || 56, 20, 100)}px`;
            };
            const updateKeyboardMarker = () => {
                keyboardMarker.style.bottom = `${numbers_1.clamp(this.configurationService.getValue('screencastMode.verticalOffset') || 0, 0, 90)}%`;
            };
            updateKeyboardFontSize();
            updateKeyboardMarker();
            disposables.add(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('screencastMode.verticalOffset')) {
                    updateKeyboardMarker();
                }
                if (e.affectsConfiguration('screencastMode.fontSize')) {
                    updateKeyboardFontSize();
                }
            }));
            const onKeyDown = event_1.domEvent(window, 'keydown', true);
            let keyboardTimeout = lifecycle_1.Disposable.None;
            let length = 0;
            disposables.add(onKeyDown(e => {
                keyboardTimeout.dispose();
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                const shortcut = this.keybindingService.softDispatch(event, event.target);
                if (shortcut || !this.configurationService.getValue('screencastMode.onlyKeyboardShortcuts')) {
                    if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey
                        || length > 20
                        || event.keyCode === 1 /* Backspace */ || event.keyCode === 9 /* Escape */) {
                        keyboardMarker.innerHTML = '';
                        length = 0;
                    }
                    const keybinding = this.keybindingService.resolveKeyboardEvent(event);
                    const label = keybinding.getLabel();
                    const key = dom_1.$('span.key', {}, label || '');
                    length++;
                    dom_1.append(keyboardMarker, key);
                }
                const promise = async_1.timeout(800);
                keyboardTimeout = lifecycle_1.toDisposable(() => promise.cancel());
                promise.then(() => {
                    keyboardMarker.textContent = '';
                    length = 0;
                });
            }));
            ToggleScreencastModeAction.disposable = disposables;
        }
    };
    ToggleScreencastModeAction.ID = 'workbench.action.toggleScreencastMode';
    ToggleScreencastModeAction.LABEL = nls.localize('toggle screencast mode', "Toggle Screencast Mode");
    ToggleScreencastModeAction = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, layoutService_1.ILayoutService),
        __param(4, configuration_1.IConfigurationService)
    ], ToggleScreencastModeAction);
    let LogStorageAction = class LogStorageAction extends actions_1.Action {
        constructor(id, label, storageService) {
            super(id, label);
            this.storageService = storageService;
        }
        async run() {
            this.storageService.logStorage();
        }
    };
    LogStorageAction.ID = 'workbench.action.logStorage';
    LogStorageAction.LABEL = nls.localize({ key: 'logStorage', comment: ['A developer only action to log the contents of the storage for the current window.'] }, "Log Storage Database Contents");
    LogStorageAction = __decorate([
        __param(2, storage_1.IStorageService)
    ], LogStorageAction);
    let LogWorkingCopiesAction = class LogWorkingCopiesAction extends actions_1.Action {
        constructor(id, label, logService, workingCopyService) {
            super(id, label);
            this.logService = logService;
            this.workingCopyService = workingCopyService;
        }
        async run() {
            const msg = [
                `Dirty Working Copies:`,
                ...this.workingCopyService.dirtyWorkingCopies.map(workingCopy => workingCopy.resource.toString(true)),
                ``,
                `All Working Copies:`,
                ...this.workingCopyService.workingCopies.map(workingCopy => workingCopy.resource.toString(true)),
            ];
            this.logService.info(msg.join('\n'));
        }
    };
    LogWorkingCopiesAction.ID = 'workbench.action.logWorkingCopies';
    LogWorkingCopiesAction.LABEL = nls.localize({ key: 'logWorkingCopies', comment: ['A developer only action to log the working copies that exist.'] }, "Log Working Copies");
    LogWorkingCopiesAction = __decorate([
        __param(2, log_1.ILogService),
        __param(3, workingCopyService_1.IWorkingCopyService)
    ], LogWorkingCopiesAction);
    // --- Actions Registration
    const developerCategory = nls.localize('developer', "Developer");
    const registry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(InspectContextKeysAction), 'Developer: Inspect Context Keys', developerCategory);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleScreencastModeAction), 'Developer: Toggle Screencast Mode', developerCategory);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(LogStorageAction), 'Developer: Log Storage Database Contents', developerCategory);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(LogWorkingCopiesAction), 'Developer: Log Working Copies', developerCategory);
    // Screencast Mode
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'screencastMode',
        order: 9,
        title: nls.localize('screencastModeConfigurationTitle', "Screencast Mode"),
        type: 'object',
        properties: {
            'screencastMode.verticalOffset': {
                type: 'number',
                default: 20,
                minimum: 0,
                maximum: 90,
                description: nls.localize('screencastMode.location.verticalPosition', "Controls the vertical offset of the screencast mode overlay from the bottom as a percentage of the workbench height.")
            },
            'screencastMode.fontSize': {
                type: 'number',
                default: 56,
                minimum: 20,
                maximum: 100,
                description: nls.localize('screencastMode.fontSize', "Controls the font size (in pixels) of the screencast mode keyboard.")
            },
            'screencastMode.onlyKeyboardShortcuts': {
                type: 'boolean',
                description: nls.localize('screencastMode.onlyKeyboardShortcuts', "Only show keyboard shortcuts in Screencast Mode."),
                default: false
            }
        }
    });
});
//# __sourceMappingURL=developerActions.js.map