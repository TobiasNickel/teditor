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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/browser/formattedTextRenderer", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/widget", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/toggleTabFocusMode/toggleTabFocusMode", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./accessibility"], function (require, exports, nls, dom, fastDomNode_1, formattedTextRenderer_1, aria_1, widget_1, lifecycle_1, platform, strings, uri_1, editorExtensions_1, editorContextKeys_1, toggleTabFocusMode_1, configuration_1, contextkey_1, instantiation_1, keybinding_1, opener_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CONTEXT_ACCESSIBILITY_WIDGET_VISIBLE = new contextkey_1.RawContextKey('accessibilityHelpWidgetVisible', false);
    let AccessibilityHelpController = class AccessibilityHelpController extends lifecycle_1.Disposable {
        constructor(editor, instantiationService) {
            super();
            this._editor = editor;
            this._widget = this._register(instantiationService.createInstance(AccessibilityHelpWidget, this._editor));
        }
        static get(editor) {
            return editor.getContribution(AccessibilityHelpController.ID);
        }
        show() {
            this._widget.show();
        }
        hide() {
            this._widget.hide();
        }
    };
    AccessibilityHelpController.ID = 'editor.contrib.accessibilityHelpController';
    AccessibilityHelpController = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], AccessibilityHelpController);
    let AccessibilityHelpWidget = class AccessibilityHelpWidget extends widget_1.Widget {
        constructor(editor, _contextKeyService, _keybindingService, _configurationService, _openerService) {
            super();
            this._contextKeyService = _contextKeyService;
            this._keybindingService = _keybindingService;
            this._configurationService = _configurationService;
            this._openerService = _openerService;
            this._editor = editor;
            this._isVisibleKey = CONTEXT_ACCESSIBILITY_WIDGET_VISIBLE.bindTo(this._contextKeyService);
            this._domNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._domNode.setClassName('accessibilityHelpWidget');
            this._domNode.setWidth(AccessibilityHelpWidget.WIDTH);
            this._domNode.setHeight(AccessibilityHelpWidget.HEIGHT);
            this._domNode.setDisplay('none');
            this._domNode.setAttribute('role', 'dialog');
            this._domNode.setAttribute('aria-hidden', 'true');
            this._contentDomNode = fastDomNode_1.createFastDomNode(document.createElement('div'));
            this._contentDomNode.setAttribute('role', 'document');
            this._domNode.appendChild(this._contentDomNode);
            this._isVisible = false;
            this._register(this._editor.onDidLayoutChange(() => {
                if (this._isVisible) {
                    this._layout();
                }
            }));
            // Intentionally not configurable!
            this._register(dom.addStandardDisposableListener(this._contentDomNode.domNode, 'keydown', (e) => {
                if (!this._isVisible) {
                    return;
                }
                if (e.equals(2048 /* CtrlCmd */ | 35 /* KEY_E */)) {
                    aria_1.alert(nls.localize('emergencyConfOn', "Now changing the setting `editor.accessibilitySupport` to 'on'."));
                    this._configurationService.updateValue('editor.accessibilitySupport', 'on', 1 /* USER */);
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (e.equals(2048 /* CtrlCmd */ | 38 /* KEY_H */)) {
                    aria_1.alert(nls.localize('openingDocs', "Now opening the VS Code Accessibility documentation page."));
                    this._openerService.open(uri_1.URI.parse('https://go.microsoft.com/fwlink/?linkid=851010'));
                    e.preventDefault();
                    e.stopPropagation();
                }
            }));
            this.onblur(this._contentDomNode.domNode, () => {
                this.hide();
            });
            this._editor.addOverlayWidget(this);
        }
        dispose() {
            this._editor.removeOverlayWidget(this);
            super.dispose();
        }
        getId() {
            return AccessibilityHelpWidget.ID;
        }
        getDomNode() {
            return this._domNode.domNode;
        }
        getPosition() {
            return {
                preference: null
            };
        }
        show() {
            if (this._isVisible) {
                return;
            }
            this._isVisible = true;
            this._isVisibleKey.set(true);
            this._layout();
            this._domNode.setDisplay('block');
            this._domNode.setAttribute('aria-hidden', 'false');
            this._contentDomNode.domNode.tabIndex = 0;
            this._buildContent();
            this._contentDomNode.domNode.focus();
        }
        _descriptionForCommand(commandId, msg, noKbMsg) {
            let kb = this._keybindingService.lookupKeybinding(commandId);
            if (kb) {
                return strings.format(msg, kb.getAriaLabel());
            }
            return strings.format(noKbMsg, commandId);
        }
        _buildContent() {
            const options = this._editor.getOptions();
            let text = nls.localize('introMsg', "Thank you for trying out VS Code's accessibility options.");
            text += '\n\n' + nls.localize('status', "Status:");
            const configuredValue = this._configurationService.getValue('editor').accessibilitySupport;
            const actualValue = options.get(2 /* accessibilitySupport */);
            const emergencyTurnOnMessage = (platform.isMacintosh
                ? nls.localize('changeConfigToOnMac', "To configure the editor to be permanently optimized for usage with a Screen Reader press Command+E now.")
                : nls.localize('changeConfigToOnWinLinux', "To configure the editor to be permanently optimized for usage with a Screen Reader press Control+E now."));
            switch (configuredValue) {
                case 'auto':
                    switch (actualValue) {
                        case 0 /* Unknown */:
                            // Should never happen in VS Code
                            text += '\n\n - ' + nls.localize('auto_unknown', "The editor is configured to use platform APIs to detect when a Screen Reader is attached, but the current runtime does not support this.");
                            break;
                        case 2 /* Enabled */:
                            text += '\n\n - ' + nls.localize('auto_on', "The editor has automatically detected a Screen Reader is attached.");
                            break;
                        case 1 /* Disabled */:
                            text += '\n\n - ' + nls.localize('auto_off', "The editor is configured to automatically detect when a Screen Reader is attached, which is not the case at this time.");
                            text += ' ' + emergencyTurnOnMessage;
                            break;
                    }
                    break;
                case 'on':
                    text += '\n\n - ' + nls.localize('configuredOn', "The editor is configured to be permanently optimized for usage with a Screen Reader - you can change this by editing the setting `editor.accessibilitySupport`.");
                    break;
                case 'off':
                    text += '\n\n - ' + nls.localize('configuredOff', "The editor is configured to never be optimized for usage with a Screen Reader.");
                    text += ' ' + emergencyTurnOnMessage;
                    break;
            }
            const NLS_TAB_FOCUS_MODE_ON = nls.localize('tabFocusModeOnMsg', "Pressing Tab in the current editor will move focus to the next focusable element. Toggle this behavior by pressing {0}.");
            const NLS_TAB_FOCUS_MODE_ON_NO_KB = nls.localize('tabFocusModeOnMsgNoKb', "Pressing Tab in the current editor will move focus to the next focusable element. The command {0} is currently not triggerable by a keybinding.");
            const NLS_TAB_FOCUS_MODE_OFF = nls.localize('tabFocusModeOffMsg', "Pressing Tab in the current editor will insert the tab character. Toggle this behavior by pressing {0}.");
            const NLS_TAB_FOCUS_MODE_OFF_NO_KB = nls.localize('tabFocusModeOffMsgNoKb', "Pressing Tab in the current editor will insert the tab character. The command {0} is currently not triggerable by a keybinding.");
            if (options.get(114 /* tabFocusMode */)) {
                text += '\n\n - ' + this._descriptionForCommand(toggleTabFocusMode_1.ToggleTabFocusModeAction.ID, NLS_TAB_FOCUS_MODE_ON, NLS_TAB_FOCUS_MODE_ON_NO_KB);
            }
            else {
                text += '\n\n - ' + this._descriptionForCommand(toggleTabFocusMode_1.ToggleTabFocusModeAction.ID, NLS_TAB_FOCUS_MODE_OFF, NLS_TAB_FOCUS_MODE_OFF_NO_KB);
            }
            const openDocMessage = (platform.isMacintosh
                ? nls.localize('openDocMac', "Press Command+H now to open a browser window with more VS Code information related to Accessibility.")
                : nls.localize('openDocWinLinux', "Press Control+H now to open a browser window with more VS Code information related to Accessibility."));
            text += '\n\n' + openDocMessage;
            text += '\n\n' + nls.localize('outroMsg', "You can dismiss this tooltip and return to the editor by pressing Escape or Shift+Escape.");
            this._contentDomNode.domNode.appendChild(formattedTextRenderer_1.renderFormattedText(text));
            // Per https://www.w3.org/TR/wai-aria/roles#document, Authors SHOULD provide a title or label for documents
            this._contentDomNode.domNode.setAttribute('aria-label', text);
        }
        hide() {
            if (!this._isVisible) {
                return;
            }
            this._isVisible = false;
            this._isVisibleKey.reset();
            this._domNode.setDisplay('none');
            this._domNode.setAttribute('aria-hidden', 'true');
            this._contentDomNode.domNode.tabIndex = -1;
            dom.clearNode(this._contentDomNode.domNode);
            this._editor.focus();
        }
        _layout() {
            let editorLayout = this._editor.getLayoutInfo();
            const width = Math.min(editorLayout.width - 40, AccessibilityHelpWidget.WIDTH);
            const height = Math.min(editorLayout.height - 40, AccessibilityHelpWidget.HEIGHT);
            this._domNode.setTop(Math.round((editorLayout.height - height) / 2));
            this._domNode.setLeft(Math.round((editorLayout.width - width) / 2));
            this._domNode.setWidth(width);
            this._domNode.setHeight(height);
        }
    };
    AccessibilityHelpWidget.ID = 'editor.contrib.accessibilityHelpWidget';
    AccessibilityHelpWidget.WIDTH = 500;
    AccessibilityHelpWidget.HEIGHT = 300;
    AccessibilityHelpWidget = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, opener_1.IOpenerService)
    ], AccessibilityHelpWidget);
    class ShowAccessibilityHelpAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.showAccessibilityHelp',
                label: nls.localize('ShowAccessibilityHelpAction', "Show Accessibility Help"),
                alias: 'Show Accessibility Help',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 512 /* Alt */ | 59 /* F1 */,
                    weight: 100 /* EditorContrib */,
                    linux: {
                        primary: 512 /* Alt */ | 1024 /* Shift */ | 59 /* F1 */,
                        secondary: [512 /* Alt */ | 59 /* F1 */]
                    }
                }
            });
        }
        run(accessor, editor) {
            let controller = AccessibilityHelpController.get(editor);
            if (controller) {
                controller.show();
            }
        }
    }
    editorExtensions_1.registerEditorContribution(AccessibilityHelpController.ID, AccessibilityHelpController);
    editorExtensions_1.registerEditorAction(ShowAccessibilityHelpAction);
    const AccessibilityHelpCommand = editorExtensions_1.EditorCommand.bindToContribution(AccessibilityHelpController.get);
    editorExtensions_1.registerEditorCommand(new AccessibilityHelpCommand({
        id: 'closeAccessibilityHelp',
        precondition: CONTEXT_ACCESSIBILITY_WIDGET_VISIBLE,
        handler: x => x.hide(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 100,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 9 /* Escape */, secondary: [1024 /* Shift */ | 9 /* Escape */]
        }
    }));
    themeService_1.registerThemingParticipant((theme, collector) => {
        const widgetBackground = theme.getColor(colorRegistry_1.editorWidgetBackground);
        if (widgetBackground) {
            collector.addRule(`.monaco-editor .accessibilityHelpWidget { background-color: ${widgetBackground}; }`);
        }
        const widgetForeground = theme.getColor(colorRegistry_1.editorWidgetForeground);
        if (widgetBackground) {
            collector.addRule(`.monaco-editor .accessibilityHelpWidget { color: ${widgetForeground}; }`);
        }
        const widgetShadowColor = theme.getColor(colorRegistry_1.widgetShadow);
        if (widgetShadowColor) {
            collector.addRule(`.monaco-editor .accessibilityHelpWidget { box-shadow: 0 2px 8px ${widgetShadowColor}; }`);
        }
        const hcBorder = theme.getColor(colorRegistry_1.contrastBorder);
        if (hcBorder) {
            collector.addRule(`.monaco-editor .accessibilityHelpWidget { border: 2px solid ${hcBorder}; }`);
        }
    });
});
//# __sourceMappingURL=accessibility.js.map