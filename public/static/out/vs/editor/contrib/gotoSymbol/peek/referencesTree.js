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
define(["require", "exports", "../referencesModel", "vs/editor/common/services/resolverService", "vs/base/browser/ui/iconLabel/iconLabel", "vs/base/browser/ui/countBadge/countBadge", "vs/platform/label/common/label", "vs/platform/theme/common/themeService", "vs/platform/theme/common/styler", "vs/base/browser/dom", "vs/nls", "vs/base/common/labels", "vs/base/common/resources", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/base/common/filters", "vs/base/browser/ui/highlightedlabel/highlightedLabel"], function (require, exports, referencesModel_1, resolverService_1, iconLabel_1, countBadge_1, label_1, themeService_1, styler_1, dom, nls_1, labels_1, resources_1, lifecycle_1, instantiation_1, keybinding_1, filters_1, highlightedLabel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AccessibilityProvider = exports.OneReferenceRenderer = exports.FileReferencesRenderer = exports.IdentityProvider = exports.StringRepresentationProvider = exports.Delegate = exports.DataSource = void 0;
    let DataSource = class DataSource {
        constructor(_resolverService) {
            this._resolverService = _resolverService;
        }
        hasChildren(element) {
            if (element instanceof referencesModel_1.ReferencesModel) {
                return true;
            }
            if (element instanceof referencesModel_1.FileReferences) {
                return true;
            }
            return false;
        }
        getChildren(element) {
            if (element instanceof referencesModel_1.ReferencesModel) {
                return element.groups;
            }
            if (element instanceof referencesModel_1.FileReferences) {
                return element.resolve(this._resolverService).then(val => {
                    // if (element.failure) {
                    // 	// refresh the element on failure so that
                    // 	// we can update its rendering
                    // 	return tree.refresh(element).then(() => val.children);
                    // }
                    return val.children;
                });
            }
            throw new Error('bad tree');
        }
    };
    DataSource = __decorate([
        __param(0, resolverService_1.ITextModelService)
    ], DataSource);
    exports.DataSource = DataSource;
    //#endregion
    class Delegate {
        getHeight() {
            return 23;
        }
        getTemplateId(element) {
            if (element instanceof referencesModel_1.FileReferences) {
                return FileReferencesRenderer.id;
            }
            else {
                return OneReferenceRenderer.id;
            }
        }
    }
    exports.Delegate = Delegate;
    let StringRepresentationProvider = class StringRepresentationProvider {
        constructor(_keybindingService) {
            this._keybindingService = _keybindingService;
        }
        getKeyboardNavigationLabel(element) {
            var _a;
            if (element instanceof referencesModel_1.OneReference) {
                const parts = (_a = element.parent.getPreview(element)) === null || _a === void 0 ? void 0 : _a.preview(element.range);
                if (parts) {
                    return parts.value;
                }
            }
            // FileReferences or unresolved OneReference
            return resources_1.basename(element.uri);
        }
        mightProducePrintableCharacter(event) {
            return this._keybindingService.mightProducePrintableCharacter(event);
        }
    };
    StringRepresentationProvider = __decorate([
        __param(0, keybinding_1.IKeybindingService)
    ], StringRepresentationProvider);
    exports.StringRepresentationProvider = StringRepresentationProvider;
    class IdentityProvider {
        getId(element) {
            return element instanceof referencesModel_1.OneReference ? element.id : element.uri;
        }
    }
    exports.IdentityProvider = IdentityProvider;
    //#region render: File
    let FileReferencesTemplate = class FileReferencesTemplate extends lifecycle_1.Disposable {
        constructor(container, _uriLabel, themeService) {
            super();
            this._uriLabel = _uriLabel;
            const parent = document.createElement('div');
            parent.classList.add('reference-file');
            this.file = this._register(new iconLabel_1.IconLabel(parent, { supportHighlights: true }));
            this.badge = new countBadge_1.CountBadge(dom.append(parent, dom.$('.count')));
            this._register(styler_1.attachBadgeStyler(this.badge, themeService));
            container.appendChild(parent);
        }
        set(element, matches) {
            let parent = resources_1.dirname(element.uri);
            this.file.setLabel(labels_1.getBaseLabel(element.uri), this._uriLabel.getUriLabel(parent, { relative: true }), { title: this._uriLabel.getUriLabel(element.uri), matches });
            const len = element.children.length;
            this.badge.setCount(len);
            if (len > 1) {
                this.badge.setTitleFormat(nls_1.localize('referencesCount', "{0} references", len));
            }
            else {
                this.badge.setTitleFormat(nls_1.localize('referenceCount', "{0} reference", len));
            }
        }
    };
    FileReferencesTemplate = __decorate([
        __param(1, label_1.ILabelService),
        __param(2, themeService_1.IThemeService)
    ], FileReferencesTemplate);
    let FileReferencesRenderer = class FileReferencesRenderer {
        constructor(_instantiationService) {
            this._instantiationService = _instantiationService;
            this.templateId = FileReferencesRenderer.id;
        }
        renderTemplate(container) {
            return this._instantiationService.createInstance(FileReferencesTemplate, container);
        }
        renderElement(node, index, template) {
            template.set(node.element, filters_1.createMatches(node.filterData));
        }
        disposeTemplate(templateData) {
            templateData.dispose();
        }
    };
    FileReferencesRenderer.id = 'FileReferencesRenderer';
    FileReferencesRenderer = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], FileReferencesRenderer);
    exports.FileReferencesRenderer = FileReferencesRenderer;
    //#endregion
    //#region render: Reference
    class OneReferenceTemplate {
        constructor(container) {
            this.label = new highlightedLabel_1.HighlightedLabel(container, false);
        }
        set(element, score) {
            var _a;
            const preview = (_a = element.parent.getPreview(element)) === null || _a === void 0 ? void 0 : _a.preview(element.range);
            if (!preview || !preview.value) {
                // this means we FAILED to resolve the document or the value is the empty string
                this.label.set(`${resources_1.basename(element.uri)}:${element.range.startLineNumber + 1}:${element.range.startColumn + 1}`);
            }
            else {
                // render search match as highlight unless
                // we have score, then render the score
                const { value, highlight } = preview;
                if (score && !filters_1.FuzzyScore.isDefault(score)) {
                    this.label.element.classList.toggle('referenceMatch', false);
                    this.label.set(value, filters_1.createMatches(score));
                }
                else {
                    this.label.element.classList.toggle('referenceMatch', true);
                    this.label.set(value, [highlight]);
                }
            }
        }
    }
    class OneReferenceRenderer {
        constructor() {
            this.templateId = OneReferenceRenderer.id;
        }
        renderTemplate(container) {
            return new OneReferenceTemplate(container);
        }
        renderElement(node, index, templateData) {
            templateData.set(node.element, node.filterData);
        }
        disposeTemplate() {
        }
    }
    exports.OneReferenceRenderer = OneReferenceRenderer;
    OneReferenceRenderer.id = 'OneReferenceRenderer';
    //#endregion
    class AccessibilityProvider {
        getWidgetAriaLabel() {
            return nls_1.localize('treeAriaLabel', "References");
        }
        getAriaLabel(element) {
            return element.ariaMessage;
        }
    }
    exports.AccessibilityProvider = AccessibilityProvider;
});
//# __sourceMappingURL=referencesTree.js.map