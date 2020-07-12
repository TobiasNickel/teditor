/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/browser/ui/menu/menu", "vs/base/browser/dom", "vs/platform/theme/common/styler", "vs/base/browser/event", "vs/base/browser/mouseEvent", "vs/css!./contextMenuHandler"], function (require, exports, actions_1, lifecycle_1, menu_1, dom_1, styler_1, event_1, mouseEvent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextMenuHandler = void 0;
    class ContextMenuHandler {
        constructor(contextViewService, telemetryService, notificationService, keybindingService, themeService) {
            this.contextViewService = contextViewService;
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.keybindingService = keybindingService;
            this.themeService = themeService;
            this.focusToReturn = null;
            this.block = null;
            this.options = { blockMouse: true };
        }
        configure(options) {
            this.options = options;
        }
        showContextMenu(delegate) {
            const actions = delegate.getActions();
            if (!actions.length) {
                return; // Don't render an empty context menu
            }
            this.focusToReturn = document.activeElement;
            let menu;
            const anchor = delegate.getAnchor();
            this.contextViewService.showContextView({
                getAnchor: () => delegate.getAnchor(),
                canRelayout: false,
                anchorAlignment: delegate.anchorAlignment,
                render: (container) => {
                    let className = delegate.getMenuClassName ? delegate.getMenuClassName() : '';
                    if (className) {
                        container.className += ' ' + className;
                    }
                    // Render invisible div to block mouse interaction in the rest of the UI
                    if (this.options.blockMouse) {
                        this.block = container.appendChild(dom_1.$('.context-view-block'));
                        event_1.domEvent(this.block, dom_1.EventType.MOUSE_DOWN)((e) => e.stopPropagation());
                    }
                    const menuDisposables = new lifecycle_1.DisposableStore();
                    const actionRunner = delegate.actionRunner || new actions_1.ActionRunner();
                    actionRunner.onDidBeforeRun(this.onActionRun, this, menuDisposables);
                    actionRunner.onDidRun(this.onDidActionRun, this, menuDisposables);
                    menu = new menu_1.Menu(container, actions, {
                        actionViewItemProvider: delegate.getActionViewItem,
                        context: delegate.getActionsContext ? delegate.getActionsContext() : null,
                        actionRunner,
                        getKeyBinding: delegate.getKeyBinding ? delegate.getKeyBinding : action => this.keybindingService.lookupKeybinding(action.id)
                    });
                    menuDisposables.add(styler_1.attachMenuStyler(menu, this.themeService));
                    menu.onDidCancel(() => this.contextViewService.hideContextView(true), null, menuDisposables);
                    menu.onDidBlur(() => this.contextViewService.hideContextView(true), null, menuDisposables);
                    event_1.domEvent(window, dom_1.EventType.BLUR)(() => { this.contextViewService.hideContextView(true); }, null, menuDisposables);
                    event_1.domEvent(window, dom_1.EventType.MOUSE_DOWN)((e) => {
                        if (e.defaultPrevented) {
                            return;
                        }
                        let event = new mouseEvent_1.StandardMouseEvent(e);
                        let element = event.target;
                        // Don't do anything as we are likely creating a context menu
                        if (event.rightButton) {
                            return;
                        }
                        while (element) {
                            if (element === container) {
                                return;
                            }
                            element = element.parentElement;
                        }
                        this.contextViewService.hideContextView(true);
                    }, null, menuDisposables);
                    return lifecycle_1.combinedDisposable(menuDisposables, menu);
                },
                focus: () => {
                    if (menu) {
                        menu.focus(!!delegate.autoSelectFirstItem);
                    }
                },
                onHide: (didCancel) => {
                    if (delegate.onHide) {
                        delegate.onHide(!!didCancel);
                    }
                    if (this.block) {
                        dom_1.removeNode(this.block);
                        this.block = null;
                    }
                    if (this.focusToReturn) {
                        this.focusToReturn.focus();
                    }
                }
            }, !!delegate.anchorAsContainer && dom_1.isHTMLElement(anchor) ? anchor : undefined);
        }
        onActionRun(e) {
            if (this.telemetryService) {
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: 'contextMenu' });
            }
            this.contextViewService.hideContextView(false);
            // Restore focus here
            if (this.focusToReturn) {
                this.focusToReturn.focus();
            }
        }
        onDidActionRun(e) {
            if (e.error && this.notificationService) {
                this.notificationService.error(e.error);
            }
        }
    }
    exports.ContextMenuHandler = ContextMenuHandler;
});
//# __sourceMappingURL=contextMenuHandler.js.map