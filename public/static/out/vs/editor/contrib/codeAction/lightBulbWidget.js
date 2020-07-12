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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/globalMouseMoveMonitor", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/model/textModel", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/base/browser/touch", "vs/base/common/codicons", "vs/css!./lightBulbWidget"], function (require, exports, dom, globalMouseMoveMonitor_1, event_1, lifecycle_1, textModel_1, nls, keybinding_1, themeService_1, colorRegistry_1, touch_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LightBulbWidget = void 0;
    var LightBulbState;
    (function (LightBulbState) {
        let Type;
        (function (Type) {
            Type[Type["Hidden"] = 0] = "Hidden";
            Type[Type["Showing"] = 1] = "Showing";
        })(Type = LightBulbState.Type || (LightBulbState.Type = {}));
        LightBulbState.Hidden = { type: 0 /* Hidden */ };
        class Showing {
            constructor(actions, trigger, editorPosition, widgetPosition) {
                this.actions = actions;
                this.trigger = trigger;
                this.editorPosition = editorPosition;
                this.widgetPosition = widgetPosition;
                this.type = 1 /* Showing */;
            }
        }
        LightBulbState.Showing = Showing;
    })(LightBulbState || (LightBulbState = {}));
    let LightBulbWidget = class LightBulbWidget extends lifecycle_1.Disposable {
        constructor(_editor, _quickFixActionId, _preferredFixActionId, _keybindingService) {
            super();
            this._editor = _editor;
            this._quickFixActionId = _quickFixActionId;
            this._preferredFixActionId = _preferredFixActionId;
            this._keybindingService = _keybindingService;
            this._onClick = this._register(new event_1.Emitter());
            this.onClick = this._onClick.event;
            this._state = LightBulbState.Hidden;
            this._domNode = document.createElement('div');
            this._domNode.className = codicons_1.Codicon.lightBulb.classNames;
            this._editor.addContentWidget(this);
            this._register(this._editor.onDidChangeModelContent(_ => {
                // cancel when the line in question has been removed
                const editorModel = this._editor.getModel();
                if (this.state.type !== 1 /* Showing */ || !editorModel || this.state.editorPosition.lineNumber >= editorModel.getLineCount()) {
                    this.hide();
                }
            }));
            touch_1.Gesture.ignoreTarget(this._domNode);
            this._register(dom.addStandardDisposableGenericMouseDownListner(this._domNode, e => {
                if (this.state.type !== 1 /* Showing */) {
                    return;
                }
                // Make sure that focus / cursor location is not lost when clicking widget icon
                this._editor.focus();
                e.preventDefault();
                // a bit of extra work to make sure the menu
                // doesn't cover the line-text
                const { top, height } = dom.getDomNodePagePosition(this._domNode);
                const lineHeight = this._editor.getOption(51 /* lineHeight */);
                let pad = Math.floor(lineHeight / 3);
                if (this.state.widgetPosition.position !== null && this.state.widgetPosition.position.lineNumber < this.state.editorPosition.lineNumber) {
                    pad += lineHeight;
                }
                this._onClick.fire({
                    x: e.posx,
                    y: top + height + pad,
                    actions: this.state.actions,
                    trigger: this.state.trigger,
                });
            }));
            this._register(dom.addDisposableListener(this._domNode, 'mouseenter', (e) => {
                if ((e.buttons & 1) !== 1) {
                    return;
                }
                // mouse enters lightbulb while the primary/left button
                // is being pressed -> hide the lightbulb and block future
                // showings until mouse is released
                this.hide();
                const monitor = new globalMouseMoveMonitor_1.GlobalMouseMoveMonitor();
                monitor.startMonitoring(e.target, e.buttons, globalMouseMoveMonitor_1.standardMouseMoveMerger, () => { }, () => {
                    monitor.dispose();
                });
            }));
            this._register(this._editor.onDidChangeConfiguration(e => {
                // hide when told to do so
                if (e.hasChanged(49 /* lightbulb */) && !this._editor.getOption(49 /* lightbulb */).enabled) {
                    this.hide();
                }
            }));
            this._updateLightBulbTitleAndIcon();
            this._register(this._keybindingService.onDidUpdateKeybindings(this._updateLightBulbTitleAndIcon, this));
        }
        dispose() {
            super.dispose();
            this._editor.removeContentWidget(this);
        }
        getId() {
            return 'LightBulbWidget';
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return this._state.type === 1 /* Showing */ ? this._state.widgetPosition : null;
        }
        update(actions, trigger, atPosition) {
            if (actions.validActions.length <= 0) {
                return this.hide();
            }
            const options = this._editor.getOptions();
            if (!options.get(49 /* lightbulb */).enabled) {
                return this.hide();
            }
            const model = this._editor.getModel();
            if (!model) {
                return this.hide();
            }
            const { lineNumber, column } = model.validatePosition(atPosition);
            const tabSize = model.getOptions().tabSize;
            const fontInfo = options.get(36 /* fontInfo */);
            const lineContent = model.getLineContent(lineNumber);
            const indent = textModel_1.TextModel.computeIndentLevel(lineContent, tabSize);
            const lineHasSpace = fontInfo.spaceWidth * indent > 22;
            const isFolded = (lineNumber) => {
                return lineNumber > 2 && this._editor.getTopForLineNumber(lineNumber) === this._editor.getTopForLineNumber(lineNumber - 1);
            };
            let effectiveLineNumber = lineNumber;
            if (!lineHasSpace) {
                if (lineNumber > 1 && !isFolded(lineNumber - 1)) {
                    effectiveLineNumber -= 1;
                }
                else if (!isFolded(lineNumber + 1)) {
                    effectiveLineNumber += 1;
                }
                else if (column * fontInfo.spaceWidth < 22) {
                    // cannot show lightbulb above/below and showing
                    // it inline would overlay the cursor...
                    return this.hide();
                }
            }
            this.state = new LightBulbState.Showing(actions, trigger, atPosition, {
                position: { lineNumber: effectiveLineNumber, column: 1 },
                preference: LightBulbWidget._posPref
            });
            this._editor.layoutContentWidget(this);
        }
        hide() {
            this.state = LightBulbState.Hidden;
            this._editor.layoutContentWidget(this);
        }
        get state() { return this._state; }
        set state(value) {
            this._state = value;
            this._updateLightBulbTitleAndIcon();
        }
        _updateLightBulbTitleAndIcon() {
            if (this.state.type === 1 /* Showing */ && this.state.actions.hasAutoFix) {
                // update icon
                dom.removeClasses(this._domNode, codicons_1.Codicon.lightBulb.classNames);
                dom.addClasses(this._domNode, codicons_1.Codicon.lightbulbAutofix.classNames);
                const preferredKb = this._keybindingService.lookupKeybinding(this._preferredFixActionId);
                if (preferredKb) {
                    this.title = nls.localize('prefferedQuickFixWithKb', "Show Fixes. Preferred Fix Available ({0})", preferredKb.getLabel());
                    return;
                }
            }
            // update icon
            dom.removeClasses(this._domNode, codicons_1.Codicon.lightbulbAutofix.classNames);
            dom.addClasses(this._domNode, codicons_1.Codicon.lightBulb.classNames);
            const kb = this._keybindingService.lookupKeybinding(this._quickFixActionId);
            if (kb) {
                this.title = nls.localize('quickFixWithKb', "Show Fixes ({0})", kb.getLabel());
            }
            else {
                this.title = nls.localize('quickFix', "Show Fixes");
            }
        }
        set title(value) {
            this._domNode.title = value;
        }
    };
    LightBulbWidget._posPref = [0 /* EXACT */];
    LightBulbWidget = __decorate([
        __param(3, keybinding_1.IKeybindingService)
    ], LightBulbWidget);
    exports.LightBulbWidget = LightBulbWidget;
    themeService_1.registerThemingParticipant((theme, collector) => {
        // Lightbulb Icon
        const editorLightBulbForegroundColor = theme.getColor(colorRegistry_1.editorLightBulbForeground);
        if (editorLightBulbForegroundColor) {
            collector.addRule(`
		.monaco-editor .contentWidgets ${codicons_1.Codicon.lightBulb.cssSelector} {
			color: ${editorLightBulbForegroundColor};
		}`);
        }
        // Lightbulb Auto Fix Icon
        const editorLightBulbAutoFixForegroundColor = theme.getColor(colorRegistry_1.editorLightBulbAutoFixForeground);
        if (editorLightBulbAutoFixForegroundColor) {
            collector.addRule(`
		.monaco-editor .contentWidgets ${codicons_1.Codicon.lightbulbAutofix.cssSelector} {
			color: ${editorLightBulbAutoFixForegroundColor};
		}`);
        }
    });
});
//# __sourceMappingURL=lightBulbWidget.js.map