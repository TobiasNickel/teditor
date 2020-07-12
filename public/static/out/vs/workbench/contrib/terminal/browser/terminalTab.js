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
define(["require", "exports", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/browser/ui/splitview/splitview", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/common/views"], function (require, exports, terminal_1, event_1, lifecycle_1, splitview_1, layoutService_1, instantiation_1, terminal_2, views_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalTab = void 0;
    const SPLIT_PANE_MIN_SIZE = 120;
    let SplitPaneContainer = class SplitPaneContainer extends lifecycle_1.Disposable {
        constructor(_container, orientation, _layoutService) {
            super();
            this._container = _container;
            this.orientation = orientation;
            this._layoutService = _layoutService;
            this._splitViewDisposables = this._register(new lifecycle_1.DisposableStore());
            this._children = [];
            this._onDidChange = event_1.Event.None;
            this._width = this._container.offsetWidth;
            this._height = this._container.offsetHeight;
            this._createSplitView();
            this._splitView.layout(this.orientation === 1 /* HORIZONTAL */ ? this._width : this._height);
        }
        get onDidChange() { return this._onDidChange; }
        _createSplitView() {
            this._splitView = new splitview_1.SplitView(this._container, { orientation: this.orientation });
            this._splitViewDisposables.clear();
            this._splitViewDisposables.add(this._splitView.onDidSashReset(() => this._splitView.distributeViewSizes()));
        }
        split(instance, index = this._children.length) {
            this._addChild(instance, index);
        }
        resizePane(index, direction, amount) {
            const isHorizontal = (direction === 0 /* Left */) || (direction === 1 /* Right */);
            if ((isHorizontal && this.orientation !== 1 /* HORIZONTAL */) ||
                (!isHorizontal && this.orientation !== 0 /* VERTICAL */)) {
                // Resize the entire pane as a whole
                if ((this.orientation === 1 /* HORIZONTAL */ && direction === 3 /* Down */) ||
                    (this.orientation === 0 /* VERTICAL */ && direction === 1 /* Right */)) {
                    amount *= -1;
                }
                this._layoutService.resizePart("workbench.parts.panel" /* PANEL_PART */, amount);
                return;
            }
            // Resize left/right in horizontal or up/down in vertical
            // Only resize when there is more than one pane
            if (this._children.length <= 1) {
                return;
            }
            // Get sizes
            const sizes = [];
            for (let i = 0; i < this._splitView.length; i++) {
                sizes.push(this._splitView.getViewSize(i));
            }
            // Remove size from right pane, unless index is the last pane in which case use left pane
            const isSizingEndPane = index !== this._children.length - 1;
            const indexToChange = isSizingEndPane ? index + 1 : index - 1;
            if (isSizingEndPane && direction === 0 /* Left */) {
                amount *= -1;
            }
            else if (!isSizingEndPane && direction === 1 /* Right */) {
                amount *= -1;
            }
            else if (isSizingEndPane && direction === 2 /* Up */) {
                amount *= -1;
            }
            else if (!isSizingEndPane && direction === 3 /* Down */) {
                amount *= -1;
            }
            // Ensure the size is not reduced beyond the minimum, otherwise weird things can happen
            if (sizes[index] + amount < SPLIT_PANE_MIN_SIZE) {
                amount = SPLIT_PANE_MIN_SIZE - sizes[index];
            }
            else if (sizes[indexToChange] - amount < SPLIT_PANE_MIN_SIZE) {
                amount = sizes[indexToChange] - SPLIT_PANE_MIN_SIZE;
            }
            // Apply the size change
            sizes[index] += amount;
            sizes[indexToChange] -= amount;
            for (let i = 0; i < this._splitView.length - 1; i++) {
                this._splitView.resizeView(i, sizes[i]);
            }
        }
        _addChild(instance, index) {
            const child = new SplitPane(instance, this.orientation === 1 /* HORIZONTAL */ ? this._height : this._width);
            child.orientation = this.orientation;
            if (typeof index === 'number') {
                this._children.splice(index, 0, child);
            }
            else {
                this._children.push(child);
            }
            this._withDisabledLayout(() => this._splitView.addView(child, splitview_1.Sizing.Distribute, index));
            this._onDidChange = event_1.Event.any(...this._children.map(c => c.onDidChange));
        }
        remove(instance) {
            let index = null;
            for (let i = 0; i < this._children.length; i++) {
                if (this._children[i].instance === instance) {
                    index = i;
                }
            }
            if (index !== null) {
                this._children.splice(index, 1);
                this._splitView.removeView(index, splitview_1.Sizing.Distribute);
            }
        }
        layout(width, height) {
            this._width = width;
            this._height = height;
            if (this.orientation === 1 /* HORIZONTAL */) {
                this._children.forEach(c => c.orthogonalLayout(height));
                this._splitView.layout(width);
            }
            else {
                this._children.forEach(c => c.orthogonalLayout(width));
                this._splitView.layout(height);
            }
        }
        setOrientation(orientation) {
            if (this.orientation === orientation) {
                return;
            }
            this.orientation = orientation;
            // Remove old split view
            while (this._container.children.length > 0) {
                this._container.removeChild(this._container.children[0]);
            }
            this._splitViewDisposables.clear();
            this._splitView.dispose();
            // Create new split view with updated orientation
            this._createSplitView();
            this._withDisabledLayout(() => {
                this._children.forEach(child => {
                    child.orientation = orientation;
                    this._splitView.addView(child, 1);
                });
            });
        }
        _withDisabledLayout(innerFunction) {
            // Whenever manipulating views that are going to be changed immediately, disabling
            // layout/resize events in the terminal prevent bad dimensions going to the pty.
            this._children.forEach(c => c.instance.disableLayout = true);
            innerFunction();
            this._children.forEach(c => c.instance.disableLayout = false);
        }
    };
    SplitPaneContainer = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], SplitPaneContainer);
    class SplitPane {
        constructor(instance, orthogonalSize) {
            this.instance = instance;
            this.orthogonalSize = orthogonalSize;
            this.minimumSize = SPLIT_PANE_MIN_SIZE;
            this.maximumSize = Number.MAX_VALUE;
            this._onDidChange = event_1.Event.None;
            this.element = document.createElement('div');
            this.element.className = 'terminal-split-pane';
            this.instance.attachToElement(this.element);
        }
        get onDidChange() { return this._onDidChange; }
        layout(size) {
            // Only layout when both sizes are known
            if (!size || !this.orthogonalSize) {
                return;
            }
            if (this.orientation === 0 /* VERTICAL */) {
                this.instance.layout({ width: this.orthogonalSize, height: size });
            }
            else {
                this.instance.layout({ width: size, height: this.orthogonalSize });
            }
        }
        orthogonalLayout(size) {
            this.orthogonalSize = size;
        }
    }
    let TerminalTab = class TerminalTab extends lifecycle_1.Disposable {
        constructor(_container, shellLaunchConfigOrInstance, _terminalService, _layoutService, _viewDescriptorService, _instantiationService) {
            super();
            this._container = _container;
            this._terminalService = _terminalService;
            this._layoutService = _layoutService;
            this._viewDescriptorService = _viewDescriptorService;
            this._instantiationService = _instantiationService;
            this._terminalInstances = [];
            this._panelPosition = 2 /* BOTTOM */;
            this._terminalLocation = views_1.ViewContainerLocation.Panel;
            this._isVisible = false;
            this._onDisposed = this._register(new event_1.Emitter());
            this.onDisposed = this._onDisposed.event;
            this._onInstancesChanged = this._register(new event_1.Emitter());
            this.onInstancesChanged = this._onInstancesChanged.event;
            let instance;
            if ('id' in shellLaunchConfigOrInstance) {
                instance = shellLaunchConfigOrInstance;
            }
            else {
                instance = this._terminalService.createInstance(undefined, shellLaunchConfigOrInstance);
            }
            this._terminalInstances.push(instance);
            this._initInstanceListeners(instance);
            this._activeInstanceIndex = 0;
            if (this._container) {
                this.attachToElement(this._container);
            }
        }
        get terminalInstances() { return this._terminalInstances; }
        dispose() {
            super.dispose();
            if (this._container && this._tabElement) {
                this._container.removeChild(this._tabElement);
                this._tabElement = undefined;
            }
            this._terminalInstances = [];
            this._onInstancesChanged.fire();
        }
        get activeInstance() {
            if (this._terminalInstances.length === 0) {
                return null;
            }
            return this._terminalInstances[this._activeInstanceIndex];
        }
        _initInstanceListeners(instance) {
            instance.addDisposable(instance.onDisposed(instance => this._onInstanceDisposed(instance)));
            instance.addDisposable(instance.onFocused(instance => this._setActiveInstance(instance)));
        }
        _onInstanceDisposed(instance) {
            // Get the index of the instance and remove it from the list
            const index = this._terminalInstances.indexOf(instance);
            const wasActiveInstance = instance === this.activeInstance;
            if (index !== -1) {
                this._terminalInstances.splice(index, 1);
            }
            // Adjust focus if the instance was active
            if (wasActiveInstance && this._terminalInstances.length > 0) {
                const newIndex = index < this._terminalInstances.length ? index : this._terminalInstances.length - 1;
                this.setActiveInstanceByIndex(newIndex);
                // TODO: Only focus the new instance if the tab had focus?
                if (this.activeInstance) {
                    this.activeInstance.focus(true);
                }
            }
            // Remove the instance from the split pane if it has been created
            if (this._splitPaneContainer) {
                this._splitPaneContainer.remove(instance);
            }
            // Fire events and dispose tab if it was the last instance
            this._onInstancesChanged.fire();
            if (this._terminalInstances.length === 0) {
                this._onDisposed.fire(this);
                this.dispose();
            }
        }
        _setActiveInstance(instance) {
            this.setActiveInstanceByIndex(this._getIndexFromId(instance.id));
        }
        _getIndexFromId(terminalId) {
            let terminalIndex = -1;
            this.terminalInstances.forEach((terminalInstance, i) => {
                if (terminalInstance.id === terminalId) {
                    terminalIndex = i;
                }
            });
            if (terminalIndex === -1) {
                throw new Error(`Terminal with ID ${terminalId} does not exist (has it already been disposed?)`);
            }
            return terminalIndex;
        }
        setActiveInstanceByIndex(index) {
            // Check for invalid value
            if (index < 0 || index >= this._terminalInstances.length) {
                return;
            }
            const didInstanceChange = this._activeInstanceIndex !== index;
            this._activeInstanceIndex = index;
            if (didInstanceChange) {
                this._onInstancesChanged.fire();
            }
        }
        attachToElement(element) {
            this._container = element;
            // If we already have a tab element, we can reparent it
            if (!this._tabElement) {
                this._tabElement = document.createElement('div');
                this._tabElement.classList.add('terminal-tab');
            }
            this._container.appendChild(this._tabElement);
            if (!this._splitPaneContainer) {
                this._panelPosition = this._layoutService.getPanelPosition();
                this._terminalLocation = this._viewDescriptorService.getViewLocationById(terminal_1.TERMINAL_VIEW_ID);
                const orientation = this._terminalLocation === views_1.ViewContainerLocation.Panel && this._panelPosition === 2 /* BOTTOM */ ? 1 /* HORIZONTAL */ : 0 /* VERTICAL */;
                const newLocal = this._instantiationService.createInstance(SplitPaneContainer, this._tabElement, orientation);
                this._splitPaneContainer = newLocal;
                this.terminalInstances.forEach(instance => this._splitPaneContainer.split(instance));
            }
            this.setVisible(this._isVisible);
        }
        get title() {
            let title = this.terminalInstances[0].title;
            for (let i = 1; i < this.terminalInstances.length; i++) {
                if (this.terminalInstances[i].title) {
                    title += `, ${this.terminalInstances[i].title}`;
                }
            }
            return title;
        }
        setVisible(visible) {
            this._isVisible = visible;
            if (this._tabElement) {
                this._tabElement.style.display = visible ? '' : 'none';
            }
            this.terminalInstances.forEach(i => i.setVisible(visible));
        }
        split(shellLaunchConfig) {
            if (!this._container) {
                throw new Error('Cannot split terminal that has not been attached');
            }
            const instance = this._terminalService.createInstance(undefined, shellLaunchConfig);
            this._terminalInstances.splice(this._activeInstanceIndex + 1, 0, instance);
            this._initInstanceListeners(instance);
            this._setActiveInstance(instance);
            if (this._splitPaneContainer) {
                this._splitPaneContainer.split(instance, this._activeInstanceIndex);
            }
            return instance;
        }
        addDisposable(disposable) {
            this._register(disposable);
        }
        layout(width, height) {
            if (this._splitPaneContainer) {
                // Check if the panel position changed and rotate panes if so
                const newPanelPosition = this._layoutService.getPanelPosition();
                const newTerminalLocation = this._viewDescriptorService.getViewLocationById(terminal_1.TERMINAL_VIEW_ID);
                const terminalPositionChanged = newPanelPosition !== this._panelPosition || newTerminalLocation !== this._terminalLocation;
                if (terminalPositionChanged) {
                    const newOrientation = newTerminalLocation === views_1.ViewContainerLocation.Panel && newPanelPosition === 2 /* BOTTOM */ ? 1 /* HORIZONTAL */ : 0 /* VERTICAL */;
                    this._splitPaneContainer.setOrientation(newOrientation);
                    this._panelPosition = newPanelPosition;
                    this._terminalLocation = newTerminalLocation;
                }
                this._splitPaneContainer.layout(width, height);
            }
        }
        focusPreviousPane() {
            const newIndex = this._activeInstanceIndex === 0 ? this._terminalInstances.length - 1 : this._activeInstanceIndex - 1;
            this.setActiveInstanceByIndex(newIndex);
        }
        focusNextPane() {
            const newIndex = this._activeInstanceIndex === this._terminalInstances.length - 1 ? 0 : this._activeInstanceIndex + 1;
            this.setActiveInstanceByIndex(newIndex);
        }
        resizePane(direction) {
            if (!this._splitPaneContainer) {
                return;
            }
            const isHorizontal = (direction === 0 /* Left */ || direction === 1 /* Right */);
            const font = this._terminalService.configHelper.getFont();
            // TODO: Support letter spacing and line height
            const amount = isHorizontal ? font.charWidth : font.charHeight;
            if (amount) {
                this._splitPaneContainer.resizePane(this._activeInstanceIndex, direction, amount);
            }
        }
    };
    TerminalTab = __decorate([
        __param(2, terminal_2.ITerminalService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, views_1.IViewDescriptorService),
        __param(5, instantiation_1.IInstantiationService)
    ], TerminalTab);
    exports.TerminalTab = TerminalTab;
});
//# __sourceMappingURL=terminalTab.js.map