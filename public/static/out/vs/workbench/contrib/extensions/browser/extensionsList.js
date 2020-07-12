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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/browser/event", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/contrib/extensions/browser/extensionsWidgets", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/notification/common/notification", "vs/platform/extensions/common/extensions", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/css!./media/extension"], function (require, exports, dom_1, lifecycle_1, actionbar_1, instantiation_1, event_1, event_2, extensions_1, extensionsActions_1, extensionManagementUtil_1, extensionsWidgets_1, extensions_2, extensionManagement_1, notification_1, extensions_3, themeService_1, colorRegistry_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Renderer = exports.Delegate = void 0;
    class Delegate {
        getHeight() { return 62; }
        getTemplateId() { return 'extension'; }
    }
    exports.Delegate = Delegate;
    const actionOptions = { icon: true, label: true, tabOnlyOnFocus: true };
    let Renderer = class Renderer {
        constructor(extensionViewState, instantiationService, notificationService, extensionService, extensionManagementServerService, extensionsWorkbenchService) {
            this.extensionViewState = extensionViewState;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
            this.extensionService = extensionService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
        }
        get templateId() { return 'extension'; }
        renderTemplate(root) {
            const recommendationWidget = this.instantiationService.createInstance(extensionsWidgets_1.RecommendationWidget, dom_1.append(root, dom_1.$('.extension-bookmark-container')));
            const element = dom_1.append(root, dom_1.$('.extension-list-item'));
            const iconContainer = dom_1.append(element, dom_1.$('.icon-container'));
            const icon = dom_1.append(iconContainer, dom_1.$('img.icon'));
            const iconRemoteBadgeWidget = this.instantiationService.createInstance(extensionsWidgets_1.RemoteBadgeWidget, iconContainer, false);
            const extensionPackBadgeWidget = this.instantiationService.createInstance(extensionsWidgets_1.ExtensionPackCountWidget, iconContainer);
            const details = dom_1.append(element, dom_1.$('.details'));
            const headerContainer = dom_1.append(details, dom_1.$('.header-container'));
            const header = dom_1.append(headerContainer, dom_1.$('.header'));
            const name = dom_1.append(header, dom_1.$('span.name'));
            const version = dom_1.append(header, dom_1.$('span.version'));
            const installCount = dom_1.append(header, dom_1.$('span.install-count'));
            const ratings = dom_1.append(header, dom_1.$('span.ratings'));
            const headerRemoteBadgeWidget = this.instantiationService.createInstance(extensionsWidgets_1.RemoteBadgeWidget, header, false);
            const description = dom_1.append(details, dom_1.$('.description.ellipsis'));
            const footer = dom_1.append(details, dom_1.$('.footer'));
            const author = dom_1.append(footer, dom_1.$('.author.ellipsis'));
            const actionbar = new actionbar_1.ActionBar(footer, {
                animated: false,
                actionViewItemProvider: (action) => {
                    if (action.id === extensionsActions_1.ManageExtensionAction.ID) {
                        return action.createActionViewItem();
                    }
                    return new extensionsActions_1.ExtensionActionViewItem(null, action, actionOptions);
                }
            });
            actionbar.onDidRun(({ error }) => error && this.notificationService.error(error));
            const systemDisabledWarningAction = this.instantiationService.createInstance(extensionsActions_1.SystemDisabledWarningAction);
            const reloadAction = this.instantiationService.createInstance(extensionsActions_1.ReloadAction);
            const actions = [
                this.instantiationService.createInstance(extensionsActions_1.StatusLabelAction),
                this.instantiationService.createInstance(extensionsActions_1.SyncIgnoredIconAction),
                this.instantiationService.createInstance(extensionsActions_1.UpdateAction),
                reloadAction,
                this.instantiationService.createInstance(extensionsActions_1.InstallAction),
                this.instantiationService.createInstance(extensionsActions_1.RemoteInstallAction, false),
                this.instantiationService.createInstance(extensionsActions_1.LocalInstallAction),
                this.instantiationService.createInstance(extensionsActions_1.MaliciousStatusLabelAction, false),
                systemDisabledWarningAction,
                this.instantiationService.createInstance(extensionsActions_1.ManageExtensionAction)
            ];
            const extensionTooltipAction = this.instantiationService.createInstance(extensionsActions_1.ExtensionToolTipAction, systemDisabledWarningAction, reloadAction);
            const tooltipWidget = this.instantiationService.createInstance(extensionsWidgets_1.TooltipWidget, root, extensionTooltipAction, recommendationWidget);
            const widgets = [
                recommendationWidget,
                iconRemoteBadgeWidget,
                extensionPackBadgeWidget,
                headerRemoteBadgeWidget,
                tooltipWidget,
                this.instantiationService.createInstance(extensionsWidgets_1.Label, version, (e) => e.version),
                this.instantiationService.createInstance(extensionsWidgets_1.InstallCountWidget, installCount, true),
                this.instantiationService.createInstance(extensionsWidgets_1.RatingsWidget, ratings, true)
            ];
            const extensionContainers = this.instantiationService.createInstance(extensions_1.ExtensionContainers, [...actions, ...widgets, extensionTooltipAction]);
            actionbar.push(actions, actionOptions);
            const disposable = lifecycle_1.combinedDisposable(...actions, ...widgets, actionbar, extensionContainers, extensionTooltipAction);
            return {
                root, element, icon, name, installCount, ratings, author, description, disposables: [disposable], actionbar,
                extensionDisposables: [],
                set extension(extension) {
                    extensionContainers.extension = extension;
                }
            };
        }
        renderPlaceholder(index, data) {
            dom_1.addClass(data.element, 'loading');
            data.root.removeAttribute('aria-label');
            data.extensionDisposables = lifecycle_1.dispose(data.extensionDisposables);
            data.icon.src = '';
            data.name.textContent = '';
            data.author.textContent = '';
            data.description.textContent = '';
            data.installCount.style.display = 'none';
            data.ratings.style.display = 'none';
            data.extension = null;
        }
        renderElement(extension, index, data) {
            dom_1.removeClass(data.element, 'loading');
            if (extension.state !== 3 /* Uninstalled */ && !extension.server) {
                // Get the extension if it is installed and has no server information
                extension = this.extensionsWorkbenchService.local.filter(e => e.server === extension.server && extensionManagementUtil_1.areSameExtensions(e.identifier, extension.identifier))[0] || extension;
            }
            data.extensionDisposables = lifecycle_1.dispose(data.extensionDisposables);
            let isDisabled = false;
            const updateEnablement = async () => {
                const runningExtensions = await this.extensionService.getExtensions();
                isDisabled = false;
                if (extension.local && !extensions_3.isLanguagePackExtension(extension.local.manifest)) {
                    const runningExtension = runningExtensions.filter(e => extensionManagementUtil_1.areSameExtensions({ id: e.identifier.value, uuid: e.uuid }, extension.identifier))[0];
                    isDisabled = !(runningExtension && extension.server === this.extensionManagementServerService.getExtensionManagementServer(extensions_2.toExtension(runningExtension)));
                }
                dom_1.toggleClass(data.root, 'disabled', isDisabled);
            };
            updateEnablement();
            this.extensionService.onDidChangeExtensions(() => updateEnablement(), this, data.extensionDisposables);
            const onError = event_1.Event.once(event_2.domEvent(data.icon, 'error'));
            onError(() => data.icon.src = extension.iconUrlFallback, null, data.extensionDisposables);
            data.icon.src = extension.iconUrl;
            if (!data.icon.complete) {
                data.icon.style.visibility = 'hidden';
                data.icon.onload = () => data.icon.style.visibility = 'inherit';
            }
            else {
                data.icon.style.visibility = 'inherit';
            }
            data.name.textContent = extension.displayName;
            data.author.textContent = extension.publisherDisplayName;
            data.description.textContent = extension.description;
            data.installCount.style.display = '';
            data.ratings.style.display = '';
            data.extension = extension;
            if (extension.gallery && extension.gallery.properties && extension.gallery.properties.localizedLanguages && extension.gallery.properties.localizedLanguages.length) {
                data.description.textContent = extension.gallery.properties.localizedLanguages.map(name => name[0].toLocaleUpperCase() + name.slice(1)).join(', ');
            }
            this.extensionViewState.onFocus(e => {
                if (extensionManagementUtil_1.areSameExtensions(extension.identifier, e.identifier)) {
                    data.actionbar.viewItems.forEach(item => item.setFocus(true));
                }
            }, this, data.extensionDisposables);
            this.extensionViewState.onBlur(e => {
                if (extensionManagementUtil_1.areSameExtensions(extension.identifier, e.identifier)) {
                    data.actionbar.viewItems.forEach(item => item.setFocus(false));
                }
            }, this, data.extensionDisposables);
        }
        disposeTemplate(data) {
            data.disposables = lifecycle_1.dispose(data.disposables);
        }
    };
    Renderer = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notification_1.INotificationService),
        __param(3, extensions_2.IExtensionService),
        __param(4, extensionManagement_1.IExtensionManagementServerService),
        __param(5, extensions_1.IExtensionsWorkbenchService)
    ], Renderer);
    exports.Renderer = Renderer;
    themeService_1.registerThemingParticipant((theme, collector) => {
        const foregroundColor = theme.getColor(colorRegistry_1.foreground);
        if (foregroundColor) {
            const authorForeground = foregroundColor.transparent(.9).makeOpaque(theme_1.WORKBENCH_BACKGROUND(theme));
            collector.addRule(`.extensions-list .monaco-list .monaco-list-row:not(.disabled) .author { color: ${authorForeground}; }`);
            const disabledExtensionForeground = foregroundColor.transparent(.5).makeOpaque(theme_1.WORKBENCH_BACKGROUND(theme));
            collector.addRule(`.extensions-list .monaco-list .monaco-list-row.disabled { color: ${disabledExtensionForeground}; }`);
        }
        const listActiveSelectionForegroundColor = theme.getColor(colorRegistry_1.listActiveSelectionForeground);
        const listActiveSelectionBackgroundColor = theme.getColor(colorRegistry_1.listActiveSelectionBackground);
        if (listActiveSelectionForegroundColor && listActiveSelectionBackgroundColor) {
            const authorForeground = listActiveSelectionForegroundColor.transparent(.9).makeOpaque(listActiveSelectionBackgroundColor);
            collector.addRule(`.extensions-list .monaco-list:focus .monaco-list-row:not(.disabled).selected .author { color: ${authorForeground}; }`);
            const disabledExtensionForeground = listActiveSelectionForegroundColor.transparent(.5).makeOpaque(listActiveSelectionBackgroundColor);
            collector.addRule(`.extensions-list .monaco-list:focus .monaco-list-row.disabled.selected { color: ${disabledExtensionForeground}; }`);
        }
        const listInactiveSelectionForegroundColor = theme.getColor(colorRegistry_1.listInactiveSelectionForeground);
        const listInactiveSelectionBackgroundColor = theme.getColor(colorRegistry_1.listInactiveSelectionBackground);
        if (listInactiveSelectionForegroundColor && listInactiveSelectionBackgroundColor) {
            const authorForeground = listInactiveSelectionForegroundColor.transparent(.9).makeOpaque(listInactiveSelectionBackgroundColor);
            collector.addRule(`.extensions-list .monaco-list .monaco-list-row:not(.disabled).selected .author { color: ${authorForeground}; }`);
            const disabledExtensionForeground = listInactiveSelectionForegroundColor.transparent(.5).makeOpaque(listInactiveSelectionBackgroundColor);
            collector.addRule(`.extensions-list .monaco-list .monaco-list-row.disabled.selected { color: ${disabledExtensionForeground}; }`);
        }
        const listFocusForegroundColor = theme.getColor(colorRegistry_1.listFocusForeground);
        const listFocusBackgroundColor = theme.getColor(colorRegistry_1.listFocusBackground);
        if (listFocusForegroundColor && listFocusBackgroundColor) {
            const authorForeground = listFocusForegroundColor.transparent(.9).makeOpaque(listFocusBackgroundColor);
            collector.addRule(`.extensions-list .monaco-list:focus .monaco-list-row:not(.disabled).focused .author { color: ${authorForeground}; }`);
            const disabledExtensionForeground = listFocusForegroundColor.transparent(.5).makeOpaque(listFocusBackgroundColor);
            collector.addRule(`.extensions-list .monaco-list:focus .monaco-list-row.disabled.focused { color: ${disabledExtensionForeground}; }`);
        }
        const listHoverForegroundColor = theme.getColor(colorRegistry_1.listHoverForeground);
        const listHoverBackgroundColor = theme.getColor(colorRegistry_1.listHoverBackground);
        if (listHoverForegroundColor && listHoverBackgroundColor) {
            const authorForeground = listHoverForegroundColor.transparent(.9).makeOpaque(listHoverBackgroundColor);
            collector.addRule(`.extensions-list .monaco-list .monaco-list-row:hover:not(.disabled):not(.selected):.not(.focused) .author { color: ${authorForeground}; }`);
            const disabledExtensionForeground = listHoverForegroundColor.transparent(.5).makeOpaque(listHoverBackgroundColor);
            collector.addRule(`.extensions-list .monaco-list .monaco-list-row.disabled:hover:not(.selected):.not(.focused) { color: ${disabledExtensionForeground}; }`);
        }
    });
});
//# __sourceMappingURL=extensionsList.js.map