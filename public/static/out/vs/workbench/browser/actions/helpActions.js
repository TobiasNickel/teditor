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
define(["require", "exports", "vs/base/common/actions", "vs/nls", "vs/platform/product/common/product", "vs/base/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/base/common/keyCodes", "vs/platform/product/common/productService"], function (require, exports, actions_1, nls, product_1, platform_1, telemetry_1, opener_1, uri_1, platform_2, actions_2, actions_3, keyCodes_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let KeybindingsReferenceAction = class KeybindingsReferenceAction extends actions_1.Action {
        constructor(id, label, openerService, productService) {
            super(id, label);
            this.openerService = openerService;
            this.productService = productService;
        }
        async run() {
            const url = platform_1.isLinux ? this.productService.keyboardShortcutsUrlLinux : platform_1.isMacintosh ? this.productService.keyboardShortcutsUrlMac : this.productService.keyboardShortcutsUrlWin;
            if (url) {
                this.openerService.open(uri_1.URI.parse(url));
            }
        }
    };
    KeybindingsReferenceAction.ID = 'workbench.action.keybindingsReference';
    KeybindingsReferenceAction.LABEL = nls.localize('keybindingsReference', "Keyboard Shortcuts Reference");
    KeybindingsReferenceAction.AVAILABLE = !!(platform_1.isLinux ? product_1.default.keyboardShortcutsUrlLinux : platform_1.isMacintosh ? product_1.default.keyboardShortcutsUrlMac : product_1.default.keyboardShortcutsUrlWin);
    KeybindingsReferenceAction = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, productService_1.IProductService)
    ], KeybindingsReferenceAction);
    let OpenDocumentationUrlAction = class OpenDocumentationUrlAction extends actions_1.Action {
        constructor(id, label, openerService, productService) {
            super(id, label);
            this.openerService = openerService;
            this.productService = productService;
        }
        async run() {
            if (this.productService.documentationUrl) {
                this.openerService.open(uri_1.URI.parse(this.productService.documentationUrl));
            }
        }
    };
    OpenDocumentationUrlAction.ID = 'workbench.action.openDocumentationUrl';
    OpenDocumentationUrlAction.LABEL = nls.localize('openDocumentationUrl', "Documentation");
    OpenDocumentationUrlAction.AVAILABLE = !!product_1.default.documentationUrl;
    OpenDocumentationUrlAction = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, productService_1.IProductService)
    ], OpenDocumentationUrlAction);
    let OpenIntroductoryVideosUrlAction = class OpenIntroductoryVideosUrlAction extends actions_1.Action {
        constructor(id, label, openerService, productService) {
            super(id, label);
            this.openerService = openerService;
            this.productService = productService;
        }
        async run() {
            if (this.productService.introductoryVideosUrl) {
                this.openerService.open(uri_1.URI.parse(this.productService.introductoryVideosUrl));
            }
        }
    };
    OpenIntroductoryVideosUrlAction.ID = 'workbench.action.openIntroductoryVideosUrl';
    OpenIntroductoryVideosUrlAction.LABEL = nls.localize('openIntroductoryVideosUrl', "Introductory Videos");
    OpenIntroductoryVideosUrlAction.AVAILABLE = !!product_1.default.introductoryVideosUrl;
    OpenIntroductoryVideosUrlAction = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, productService_1.IProductService)
    ], OpenIntroductoryVideosUrlAction);
    let OpenTipsAndTricksUrlAction = class OpenTipsAndTricksUrlAction extends actions_1.Action {
        constructor(id, label, openerService, productService) {
            super(id, label);
            this.openerService = openerService;
            this.productService = productService;
        }
        async run() {
            if (this.productService.tipsAndTricksUrl) {
                this.openerService.open(uri_1.URI.parse(this.productService.tipsAndTricksUrl));
            }
        }
    };
    OpenTipsAndTricksUrlAction.ID = 'workbench.action.openTipsAndTricksUrl';
    OpenTipsAndTricksUrlAction.LABEL = nls.localize('openTipsAndTricksUrl', "Tips and Tricks");
    OpenTipsAndTricksUrlAction.AVAILABLE = !!product_1.default.tipsAndTricksUrl;
    OpenTipsAndTricksUrlAction = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, productService_1.IProductService)
    ], OpenTipsAndTricksUrlAction);
    let OpenNewsletterSignupUrlAction = class OpenNewsletterSignupUrlAction extends actions_1.Action {
        constructor(id, label, openerService, telemetryService, productService) {
            super(id, label);
            this.openerService = openerService;
            this.telemetryService = telemetryService;
            this.productService = productService;
        }
        async run() {
            const info = await this.telemetryService.getTelemetryInfo();
            this.openerService.open(uri_1.URI.parse(`${this.productService.newsletterSignupUrl}?machineId=${encodeURIComponent(info.machineId)}`));
        }
    };
    OpenNewsletterSignupUrlAction.ID = 'workbench.action.openNewsletterSignupUrl';
    OpenNewsletterSignupUrlAction.LABEL = nls.localize('newsletterSignup', "Signup for the VS Code Newsletter");
    OpenNewsletterSignupUrlAction.AVAILABLE = !!product_1.default.newsletterSignupUrl;
    OpenNewsletterSignupUrlAction = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, productService_1.IProductService)
    ], OpenNewsletterSignupUrlAction);
    let OpenTwitterUrlAction = class OpenTwitterUrlAction extends actions_1.Action {
        constructor(id, label, openerService, productService) {
            super(id, label);
            this.openerService = openerService;
            this.productService = productService;
        }
        async run() {
            if (this.productService.twitterUrl) {
                this.openerService.open(uri_1.URI.parse(this.productService.twitterUrl));
            }
        }
    };
    OpenTwitterUrlAction.ID = 'workbench.action.openTwitterUrl';
    OpenTwitterUrlAction.LABEL = nls.localize('openTwitterUrl', "Join Us on Twitter");
    OpenTwitterUrlAction.AVAILABLE = !!product_1.default.twitterUrl;
    OpenTwitterUrlAction = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, productService_1.IProductService)
    ], OpenTwitterUrlAction);
    let OpenRequestFeatureUrlAction = class OpenRequestFeatureUrlAction extends actions_1.Action {
        constructor(id, label, openerService, productService) {
            super(id, label);
            this.openerService = openerService;
            this.productService = productService;
        }
        async run() {
            if (this.productService.requestFeatureUrl) {
                this.openerService.open(uri_1.URI.parse(this.productService.requestFeatureUrl));
            }
        }
    };
    OpenRequestFeatureUrlAction.ID = 'workbench.action.openRequestFeatureUrl';
    OpenRequestFeatureUrlAction.LABEL = nls.localize('openUserVoiceUrl', "Search Feature Requests");
    OpenRequestFeatureUrlAction.AVAILABLE = !!product_1.default.requestFeatureUrl;
    OpenRequestFeatureUrlAction = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, productService_1.IProductService)
    ], OpenRequestFeatureUrlAction);
    let OpenLicenseUrlAction = class OpenLicenseUrlAction extends actions_1.Action {
        constructor(id, label, openerService, productService) {
            super(id, label);
            this.openerService = openerService;
            this.productService = productService;
        }
        async run() {
            if (this.productService.licenseUrl) {
                if (platform_1.language) {
                    const queryArgChar = this.productService.licenseUrl.indexOf('?') > 0 ? '&' : '?';
                    this.openerService.open(uri_1.URI.parse(`${this.productService.licenseUrl}${queryArgChar}lang=${platform_1.language}`));
                }
                else {
                    this.openerService.open(uri_1.URI.parse(this.productService.licenseUrl));
                }
            }
        }
    };
    OpenLicenseUrlAction.ID = 'workbench.action.openLicenseUrl';
    OpenLicenseUrlAction.LABEL = nls.localize('openLicenseUrl', "View License");
    OpenLicenseUrlAction.AVAILABLE = !!product_1.default.licenseUrl;
    OpenLicenseUrlAction = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, productService_1.IProductService)
    ], OpenLicenseUrlAction);
    let OpenPrivacyStatementUrlAction = class OpenPrivacyStatementUrlAction extends actions_1.Action {
        constructor(id, label, openerService, productService) {
            super(id, label);
            this.openerService = openerService;
            this.productService = productService;
        }
        async run() {
            if (this.productService.privacyStatementUrl) {
                if (platform_1.language) {
                    const queryArgChar = this.productService.privacyStatementUrl.indexOf('?') > 0 ? '&' : '?';
                    this.openerService.open(uri_1.URI.parse(`${this.productService.privacyStatementUrl}${queryArgChar}lang=${platform_1.language}`));
                }
                else {
                    this.openerService.open(uri_1.URI.parse(this.productService.privacyStatementUrl));
                }
            }
        }
    };
    OpenPrivacyStatementUrlAction.ID = 'workbench.action.openPrivacyStatementUrl';
    OpenPrivacyStatementUrlAction.LABEL = nls.localize('openPrivacyStatement', "Privacy Statement");
    OpenPrivacyStatementUrlAction.AVAILABE = !!product_1.default.privacyStatementUrl;
    OpenPrivacyStatementUrlAction = __decorate([
        __param(2, opener_1.IOpenerService),
        __param(3, productService_1.IProductService)
    ], OpenPrivacyStatementUrlAction);
    // --- Actions Registration
    const registry = platform_2.Registry.as(actions_2.Extensions.WorkbenchActions);
    const helpCategory = nls.localize('help', "Help");
    if (KeybindingsReferenceAction.AVAILABLE) {
        registry.registerWorkbenchAction(actions_3.SyncActionDescriptor.from(KeybindingsReferenceAction, { primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 48 /* KEY_R */) }), 'Help: Keyboard Shortcuts Reference', helpCategory);
    }
    if (OpenDocumentationUrlAction.AVAILABLE) {
        registry.registerWorkbenchAction(actions_3.SyncActionDescriptor.from(OpenDocumentationUrlAction), 'Help: Documentation', helpCategory);
    }
    if (OpenIntroductoryVideosUrlAction.AVAILABLE) {
        registry.registerWorkbenchAction(actions_3.SyncActionDescriptor.from(OpenIntroductoryVideosUrlAction), 'Help: Introductory Videos', helpCategory);
    }
    if (OpenTipsAndTricksUrlAction.AVAILABLE) {
        registry.registerWorkbenchAction(actions_3.SyncActionDescriptor.from(OpenTipsAndTricksUrlAction), 'Help: Tips and Tricks', helpCategory);
    }
    if (OpenNewsletterSignupUrlAction.AVAILABLE) {
        registry.registerWorkbenchAction(actions_3.SyncActionDescriptor.from(OpenNewsletterSignupUrlAction), 'Help: Tips and Tricks', helpCategory);
    }
    if (OpenTwitterUrlAction.AVAILABLE) {
        registry.registerWorkbenchAction(actions_3.SyncActionDescriptor.from(OpenTwitterUrlAction), 'Help: Join Us on Twitter', helpCategory);
    }
    if (OpenRequestFeatureUrlAction.AVAILABLE) {
        registry.registerWorkbenchAction(actions_3.SyncActionDescriptor.from(OpenRequestFeatureUrlAction), 'Help: Search Feature Requests', helpCategory);
    }
    if (OpenLicenseUrlAction.AVAILABLE) {
        registry.registerWorkbenchAction(actions_3.SyncActionDescriptor.from(OpenLicenseUrlAction), 'Help: View License', helpCategory);
    }
    if (OpenPrivacyStatementUrlAction.AVAILABE) {
        registry.registerWorkbenchAction(actions_3.SyncActionDescriptor.from(OpenPrivacyStatementUrlAction), 'Help: Privacy Statement', helpCategory);
    }
    // --- Menu Registration
    // Help
    if (OpenDocumentationUrlAction.AVAILABLE) {
        actions_3.MenuRegistry.appendMenuItem(actions_3.MenuId.MenubarHelpMenu, {
            group: '1_welcome',
            command: {
                id: OpenDocumentationUrlAction.ID,
                title: nls.localize({ key: 'miDocumentation', comment: ['&& denotes a mnemonic'] }, "&&Documentation")
            },
            order: 3
        });
    }
    // Reference
    if (KeybindingsReferenceAction.AVAILABLE) {
        actions_3.MenuRegistry.appendMenuItem(actions_3.MenuId.MenubarHelpMenu, {
            group: '2_reference',
            command: {
                id: KeybindingsReferenceAction.ID,
                title: nls.localize({ key: 'miKeyboardShortcuts', comment: ['&& denotes a mnemonic'] }, "&&Keyboard Shortcuts Reference")
            },
            order: 1
        });
    }
    if (OpenIntroductoryVideosUrlAction.AVAILABLE) {
        actions_3.MenuRegistry.appendMenuItem(actions_3.MenuId.MenubarHelpMenu, {
            group: '2_reference',
            command: {
                id: OpenIntroductoryVideosUrlAction.ID,
                title: nls.localize({ key: 'miIntroductoryVideos', comment: ['&& denotes a mnemonic'] }, "Introductory &&Videos")
            },
            order: 2
        });
    }
    if (OpenTipsAndTricksUrlAction.AVAILABLE) {
        actions_3.MenuRegistry.appendMenuItem(actions_3.MenuId.MenubarHelpMenu, {
            group: '2_reference',
            command: {
                id: OpenTipsAndTricksUrlAction.ID,
                title: nls.localize({ key: 'miTipsAndTricks', comment: ['&& denotes a mnemonic'] }, "Tips and Tri&&cks")
            },
            order: 3
        });
    }
    // Feedback
    if (OpenTwitterUrlAction.AVAILABLE) {
        actions_3.MenuRegistry.appendMenuItem(actions_3.MenuId.MenubarHelpMenu, {
            group: '3_feedback',
            command: {
                id: OpenTwitterUrlAction.ID,
                title: nls.localize({ key: 'miTwitter', comment: ['&& denotes a mnemonic'] }, "&&Join Us on Twitter")
            },
            order: 1
        });
    }
    if (OpenRequestFeatureUrlAction.AVAILABLE) {
        actions_3.MenuRegistry.appendMenuItem(actions_3.MenuId.MenubarHelpMenu, {
            group: '3_feedback',
            command: {
                id: OpenRequestFeatureUrlAction.ID,
                title: nls.localize({ key: 'miUserVoice', comment: ['&& denotes a mnemonic'] }, "&&Search Feature Requests")
            },
            order: 2
        });
    }
    // Legal
    if (OpenLicenseUrlAction.AVAILABLE) {
        actions_3.MenuRegistry.appendMenuItem(actions_3.MenuId.MenubarHelpMenu, {
            group: '4_legal',
            command: {
                id: OpenLicenseUrlAction.ID,
                title: nls.localize({ key: 'miLicense', comment: ['&& denotes a mnemonic'] }, "View &&License")
            },
            order: 1
        });
    }
    if (OpenPrivacyStatementUrlAction.AVAILABE) {
        actions_3.MenuRegistry.appendMenuItem(actions_3.MenuId.MenubarHelpMenu, {
            group: '4_legal',
            command: {
                id: OpenPrivacyStatementUrlAction.ID,
                title: nls.localize({ key: 'miPrivacyStatement', comment: ['&& denotes a mnemonic'] }, "Privac&&y Statement")
            },
            order: 2
        });
    }
});
//# __sourceMappingURL=helpActions.js.map