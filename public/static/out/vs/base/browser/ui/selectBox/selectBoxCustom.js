/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/keyCodes", "vs/base/browser/keyboardEvent", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/browser/ui/list/listWidget", "vs/base/browser/event", "vs/base/common/platform", "vs/base/browser/markdownRenderer", "vs/nls", "vs/css!./selectBoxCustom"], function (require, exports, lifecycle_1, event_1, keyCodes_1, keyboardEvent_1, dom, arrays, listWidget_1, event_2, platform_1, markdownRenderer_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectBoxList = void 0;
    const $ = dom.$;
    const SELECT_OPTION_ENTRY_TEMPLATE_ID = 'selectOption.entry.template';
    class SelectListRenderer {
        get templateId() { return SELECT_OPTION_ENTRY_TEMPLATE_ID; }
        renderTemplate(container) {
            const data = Object.create(null);
            data.disposables = [];
            data.root = container;
            data.text = dom.append(container, $('.option-text'));
            data.decoratorRight = dom.append(container, $('.option-decorator-right'));
            data.itemDescription = dom.append(container, $('.option-text-description'));
            dom.addClass(data.itemDescription, 'visually-hidden');
            return data;
        }
        renderElement(element, index, templateData) {
            const data = templateData;
            const text = element.text;
            const decoratorRight = element.decoratorRight;
            const isDisabled = element.isDisabled;
            data.text.textContent = text;
            data.decoratorRight.innerText = (!!decoratorRight ? decoratorRight : '');
            if (typeof element.description === 'string') {
                const itemDescriptionId = (text.replace(/ /g, '_').toLowerCase() + '_description_' + data.root.id);
                data.text.setAttribute('aria-describedby', itemDescriptionId);
                data.itemDescription.id = itemDescriptionId;
                data.itemDescription.innerText = element.description;
            }
            // pseudo-select disabled option
            if (isDisabled) {
                dom.addClass(data.root, 'option-disabled');
            }
            else {
                // Make sure we do class removal from prior template rendering
                dom.removeClass(data.root, 'option-disabled');
            }
        }
        disposeTemplate(templateData) {
            templateData.disposables = lifecycle_1.dispose(templateData.disposables);
        }
    }
    class SelectBoxList extends lifecycle_1.Disposable {
        constructor(options, selected, contextViewProvider, styles, selectBoxOptions) {
            super();
            this.options = [];
            this._currentSelection = 0;
            this._hasDetails = false;
            this._skipLayout = false;
            this._sticky = false; // for dev purposes only
            this._isVisible = false;
            this.selectBoxOptions = selectBoxOptions || Object.create(null);
            if (typeof this.selectBoxOptions.minBottomMargin !== 'number') {
                this.selectBoxOptions.minBottomMargin = SelectBoxList.DEFAULT_DROPDOWN_MINIMUM_BOTTOM_MARGIN;
            }
            else if (this.selectBoxOptions.minBottomMargin < 0) {
                this.selectBoxOptions.minBottomMargin = 0;
            }
            this.selectElement = document.createElement('select');
            // Use custom CSS vars for padding calculation
            this.selectElement.className = 'monaco-select-box monaco-select-box-dropdown-padding';
            if (typeof this.selectBoxOptions.ariaLabel === 'string') {
                this.selectElement.setAttribute('aria-label', this.selectBoxOptions.ariaLabel);
            }
            this._onDidSelect = new event_1.Emitter();
            this._register(this._onDidSelect);
            this.styles = styles;
            this.registerListeners();
            this.constructSelectDropDown(contextViewProvider);
            this.selected = selected || 0;
            if (options) {
                this.setOptions(options, selected);
            }
        }
        // IDelegate - List renderer
        getHeight() {
            return 18;
        }
        getTemplateId() {
            return SELECT_OPTION_ENTRY_TEMPLATE_ID;
        }
        constructSelectDropDown(contextViewProvider) {
            // SetUp ContextView container to hold select Dropdown
            this.contextViewProvider = contextViewProvider;
            this.selectDropDownContainer = dom.$('.monaco-select-box-dropdown-container');
            // Use custom CSS vars for padding calculation (shared with parent select)
            dom.addClass(this.selectDropDownContainer, 'monaco-select-box-dropdown-padding');
            // Setup container for select option details
            this.selectionDetailsPane = dom.append(this.selectDropDownContainer, $('.select-box-details-pane'));
            // Create span flex box item/div we can measure and control
            let widthControlOuterDiv = dom.append(this.selectDropDownContainer, $('.select-box-dropdown-container-width-control'));
            let widthControlInnerDiv = dom.append(widthControlOuterDiv, $('.width-control-div'));
            this.widthControlElement = document.createElement('span');
            this.widthControlElement.className = 'option-text-width-control';
            dom.append(widthControlInnerDiv, this.widthControlElement);
            // Always default to below position
            this._dropDownPosition = 0 /* BELOW */;
            // Inline stylesheet for themes
            this.styleElement = dom.createStyleSheet(this.selectDropDownContainer);
        }
        registerListeners() {
            // Parent native select keyboard listeners
            this._register(dom.addStandardDisposableListener(this.selectElement, 'change', (e) => {
                this.selected = e.target.selectedIndex;
                this._onDidSelect.fire({
                    index: e.target.selectedIndex,
                    selected: e.target.value
                });
                if (!!this.options[this.selected] && !!this.options[this.selected].text) {
                    this.selectElement.title = this.options[this.selected].text;
                }
            }));
            // Have to implement both keyboard and mouse controllers to handle disabled options
            // Intercept mouse events to override normal select actions on parents
            this._register(dom.addDisposableListener(this.selectElement, dom.EventType.CLICK, (e) => {
                dom.EventHelper.stop(e);
                if (this._isVisible) {
                    this.hideSelectDropDown(true);
                }
                else {
                    this.showSelectDropDown();
                }
            }));
            this._register(dom.addDisposableListener(this.selectElement, dom.EventType.MOUSE_DOWN, (e) => {
                dom.EventHelper.stop(e);
            }));
            // Intercept keyboard handling
            this._register(dom.addDisposableListener(this.selectElement, dom.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                let showDropDown = false;
                // Create and drop down select list on keyboard select
                if (platform_1.isMacintosh) {
                    if (event.keyCode === 18 /* DownArrow */ || event.keyCode === 16 /* UpArrow */ || event.keyCode === 10 /* Space */ || event.keyCode === 3 /* Enter */) {
                        showDropDown = true;
                    }
                }
                else {
                    if (event.keyCode === 18 /* DownArrow */ && event.altKey || event.keyCode === 16 /* UpArrow */ && event.altKey || event.keyCode === 10 /* Space */ || event.keyCode === 3 /* Enter */) {
                        showDropDown = true;
                    }
                }
                if (showDropDown) {
                    this.showSelectDropDown();
                    dom.EventHelper.stop(e);
                }
            }));
        }
        get onDidSelect() {
            return this._onDidSelect.event;
        }
        setOptions(options, selected) {
            if (!arrays.equals(this.options, options)) {
                this.options = options;
                this.selectElement.options.length = 0;
                this._hasDetails = false;
                this.options.forEach((option, index) => {
                    this.selectElement.add(this.createOption(option.text, index, option.isDisabled));
                    if (typeof option.description === 'string') {
                        this._hasDetails = true;
                    }
                });
            }
            if (selected !== undefined) {
                this.select(selected);
                // Set current = selected since this is not necessarily a user exit
                this._currentSelection = this.selected;
            }
        }
        setOptionsList() {
            // Mirror options in drop-down
            // Populate select list for non-native select mode
            if (this.selectList) {
                this.selectList.splice(0, this.selectList.length, this.options);
            }
        }
        select(index) {
            if (index >= 0 && index < this.options.length) {
                this.selected = index;
            }
            else if (index > this.options.length - 1) {
                // Adjust index to end of list
                // This could make client out of sync with the select
                this.select(this.options.length - 1);
            }
            else if (this.selected < 0) {
                this.selected = 0;
            }
            this.selectElement.selectedIndex = this.selected;
            if (!!this.options[this.selected] && !!this.options[this.selected].text) {
                this.selectElement.title = this.options[this.selected].text;
            }
        }
        setAriaLabel(label) {
            this.selectBoxOptions.ariaLabel = label;
            this.selectElement.setAttribute('aria-label', this.selectBoxOptions.ariaLabel);
        }
        focus() {
            if (this.selectElement) {
                this.selectElement.focus();
            }
        }
        blur() {
            if (this.selectElement) {
                this.selectElement.blur();
            }
        }
        render(container) {
            this.container = container;
            dom.addClass(container, 'select-container');
            container.appendChild(this.selectElement);
            this.applyStyles();
        }
        style(styles) {
            const content = [];
            this.styles = styles;
            // Style non-native select mode
            if (this.styles.listFocusBackground) {
                content.push(`.monaco-select-box-dropdown-container > .select-box-dropdown-list-container .monaco-list .monaco-list-row.focused { background-color: ${this.styles.listFocusBackground} !important; }`);
            }
            if (this.styles.listFocusForeground) {
                content.push(`.monaco-select-box-dropdown-container > .select-box-dropdown-list-container .monaco-list .monaco-list-row.focused:not(:hover) { color: ${this.styles.listFocusForeground} !important; }`);
            }
            if (this.styles.decoratorRightForeground) {
                content.push(`.monaco-select-box-dropdown-container > .select-box-dropdown-list-container .monaco-list .monaco-list-row .option-decorator-right { color: ${this.styles.decoratorRightForeground} !important; }`);
            }
            if (this.styles.selectBackground && this.styles.selectBorder && !this.styles.selectBorder.equals(this.styles.selectBackground)) {
                content.push(`.monaco-select-box-dropdown-container { border: 1px solid ${this.styles.selectBorder} } `);
                content.push(`.monaco-select-box-dropdown-container > .select-box-details-pane.border-top { border-top: 1px solid ${this.styles.selectBorder} } `);
                content.push(`.monaco-select-box-dropdown-container > .select-box-details-pane.border-bottom { border-bottom: 1px solid ${this.styles.selectBorder} } `);
            }
            else if (this.styles.selectListBorder) {
                content.push(`.monaco-select-box-dropdown-container > .select-box-details-pane.border-top { border-top: 1px solid ${this.styles.selectListBorder} } `);
                content.push(`.monaco-select-box-dropdown-container > .select-box-details-pane.border-bottom { border-bottom: 1px solid ${this.styles.selectListBorder} } `);
            }
            // Hover foreground - ignore for disabled options
            if (this.styles.listHoverForeground) {
                content.push(`.monaco-select-box-dropdown-container > .select-box-dropdown-list-container .monaco-list .monaco-list-row:hover { color: ${this.styles.listHoverForeground} !important; }`);
                content.push(`.monaco-select-box-dropdown-container > .select-box-dropdown-list-container .monaco-list .monaco-list-row.option-disabled:hover { background-color: ${this.styles.listActiveSelectionForeground} !important; }`);
            }
            // Hover background - ignore for disabled options
            if (this.styles.listHoverBackground) {
                content.push(`.monaco-select-box-dropdown-container > .select-box-dropdown-list-container .monaco-list .monaco-list-row:not(.option-disabled):not(.focused):hover { background-color: ${this.styles.listHoverBackground} !important; }`);
                content.push(`.monaco-select-box-dropdown-container > .select-box-dropdown-list-container .monaco-list .monaco-list-row.option-disabled:hover { background-color: ${this.styles.selectBackground} !important; }`);
            }
            // Match quick input outline styles - ignore for disabled options
            if (this.styles.listFocusOutline) {
                content.push(`.monaco-select-box-dropdown-container > .select-box-dropdown-list-container .monaco-list .monaco-list-row.focused { outline: 1.6px dotted ${this.styles.listFocusOutline} !important; outline-offset: -1.6px !important; }`);
            }
            if (this.styles.listHoverOutline) {
                content.push(`.monaco-select-box-dropdown-container > .select-box-dropdown-list-container .monaco-list .monaco-list-row:hover:not(.focused) { outline: 1.6px dashed ${this.styles.listHoverOutline} !important; outline-offset: -1.6px !important; }`);
                content.push(`.monaco-select-box-dropdown-container > .select-box-dropdown-list-container .monaco-list .monaco-list-row.option-disabled:hover { outline: none !important; }`);
            }
            this.styleElement.innerHTML = content.join('\n');
            this.applyStyles();
        }
        applyStyles() {
            // Style parent select
            if (this.selectElement) {
                const background = this.styles.selectBackground ? this.styles.selectBackground.toString() : '';
                const foreground = this.styles.selectForeground ? this.styles.selectForeground.toString() : '';
                const border = this.styles.selectBorder ? this.styles.selectBorder.toString() : '';
                this.selectElement.style.backgroundColor = background;
                this.selectElement.style.color = foreground;
                this.selectElement.style.borderColor = border;
            }
            // Style drop down select list (non-native mode only)
            if (this.selectList) {
                this.styleList();
            }
        }
        styleList() {
            if (this.selectList) {
                const background = this.styles.selectBackground ? this.styles.selectBackground.toString() : '';
                this.selectList.style({});
                const listBackground = this.styles.selectListBackground ? this.styles.selectListBackground.toString() : background;
                this.selectDropDownListContainer.style.backgroundColor = listBackground;
                this.selectionDetailsPane.style.backgroundColor = listBackground;
                const optionsBorder = this.styles.focusBorder ? this.styles.focusBorder.toString() : '';
                this.selectDropDownContainer.style.outlineColor = optionsBorder;
                this.selectDropDownContainer.style.outlineOffset = '-1px';
            }
        }
        createOption(value, index, disabled) {
            let option = document.createElement('option');
            option.value = value;
            option.text = value;
            option.disabled = !!disabled;
            return option;
        }
        // ContextView dropdown methods
        showSelectDropDown() {
            this.selectionDetailsPane.innerText = '';
            if (!this.contextViewProvider || this._isVisible) {
                return;
            }
            // Lazily create and populate list only at open, moved from constructor
            this.createSelectList(this.selectDropDownContainer);
            this.setOptionsList();
            // This allows us to flip the position based on measurement
            // Set drop-down position above/below from required height and margins
            // If pre-layout cannot fit at least one option do not show drop-down
            this.contextViewProvider.showContextView({
                getAnchor: () => this.selectElement,
                render: (container) => this.renderSelectDropDown(container, true),
                layout: () => {
                    this.layoutSelectDropDown();
                },
                onHide: () => {
                    dom.toggleClass(this.selectDropDownContainer, 'visible', false);
                    dom.toggleClass(this.selectElement, 'synthetic-focus', false);
                },
                anchorPosition: this._dropDownPosition
            }, this.selectBoxOptions.optionsAsChildren ? this.container : undefined);
            // Hide so we can relay out
            this._isVisible = true;
            this.hideSelectDropDown(false);
            this.contextViewProvider.showContextView({
                getAnchor: () => this.selectElement,
                render: (container) => this.renderSelectDropDown(container),
                layout: () => this.layoutSelectDropDown(),
                onHide: () => {
                    dom.toggleClass(this.selectDropDownContainer, 'visible', false);
                    dom.toggleClass(this.selectElement, 'synthetic-focus', false);
                },
                anchorPosition: this._dropDownPosition
            }, this.selectBoxOptions.optionsAsChildren ? this.container : undefined);
            // Track initial selection the case user escape, blur
            this._currentSelection = this.selected;
            this._isVisible = true;
            this.selectElement.setAttribute('aria-expanded', 'true');
        }
        hideSelectDropDown(focusSelect) {
            if (!this.contextViewProvider || !this._isVisible) {
                return;
            }
            this._isVisible = false;
            this.selectElement.setAttribute('aria-expanded', 'false');
            if (focusSelect) {
                this.selectElement.focus();
            }
            this.contextViewProvider.hideContextView();
        }
        renderSelectDropDown(container, preLayoutPosition) {
            container.appendChild(this.selectDropDownContainer);
            // Pre-Layout allows us to change position
            this.layoutSelectDropDown(preLayoutPosition);
            return {
                dispose: () => {
                    // contextView will dispose itself if moving from one View to another
                    try {
                        container.removeChild(this.selectDropDownContainer); // remove to take out the CSS rules we add
                    }
                    catch (error) {
                        // Ignore, removed already by change of focus
                    }
                }
            };
        }
        // Iterate over detailed descriptions, find max height
        measureMaxDetailsHeight() {
            let maxDetailsPaneHeight = 0;
            this.options.forEach((option, index) => {
                this.selectionDetailsPane.innerText = '';
                if (option.description) {
                    if (option.descriptionIsMarkdown) {
                        this.selectionDetailsPane.appendChild(this.renderDescriptionMarkdown(option.description));
                    }
                    else {
                        this.selectionDetailsPane.innerText = option.description;
                    }
                    this.selectionDetailsPane.style.display = 'block';
                }
                else {
                    this.selectionDetailsPane.style.display = 'none';
                }
                if (this.selectionDetailsPane.offsetHeight > maxDetailsPaneHeight) {
                    maxDetailsPaneHeight = this.selectionDetailsPane.offsetHeight;
                }
            });
            // Reset description to selected
            this.selectionDetailsPane.innerText = '';
            const description = this.options[this.selected].description || null;
            const descriptionIsMarkdown = this.options[this.selected].descriptionIsMarkdown || null;
            if (description) {
                if (descriptionIsMarkdown) {
                    this.selectionDetailsPane.appendChild(this.renderDescriptionMarkdown(description));
                }
                else {
                    this.selectionDetailsPane.innerText = description;
                }
                this.selectionDetailsPane.style.display = 'block';
            }
            return maxDetailsPaneHeight;
        }
        layoutSelectDropDown(preLayoutPosition) {
            // Avoid recursion from layout called in onListFocus
            if (this._skipLayout) {
                return false;
            }
            // Layout ContextView drop down select list and container
            // Have to manage our vertical overflow, sizing, position below or above
            // Position has to be determined and set prior to contextView instantiation
            if (this.selectList) {
                // Make visible to enable measurements
                dom.toggleClass(this.selectDropDownContainer, 'visible', true);
                const selectPosition = dom.getDomNodePagePosition(this.selectElement);
                const styles = getComputedStyle(this.selectElement);
                const verticalPadding = parseFloat(styles.getPropertyValue('--dropdown-padding-top')) + parseFloat(styles.getPropertyValue('--dropdown-padding-bottom'));
                const maxSelectDropDownHeightBelow = (window.innerHeight - selectPosition.top - selectPosition.height - (this.selectBoxOptions.minBottomMargin || 0));
                const maxSelectDropDownHeightAbove = (selectPosition.top - SelectBoxList.DEFAULT_DROPDOWN_MINIMUM_TOP_MARGIN);
                // Determine optimal width - min(longest option), opt(parent select, excluding margins), max(ContextView controlled)
                const selectWidth = this.selectElement.offsetWidth;
                const selectMinWidth = this.setWidthControlElement(this.widthControlElement);
                const selectOptimalWidth = Math.max(selectMinWidth, Math.round(selectWidth)).toString() + 'px';
                this.selectDropDownContainer.style.width = selectOptimalWidth;
                // Get initial list height and determine space above and below
                this.selectList.getHTMLElement().style.height = '';
                this.selectList.layout();
                let listHeight = this.selectList.contentHeight;
                const maxDetailsPaneHeight = this._hasDetails ? this.measureMaxDetailsHeight() : 0;
                const minRequiredDropDownHeight = listHeight + verticalPadding + maxDetailsPaneHeight;
                const maxVisibleOptionsBelow = ((Math.floor((maxSelectDropDownHeightBelow - verticalPadding - maxDetailsPaneHeight) / this.getHeight())));
                const maxVisibleOptionsAbove = ((Math.floor((maxSelectDropDownHeightAbove - verticalPadding - maxDetailsPaneHeight) / this.getHeight())));
                // If we are only doing pre-layout check/adjust position only
                // Calculate vertical space available, flip up if insufficient
                // Use reflected padding on parent select, ContextView style
                // properties not available before DOM attachment
                if (preLayoutPosition) {
                    // Check if select moved out of viewport , do not open
                    // If at least one option cannot be shown, don't open the drop-down or hide/remove if open
                    if ((selectPosition.top + selectPosition.height) > (window.innerHeight - 22)
                        || selectPosition.top < SelectBoxList.DEFAULT_DROPDOWN_MINIMUM_TOP_MARGIN
                        || ((maxVisibleOptionsBelow < 1) && (maxVisibleOptionsAbove < 1))) {
                        // Indicate we cannot open
                        return false;
                    }
                    // Determine if we have to flip up
                    // Always show complete list items - never more than Max available vertical height
                    if (maxVisibleOptionsBelow < SelectBoxList.DEFAULT_MINIMUM_VISIBLE_OPTIONS
                        && maxVisibleOptionsAbove > maxVisibleOptionsBelow
                        && this.options.length > maxVisibleOptionsBelow) {
                        this._dropDownPosition = 1 /* ABOVE */;
                        this.selectDropDownContainer.removeChild(this.selectDropDownListContainer);
                        this.selectDropDownContainer.removeChild(this.selectionDetailsPane);
                        this.selectDropDownContainer.appendChild(this.selectionDetailsPane);
                        this.selectDropDownContainer.appendChild(this.selectDropDownListContainer);
                        dom.removeClass(this.selectionDetailsPane, 'border-top');
                        dom.addClass(this.selectionDetailsPane, 'border-bottom');
                    }
                    else {
                        this._dropDownPosition = 0 /* BELOW */;
                        this.selectDropDownContainer.removeChild(this.selectDropDownListContainer);
                        this.selectDropDownContainer.removeChild(this.selectionDetailsPane);
                        this.selectDropDownContainer.appendChild(this.selectDropDownListContainer);
                        this.selectDropDownContainer.appendChild(this.selectionDetailsPane);
                        dom.removeClass(this.selectionDetailsPane, 'border-bottom');
                        dom.addClass(this.selectionDetailsPane, 'border-top');
                    }
                    // Do full layout on showSelectDropDown only
                    return true;
                }
                // Check if select out of viewport or cutting into status bar
                if ((selectPosition.top + selectPosition.height) > (window.innerHeight - 22)
                    || selectPosition.top < SelectBoxList.DEFAULT_DROPDOWN_MINIMUM_TOP_MARGIN
                    || (this._dropDownPosition === 0 /* BELOW */ && maxVisibleOptionsBelow < 1)
                    || (this._dropDownPosition === 1 /* ABOVE */ && maxVisibleOptionsAbove < 1)) {
                    // Cannot properly layout, close and hide
                    this.hideSelectDropDown(true);
                    return false;
                }
                // SetUp list dimensions and layout - account for container padding
                // Use position to check above or below available space
                if (this._dropDownPosition === 0 /* BELOW */) {
                    if (this._isVisible && maxVisibleOptionsBelow + maxVisibleOptionsAbove < 1) {
                        // If drop-down is visible, must be doing a DOM re-layout, hide since we don't fit
                        // Hide drop-down, hide contextview, focus on parent select
                        this.hideSelectDropDown(true);
                        return false;
                    }
                    // Adjust list height to max from select bottom to margin (default/minBottomMargin)
                    if (minRequiredDropDownHeight > maxSelectDropDownHeightBelow) {
                        listHeight = (maxVisibleOptionsBelow * this.getHeight());
                    }
                }
                else {
                    if (minRequiredDropDownHeight > maxSelectDropDownHeightAbove) {
                        listHeight = (maxVisibleOptionsAbove * this.getHeight());
                    }
                }
                // Set adjusted list height and relayout
                this.selectList.layout(listHeight);
                this.selectList.domFocus();
                // Finally set focus on selected item
                if (this.selectList.length > 0) {
                    this.selectList.setFocus([this.selected || 0]);
                    this.selectList.reveal(this.selectList.getFocus()[0] || 0);
                }
                if (this._hasDetails) {
                    // Leave the selectDropDownContainer to size itself according to children (list + details) - #57447
                    this.selectList.getHTMLElement().style.height = (listHeight + verticalPadding) + 'px';
                    this.selectDropDownContainer.style.height = '';
                }
                else {
                    this.selectDropDownContainer.style.height = (listHeight + verticalPadding) + 'px';
                }
                this.selectDropDownContainer.style.width = selectOptimalWidth;
                // Maintain focus outline on parent select as well as list container - tabindex for focus
                this.selectDropDownListContainer.setAttribute('tabindex', '0');
                dom.toggleClass(this.selectElement, 'synthetic-focus', true);
                dom.toggleClass(this.selectDropDownContainer, 'synthetic-focus', true);
                return true;
            }
            else {
                return false;
            }
        }
        setWidthControlElement(container) {
            let elementWidth = 0;
            if (container) {
                let longest = 0;
                let longestLength = 0;
                this.options.forEach((option, index) => {
                    const len = option.text.length + (!!option.decoratorRight ? option.decoratorRight.length : 0);
                    if (len > longestLength) {
                        longest = index;
                        longestLength = len;
                    }
                });
                container.innerHTML = this.options[longest].text + (!!this.options[longest].decoratorRight ? (this.options[longest].decoratorRight + ' ') : '');
                elementWidth = dom.getTotalWidth(container);
            }
            return elementWidth;
        }
        createSelectList(parent) {
            // If we have already constructive list on open, skip
            if (this.selectList) {
                return;
            }
            // SetUp container for list
            this.selectDropDownListContainer = dom.append(parent, $('.select-box-dropdown-list-container'));
            this.listRenderer = new SelectListRenderer();
            this.selectList = new listWidget_1.List('SelectBoxCustom', this.selectDropDownListContainer, this, [this.listRenderer], {
                useShadows: false,
                verticalScrollMode: 3 /* Visible */,
                keyboardSupport: false,
                mouseSupport: false,
                accessibilityProvider: {
                    getAriaLabel: (element) => element.text,
                    getWidgetAriaLabel: () => nls_1.localize({ key: 'selectBox', comment: ['Behave like native select dropdown element.'] }, "Select Box"),
                    getRole: () => 'option',
                    getWidgetRole: () => 'listbox'
                }
            });
            if (this.selectBoxOptions.ariaLabel) {
                this.selectList.ariaLabel = this.selectBoxOptions.ariaLabel;
            }
            // SetUp list keyboard controller - control navigation, disabled items, focus
            const onSelectDropDownKeyDown = event_1.Event.chain(event_2.domEvent(this.selectDropDownListContainer, 'keydown'))
                .filter(() => this.selectList.length > 0)
                .map(e => new keyboardEvent_1.StandardKeyboardEvent(e));
            this._register(onSelectDropDownKeyDown.filter(e => e.keyCode === 3 /* Enter */).on(e => this.onEnter(e), this));
            this._register(onSelectDropDownKeyDown.filter(e => e.keyCode === 9 /* Escape */).on(e => this.onEscape(e), this));
            this._register(onSelectDropDownKeyDown.filter(e => e.keyCode === 16 /* UpArrow */).on(this.onUpArrow, this));
            this._register(onSelectDropDownKeyDown.filter(e => e.keyCode === 18 /* DownArrow */).on(this.onDownArrow, this));
            this._register(onSelectDropDownKeyDown.filter(e => e.keyCode === 12 /* PageDown */).on(this.onPageDown, this));
            this._register(onSelectDropDownKeyDown.filter(e => e.keyCode === 11 /* PageUp */).on(this.onPageUp, this));
            this._register(onSelectDropDownKeyDown.filter(e => e.keyCode === 14 /* Home */).on(this.onHome, this));
            this._register(onSelectDropDownKeyDown.filter(e => e.keyCode === 13 /* End */).on(this.onEnd, this));
            this._register(onSelectDropDownKeyDown.filter(e => (e.keyCode >= 21 /* KEY_0 */ && e.keyCode <= 56 /* KEY_Z */) || (e.keyCode >= 80 /* US_SEMICOLON */ && e.keyCode <= 108 /* NUMPAD_DIVIDE */)).on(this.onCharacter, this));
            // SetUp list mouse controller - control navigation, disabled items, focus
            this._register(event_1.Event.chain(event_2.domEvent(this.selectList.getHTMLElement(), 'mouseup'))
                .filter(() => this.selectList.length > 0)
                .on(e => this.onMouseUp(e), this));
            this._register(this.selectList.onMouseOver(e => typeof e.index !== 'undefined' && this.selectList.setFocus([e.index])));
            this._register(this.selectList.onDidChangeFocus(e => this.onListFocus(e)));
            this._register(dom.addDisposableListener(this.selectDropDownContainer, dom.EventType.FOCUS_OUT, e => {
                if (!this._isVisible || dom.isAncestor(e.relatedTarget, this.selectDropDownContainer)) {
                    return;
                }
                this.onListBlur();
            }));
            this.selectList.getHTMLElement().setAttribute('aria-label', this.selectBoxOptions.ariaLabel || '');
            this.selectList.getHTMLElement().setAttribute('aria-expanded', 'true');
            this.styleList();
        }
        // List methods
        // List mouse controller - active exit, select option, fire onDidSelect if change, return focus to parent select
        onMouseUp(e) {
            dom.EventHelper.stop(e);
            const target = e.target;
            if (!target) {
                return;
            }
            // Check our mouse event is on an option (not scrollbar)
            if (!!target.classList.contains('slider')) {
                return;
            }
            const listRowElement = target.closest('.monaco-list-row');
            if (!listRowElement) {
                return;
            }
            const index = Number(listRowElement.getAttribute('data-index'));
            const disabled = listRowElement.classList.contains('option-disabled');
            // Ignore mouse selection of disabled options
            if (index >= 0 && index < this.options.length && !disabled) {
                this.selected = index;
                this.select(this.selected);
                this.selectList.setFocus([this.selected]);
                this.selectList.reveal(this.selectList.getFocus()[0]);
                // Only fire if selection change
                if (this.selected !== this._currentSelection) {
                    // Set current = selected
                    this._currentSelection = this.selected;
                    this._onDidSelect.fire({
                        index: this.selectElement.selectedIndex,
                        selected: this.options[this.selected].text
                    });
                    if (!!this.options[this.selected] && !!this.options[this.selected].text) {
                        this.selectElement.title = this.options[this.selected].text;
                    }
                }
                this.hideSelectDropDown(true);
            }
        }
        // List Exit - passive - implicit no selection change, hide drop-down
        onListBlur() {
            if (this._sticky) {
                return;
            }
            if (this.selected !== this._currentSelection) {
                // Reset selected to current if no change
                this.select(this._currentSelection);
            }
            this.hideSelectDropDown(false);
        }
        renderDescriptionMarkdown(text, actionHandler) {
            const cleanRenderedMarkdown = (element) => {
                for (let i = 0; i < element.childNodes.length; i++) {
                    const child = element.childNodes.item(i);
                    const tagName = child.tagName && child.tagName.toLowerCase();
                    if (tagName === 'img') {
                        element.removeChild(child);
                    }
                    else {
                        cleanRenderedMarkdown(child);
                    }
                }
            };
            const renderedMarkdown = markdownRenderer_1.renderMarkdown({ value: text }, { actionHandler });
            renderedMarkdown.classList.add('select-box-description-markdown');
            cleanRenderedMarkdown(renderedMarkdown);
            return renderedMarkdown;
        }
        // List Focus Change - passive - update details pane with newly focused element's data
        onListFocus(e) {
            // Skip during initial layout
            if (!this._isVisible || !this._hasDetails) {
                return;
            }
            this.selectionDetailsPane.innerText = '';
            const selectedIndex = e.indexes[0];
            const description = this.options[selectedIndex].description;
            const descriptionIsMarkdown = this.options[selectedIndex].descriptionIsMarkdown;
            if (description) {
                if (descriptionIsMarkdown) {
                    const actionHandler = this.options[selectedIndex].descriptionMarkdownActionHandler;
                    this.selectionDetailsPane.appendChild(this.renderDescriptionMarkdown(description, actionHandler));
                }
                else {
                    this.selectionDetailsPane.innerText = description;
                }
                this.selectionDetailsPane.style.display = 'block';
            }
            else {
                this.selectionDetailsPane.style.display = 'none';
            }
            // Avoid recursion
            this._skipLayout = true;
            this.contextViewProvider.layout();
            this._skipLayout = false;
        }
        // List keyboard controller
        // List exit - active - hide ContextView dropdown, reset selection, return focus to parent select
        onEscape(e) {
            dom.EventHelper.stop(e);
            // Reset selection to value when opened
            this.select(this._currentSelection);
            this.hideSelectDropDown(true);
        }
        // List exit - active - hide ContextView dropdown, return focus to parent select, fire onDidSelect if change
        onEnter(e) {
            dom.EventHelper.stop(e);
            // Only fire if selection change
            if (this.selected !== this._currentSelection) {
                this._currentSelection = this.selected;
                this._onDidSelect.fire({
                    index: this.selectElement.selectedIndex,
                    selected: this.options[this.selected].text
                });
                if (!!this.options[this.selected] && !!this.options[this.selected].text) {
                    this.selectElement.title = this.options[this.selected].text;
                }
            }
            this.hideSelectDropDown(true);
        }
        // List navigation - have to handle a disabled option (jump over)
        onDownArrow() {
            if (this.selected < this.options.length - 1) {
                // Skip disabled options
                const nextOptionDisabled = this.options[this.selected + 1].isDisabled;
                if (nextOptionDisabled && this.options.length > this.selected + 2) {
                    this.selected += 2;
                }
                else if (nextOptionDisabled) {
                    return;
                }
                else {
                    this.selected++;
                }
                // Set focus/selection - only fire event when closing drop-down or on blur
                this.select(this.selected);
                this.selectList.setFocus([this.selected]);
                this.selectList.reveal(this.selectList.getFocus()[0]);
            }
        }
        onUpArrow() {
            if (this.selected > 0) {
                // Skip disabled options
                const previousOptionDisabled = this.options[this.selected - 1].isDisabled;
                if (previousOptionDisabled && this.selected > 1) {
                    this.selected -= 2;
                }
                else {
                    this.selected--;
                }
                // Set focus/selection - only fire event when closing drop-down or on blur
                this.select(this.selected);
                this.selectList.setFocus([this.selected]);
                this.selectList.reveal(this.selectList.getFocus()[0]);
            }
        }
        onPageUp(e) {
            dom.EventHelper.stop(e);
            this.selectList.focusPreviousPage();
            // Allow scrolling to settle
            setTimeout(() => {
                this.selected = this.selectList.getFocus()[0];
                // Shift selection down if we land on a disabled option
                if (this.options[this.selected].isDisabled && this.selected < this.options.length - 1) {
                    this.selected++;
                    this.selectList.setFocus([this.selected]);
                }
                this.selectList.reveal(this.selected);
                this.select(this.selected);
            }, 1);
        }
        onPageDown(e) {
            dom.EventHelper.stop(e);
            this.selectList.focusNextPage();
            // Allow scrolling to settle
            setTimeout(() => {
                this.selected = this.selectList.getFocus()[0];
                // Shift selection up if we land on a disabled option
                if (this.options[this.selected].isDisabled && this.selected > 0) {
                    this.selected--;
                    this.selectList.setFocus([this.selected]);
                }
                this.selectList.reveal(this.selected);
                this.select(this.selected);
            }, 1);
        }
        onHome(e) {
            dom.EventHelper.stop(e);
            if (this.options.length < 2) {
                return;
            }
            this.selected = 0;
            if (this.options[this.selected].isDisabled && this.selected > 1) {
                this.selected++;
            }
            this.selectList.setFocus([this.selected]);
            this.selectList.reveal(this.selected);
            this.select(this.selected);
        }
        onEnd(e) {
            dom.EventHelper.stop(e);
            if (this.options.length < 2) {
                return;
            }
            this.selected = this.options.length - 1;
            if (this.options[this.selected].isDisabled && this.selected > 1) {
                this.selected--;
            }
            this.selectList.setFocus([this.selected]);
            this.selectList.reveal(this.selected);
            this.select(this.selected);
        }
        // Mimic option first character navigation of native select
        onCharacter(e) {
            const ch = keyCodes_1.KeyCodeUtils.toString(e.keyCode);
            let optionIndex = -1;
            for (let i = 0; i < this.options.length - 1; i++) {
                optionIndex = (i + this.selected + 1) % this.options.length;
                if (this.options[optionIndex].text.charAt(0).toUpperCase() === ch && !this.options[optionIndex].isDisabled) {
                    this.select(optionIndex);
                    this.selectList.setFocus([optionIndex]);
                    this.selectList.reveal(this.selectList.getFocus()[0]);
                    dom.EventHelper.stop(e);
                    break;
                }
            }
        }
        dispose() {
            this.hideSelectDropDown(false);
            super.dispose();
        }
    }
    exports.SelectBoxList = SelectBoxList;
    SelectBoxList.DEFAULT_DROPDOWN_MINIMUM_BOTTOM_MARGIN = 32;
    SelectBoxList.DEFAULT_DROPDOWN_MINIMUM_TOP_MARGIN = 2;
    SelectBoxList.DEFAULT_MINIMUM_VISIBLE_OPTIONS = 3;
});
//# __sourceMappingURL=selectBoxCustom.js.map