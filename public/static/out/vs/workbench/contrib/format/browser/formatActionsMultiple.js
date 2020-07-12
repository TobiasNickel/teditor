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
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/common/modes", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/quickinput/common/quickInput", "vs/base/common/cancellation", "vs/platform/instantiation/common/instantiation", "vs/editor/contrib/format/format", "vs/editor/common/core/range", "vs/platform/telemetry/common/telemetry", "vs/platform/extensions/common/extensions", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/contributions", "vs/workbench/services/extensions/common/extensions", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/notification/common/notification", "vs/editor/common/services/modeService", "vs/platform/label/common/label", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/editor/common/config/commonEditorConfig"], function (require, exports, editorExtensions_1, editorContextKeys_1, modes_1, nls, contextkey_1, quickInput_1, cancellation_1, instantiation_1, format_1, range_1, telemetry_1, extensions_1, platform_1, configurationRegistry_1, contributions_1, extensions_2, lifecycle_1, configuration_1, notification_1, modeService_1, label_1, extensionManagement_1, commonEditorConfig_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let DefaultFormatter = class DefaultFormatter extends lifecycle_1.Disposable {
        constructor(_extensionService, _extensionEnablementService, _configService, _notificationService, _quickInputService, _modeService, _labelService) {
            super();
            this._extensionService = _extensionService;
            this._extensionEnablementService = _extensionEnablementService;
            this._configService = _configService;
            this._notificationService = _notificationService;
            this._quickInputService = _quickInputService;
            this._modeService = _modeService;
            this._labelService = _labelService;
            this._register(this._extensionService.onDidChangeExtensions(this._updateConfigValues, this));
            this._register(format_1.FormattingConflicts.setFormatterSelector((formatter, document, mode) => this._selectFormatter(formatter, document, mode)));
            this._updateConfigValues();
        }
        async _updateConfigValues() {
            const extensions = await this._extensionService.getExtensions();
            DefaultFormatter.extensionIds.length = 0;
            DefaultFormatter.extensionDescriptions.length = 0;
            DefaultFormatter.extensionIds.push(null);
            DefaultFormatter.extensionDescriptions.push(nls.localize('nullFormatterDescription', "None"));
            for (const extension of extensions) {
                if (extension.main) {
                    DefaultFormatter.extensionIds.push(extension.identifier.value);
                    DefaultFormatter.extensionDescriptions.push(extension.description || '');
                }
            }
        }
        static _maybeQuotes(s) {
            return s.match(/\s/) ? `'${s}'` : s;
        }
        async _selectFormatter(formatter, document, mode) {
            const defaultFormatterId = this._configService.getValue(DefaultFormatter.configName, {
                resource: document.uri,
                overrideIdentifier: document.getModeId()
            });
            if (defaultFormatterId) {
                // good -> formatter configured
                const [defaultFormatter] = formatter.filter(formatter => extensions_1.ExtensionIdentifier.equals(formatter.extensionId, defaultFormatterId));
                if (defaultFormatter) {
                    // formatter available
                    return defaultFormatter;
                }
                // bad -> formatter gone
                const extension = await this._extensionService.getExtension(defaultFormatterId);
                if (extension && this._extensionEnablementService.isEnabled(extensions_2.toExtension(extension))) {
                    // formatter does not target this file
                    const label = this._labelService.getUriLabel(document.uri, { relative: true });
                    const message = nls.localize('miss', "Extension '{0}' cannot format '{1}'", extension.displayName || extension.name, label);
                    this._notificationService.status(message, { hideAfter: 4000 });
                    return undefined;
                }
            }
            else if (formatter.length === 1) {
                // ok -> nothing configured but only one formatter available
                return formatter[0];
            }
            const langName = this._modeService.getLanguageName(document.getModeId()) || document.getModeId();
            const silent = mode === 2 /* Silent */;
            const message = !defaultFormatterId
                ? nls.localize('config.needed', "There are multiple formatters for '{0}' files. Select a default formatter to continue.", DefaultFormatter._maybeQuotes(langName))
                : nls.localize('config.bad', "Extension '{0}' is configured as formatter but not available. Select a different default formatter to continue.", defaultFormatterId);
            return new Promise((resolve, reject) => {
                this._notificationService.prompt(notification_1.Severity.Info, message, [{ label: nls.localize('do.config', "Configure..."), run: () => this._pickAndPersistDefaultFormatter(formatter, document).then(resolve, reject) }], { silent, onCancel: resolve });
                if (silent) {
                    // don't wait when formatting happens without interaction
                    // but pick some formatter...
                    resolve(formatter[0]);
                }
            });
        }
        async _pickAndPersistDefaultFormatter(formatter, document) {
            const picks = formatter.map((formatter, index) => {
                return {
                    index,
                    label: formatter.displayName || (formatter.extensionId ? formatter.extensionId.value : '?'),
                    description: formatter.extensionId && formatter.extensionId.value
                };
            });
            const langName = this._modeService.getLanguageName(document.getModeId()) || document.getModeId();
            const pick = await this._quickInputService.pick(picks, { placeHolder: nls.localize('select', "Select a default formatter for '{0}' files", DefaultFormatter._maybeQuotes(langName)) });
            if (!pick || !formatter[pick.index].extensionId) {
                return undefined;
            }
            this._configService.updateValue(DefaultFormatter.configName, formatter[pick.index].extensionId.value, {
                resource: document.uri,
                overrideIdentifier: document.getModeId()
            });
            return formatter[pick.index];
        }
    };
    DefaultFormatter.configName = 'editor.defaultFormatter';
    DefaultFormatter.extensionIds = [];
    DefaultFormatter.extensionDescriptions = [];
    DefaultFormatter = __decorate([
        __param(0, extensions_2.IExtensionService),
        __param(1, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, notification_1.INotificationService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, modeService_1.IModeService),
        __param(6, label_1.ILabelService)
    ], DefaultFormatter);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(DefaultFormatter, 3 /* Restored */);
    platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration(Object.assign(Object.assign({}, commonEditorConfig_1.editorConfigurationBaseNode), { properties: {
            [DefaultFormatter.configName]: {
                description: nls.localize('formatter.default', "Defines a default formatter which takes precedence over all other formatter settings. Must be the identifier of an extension contributing a formatter."),
                type: ['string', 'null'],
                default: null,
                enum: DefaultFormatter.extensionIds,
                markdownEnumDescriptions: DefaultFormatter.extensionDescriptions
            }
        } }));
    function logFormatterTelemetry(telemetryService, mode, options, pick) {
        function extKey(obj) {
            return obj.extensionId ? extensions_1.ExtensionIdentifier.toKey(obj.extensionId) : 'unknown';
        }
        /*
         * __GDPR__
            "formatterpick" : {
                "mode" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "extensions" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" },
                "pick" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
            }
         */
        telemetryService.publicLog('formatterpick', {
            mode,
            extensions: options.map(extKey),
            pick: pick ? extKey(pick) : 'none'
        });
    }
    async function showFormatterPick(accessor, model, formatters) {
        const quickPickService = accessor.get(quickInput_1.IQuickInputService);
        const configService = accessor.get(configuration_1.IConfigurationService);
        const modeService = accessor.get(modeService_1.IModeService);
        const overrides = { resource: model.uri, overrideIdentifier: model.getModeId() };
        const defaultFormatter = configService.getValue(DefaultFormatter.configName, overrides);
        let defaultFormatterPick;
        const picks = formatters.map((provider, index) => {
            const isDefault = extensions_1.ExtensionIdentifier.equals(provider.extensionId, defaultFormatter);
            const pick = {
                index,
                label: provider.displayName || '',
                description: isDefault ? nls.localize('def', "(default)") : undefined,
            };
            if (isDefault) {
                // autofocus default pick
                defaultFormatterPick = pick;
            }
            return pick;
        });
        const configurePick = {
            label: nls.localize('config', "Configure Default Formatter...")
        };
        const pick = await quickPickService.pick([...picks, { type: 'separator' }, configurePick], {
            placeHolder: nls.localize('format.placeHolder', "Select a formatter"),
            activeItem: defaultFormatterPick
        });
        if (!pick) {
            // dismissed
            return undefined;
        }
        else if (pick === configurePick) {
            // config default
            const langName = modeService.getLanguageName(model.getModeId()) || model.getModeId();
            const pick = await quickPickService.pick(picks, { placeHolder: nls.localize('select', "Select a default formatter for '{0}' files", DefaultFormatter._maybeQuotes(langName)) });
            if (pick && formatters[pick.index].extensionId) {
                configService.updateValue(DefaultFormatter.configName, formatters[pick.index].extensionId.value, overrides);
            }
            return undefined;
        }
        else {
            // picked one
            return pick.index;
        }
    }
    editorExtensions_1.registerEditorAction(class FormatDocumentMultipleAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatDocument.multiple',
                label: nls.localize('formatDocument.label.multiple', "Format Document With..."),
                alias: 'Format Document...',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.hasMultipleDocumentFormattingProvider),
                contextMenuOpts: {
                    group: '1_modification',
                    order: 1.3
                }
            });
        }
        async run(accessor, editor, args) {
            if (!editor.hasModel()) {
                return;
            }
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            const model = editor.getModel();
            const provider = format_1.getRealAndSyntheticDocumentFormattersOrdered(model);
            const pick = await instaService.invokeFunction(showFormatterPick, model, provider);
            if (typeof pick === 'number') {
                await instaService.invokeFunction(format_1.formatDocumentWithProvider, provider[pick], editor, 1 /* Explicit */, cancellation_1.CancellationToken.None);
            }
            logFormatterTelemetry(telemetryService, 'document', provider, typeof pick === 'number' && provider[pick] || undefined);
        }
    });
    editorExtensions_1.registerEditorAction(class FormatSelectionMultipleAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.formatSelection.multiple',
                label: nls.localize('formatSelection.label.multiple', "Format Selection With..."),
                alias: 'Format Code...',
                precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable), editorContextKeys_1.EditorContextKeys.hasMultipleDocumentSelectionFormattingProvider),
                contextMenuOpts: {
                    when: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasNonEmptySelection),
                    group: '1_modification',
                    order: 1.31
                }
            });
        }
        async run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const instaService = accessor.get(instantiation_1.IInstantiationService);
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            const model = editor.getModel();
            let range = editor.getSelection();
            if (range.isEmpty()) {
                range = new range_1.Range(range.startLineNumber, 1, range.startLineNumber, model.getLineMaxColumn(range.startLineNumber));
            }
            const provider = modes_1.DocumentRangeFormattingEditProviderRegistry.ordered(model);
            const pick = await instaService.invokeFunction(showFormatterPick, model, provider);
            if (typeof pick === 'number') {
                await instaService.invokeFunction(format_1.formatDocumentRangeWithProvider, provider[pick], editor, range, cancellation_1.CancellationToken.None);
            }
            logFormatterTelemetry(telemetryService, 'range', provider, typeof pick === 'number' && provider[pick] || undefined);
        }
    });
});
//# __sourceMappingURL=formatActionsMultiple.js.map