/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/quickinput/common/quickInput", "vs/base/browser/dom", "vs/base/common/cancellation", "./quickInputList", "./quickInputBox", "vs/base/browser/keyboardEvent", "vs/nls", "vs/base/browser/ui/countBadge/countBadge", "vs/base/browser/ui/progressbar/progressbar", "vs/base/common/event", "vs/base/browser/ui/button/button", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/parts/quickinput/browser/quickInputUtils", "vs/base/common/codicons", "vs/css!./media/quickInput"], function (require, exports, quickInput_1, dom, cancellation_1, quickInputList_1, quickInputBox_1, keyboardEvent_1, nls_1, countBadge_1, progressbar_1, event_1, button_1, lifecycle_1, severity_1, actionbar_1, actions_1, arrays_1, async_1, quickInputUtils_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickInputController = void 0;
    const $ = dom.$;
    const backButtonIcon = codicons_1.registerIcon('quick-input-back', codicons_1.Codicon.arrowLeft);
    const backButton = {
        iconClass: backButtonIcon.classNames,
        tooltip: nls_1.localize('quickInput.back', "Back"),
        handle: -1 // TODO
    };
    class QuickInput extends lifecycle_1.Disposable {
        constructor(ui) {
            super();
            this.ui = ui;
            this.visible = false;
            this._enabled = true;
            this._busy = false;
            this._ignoreFocusOut = false;
            this._buttons = [];
            this.buttonsUpdated = false;
            this.onDidTriggerButtonEmitter = this._register(new event_1.Emitter());
            this.onDidHideEmitter = this._register(new event_1.Emitter());
            this.onDisposeEmitter = this._register(new event_1.Emitter());
            this.visibleDisposables = this._register(new lifecycle_1.DisposableStore());
            this.onDidTriggerButton = this.onDidTriggerButtonEmitter.event;
            this.onDidHide = this.onDidHideEmitter.event;
            this.onDispose = this.onDisposeEmitter.event;
        }
        get title() {
            return this._title;
        }
        set title(title) {
            this._title = title;
            this.update();
        }
        get description() {
            return this._description;
        }
        set description(description) {
            this._description = description;
            this.update();
        }
        get step() {
            return this._steps;
        }
        set step(step) {
            this._steps = step;
            this.update();
        }
        get totalSteps() {
            return this._totalSteps;
        }
        set totalSteps(totalSteps) {
            this._totalSteps = totalSteps;
            this.update();
        }
        get enabled() {
            return this._enabled;
        }
        set enabled(enabled) {
            this._enabled = enabled;
            this.update();
        }
        get contextKey() {
            return this._contextKey;
        }
        set contextKey(contextKey) {
            this._contextKey = contextKey;
            this.update();
        }
        get busy() {
            return this._busy;
        }
        set busy(busy) {
            this._busy = busy;
            this.update();
        }
        get ignoreFocusOut() {
            return this._ignoreFocusOut;
        }
        set ignoreFocusOut(ignoreFocusOut) {
            this._ignoreFocusOut = ignoreFocusOut;
            this.update();
        }
        get buttons() {
            return this._buttons;
        }
        set buttons(buttons) {
            this._buttons = buttons;
            this.buttonsUpdated = true;
            this.update();
        }
        show() {
            if (this.visible) {
                return;
            }
            this.visibleDisposables.add(this.ui.onDidTriggerButton(button => {
                if (this.buttons.indexOf(button) !== -1) {
                    this.onDidTriggerButtonEmitter.fire(button);
                }
            }));
            this.ui.show(this);
            this.visible = true;
            this.update();
        }
        hide() {
            if (!this.visible) {
                return;
            }
            this.ui.hide();
        }
        didHide() {
            this.visible = false;
            this.visibleDisposables.clear();
            this.onDidHideEmitter.fire();
        }
        update() {
            if (!this.visible) {
                return;
            }
            const title = this.getTitle();
            if (title && this.ui.title.textContent !== title) {
                this.ui.title.textContent = title;
            }
            else if (!title && this.ui.title.innerHTML !== '&nbsp;') {
                this.ui.title.innerHTML = '&nbsp;';
            }
            const description = this.getDescription();
            if (this.ui.description.textContent !== description) {
                this.ui.description.textContent = description;
            }
            if (this.busy && !this.busyDelay) {
                this.busyDelay = new async_1.TimeoutTimer();
                this.busyDelay.setIfNotSet(() => {
                    if (this.visible) {
                        this.ui.progressBar.infinite();
                    }
                }, 800);
            }
            if (!this.busy && this.busyDelay) {
                this.ui.progressBar.stop();
                this.busyDelay.cancel();
                this.busyDelay = undefined;
            }
            if (this.buttonsUpdated) {
                this.buttonsUpdated = false;
                this.ui.leftActionBar.clear();
                const leftButtons = this.buttons.filter(button => button === backButton);
                this.ui.leftActionBar.push(leftButtons.map((button, index) => {
                    const action = new actions_1.Action(`id-${index}`, '', button.iconClass || quickInputUtils_1.getIconClass(button.iconPath), true, async () => {
                        this.onDidTriggerButtonEmitter.fire(button);
                    });
                    action.tooltip = button.tooltip || '';
                    return action;
                }), { icon: true, label: false });
                this.ui.rightActionBar.clear();
                const rightButtons = this.buttons.filter(button => button !== backButton);
                this.ui.rightActionBar.push(rightButtons.map((button, index) => {
                    const action = new actions_1.Action(`id-${index}`, '', button.iconClass || quickInputUtils_1.getIconClass(button.iconPath), true, async () => {
                        this.onDidTriggerButtonEmitter.fire(button);
                    });
                    action.tooltip = button.tooltip || '';
                    return action;
                }), { icon: true, label: false });
            }
            this.ui.ignoreFocusOut = this.ignoreFocusOut;
            this.ui.setEnabled(this.enabled);
            this.ui.setContextKey(this.contextKey);
        }
        getTitle() {
            if (this.title && this.step) {
                return `${this.title} (${this.getSteps()})`;
            }
            if (this.title) {
                return this.title;
            }
            if (this.step) {
                return this.getSteps();
            }
            return '';
        }
        getDescription() {
            return this.description || '';
        }
        getSteps() {
            if (this.step && this.totalSteps) {
                return nls_1.localize('quickInput.steps', "{0}/{1}", this.step, this.totalSteps);
            }
            if (this.step) {
                return String(this.step);
            }
            return '';
        }
        showMessageDecoration(severity) {
            this.ui.inputBox.showDecoration(severity);
            if (severity === severity_1.default.Error) {
                const styles = this.ui.inputBox.stylesForType(severity);
                this.ui.message.style.backgroundColor = styles.background ? `${styles.background}` : '';
                this.ui.message.style.border = styles.border ? `1px solid ${styles.border}` : '';
                this.ui.message.style.paddingBottom = '4px';
            }
            else {
                this.ui.message.style.backgroundColor = '';
                this.ui.message.style.border = '';
                this.ui.message.style.paddingBottom = '';
            }
        }
        dispose() {
            this.hide();
            this.onDisposeEmitter.fire();
            super.dispose();
        }
    }
    class QuickPick extends QuickInput {
        constructor() {
            super(...arguments);
            this._value = '';
            this._ariaLabel = QuickPick.DEFAULT_ARIA_LABEL;
            this.onDidChangeValueEmitter = this._register(new event_1.Emitter());
            this.onDidAcceptEmitter = this._register(new event_1.Emitter());
            this.onDidCustomEmitter = this._register(new event_1.Emitter());
            this._items = [];
            this.itemsUpdated = false;
            this._canSelectMany = false;
            this._canAcceptInBackground = false;
            this._matchOnDescription = false;
            this._matchOnDetail = false;
            this._matchOnLabel = true;
            this._sortByLabel = true;
            this._autoFocusOnList = true;
            this._itemActivation = this.ui.isScreenReaderOptimized() ? quickInput_1.ItemActivation.NONE /* https://github.com/microsoft/vscode/issues/57501 */ : quickInput_1.ItemActivation.FIRST;
            this._activeItems = [];
            this.activeItemsUpdated = false;
            this.activeItemsToConfirm = [];
            this.onDidChangeActiveEmitter = this._register(new event_1.Emitter());
            this._selectedItems = [];
            this.selectedItemsUpdated = false;
            this.selectedItemsToConfirm = [];
            this.onDidChangeSelectionEmitter = this._register(new event_1.Emitter());
            this.onDidTriggerItemButtonEmitter = this._register(new event_1.Emitter());
            this.valueSelectionUpdated = true;
            this._ok = 'default';
            this._customButton = false;
            this.filterValue = (value) => value;
            this.onDidChangeValue = this.onDidChangeValueEmitter.event;
            this.onDidAccept = this.onDidAcceptEmitter.event;
            this.onDidCustom = this.onDidCustomEmitter.event;
            this.onDidChangeActive = this.onDidChangeActiveEmitter.event;
            this.onDidChangeSelection = this.onDidChangeSelectionEmitter.event;
            this.onDidTriggerItemButton = this.onDidTriggerItemButtonEmitter.event;
        }
        get quickNavigate() {
            return this._quickNavigate;
        }
        set quickNavigate(quickNavigate) {
            this._quickNavigate = quickNavigate;
            this.update();
        }
        get value() {
            return this._value;
        }
        set value(value) {
            this._value = value || '';
            this.update();
        }
        set ariaLabel(ariaLabel) {
            this._ariaLabel = ariaLabel || QuickPick.DEFAULT_ARIA_LABEL;
            this.update();
        }
        get ariaLabel() {
            return this._ariaLabel;
        }
        get placeholder() {
            return this._placeholder;
        }
        set placeholder(placeholder) {
            this._placeholder = placeholder;
            this.update();
        }
        get items() {
            return this._items;
        }
        set items(items) {
            this._items = items;
            this.itemsUpdated = true;
            this.update();
        }
        get canSelectMany() {
            return this._canSelectMany;
        }
        set canSelectMany(canSelectMany) {
            this._canSelectMany = canSelectMany;
            this.update();
        }
        get canAcceptInBackground() {
            return this._canAcceptInBackground;
        }
        set canAcceptInBackground(canAcceptInBackground) {
            this._canAcceptInBackground = canAcceptInBackground;
        }
        get matchOnDescription() {
            return this._matchOnDescription;
        }
        set matchOnDescription(matchOnDescription) {
            this._matchOnDescription = matchOnDescription;
            this.update();
        }
        get matchOnDetail() {
            return this._matchOnDetail;
        }
        set matchOnDetail(matchOnDetail) {
            this._matchOnDetail = matchOnDetail;
            this.update();
        }
        get matchOnLabel() {
            return this._matchOnLabel;
        }
        set matchOnLabel(matchOnLabel) {
            this._matchOnLabel = matchOnLabel;
            this.update();
        }
        get sortByLabel() {
            return this._sortByLabel;
        }
        set sortByLabel(sortByLabel) {
            this._sortByLabel = sortByLabel;
            this.update();
        }
        get autoFocusOnList() {
            return this._autoFocusOnList;
        }
        set autoFocusOnList(autoFocusOnList) {
            this._autoFocusOnList = autoFocusOnList;
            this.update();
        }
        get itemActivation() {
            return this._itemActivation;
        }
        set itemActivation(itemActivation) {
            this._itemActivation = itemActivation;
        }
        get activeItems() {
            return this._activeItems;
        }
        set activeItems(activeItems) {
            this._activeItems = activeItems;
            this.activeItemsUpdated = true;
            this.update();
        }
        get selectedItems() {
            return this._selectedItems;
        }
        set selectedItems(selectedItems) {
            this._selectedItems = selectedItems;
            this.selectedItemsUpdated = true;
            this.update();
        }
        get keyMods() {
            if (this._quickNavigate) {
                // Disable keyMods when quick navigate is enabled
                // because in this model the interaction is purely
                // keyboard driven and Ctrl/Alt are typically
                // pressed and hold during this interaction.
                return quickInput_1.NO_KEY_MODS;
            }
            return this.ui.keyMods;
        }
        set valueSelection(valueSelection) {
            this._valueSelection = valueSelection;
            this.valueSelectionUpdated = true;
            this.update();
        }
        get validationMessage() {
            return this._validationMessage;
        }
        set validationMessage(validationMessage) {
            this._validationMessage = validationMessage;
            this.update();
        }
        get customButton() {
            return this._customButton;
        }
        set customButton(showCustomButton) {
            this._customButton = showCustomButton;
            this.update();
        }
        get customLabel() {
            return this._customButtonLabel;
        }
        set customLabel(label) {
            this._customButtonLabel = label;
            this.update();
        }
        get customHover() {
            return this._customButtonHover;
        }
        set customHover(hover) {
            this._customButtonHover = hover;
            this.update();
        }
        get ok() {
            return this._ok;
        }
        set ok(showOkButton) {
            this._ok = showOkButton;
            this.update();
        }
        inputHasFocus() {
            return this.visible ? this.ui.inputBox.hasFocus() : false;
        }
        focusOnInput() {
            this.ui.inputBox.setFocus();
        }
        get hideInput() {
            return !!this._hideInput;
        }
        set hideInput(hideInput) {
            this._hideInput = hideInput;
            this.update();
        }
        trySelectFirst() {
            if (this.autoFocusOnList) {
                if (!this.canSelectMany) {
                    this.ui.list.focus(quickInputList_1.QuickInputListFocus.First);
                }
            }
        }
        show() {
            if (!this.visible) {
                this.visibleDisposables.add(this.ui.inputBox.onDidChange(value => {
                    if (value === this.value) {
                        return;
                    }
                    this._value = value;
                    const didFilter = this.ui.list.filter(this.filterValue(this.ui.inputBox.value));
                    if (didFilter) {
                        this.trySelectFirst();
                    }
                    this.onDidChangeValueEmitter.fire(value);
                }));
                this.visibleDisposables.add(this.ui.inputBox.onMouseDown(event => {
                    if (!this.autoFocusOnList) {
                        this.ui.list.clearFocus();
                    }
                }));
                this.visibleDisposables.add((this._hideInput ? this.ui.list : this.ui.inputBox).onKeyDown((event) => {
                    switch (event.keyCode) {
                        case 18 /* DownArrow */:
                            this.ui.list.focus(quickInputList_1.QuickInputListFocus.Next);
                            if (this.canSelectMany) {
                                this.ui.list.domFocus();
                            }
                            dom.EventHelper.stop(event, true);
                            break;
                        case 16 /* UpArrow */:
                            if (this.ui.list.getFocusedElements().length) {
                                this.ui.list.focus(quickInputList_1.QuickInputListFocus.Previous);
                            }
                            else {
                                this.ui.list.focus(quickInputList_1.QuickInputListFocus.Last);
                            }
                            if (this.canSelectMany) {
                                this.ui.list.domFocus();
                            }
                            dom.EventHelper.stop(event, true);
                            break;
                        case 12 /* PageDown */:
                            this.ui.list.focus(quickInputList_1.QuickInputListFocus.NextPage);
                            if (this.canSelectMany) {
                                this.ui.list.domFocus();
                            }
                            dom.EventHelper.stop(event, true);
                            break;
                        case 11 /* PageUp */:
                            this.ui.list.focus(quickInputList_1.QuickInputListFocus.PreviousPage);
                            if (this.canSelectMany) {
                                this.ui.list.domFocus();
                            }
                            dom.EventHelper.stop(event, true);
                            break;
                        case 17 /* RightArrow */:
                            if (!this._canAcceptInBackground) {
                                return; // needs to be enabled
                            }
                            if (!this.ui.inputBox.isSelectionAtEnd()) {
                                return; // ensure input box selection at end
                            }
                            if (this.activeItems[0]) {
                                this._selectedItems = [this.activeItems[0]];
                                this.onDidChangeSelectionEmitter.fire(this.selectedItems);
                                this.onDidAcceptEmitter.fire({ inBackground: true });
                            }
                            break;
                        case 14 /* Home */:
                            if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
                                this.ui.list.focus(quickInputList_1.QuickInputListFocus.First);
                                dom.EventHelper.stop(event, true);
                            }
                            break;
                        case 13 /* End */:
                            if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
                                this.ui.list.focus(quickInputList_1.QuickInputListFocus.Last);
                                dom.EventHelper.stop(event, true);
                            }
                            break;
                    }
                }));
                this.visibleDisposables.add(this.ui.onDidAccept(() => {
                    if (!this.canSelectMany && this.activeItems[0]) {
                        this._selectedItems = [this.activeItems[0]];
                        this.onDidChangeSelectionEmitter.fire(this.selectedItems);
                    }
                    this.onDidAcceptEmitter.fire({ inBackground: false });
                }));
                this.visibleDisposables.add(this.ui.onDidCustom(() => {
                    this.onDidCustomEmitter.fire();
                }));
                this.visibleDisposables.add(this.ui.list.onDidChangeFocus(focusedItems => {
                    if (this.activeItemsUpdated) {
                        return; // Expect another event.
                    }
                    if (this.activeItemsToConfirm !== this._activeItems && arrays_1.equals(focusedItems, this._activeItems, (a, b) => a === b)) {
                        return;
                    }
                    this._activeItems = focusedItems;
                    this.onDidChangeActiveEmitter.fire(focusedItems);
                }));
                this.visibleDisposables.add(this.ui.list.onDidChangeSelection(({ items: selectedItems, event }) => {
                    if (this.canSelectMany) {
                        if (selectedItems.length) {
                            this.ui.list.setSelectedElements([]);
                        }
                        return;
                    }
                    if (this.selectedItemsToConfirm !== this._selectedItems && arrays_1.equals(selectedItems, this._selectedItems, (a, b) => a === b)) {
                        return;
                    }
                    this._selectedItems = selectedItems;
                    this.onDidChangeSelectionEmitter.fire(selectedItems);
                    if (selectedItems.length) {
                        this.onDidAcceptEmitter.fire({ inBackground: event instanceof MouseEvent && event.button === 1 /* mouse middle click */ });
                    }
                }));
                this.visibleDisposables.add(this.ui.list.onChangedCheckedElements(checkedItems => {
                    if (!this.canSelectMany) {
                        return;
                    }
                    if (this.selectedItemsToConfirm !== this._selectedItems && arrays_1.equals(checkedItems, this._selectedItems, (a, b) => a === b)) {
                        return;
                    }
                    this._selectedItems = checkedItems;
                    this.onDidChangeSelectionEmitter.fire(checkedItems);
                }));
                this.visibleDisposables.add(this.ui.list.onButtonTriggered(event => this.onDidTriggerItemButtonEmitter.fire(event)));
                this.visibleDisposables.add(this.registerQuickNavigation());
                this.valueSelectionUpdated = true;
            }
            super.show(); // TODO: Why have show() bubble up while update() trickles down? (Could move setComboboxAccessibility() here.)
        }
        registerQuickNavigation() {
            return dom.addDisposableListener(this.ui.container, dom.EventType.KEY_UP, e => {
                if (this.canSelectMany || !this._quickNavigate) {
                    return;
                }
                const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                const keyCode = keyboardEvent.keyCode;
                // Select element when keys are pressed that signal it
                const quickNavKeys = this._quickNavigate.keybindings;
                const wasTriggerKeyPressed = quickNavKeys.some(k => {
                    const [firstPart, chordPart] = k.getParts();
                    if (chordPart) {
                        return false;
                    }
                    if (firstPart.shiftKey && keyCode === 4 /* Shift */) {
                        if (keyboardEvent.ctrlKey || keyboardEvent.altKey || keyboardEvent.metaKey) {
                            return false; // this is an optimistic check for the shift key being used to navigate back in quick input
                        }
                        return true;
                    }
                    if (firstPart.altKey && keyCode === 6 /* Alt */) {
                        return true;
                    }
                    if (firstPart.ctrlKey && keyCode === 5 /* Ctrl */) {
                        return true;
                    }
                    if (firstPart.metaKey && keyCode === 57 /* Meta */) {
                        return true;
                    }
                    return false;
                });
                if (wasTriggerKeyPressed) {
                    if (this.activeItems[0]) {
                        this._selectedItems = [this.activeItems[0]];
                        this.onDidChangeSelectionEmitter.fire(this.selectedItems);
                        this.onDidAcceptEmitter.fire({ inBackground: false });
                    }
                    // Unset quick navigate after press. It is only valid once
                    // and should not result in any behaviour change afterwards
                    // if the picker remains open because there was no active item
                    this._quickNavigate = undefined;
                }
            });
        }
        update() {
            if (!this.visible) {
                return;
            }
            let hideInput = false;
            let inputShownJustForScreenReader = false;
            if (!!this._hideInput && this._items.length > 0) {
                if (this.ui.isScreenReaderOptimized()) {
                    // Always show input if screen reader attached https://github.com/microsoft/vscode/issues/94360
                    inputShownJustForScreenReader = true;
                }
                else {
                    hideInput = true;
                }
            }
            dom.toggleClass(this.ui.container, 'hidden-input', hideInput);
            const visibilities = {
                title: !!this.title || !!this.step || !!this.buttons.length,
                description: !!this.description,
                checkAll: this.canSelectMany,
                inputBox: !hideInput,
                progressBar: !hideInput,
                visibleCount: true,
                count: this.canSelectMany,
                ok: this.ok === 'default' ? this.canSelectMany : this.ok,
                list: true,
                message: !!this.validationMessage,
                customButton: this.customButton
            };
            this.ui.setVisibilities(visibilities);
            super.update();
            if (this.ui.inputBox.value !== this.value) {
                this.ui.inputBox.value = this.value;
            }
            if (this.valueSelectionUpdated) {
                this.valueSelectionUpdated = false;
                this.ui.inputBox.select(this._valueSelection && { start: this._valueSelection[0], end: this._valueSelection[1] });
            }
            if (this.ui.inputBox.placeholder !== (this.placeholder || '')) {
                this.ui.inputBox.placeholder = (this.placeholder || '');
            }
            if (inputShownJustForScreenReader) {
                this.ui.inputBox.ariaLabel = '';
            }
            else if (this.ui.inputBox.ariaLabel !== this.ariaLabel) {
                this.ui.inputBox.ariaLabel = this.ariaLabel;
            }
            this.ui.list.matchOnDescription = this.matchOnDescription;
            this.ui.list.matchOnDetail = this.matchOnDetail;
            this.ui.list.matchOnLabel = this.matchOnLabel;
            this.ui.list.sortByLabel = this.sortByLabel;
            if (this.itemsUpdated) {
                this.itemsUpdated = false;
                this.ui.list.setElements(this.items);
                this.ui.list.filter(this.filterValue(this.ui.inputBox.value));
                this.ui.checkAll.checked = this.ui.list.getAllVisibleChecked();
                this.ui.visibleCount.setCount(this.ui.list.getVisibleCount());
                this.ui.count.setCount(this.ui.list.getCheckedCount());
                switch (this._itemActivation) {
                    case quickInput_1.ItemActivation.NONE:
                        this._itemActivation = quickInput_1.ItemActivation.FIRST; // only valid once, then unset
                        break;
                    case quickInput_1.ItemActivation.SECOND:
                        this.ui.list.focus(quickInputList_1.QuickInputListFocus.Second);
                        this._itemActivation = quickInput_1.ItemActivation.FIRST; // only valid once, then unset
                        break;
                    case quickInput_1.ItemActivation.LAST:
                        this.ui.list.focus(quickInputList_1.QuickInputListFocus.Last);
                        this._itemActivation = quickInput_1.ItemActivation.FIRST; // only valid once, then unset
                        break;
                    default:
                        this.trySelectFirst();
                        break;
                }
            }
            if (this.ui.container.classList.contains('show-checkboxes') !== !!this.canSelectMany) {
                if (this.canSelectMany) {
                    this.ui.list.clearFocus();
                }
                else {
                    this.trySelectFirst();
                }
            }
            if (this.activeItemsUpdated) {
                this.activeItemsUpdated = false;
                this.activeItemsToConfirm = this._activeItems;
                this.ui.list.setFocusedElements(this.activeItems);
                if (this.activeItemsToConfirm === this._activeItems) {
                    this.activeItemsToConfirm = null;
                }
            }
            if (this.selectedItemsUpdated) {
                this.selectedItemsUpdated = false;
                this.selectedItemsToConfirm = this._selectedItems;
                if (this.canSelectMany) {
                    this.ui.list.setCheckedElements(this.selectedItems);
                }
                else {
                    this.ui.list.setSelectedElements(this.selectedItems);
                }
                if (this.selectedItemsToConfirm === this._selectedItems) {
                    this.selectedItemsToConfirm = null;
                }
            }
            if (this.validationMessage) {
                this.ui.message.textContent = this.validationMessage;
                this.showMessageDecoration(severity_1.default.Error);
            }
            else {
                this.ui.message.textContent = null;
                this.showMessageDecoration(severity_1.default.Ignore);
            }
            this.ui.customButton.label = this.customLabel || '';
            this.ui.customButton.element.title = this.customHover || '';
            this.ui.setComboboxAccessibility(true);
            if (!visibilities.inputBox) {
                // we need to move focus into the tree to detect keybindings
                // properly when the input box is not visible (quick nav)
                this.ui.list.domFocus();
            }
        }
    }
    QuickPick.DEFAULT_ARIA_LABEL = nls_1.localize('quickInputBox.ariaLabel', "Type to narrow down results.");
    class InputBox extends QuickInput {
        constructor() {
            super(...arguments);
            this._value = '';
            this.valueSelectionUpdated = true;
            this._password = false;
            this.noValidationMessage = InputBox.noPromptMessage;
            this.onDidValueChangeEmitter = this._register(new event_1.Emitter());
            this.onDidAcceptEmitter = this._register(new event_1.Emitter());
            this.onDidChangeValue = this.onDidValueChangeEmitter.event;
            this.onDidAccept = this.onDidAcceptEmitter.event;
        }
        get value() {
            return this._value;
        }
        set value(value) {
            this._value = value || '';
            this.update();
        }
        set valueSelection(valueSelection) {
            this._valueSelection = valueSelection;
            this.valueSelectionUpdated = true;
            this.update();
        }
        get placeholder() {
            return this._placeholder;
        }
        set placeholder(placeholder) {
            this._placeholder = placeholder;
            this.update();
        }
        get password() {
            return this._password;
        }
        set password(password) {
            this._password = password;
            this.update();
        }
        get prompt() {
            return this._prompt;
        }
        set prompt(prompt) {
            this._prompt = prompt;
            this.noValidationMessage = prompt
                ? nls_1.localize('inputModeEntryDescription', "{0} (Press 'Enter' to confirm or 'Escape' to cancel)", prompt)
                : InputBox.noPromptMessage;
            this.update();
        }
        get validationMessage() {
            return this._validationMessage;
        }
        set validationMessage(validationMessage) {
            this._validationMessage = validationMessage;
            this.update();
        }
        show() {
            if (!this.visible) {
                this.visibleDisposables.add(this.ui.inputBox.onDidChange(value => {
                    if (value === this.value) {
                        return;
                    }
                    this._value = value;
                    this.onDidValueChangeEmitter.fire(value);
                }));
                this.visibleDisposables.add(this.ui.onDidAccept(() => this.onDidAcceptEmitter.fire()));
                this.valueSelectionUpdated = true;
            }
            super.show();
        }
        update() {
            if (!this.visible) {
                return;
            }
            const visibilities = {
                title: !!this.title || !!this.step || !!this.buttons.length,
                description: !!this.description || !!this.step,
                inputBox: true, message: true
            };
            this.ui.setVisibilities(visibilities);
            super.update();
            if (this.ui.inputBox.value !== this.value) {
                this.ui.inputBox.value = this.value;
            }
            if (this.valueSelectionUpdated) {
                this.valueSelectionUpdated = false;
                this.ui.inputBox.select(this._valueSelection && { start: this._valueSelection[0], end: this._valueSelection[1] });
            }
            if (this.ui.inputBox.placeholder !== (this.placeholder || '')) {
                this.ui.inputBox.placeholder = (this.placeholder || '');
            }
            if (this.ui.inputBox.password !== this.password) {
                this.ui.inputBox.password = this.password;
            }
            if (!this.validationMessage && this.ui.message.textContent !== this.noValidationMessage) {
                this.ui.message.textContent = this.noValidationMessage;
                this.showMessageDecoration(severity_1.default.Ignore);
            }
            if (this.validationMessage && this.ui.message.textContent !== this.validationMessage) {
                this.ui.message.textContent = this.validationMessage;
                this.showMessageDecoration(severity_1.default.Error);
            }
        }
    }
    InputBox.noPromptMessage = nls_1.localize('inputModeEntry', "Press 'Enter' to confirm your input or 'Escape' to cancel");
    class QuickInputController extends lifecycle_1.Disposable {
        constructor(options) {
            super();
            this.options = options;
            this.comboboxAccessibility = false;
            this.enabled = true;
            this.onDidAcceptEmitter = this._register(new event_1.Emitter());
            this.onDidCustomEmitter = this._register(new event_1.Emitter());
            this.onDidTriggerButtonEmitter = this._register(new event_1.Emitter());
            this.keyMods = { ctrlCmd: false, alt: false };
            this.controller = null;
            this.onShowEmitter = this._register(new event_1.Emitter());
            this.onShow = this.onShowEmitter.event;
            this.onHideEmitter = this._register(new event_1.Emitter());
            this.onHide = this.onHideEmitter.event;
            this.backButton = backButton;
            this.idPrefix = options.idPrefix;
            this.parentElement = options.container;
            this.styles = options.styles;
            this.registerKeyModsListeners();
        }
        registerKeyModsListeners() {
            const listener = (e) => {
                this.keyMods.ctrlCmd = e.ctrlKey || e.metaKey;
                this.keyMods.alt = e.altKey;
            };
            this._register(dom.addDisposableListener(window, dom.EventType.KEY_DOWN, listener, true));
            this._register(dom.addDisposableListener(window, dom.EventType.KEY_UP, listener, true));
            this._register(dom.addDisposableListener(window, dom.EventType.MOUSE_DOWN, listener, true));
        }
        getUI() {
            if (this.ui) {
                return this.ui;
            }
            const container = dom.append(this.parentElement, $('.quick-input-widget.show-file-icons'));
            container.tabIndex = -1;
            container.style.display = 'none';
            const styleSheet = dom.createStyleSheet(container);
            const titleBar = dom.append(container, $('.quick-input-titlebar'));
            const leftActionBar = this._register(new actionbar_1.ActionBar(titleBar));
            leftActionBar.domNode.classList.add('quick-input-left-action-bar');
            const title = dom.append(titleBar, $('.quick-input-title'));
            const rightActionBar = this._register(new actionbar_1.ActionBar(titleBar));
            rightActionBar.domNode.classList.add('quick-input-right-action-bar');
            const description = dom.append(container, $('.quick-input-description'));
            const headerContainer = dom.append(container, $('.quick-input-header'));
            const checkAll = dom.append(headerContainer, $('input.quick-input-check-all'));
            checkAll.type = 'checkbox';
            this._register(dom.addStandardDisposableListener(checkAll, dom.EventType.CHANGE, e => {
                const checked = checkAll.checked;
                list.setAllVisibleChecked(checked);
            }));
            this._register(dom.addDisposableListener(checkAll, dom.EventType.CLICK, e => {
                if (e.x || e.y) { // Avoid 'click' triggered by 'space'...
                    inputBox.setFocus();
                }
            }));
            const extraContainer = dom.append(headerContainer, $('.quick-input-and-message'));
            const filterContainer = dom.append(extraContainer, $('.quick-input-filter'));
            const inputBox = this._register(new quickInputBox_1.QuickInputBox(filterContainer));
            inputBox.setAttribute('aria-describedby', `${this.idPrefix}message`);
            const visibleCountContainer = dom.append(filterContainer, $('.quick-input-visible-count'));
            visibleCountContainer.setAttribute('aria-live', 'polite');
            visibleCountContainer.setAttribute('aria-atomic', 'true');
            const visibleCount = new countBadge_1.CountBadge(visibleCountContainer, { countFormat: nls_1.localize({ key: 'quickInput.visibleCount', comment: ['This tells the user how many items are shown in a list of items to select from. The items can be anything. Currently not visible, but read by screen readers.'] }, "{0} Results") });
            const countContainer = dom.append(filterContainer, $('.quick-input-count'));
            countContainer.setAttribute('aria-live', 'polite');
            const count = new countBadge_1.CountBadge(countContainer, { countFormat: nls_1.localize({ key: 'quickInput.countSelected', comment: ['This tells the user how many items are selected in a list of items to select from. The items can be anything.'] }, "{0} Selected") });
            const okContainer = dom.append(headerContainer, $('.quick-input-action'));
            const ok = new button_1.Button(okContainer);
            ok.label = nls_1.localize('ok', "OK");
            this._register(ok.onDidClick(e => {
                this.onDidAcceptEmitter.fire();
            }));
            const customButtonContainer = dom.append(headerContainer, $('.quick-input-action'));
            const customButton = new button_1.Button(customButtonContainer);
            customButton.label = nls_1.localize('custom', "Custom");
            this._register(customButton.onDidClick(e => {
                this.onDidCustomEmitter.fire();
            }));
            const message = dom.append(extraContainer, $(`#${this.idPrefix}message.quick-input-message`));
            const progressBar = new progressbar_1.ProgressBar(container);
            dom.addClass(progressBar.getContainer(), 'quick-input-progress');
            const list = this._register(new quickInputList_1.QuickInputList(container, this.idPrefix + 'list', this.options));
            this._register(list.onChangedAllVisibleChecked(checked => {
                checkAll.checked = checked;
            }));
            this._register(list.onChangedVisibleCount(c => {
                visibleCount.setCount(c);
            }));
            this._register(list.onChangedCheckedCount(c => {
                count.setCount(c);
            }));
            this._register(list.onLeave(() => {
                // Defer to avoid the input field reacting to the triggering key.
                setTimeout(() => {
                    inputBox.setFocus();
                    if (this.controller instanceof QuickPick && this.controller.canSelectMany) {
                        list.clearFocus();
                    }
                }, 0);
            }));
            this._register(list.onDidChangeFocus(() => {
                if (this.comboboxAccessibility) {
                    this.getUI().inputBox.setAttribute('aria-activedescendant', this.getUI().list.getActiveDescendant() || '');
                }
            }));
            const focusTracker = dom.trackFocus(container);
            this._register(focusTracker);
            this._register(dom.addDisposableListener(container, dom.EventType.FOCUS, e => {
                this.previousFocusElement = e.relatedTarget instanceof HTMLElement ? e.relatedTarget : undefined;
            }, true));
            this._register(focusTracker.onDidBlur(() => {
                this.previousFocusElement = undefined;
                if (!this.getUI().ignoreFocusOut && !this.options.ignoreFocusOut()) {
                    this.hide(true);
                }
            }));
            this._register(dom.addDisposableListener(container, dom.EventType.FOCUS, (e) => {
                inputBox.setFocus();
            }));
            this._register(dom.addDisposableListener(container, dom.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                switch (event.keyCode) {
                    case 3 /* Enter */:
                        dom.EventHelper.stop(e, true);
                        this.onDidAcceptEmitter.fire();
                        break;
                    case 9 /* Escape */:
                        dom.EventHelper.stop(e, true);
                        this.hide();
                        break;
                    case 2 /* Tab */:
                        if (!event.altKey && !event.ctrlKey && !event.metaKey) {
                            const selectors = ['.action-label.codicon'];
                            if (container.classList.contains('show-checkboxes')) {
                                selectors.push('input');
                            }
                            else {
                                selectors.push('input[type=text]');
                            }
                            if (this.getUI().list.isDisplayed()) {
                                selectors.push('.monaco-list');
                            }
                            const stops = container.querySelectorAll(selectors.join(', '));
                            if (event.shiftKey && event.target === stops[0]) {
                                dom.EventHelper.stop(e, true);
                                stops[stops.length - 1].focus();
                            }
                            else if (!event.shiftKey && event.target === stops[stops.length - 1]) {
                                dom.EventHelper.stop(e, true);
                                stops[0].focus();
                            }
                        }
                        break;
                }
            }));
            this.ui = {
                container,
                styleSheet,
                leftActionBar,
                titleBar,
                title,
                description,
                rightActionBar,
                checkAll,
                filterContainer,
                inputBox,
                visibleCountContainer,
                visibleCount,
                countContainer,
                count,
                okContainer,
                ok,
                message,
                customButtonContainer,
                customButton,
                progressBar,
                list,
                onDidAccept: this.onDidAcceptEmitter.event,
                onDidCustom: this.onDidCustomEmitter.event,
                onDidTriggerButton: this.onDidTriggerButtonEmitter.event,
                ignoreFocusOut: false,
                keyMods: this.keyMods,
                isScreenReaderOptimized: () => this.options.isScreenReaderOptimized(),
                show: controller => this.show(controller),
                hide: () => this.hide(),
                setVisibilities: visibilities => this.setVisibilities(visibilities),
                setComboboxAccessibility: enabled => this.setComboboxAccessibility(enabled),
                setEnabled: enabled => this.setEnabled(enabled),
                setContextKey: contextKey => this.options.setContextKey(contextKey),
            };
            this.updateStyles();
            return this.ui;
        }
        pick(picks, options = {}, token = cancellation_1.CancellationToken.None) {
            return new Promise((doResolve, reject) => {
                let resolve = (result) => {
                    resolve = doResolve;
                    if (options.onKeyMods) {
                        options.onKeyMods(input.keyMods);
                    }
                    doResolve(result);
                };
                if (token.isCancellationRequested) {
                    resolve(undefined);
                    return;
                }
                const input = this.createQuickPick();
                let activeItem;
                const disposables = [
                    input,
                    input.onDidAccept(() => {
                        if (input.canSelectMany) {
                            resolve(input.selectedItems.slice());
                            input.hide();
                        }
                        else {
                            const result = input.activeItems[0];
                            if (result) {
                                resolve(result);
                                input.hide();
                            }
                        }
                    }),
                    input.onDidChangeActive(items => {
                        const focused = items[0];
                        if (focused && options.onDidFocus) {
                            options.onDidFocus(focused);
                        }
                    }),
                    input.onDidChangeSelection(items => {
                        if (!input.canSelectMany) {
                            const result = items[0];
                            if (result) {
                                resolve(result);
                                input.hide();
                            }
                        }
                    }),
                    input.onDidTriggerItemButton(event => options.onDidTriggerItemButton && options.onDidTriggerItemButton(Object.assign(Object.assign({}, event), { removeItem: () => {
                            const index = input.items.indexOf(event.item);
                            if (index !== -1) {
                                const items = input.items.slice();
                                items.splice(index, 1);
                                input.items = items;
                            }
                        } }))),
                    input.onDidChangeValue(value => {
                        if (activeItem && !value && (input.activeItems.length !== 1 || input.activeItems[0] !== activeItem)) {
                            input.activeItems = [activeItem];
                        }
                    }),
                    token.onCancellationRequested(() => {
                        input.hide();
                    }),
                    input.onDidHide(() => {
                        lifecycle_1.dispose(disposables);
                        resolve(undefined);
                    }),
                ];
                input.canSelectMany = !!options.canPickMany;
                input.placeholder = options.placeHolder;
                if (options.placeHolder) {
                    input.ariaLabel = options.placeHolder;
                }
                input.ignoreFocusOut = !!options.ignoreFocusLost;
                input.matchOnDescription = !!options.matchOnDescription;
                input.matchOnDetail = !!options.matchOnDetail;
                input.matchOnLabel = (options.matchOnLabel === undefined) || options.matchOnLabel; // default to true
                input.autoFocusOnList = (options.autoFocusOnList === undefined) || options.autoFocusOnList; // default to true
                input.quickNavigate = options.quickNavigate;
                input.contextKey = options.contextKey;
                input.busy = true;
                Promise.all([picks, options.activeItem])
                    .then(([items, _activeItem]) => {
                    activeItem = _activeItem;
                    input.busy = false;
                    input.items = items;
                    if (input.canSelectMany) {
                        input.selectedItems = items.filter(item => item.type !== 'separator' && item.picked);
                    }
                    if (activeItem) {
                        input.activeItems = [activeItem];
                    }
                });
                input.show();
                Promise.resolve(picks).then(undefined, err => {
                    reject(err);
                    input.hide();
                });
            });
        }
        input(options = {}, token = cancellation_1.CancellationToken.None) {
            return new Promise((resolve, reject) => {
                if (token.isCancellationRequested) {
                    resolve(undefined);
                    return;
                }
                const input = this.createInputBox();
                const validateInput = options.validateInput || (() => Promise.resolve(undefined));
                const onDidValueChange = event_1.Event.debounce(input.onDidChangeValue, (last, cur) => cur, 100);
                let validationValue = options.value || '';
                let validation = Promise.resolve(validateInput(validationValue));
                const disposables = [
                    input,
                    onDidValueChange(value => {
                        if (value !== validationValue) {
                            validation = Promise.resolve(validateInput(value));
                            validationValue = value;
                        }
                        validation.then(result => {
                            if (value === validationValue) {
                                input.validationMessage = result || undefined;
                            }
                        });
                    }),
                    input.onDidAccept(() => {
                        const value = input.value;
                        if (value !== validationValue) {
                            validation = Promise.resolve(validateInput(value));
                            validationValue = value;
                        }
                        validation.then(result => {
                            if (!result) {
                                resolve(value);
                                input.hide();
                            }
                            else if (value === validationValue) {
                                input.validationMessage = result;
                            }
                        });
                    }),
                    token.onCancellationRequested(() => {
                        input.hide();
                    }),
                    input.onDidHide(() => {
                        lifecycle_1.dispose(disposables);
                        resolve(undefined);
                    }),
                ];
                input.value = options.value || '';
                input.valueSelection = options.valueSelection;
                input.prompt = options.prompt;
                input.placeholder = options.placeHolder;
                input.password = !!options.password;
                input.ignoreFocusOut = !!options.ignoreFocusLost;
                input.show();
            });
        }
        createQuickPick() {
            const ui = this.getUI();
            return new QuickPick(ui);
        }
        createInputBox() {
            const ui = this.getUI();
            return new InputBox(ui);
        }
        show(controller) {
            const ui = this.getUI();
            this.onShowEmitter.fire();
            const oldController = this.controller;
            this.controller = controller;
            if (oldController) {
                oldController.didHide();
            }
            this.setEnabled(true);
            ui.leftActionBar.clear();
            ui.title.textContent = '';
            ui.description.textContent = '';
            ui.rightActionBar.clear();
            ui.checkAll.checked = false;
            // ui.inputBox.value = ''; Avoid triggering an event.
            ui.inputBox.placeholder = '';
            ui.inputBox.password = false;
            ui.inputBox.showDecoration(severity_1.default.Ignore);
            ui.visibleCount.setCount(0);
            ui.count.setCount(0);
            ui.message.textContent = '';
            ui.progressBar.stop();
            ui.list.setElements([]);
            ui.list.matchOnDescription = false;
            ui.list.matchOnDetail = false;
            ui.list.matchOnLabel = true;
            ui.list.sortByLabel = true;
            ui.ignoreFocusOut = false;
            this.setComboboxAccessibility(false);
            ui.inputBox.ariaLabel = '';
            const backKeybindingLabel = this.options.backKeybindingLabel();
            backButton.tooltip = backKeybindingLabel ? nls_1.localize('quickInput.backWithKeybinding', "Back ({0})", backKeybindingLabel) : nls_1.localize('quickInput.back', "Back");
            ui.container.style.display = '';
            this.updateLayout();
            ui.inputBox.setFocus();
        }
        setVisibilities(visibilities) {
            const ui = this.getUI();
            ui.title.style.display = visibilities.title ? '' : 'none';
            ui.description.style.display = visibilities.description ? '' : 'none';
            ui.checkAll.style.display = visibilities.checkAll ? '' : 'none';
            ui.filterContainer.style.display = visibilities.inputBox ? '' : 'none';
            ui.visibleCountContainer.style.display = visibilities.visibleCount ? '' : 'none';
            ui.countContainer.style.display = visibilities.count ? '' : 'none';
            ui.okContainer.style.display = visibilities.ok ? '' : 'none';
            ui.customButtonContainer.style.display = visibilities.customButton ? '' : 'none';
            ui.message.style.display = visibilities.message ? '' : 'none';
            ui.progressBar.getContainer().style.display = visibilities.progressBar ? '' : 'none';
            ui.list.display(!!visibilities.list);
            ui.container.classList[visibilities.checkAll ? 'add' : 'remove']('show-checkboxes');
            this.updateLayout(); // TODO
        }
        setComboboxAccessibility(enabled) {
            if (enabled !== this.comboboxAccessibility) {
                const ui = this.getUI();
                this.comboboxAccessibility = enabled;
                if (this.comboboxAccessibility) {
                    ui.inputBox.setAttribute('role', 'combobox');
                    ui.inputBox.setAttribute('aria-haspopup', 'true');
                    ui.inputBox.setAttribute('aria-autocomplete', 'list');
                    ui.inputBox.setAttribute('aria-activedescendant', ui.list.getActiveDescendant() || '');
                }
                else {
                    ui.inputBox.removeAttribute('role');
                    ui.inputBox.removeAttribute('aria-haspopup');
                    ui.inputBox.removeAttribute('aria-autocomplete');
                    ui.inputBox.removeAttribute('aria-activedescendant');
                }
            }
        }
        setEnabled(enabled) {
            if (enabled !== this.enabled) {
                this.enabled = enabled;
                for (const item of this.getUI().leftActionBar.viewItems) {
                    item.getAction().enabled = enabled;
                }
                for (const item of this.getUI().rightActionBar.viewItems) {
                    item.getAction().enabled = enabled;
                }
                this.getUI().checkAll.disabled = !enabled;
                // this.getUI().inputBox.enabled = enabled; Avoid loosing focus.
                this.getUI().ok.enabled = enabled;
                this.getUI().list.enabled = enabled;
            }
        }
        hide(focusLost) {
            const controller = this.controller;
            if (controller) {
                this.controller = null;
                this.onHideEmitter.fire();
                this.getUI().container.style.display = 'none';
                if (!focusLost) {
                    if (this.previousFocusElement && this.previousFocusElement.offsetParent) {
                        this.previousFocusElement.focus();
                        this.previousFocusElement = undefined;
                    }
                    else {
                        this.options.returnFocus();
                    }
                }
                controller.didHide();
            }
        }
        focus() {
            if (this.isDisplayed()) {
                this.getUI().inputBox.setFocus();
            }
        }
        toggle() {
            if (this.isDisplayed() && this.controller instanceof QuickPick && this.controller.canSelectMany) {
                this.getUI().list.toggleCheckbox();
            }
        }
        navigate(next, quickNavigate) {
            if (this.isDisplayed() && this.getUI().list.isDisplayed()) {
                this.getUI().list.focus(next ? quickInputList_1.QuickInputListFocus.Next : quickInputList_1.QuickInputListFocus.Previous);
                if (quickNavigate && this.controller instanceof QuickPick) {
                    this.controller.quickNavigate = quickNavigate;
                }
            }
        }
        async accept(keyMods = { alt: false, ctrlCmd: false }) {
            // When accepting the item programmatically, it is important that
            // we update `keyMods` either from the provided set or unset it
            // because the accept did not happen from mouse or keyboard
            // interaction on the list itself
            this.keyMods.alt = keyMods.alt;
            this.keyMods.ctrlCmd = keyMods.ctrlCmd;
            this.onDidAcceptEmitter.fire();
        }
        async back() {
            this.onDidTriggerButtonEmitter.fire(this.backButton);
        }
        async cancel() {
            this.hide();
        }
        layout(dimension, titleBarOffset) {
            this.dimension = dimension;
            this.titleBarOffset = titleBarOffset;
            this.updateLayout();
        }
        updateLayout() {
            if (this.ui) {
                this.ui.container.style.top = `${this.titleBarOffset}px`;
                const style = this.ui.container.style;
                const width = Math.min(this.dimension.width * 0.62 /* golden cut */, QuickInputController.MAX_WIDTH);
                style.width = width + 'px';
                style.marginLeft = '-' + (width / 2) + 'px';
                this.ui.inputBox.layout();
                this.ui.list.layout(this.dimension && this.dimension.height * 0.4);
            }
        }
        applyStyles(styles) {
            this.styles = styles;
            this.updateStyles();
        }
        updateStyles() {
            if (this.ui) {
                const { quickInputTitleBackground, quickInputBackground, quickInputForeground, contrastBorder, widgetShadow, } = this.styles.widget;
                this.ui.titleBar.style.backgroundColor = quickInputTitleBackground ? quickInputTitleBackground.toString() : '';
                this.ui.container.style.backgroundColor = quickInputBackground ? quickInputBackground.toString() : '';
                this.ui.container.style.color = quickInputForeground ? quickInputForeground.toString() : '';
                this.ui.container.style.border = contrastBorder ? `1px solid ${contrastBorder}` : '';
                this.ui.container.style.boxShadow = widgetShadow ? `0 5px 8px ${widgetShadow}` : '';
                this.ui.inputBox.style(this.styles.inputBox);
                this.ui.count.style(this.styles.countBadge);
                this.ui.ok.style(this.styles.button);
                this.ui.customButton.style(this.styles.button);
                this.ui.progressBar.style(this.styles.progressBar);
                this.ui.list.style(this.styles.list);
                const content = [];
                if (this.styles.list.listInactiveFocusForeground) {
                    content.push(`.monaco-list .monaco-list-row.focused { color:  ${this.styles.list.listInactiveFocusForeground}; }`);
                    content.push(`.monaco-list .monaco-list-row.focused:hover { color:  ${this.styles.list.listInactiveFocusForeground}; }`); // overwrite :hover style in this case!
                }
                if (this.styles.list.pickerGroupBorder) {
                    content.push(`.quick-input-list .quick-input-list-entry { border-top-color:  ${this.styles.list.pickerGroupBorder}; }`);
                }
                if (this.styles.list.pickerGroupForeground) {
                    content.push(`.quick-input-list .quick-input-list-separator { color:  ${this.styles.list.pickerGroupForeground}; }`);
                }
                const newStyles = content.join('\n');
                if (newStyles !== this.ui.styleSheet.innerHTML) {
                    this.ui.styleSheet.innerHTML = newStyles;
                }
            }
        }
        isDisplayed() {
            return this.ui && this.ui.container.style.display !== 'none';
        }
    }
    exports.QuickInputController = QuickInputController;
    QuickInputController.MAX_WIDTH = 600; // Max total width of quick input widget
});
//# __sourceMappingURL=quickInput.js.map