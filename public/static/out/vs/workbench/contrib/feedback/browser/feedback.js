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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/browser/ui/dropdown/dropdown", "vs/base/browser/dom", "vs/platform/commands/common/commands", "vs/workbench/services/integrity/common/integrity", "vs/platform/theme/common/themeService", "vs/platform/theme/common/styler", "vs/platform/theme/common/colorRegistry", "vs/base/browser/ui/button/button", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/statusbar/common/statusbar", "vs/platform/product/common/productService", "vs/platform/opener/common/opener", "vs/base/browser/keyboardEvent", "vs/base/common/codicons", "vs/css!./media/feedback"], function (require, exports, nls, lifecycle_1, dropdown_1, dom, commands_1, integrity_1, themeService_1, styler_1, colorRegistry_1, button_1, telemetry_1, statusbar_1, productService_1, opener_1, keyboardEvent_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FeedbackDropdown = void 0;
    let FeedbackDropdown = class FeedbackDropdown extends dropdown_1.Dropdown {
        constructor(container, options, commandService, telemetryService, integrityService, themeService, statusbarService, productService, openerService) {
            super(container, options);
            this.options = options;
            this.commandService = commandService;
            this.telemetryService = telemetryService;
            this.integrityService = integrityService;
            this.themeService = themeService;
            this.statusbarService = statusbarService;
            this.openerService = openerService;
            this.feedback = '';
            this.sentiment = 1;
            this.feedbackForm = null;
            this.feedbackDescriptionInput = null;
            this.smileyInput = null;
            this.frownyInput = null;
            this.sendButton = null;
            this.hideButton = null;
            this.remainingCharacterCount = null;
            this.isPure = true;
            this.feedbackDelegate = options.feedbackService;
            this.maxFeedbackCharacters = this.feedbackDelegate.getCharacterLimit(this.sentiment);
            if (productService.sendASmile) {
                this.requestFeatureLink = productService.sendASmile.requestFeatureUrl;
            }
            this.integrityService.isPure().then(result => {
                if (!result.isPure) {
                    this.isPure = false;
                }
            });
            dom.addClass(this.element, 'send-feedback');
            this.element.title = nls.localize('sendFeedback', "Tweet Feedback");
        }
        getAnchor() {
            const position = dom.getDomNodePagePosition(this.element);
            return {
                x: position.left + position.width,
                y: position.top - 26,
                width: position.width,
                height: position.height
            };
        }
        renderContents(container) {
            const disposables = new lifecycle_1.DisposableStore();
            dom.addClass(container, 'monaco-menu-container');
            // Form
            this.feedbackForm = dom.append(container, dom.$('form.feedback-form'));
            this.feedbackForm.setAttribute('action', 'javascript:void(0);');
            // Title
            dom.append(this.feedbackForm, dom.$('h2.title')).textContent = nls.localize("label.sendASmile", "Tweet us your feedback.");
            // Close Button (top right)
            const closeBtn = dom.append(this.feedbackForm, dom.$('div.cancel' + codicons_1.Codicon.close.cssSelector));
            closeBtn.tabIndex = 0;
            closeBtn.setAttribute('role', 'button');
            closeBtn.title = nls.localize('close', "Close");
            disposables.add(dom.addDisposableListener(container, dom.EventType.KEY_DOWN, keyboardEvent => {
                const standardKeyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(keyboardEvent);
                if (standardKeyboardEvent.keyCode === 9 /* Escape */) {
                    this.hide();
                }
            }));
            disposables.add(dom.addDisposableListener(closeBtn, dom.EventType.MOUSE_OVER, () => {
                const theme = this.themeService.getColorTheme();
                let darkenFactor;
                switch (theme.type) {
                    case 'light':
                        darkenFactor = 0.1;
                        break;
                    case 'dark':
                        darkenFactor = 0.2;
                        break;
                }
                if (darkenFactor) {
                    const backgroundBaseColor = theme.getColor(colorRegistry_1.editorWidgetBackground);
                    if (backgroundBaseColor) {
                        const backgroundColor = colorRegistry_1.darken(backgroundBaseColor, darkenFactor)(theme);
                        if (backgroundColor) {
                            closeBtn.style.backgroundColor = backgroundColor.toString();
                        }
                    }
                }
            }));
            disposables.add(dom.addDisposableListener(closeBtn, dom.EventType.MOUSE_OUT, () => {
                closeBtn.style.backgroundColor = '';
            }));
            this.invoke(closeBtn, disposables, () => this.hide());
            // Content
            const content = dom.append(this.feedbackForm, dom.$('div.content'));
            // Sentiment Buttons
            const sentimentContainer = dom.append(content, dom.$('div'));
            if (!this.isPure) {
                dom.append(sentimentContainer, dom.$('span')).textContent = nls.localize("patchedVersion1", "Your installation is corrupt.");
                sentimentContainer.appendChild(document.createElement('br'));
                dom.append(sentimentContainer, dom.$('span')).textContent = nls.localize("patchedVersion2", "Please specify this if you submit a bug.");
                sentimentContainer.appendChild(document.createElement('br'));
            }
            dom.append(sentimentContainer, dom.$('span')).textContent = nls.localize("sentiment", "How was your experience?");
            const feedbackSentiment = dom.append(sentimentContainer, dom.$('div.feedback-sentiment'));
            // Sentiment: Smiley
            this.smileyInput = dom.append(feedbackSentiment, dom.$('div.sentiment'));
            dom.addClass(this.smileyInput, 'smile');
            this.smileyInput.setAttribute('aria-checked', 'false');
            this.smileyInput.setAttribute('aria-label', nls.localize('smileCaption', "Happy Feedback Sentiment"));
            this.smileyInput.setAttribute('role', 'checkbox');
            this.smileyInput.title = nls.localize('smileCaption', "Happy Feedback Sentiment");
            this.smileyInput.tabIndex = 0;
            this.invoke(this.smileyInput, disposables, () => this.setSentiment(true));
            // Sentiment: Frowny
            this.frownyInput = dom.append(feedbackSentiment, dom.$('div.sentiment'));
            dom.addClass(this.frownyInput, 'frown');
            this.frownyInput.setAttribute('aria-checked', 'false');
            this.frownyInput.setAttribute('aria-label', nls.localize('frownCaption', "Sad Feedback Sentiment"));
            this.frownyInput.setAttribute('role', 'checkbox');
            this.frownyInput.title = nls.localize('frownCaption', "Sad Feedback Sentiment");
            this.frownyInput.tabIndex = 0;
            this.invoke(this.frownyInput, disposables, () => this.setSentiment(false));
            if (this.sentiment === 1) {
                dom.addClass(this.smileyInput, 'checked');
                this.smileyInput.setAttribute('aria-checked', 'true');
            }
            else {
                dom.addClass(this.frownyInput, 'checked');
                this.frownyInput.setAttribute('aria-checked', 'true');
            }
            // Contact Us Box
            const contactUsContainer = dom.append(content, dom.$('div.contactus'));
            dom.append(contactUsContainer, dom.$('span')).textContent = nls.localize("other ways to contact us", "Other ways to contact us");
            const channelsContainer = dom.append(contactUsContainer, dom.$('div.channels'));
            // Contact: Submit a Bug
            const submitBugLinkContainer = dom.append(channelsContainer, dom.$('div'));
            const submitBugLink = dom.append(submitBugLinkContainer, dom.$('a'));
            submitBugLink.setAttribute('target', '_blank');
            submitBugLink.setAttribute('href', '#');
            submitBugLink.textContent = nls.localize("submit a bug", "Submit a bug");
            submitBugLink.tabIndex = 0;
            disposables.add(dom.addDisposableListener(submitBugLink, 'click', e => {
                dom.EventHelper.stop(e);
                const actionId = 'workbench.action.openIssueReporter';
                this.commandService.executeCommand(actionId);
                this.hide();
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: actionId, from: 'feedback' });
            }));
            // Contact: Request a Feature
            if (!!this.requestFeatureLink) {
                const requestFeatureLinkContainer = dom.append(channelsContainer, dom.$('div'));
                const requestFeatureLink = dom.append(requestFeatureLinkContainer, dom.$('a'));
                requestFeatureLink.setAttribute('target', '_blank');
                requestFeatureLink.setAttribute('href', this.requestFeatureLink);
                requestFeatureLink.textContent = nls.localize("request a missing feature", "Request a missing feature");
                requestFeatureLink.tabIndex = 0;
                disposables.add(dom.addDisposableListener(requestFeatureLink, 'click', e => this.hide()));
            }
            // Remaining Characters
            const remainingCharacterCountContainer = dom.append(this.feedbackForm, dom.$('h3'));
            remainingCharacterCountContainer.textContent = nls.localize("tell us why", "Tell us why?");
            this.remainingCharacterCount = dom.append(remainingCharacterCountContainer, dom.$('span.char-counter'));
            this.remainingCharacterCount.textContent = this.getCharCountText(0);
            // Feedback Input Form
            this.feedbackDescriptionInput = dom.append(this.feedbackForm, dom.$('textarea.feedback-description'));
            this.feedbackDescriptionInput.rows = 3;
            this.feedbackDescriptionInput.maxLength = this.maxFeedbackCharacters;
            this.feedbackDescriptionInput.textContent = this.feedback;
            this.feedbackDescriptionInput.required = true;
            this.feedbackDescriptionInput.setAttribute('aria-label', nls.localize("feedbackTextInput", "Tell us your feedback"));
            this.feedbackDescriptionInput.focus();
            disposables.add(dom.addDisposableListener(this.feedbackDescriptionInput, 'keyup', () => this.updateCharCountText()));
            // Feedback Input Form Buttons Container
            const buttonsContainer = dom.append(this.feedbackForm, dom.$('div.form-buttons'));
            // Checkbox: Hide Feedback Smiley
            const hideButtonContainer = dom.append(buttonsContainer, dom.$('div.hide-button-container'));
            this.hideButton = dom.append(hideButtonContainer, dom.$('input.hide-button'));
            this.hideButton.type = 'checkbox';
            this.hideButton.checked = true;
            this.hideButton.id = 'hide-button';
            const hideButtonLabel = dom.append(hideButtonContainer, dom.$('label'));
            hideButtonLabel.setAttribute('for', 'hide-button');
            hideButtonLabel.textContent = nls.localize('showFeedback', "Show Feedback Icon in Status Bar");
            // Button: Send Feedback
            this.sendButton = new button_1.Button(buttonsContainer);
            this.sendButton.enabled = false;
            this.sendButton.label = nls.localize('tweet', "Tweet");
            dom.prepend(this.sendButton.element, dom.$('span.codicon.codicon-twitter'));
            dom.addClasses(this.sendButton.element, 'send');
            this.sendButton.element.title = nls.localize('tweetFeedback', "Tweet Feedback");
            disposables.add(styler_1.attachButtonStyler(this.sendButton, this.themeService));
            this.sendButton.onDidClick(() => this.onSubmit());
            disposables.add(styler_1.attachStylerCallback(this.themeService, { widgetShadow: colorRegistry_1.widgetShadow, editorWidgetBackground: colorRegistry_1.editorWidgetBackground, editorWidgetForeground: colorRegistry_1.editorWidgetForeground, inputBackground: colorRegistry_1.inputBackground, inputForeground: colorRegistry_1.inputForeground, inputBorder: colorRegistry_1.inputBorder, editorBackground: colorRegistry_1.editorBackground, contrastBorder: colorRegistry_1.contrastBorder }, colors => {
                if (this.feedbackForm) {
                    this.feedbackForm.style.backgroundColor = colors.editorWidgetBackground ? colors.editorWidgetBackground.toString() : '';
                    this.feedbackForm.style.color = colors.editorWidgetForeground ? colors.editorWidgetForeground.toString() : '';
                    this.feedbackForm.style.boxShadow = colors.widgetShadow ? `0 0 8px ${colors.widgetShadow}` : '';
                }
                if (this.feedbackDescriptionInput) {
                    this.feedbackDescriptionInput.style.backgroundColor = colors.inputBackground ? colors.inputBackground.toString() : '';
                    this.feedbackDescriptionInput.style.color = colors.inputForeground ? colors.inputForeground.toString() : '';
                    this.feedbackDescriptionInput.style.border = `1px solid ${colors.inputBorder || 'transparent'}`;
                }
                contactUsContainer.style.backgroundColor = colors.editorBackground ? colors.editorBackground.toString() : '';
                contactUsContainer.style.border = `1px solid ${colors.contrastBorder || 'transparent'}`;
            }));
            return {
                dispose: () => {
                    this.feedbackForm = null;
                    this.feedbackDescriptionInput = null;
                    this.smileyInput = null;
                    this.frownyInput = null;
                    disposables.dispose();
                }
            };
        }
        updateFeedbackDescription() {
            if (this.feedbackDescriptionInput && this.feedbackDescriptionInput.textLength > this.maxFeedbackCharacters) {
                this.feedbackDescriptionInput.value = this.feedbackDescriptionInput.value.substring(0, this.maxFeedbackCharacters);
            }
        }
        getCharCountText(charCount) {
            const remaining = this.maxFeedbackCharacters - charCount;
            const text = (remaining === 1)
                ? nls.localize("character left", "character left")
                : nls.localize("characters left", "characters left");
            return `(${remaining} ${text})`;
        }
        updateCharCountText() {
            if (this.feedbackDescriptionInput && this.remainingCharacterCount && this.sendButton) {
                this.remainingCharacterCount.innerText = this.getCharCountText(this.feedbackDescriptionInput.value.length);
                this.sendButton.enabled = this.feedbackDescriptionInput.value.length > 0;
            }
        }
        setSentiment(smile) {
            if (smile) {
                if (this.smileyInput) {
                    dom.addClass(this.smileyInput, 'checked');
                    this.smileyInput.setAttribute('aria-checked', 'true');
                }
                if (this.frownyInput) {
                    dom.removeClass(this.frownyInput, 'checked');
                    this.frownyInput.setAttribute('aria-checked', 'false');
                }
            }
            else {
                if (this.frownyInput) {
                    dom.addClass(this.frownyInput, 'checked');
                    this.frownyInput.setAttribute('aria-checked', 'true');
                }
                if (this.smileyInput) {
                    dom.removeClass(this.smileyInput, 'checked');
                    this.smileyInput.setAttribute('aria-checked', 'false');
                }
            }
            this.sentiment = smile ? 1 : 0;
            this.maxFeedbackCharacters = this.feedbackDelegate.getCharacterLimit(this.sentiment);
            this.updateFeedbackDescription();
            this.updateCharCountText();
            if (this.feedbackDescriptionInput) {
                this.feedbackDescriptionInput.maxLength = this.maxFeedbackCharacters;
            }
        }
        invoke(element, disposables, callback) {
            disposables.add(dom.addDisposableListener(element, 'click', callback));
            disposables.add(dom.addDisposableListener(element, 'keypress', e => {
                if (e instanceof KeyboardEvent) {
                    const keyboardEvent = e;
                    if (keyboardEvent.keyCode === 13 || keyboardEvent.keyCode === 32) { // Enter or Spacebar
                        callback();
                    }
                }
            }));
            return element;
        }
        show() {
            super.show();
            if (this.options.onFeedbackVisibilityChange) {
                this.options.onFeedbackVisibilityChange(true);
            }
        }
        onHide() {
            if (this.options.onFeedbackVisibilityChange) {
                this.options.onFeedbackVisibilityChange(false);
            }
        }
        hide() {
            if (this.feedbackDescriptionInput) {
                this.feedback = this.feedbackDescriptionInput.value;
            }
            if (this.autoHideTimeout) {
                clearTimeout(this.autoHideTimeout);
                this.autoHideTimeout = undefined;
            }
            if (this.hideButton && !this.hideButton.checked) {
                this.statusbarService.updateEntryVisibility('status.feedback', false);
            }
            super.hide();
        }
        onEvent(e, activeElement) {
            if (e instanceof KeyboardEvent) {
                const keyboardEvent = e;
                if (keyboardEvent.keyCode === 27) { // Escape
                    this.hide();
                }
            }
        }
        onSubmit() {
            if (!this.feedbackForm || !this.feedbackDescriptionInput || (this.feedbackForm.checkValidity && !this.feedbackForm.checkValidity())) {
                return;
            }
            this.feedbackDelegate.submitFeedback({
                feedback: this.feedbackDescriptionInput.value,
                sentiment: this.sentiment
            }, this.openerService);
            this.hide();
        }
    };
    FeedbackDropdown = __decorate([
        __param(2, commands_1.ICommandService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, integrity_1.IIntegrityService),
        __param(5, themeService_1.IThemeService),
        __param(6, statusbar_1.IStatusbarService),
        __param(7, productService_1.IProductService),
        __param(8, opener_1.IOpenerService)
    ], FeedbackDropdown);
    exports.FeedbackDropdown = FeedbackDropdown;
    themeService_1.registerThemingParticipant((theme, collector) => {
        // Sentiment Buttons
        const inputActiveOptionBorderColor = theme.getColor(colorRegistry_1.inputActiveOptionBorder);
        if (inputActiveOptionBorderColor) {
            collector.addRule(`.monaco-workbench .feedback-form .sentiment.checked { border: 1px solid ${inputActiveOptionBorderColor}; }`);
        }
        // Links
        const linkColor = theme.getColor(colorRegistry_1.textLinkForeground) || theme.getColor(colorRegistry_1.contrastBorder);
        if (linkColor) {
            collector.addRule(`.monaco-workbench .feedback-form .content .channels a { color: ${linkColor}; }`);
        }
    });
});
//# __sourceMappingURL=feedback.js.map