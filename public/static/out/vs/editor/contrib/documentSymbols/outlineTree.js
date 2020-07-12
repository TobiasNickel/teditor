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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/filters", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/editor/contrib/documentSymbols/outlineModel", "vs/nls", "vs/base/browser/ui/iconLabel/iconLabel", "vs/platform/configuration/common/configuration", "vs/platform/markers/common/markers", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/base/common/async", "vs/editor/common/services/textResourceConfigurationService", "vs/base/common/iterator", "vs/base/common/codicons", "vs/css!./media/outlineTree", "vs/css!./media/symbol-icons"], function (require, exports, dom, highlightedLabel_1, filters_1, range_1, modes_1, outlineModel_1, nls_1, iconLabel_1, configuration_1, markers_1, themeService_1, colorRegistry_1, async_1, textResourceConfigurationService_1, iterator_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SYMBOL_ICON_VARIABLE_FOREGROUND = exports.SYMBOL_ICON_UNIT_FOREGROUND = exports.SYMBOL_ICON_TYPEPARAMETER_FOREGROUND = exports.SYMBOL_ICON_TEXT_FOREGROUND = exports.SYMBOL_ICON_STRUCT_FOREGROUND = exports.SYMBOL_ICON_STRING_FOREGROUND = exports.SYMBOL_ICON_SNIPPET_FOREGROUND = exports.SYMBOL_ICON_REFERENCE_FOREGROUND = exports.SYMBOL_ICON_PROPERTY_FOREGROUND = exports.SYMBOL_ICON_PACKAGE_FOREGROUND = exports.SYMBOL_ICON_OPERATOR_FOREGROUND = exports.SYMBOL_ICON_OBJECT_FOREGROUND = exports.SYMBOL_ICON_NUMBER_FOREGROUND = exports.SYMBOL_ICON_NULL_FOREGROUND = exports.SYMBOL_ICON_NAMESPACE_FOREGROUND = exports.SYMBOL_ICON_MODULE_FOREGROUND = exports.SYMBOL_ICON_METHOD_FOREGROUND = exports.SYMBOL_ICON_KEYWORD_FOREGROUND = exports.SYMBOL_ICON_KEY_FOREGROUND = exports.SYMBOL_ICON_INTERFACE_FOREGROUND = exports.SYMBOL_ICON_FUNCTION_FOREGROUND = exports.SYMBOL_ICON_FOLDER_FOREGROUND = exports.SYMBOL_ICON_FILE_FOREGROUND = exports.SYMBOL_ICON_FIELD_FOREGROUND = exports.SYMBOL_ICON_EVENT_FOREGROUND = exports.SYMBOL_ICON_ENUMERATOR_MEMBER_FOREGROUND = exports.SYMBOL_ICON_ENUMERATOR_FOREGROUND = exports.SYMBOL_ICON_CONSTRUCTOR_FOREGROUND = exports.SYMBOL_ICON_CONSTANT_FOREGROUND = exports.SYMBOL_ICON_COLOR_FOREGROUND = exports.SYMBOL_ICON_CLASS_FOREGROUND = exports.SYMBOL_ICON_BOOLEAN_FOREGROUND = exports.SYMBOL_ICON_ARRAY_FOREGROUND = exports.OutlineDataSource = exports.OutlineItemComparator = exports.OutlineFilter = exports.OutlineSortOrder = exports.OutlineElementRenderer = exports.OutlineGroupRenderer = exports.OutlineVirtualDelegate = exports.OutlineElementTemplate = exports.OutlineGroupTemplate = exports.OutlineIdentityProvider = exports.OutlineAccessibilityProvider = exports.OutlineNavigationLabelProvider = void 0;
    class OutlineNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            if (element instanceof outlineModel_1.OutlineGroup) {
                return element.label;
            }
            else {
                return element.symbol.name;
            }
        }
    }
    exports.OutlineNavigationLabelProvider = OutlineNavigationLabelProvider;
    class OutlineAccessibilityProvider {
        constructor(ariaLabel) {
            this.ariaLabel = ariaLabel;
        }
        getWidgetAriaLabel() {
            return this.ariaLabel;
        }
        getAriaLabel(element) {
            if (element instanceof outlineModel_1.OutlineGroup) {
                return element.label;
            }
            else {
                return element.symbol.name;
            }
        }
    }
    exports.OutlineAccessibilityProvider = OutlineAccessibilityProvider;
    class OutlineIdentityProvider {
        getId(element) {
            return element.id;
        }
    }
    exports.OutlineIdentityProvider = OutlineIdentityProvider;
    class OutlineGroupTemplate {
        constructor(labelContainer, label) {
            this.labelContainer = labelContainer;
            this.label = label;
        }
    }
    exports.OutlineGroupTemplate = OutlineGroupTemplate;
    OutlineGroupTemplate.id = 'OutlineGroupTemplate';
    class OutlineElementTemplate {
        constructor(container, iconLabel, iconClass, decoration) {
            this.container = container;
            this.iconLabel = iconLabel;
            this.iconClass = iconClass;
            this.decoration = decoration;
        }
    }
    exports.OutlineElementTemplate = OutlineElementTemplate;
    OutlineElementTemplate.id = 'OutlineElementTemplate';
    class OutlineVirtualDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof outlineModel_1.OutlineGroup) {
                return OutlineGroupTemplate.id;
            }
            else {
                return OutlineElementTemplate.id;
            }
        }
    }
    exports.OutlineVirtualDelegate = OutlineVirtualDelegate;
    class OutlineGroupRenderer {
        constructor() {
            this.templateId = OutlineGroupTemplate.id;
        }
        renderTemplate(container) {
            const labelContainer = dom.$('.outline-element-label');
            container.classList.add('outline-element');
            dom.append(container, labelContainer);
            return new OutlineGroupTemplate(labelContainer, new highlightedLabel_1.HighlightedLabel(labelContainer, true));
        }
        renderElement(node, index, template) {
            template.label.set(node.element.label, filters_1.createMatches(node.filterData));
        }
        disposeTemplate(_template) {
            // nothing
        }
    }
    exports.OutlineGroupRenderer = OutlineGroupRenderer;
    let OutlineElementRenderer = class OutlineElementRenderer {
        constructor(_configurationService, _themeService) {
            this._configurationService = _configurationService;
            this._themeService = _themeService;
            this.templateId = OutlineElementTemplate.id;
        }
        renderTemplate(container) {
            container.classList.add('outline-element');
            const iconLabel = new iconLabel_1.IconLabel(container, { supportHighlights: true });
            const iconClass = dom.$('.outline-element-icon');
            const decoration = dom.$('.outline-element-decoration');
            container.prepend(iconClass);
            container.appendChild(decoration);
            return new OutlineElementTemplate(container, iconLabel, iconClass, decoration);
        }
        renderElement(node, index, template) {
            const { element } = node;
            const options = {
                matches: filters_1.createMatches(node.filterData),
                labelEscapeNewLines: true,
                extraClasses: [],
                title: nls_1.localize('title.template', "{0} ({1})", element.symbol.name, OutlineElementRenderer._symbolKindNames[element.symbol.kind])
            };
            if (this._configurationService.getValue("outline.icons" /* icons */)) {
                // add styles for the icons
                template.iconClass.className = '';
                dom.addClasses(template.iconClass, `outline-element-icon ${modes_1.SymbolKinds.toCssClassName(element.symbol.kind, true)}`);
            }
            if (element.symbol.tags.indexOf(1 /* Deprecated */) >= 0) {
                options.extraClasses.push(`deprecated`);
                options.matches = [];
            }
            template.iconLabel.setLabel(element.symbol.name, element.symbol.detail, options);
            this._renderMarkerInfo(element, template);
        }
        _renderMarkerInfo(element, template) {
            if (!element.marker) {
                dom.hide(template.decoration);
                template.container.style.removeProperty('--outline-element-color');
                return;
            }
            const { count, topSev } = element.marker;
            const color = this._themeService.getColorTheme().getColor(topSev === markers_1.MarkerSeverity.Error ? colorRegistry_1.listErrorForeground : colorRegistry_1.listWarningForeground);
            const cssColor = color ? color.toString() : 'inherit';
            // color of the label
            if (this._configurationService.getValue("outline.problems.colors" /* problemsColors */)) {
                template.container.style.setProperty('--outline-element-color', cssColor);
            }
            else {
                template.container.style.removeProperty('--outline-element-color');
            }
            // badge with color/rollup
            if (!this._configurationService.getValue("outline.problems.badges" /* problemsBadges */)) {
                dom.hide(template.decoration);
            }
            else if (count > 0) {
                dom.show(template.decoration);
                template.decoration.classList.remove('bubble');
                template.decoration.innerText = count < 10 ? count.toString() : '+9';
                template.decoration.title = count === 1 ? nls_1.localize('1.problem', "1 problem in this element") : nls_1.localize('N.problem', "{0} problems in this element", count);
                template.decoration.style.setProperty('--outline-element-color', cssColor);
            }
            else {
                dom.show(template.decoration);
                template.decoration.classList.add('bubble');
                template.decoration.innerText = '\uea71';
                template.decoration.title = nls_1.localize('deep.problem', "Contains elements with problems");
                template.decoration.style.setProperty('--outline-element-color', cssColor);
            }
        }
        disposeTemplate(_template) {
            _template.iconLabel.dispose();
        }
    };
    OutlineElementRenderer._symbolKindNames = {
        [17 /* Array */]: nls_1.localize('Array', "array"),
        [16 /* Boolean */]: nls_1.localize('Boolean', "boolean"),
        [4 /* Class */]: nls_1.localize('Class', "class"),
        [13 /* Constant */]: nls_1.localize('Constant', "constant"),
        [8 /* Constructor */]: nls_1.localize('Constructor', "constructor"),
        [9 /* Enum */]: nls_1.localize('Enum', "enumeration"),
        [21 /* EnumMember */]: nls_1.localize('EnumMember', "enumeration member"),
        [23 /* Event */]: nls_1.localize('Event', "event"),
        [7 /* Field */]: nls_1.localize('Field', "field"),
        [0 /* File */]: nls_1.localize('File', "file"),
        [11 /* Function */]: nls_1.localize('Function', "function"),
        [10 /* Interface */]: nls_1.localize('Interface', "interface"),
        [19 /* Key */]: nls_1.localize('Key', "key"),
        [5 /* Method */]: nls_1.localize('Method', "method"),
        [1 /* Module */]: nls_1.localize('Module', "module"),
        [2 /* Namespace */]: nls_1.localize('Namespace', "namespace"),
        [20 /* Null */]: nls_1.localize('Null', "null"),
        [15 /* Number */]: nls_1.localize('Number', "number"),
        [18 /* Object */]: nls_1.localize('Object', "object"),
        [24 /* Operator */]: nls_1.localize('Operator', "operator"),
        [3 /* Package */]: nls_1.localize('Package', "package"),
        [6 /* Property */]: nls_1.localize('Property', "property"),
        [14 /* String */]: nls_1.localize('String', "string"),
        [22 /* Struct */]: nls_1.localize('Struct', "struct"),
        [25 /* TypeParameter */]: nls_1.localize('TypeParameter', "type parameter"),
        [12 /* Variable */]: nls_1.localize('Variable', "variable"),
    };
    OutlineElementRenderer = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, themeService_1.IThemeService)
    ], OutlineElementRenderer);
    exports.OutlineElementRenderer = OutlineElementRenderer;
    var OutlineSortOrder;
    (function (OutlineSortOrder) {
        OutlineSortOrder[OutlineSortOrder["ByPosition"] = 0] = "ByPosition";
        OutlineSortOrder[OutlineSortOrder["ByName"] = 1] = "ByName";
        OutlineSortOrder[OutlineSortOrder["ByKind"] = 2] = "ByKind";
    })(OutlineSortOrder = exports.OutlineSortOrder || (exports.OutlineSortOrder = {}));
    let OutlineFilter = class OutlineFilter {
        constructor(_prefix, _textResourceConfigService) {
            this._prefix = _prefix;
            this._textResourceConfigService = _textResourceConfigService;
        }
        filter(element) {
            const outline = outlineModel_1.OutlineModel.get(element);
            let uri;
            if (outline) {
                uri = outline.uri;
            }
            if (!(element instanceof outlineModel_1.OutlineElement)) {
                return true;
            }
            const configName = OutlineFilter.kindToConfigName[element.symbol.kind];
            const configKey = `${this._prefix}.${configName}`;
            return this._textResourceConfigService.getValue(uri, configKey);
        }
    };
    OutlineFilter.configNameToKind = Object.freeze({
        ['showFiles']: 0 /* File */,
        ['showModules']: 1 /* Module */,
        ['showNamespaces']: 2 /* Namespace */,
        ['showPackages']: 3 /* Package */,
        ['showClasses']: 4 /* Class */,
        ['showMethods']: 5 /* Method */,
        ['showProperties']: 6 /* Property */,
        ['showFields']: 7 /* Field */,
        ['showConstructors']: 8 /* Constructor */,
        ['showEnums']: 9 /* Enum */,
        ['showInterfaces']: 10 /* Interface */,
        ['showFunctions']: 11 /* Function */,
        ['showVariables']: 12 /* Variable */,
        ['showConstants']: 13 /* Constant */,
        ['showStrings']: 14 /* String */,
        ['showNumbers']: 15 /* Number */,
        ['showBooleans']: 16 /* Boolean */,
        ['showArrays']: 17 /* Array */,
        ['showObjects']: 18 /* Object */,
        ['showKeys']: 19 /* Key */,
        ['showNull']: 20 /* Null */,
        ['showEnumMembers']: 21 /* EnumMember */,
        ['showStructs']: 22 /* Struct */,
        ['showEvents']: 23 /* Event */,
        ['showOperators']: 24 /* Operator */,
        ['showTypeParameters']: 25 /* TypeParameter */,
    });
    OutlineFilter.kindToConfigName = Object.freeze({
        [0 /* File */]: 'showFiles',
        [1 /* Module */]: 'showModules',
        [2 /* Namespace */]: 'showNamespaces',
        [3 /* Package */]: 'showPackages',
        [4 /* Class */]: 'showClasses',
        [5 /* Method */]: 'showMethods',
        [6 /* Property */]: 'showProperties',
        [7 /* Field */]: 'showFields',
        [8 /* Constructor */]: 'showConstructors',
        [9 /* Enum */]: 'showEnums',
        [10 /* Interface */]: 'showInterfaces',
        [11 /* Function */]: 'showFunctions',
        [12 /* Variable */]: 'showVariables',
        [13 /* Constant */]: 'showConstants',
        [14 /* String */]: 'showStrings',
        [15 /* Number */]: 'showNumbers',
        [16 /* Boolean */]: 'showBooleans',
        [17 /* Array */]: 'showArrays',
        [18 /* Object */]: 'showObjects',
        [19 /* Key */]: 'showKeys',
        [20 /* Null */]: 'showNull',
        [21 /* EnumMember */]: 'showEnumMembers',
        [22 /* Struct */]: 'showStructs',
        [23 /* Event */]: 'showEvents',
        [24 /* Operator */]: 'showOperators',
        [25 /* TypeParameter */]: 'showTypeParameters',
    });
    OutlineFilter = __decorate([
        __param(1, textResourceConfigurationService_1.ITextResourceConfigurationService)
    ], OutlineFilter);
    exports.OutlineFilter = OutlineFilter;
    class OutlineItemComparator {
        constructor(type = 0 /* ByPosition */) {
            this.type = type;
            this._collator = new async_1.IdleValue(() => new Intl.Collator(undefined, { numeric: true }));
        }
        compare(a, b) {
            if (a instanceof outlineModel_1.OutlineGroup && b instanceof outlineModel_1.OutlineGroup) {
                return a.order - b.order;
            }
            else if (a instanceof outlineModel_1.OutlineElement && b instanceof outlineModel_1.OutlineElement) {
                if (this.type === 2 /* ByKind */) {
                    return a.symbol.kind - b.symbol.kind || this._collator.value.compare(a.symbol.name, b.symbol.name);
                }
                else if (this.type === 1 /* ByName */) {
                    return this._collator.value.compare(a.symbol.name, b.symbol.name) || range_1.Range.compareRangesUsingStarts(a.symbol.range, b.symbol.range);
                }
                else if (this.type === 0 /* ByPosition */) {
                    return range_1.Range.compareRangesUsingStarts(a.symbol.range, b.symbol.range) || this._collator.value.compare(a.symbol.name, b.symbol.name);
                }
            }
            return 0;
        }
    }
    exports.OutlineItemComparator = OutlineItemComparator;
    class OutlineDataSource {
        getChildren(element) {
            if (!element) {
                return iterator_1.Iterable.empty();
            }
            return element.children.values();
        }
    }
    exports.OutlineDataSource = OutlineDataSource;
    exports.SYMBOL_ICON_ARRAY_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.arrayForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.arrayForeground', 'The foreground color for array symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_BOOLEAN_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.booleanForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.booleanForeground', 'The foreground color for boolean symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_CLASS_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.classForeground', {
        dark: '#EE9D28',
        light: '#D67E00',
        hc: '#EE9D28'
    }, nls_1.localize('symbolIcon.classForeground', 'The foreground color for class symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_COLOR_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.colorForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.colorForeground', 'The foreground color for color symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_CONSTANT_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.constantForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.constantForeground', 'The foreground color for constant symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_CONSTRUCTOR_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.constructorForeground', {
        dark: '#B180D7',
        light: '#652D90',
        hc: '#B180D7'
    }, nls_1.localize('symbolIcon.constructorForeground', 'The foreground color for constructor symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_ENUMERATOR_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.enumeratorForeground', {
        dark: '#EE9D28',
        light: '#D67E00',
        hc: '#EE9D28'
    }, nls_1.localize('symbolIcon.enumeratorForeground', 'The foreground color for enumerator symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_ENUMERATOR_MEMBER_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.enumeratorMemberForeground', {
        dark: '#75BEFF',
        light: '#007ACC',
        hc: '#75BEFF'
    }, nls_1.localize('symbolIcon.enumeratorMemberForeground', 'The foreground color for enumerator member symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_EVENT_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.eventForeground', {
        dark: '#EE9D28',
        light: '#D67E00',
        hc: '#EE9D28'
    }, nls_1.localize('symbolIcon.eventForeground', 'The foreground color for event symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_FIELD_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.fieldForeground', {
        dark: '#75BEFF',
        light: '#007ACC',
        hc: '#75BEFF'
    }, nls_1.localize('symbolIcon.fieldForeground', 'The foreground color for field symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_FILE_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.fileForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.fileForeground', 'The foreground color for file symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_FOLDER_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.folderForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.folderForeground', 'The foreground color for folder symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_FUNCTION_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.functionForeground', {
        dark: '#B180D7',
        light: '#652D90',
        hc: '#B180D7'
    }, nls_1.localize('symbolIcon.functionForeground', 'The foreground color for function symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_INTERFACE_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.interfaceForeground', {
        dark: '#75BEFF',
        light: '#007ACC',
        hc: '#75BEFF'
    }, nls_1.localize('symbolIcon.interfaceForeground', 'The foreground color for interface symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_KEY_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.keyForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.keyForeground', 'The foreground color for key symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_KEYWORD_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.keywordForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.keywordForeground', 'The foreground color for keyword symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_METHOD_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.methodForeground', {
        dark: '#B180D7',
        light: '#652D90',
        hc: '#B180D7'
    }, nls_1.localize('symbolIcon.methodForeground', 'The foreground color for method symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_MODULE_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.moduleForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.moduleForeground', 'The foreground color for module symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_NAMESPACE_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.namespaceForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.namespaceForeground', 'The foreground color for namespace symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_NULL_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.nullForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.nullForeground', 'The foreground color for null symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_NUMBER_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.numberForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.numberForeground', 'The foreground color for number symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_OBJECT_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.objectForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.objectForeground', 'The foreground color for object symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_OPERATOR_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.operatorForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.operatorForeground', 'The foreground color for operator symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_PACKAGE_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.packageForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.packageForeground', 'The foreground color for package symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_PROPERTY_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.propertyForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.propertyForeground', 'The foreground color for property symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_REFERENCE_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.referenceForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.referenceForeground', 'The foreground color for reference symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_SNIPPET_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.snippetForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.snippetForeground', 'The foreground color for snippet symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_STRING_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.stringForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.stringForeground', 'The foreground color for string symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_STRUCT_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.structForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.structForeground', 'The foreground color for struct symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_TEXT_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.textForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.textForeground', 'The foreground color for text symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_TYPEPARAMETER_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.typeParameterForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.typeParameterForeground', 'The foreground color for type parameter symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_UNIT_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.unitForeground', {
        dark: colorRegistry_1.foreground,
        light: colorRegistry_1.foreground,
        hc: colorRegistry_1.foreground
    }, nls_1.localize('symbolIcon.unitForeground', 'The foreground color for unit symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    exports.SYMBOL_ICON_VARIABLE_FOREGROUND = colorRegistry_1.registerColor('symbolIcon.variableForeground', {
        dark: '#75BEFF',
        light: '#007ACC',
        hc: '#75BEFF'
    }, nls_1.localize('symbolIcon.variableForeground', 'The foreground color for variable symbols. These symbols appear in the outline, breadcrumb, and suggest widget.'));
    themeService_1.registerThemingParticipant((theme, collector) => {
        const symbolIconArrayColor = theme.getColor(exports.SYMBOL_ICON_ARRAY_FOREGROUND);
        if (symbolIconArrayColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolArray.cssSelector} { color: ${symbolIconArrayColor}; }`);
        }
        const symbolIconBooleanColor = theme.getColor(exports.SYMBOL_ICON_BOOLEAN_FOREGROUND);
        if (symbolIconBooleanColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolBoolean.cssSelector} { color: ${symbolIconBooleanColor}; }`);
        }
        const symbolIconClassColor = theme.getColor(exports.SYMBOL_ICON_CLASS_FOREGROUND);
        if (symbolIconClassColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolClass.cssSelector} { color: ${symbolIconClassColor}; }`);
        }
        const symbolIconMethodColor = theme.getColor(exports.SYMBOL_ICON_METHOD_FOREGROUND);
        if (symbolIconMethodColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolMethod.cssSelector} { color: ${symbolIconMethodColor}; }`);
        }
        const symbolIconColorColor = theme.getColor(exports.SYMBOL_ICON_COLOR_FOREGROUND);
        if (symbolIconColorColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolColor.cssSelector} { color: ${symbolIconColorColor}; }`);
        }
        const symbolIconConstantColor = theme.getColor(exports.SYMBOL_ICON_CONSTANT_FOREGROUND);
        if (symbolIconConstantColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolConstant.cssSelector} { color: ${symbolIconConstantColor}; }`);
        }
        const symbolIconConstructorColor = theme.getColor(exports.SYMBOL_ICON_CONSTRUCTOR_FOREGROUND);
        if (symbolIconConstructorColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolConstructor.cssSelector} { color: ${symbolIconConstructorColor}; }`);
        }
        const symbolIconEnumeratorColor = theme.getColor(exports.SYMBOL_ICON_ENUMERATOR_FOREGROUND);
        if (symbolIconEnumeratorColor) {
            collector.addRule(`
			.monaco-workbench ${codicons_1.Codicon.symbolValue.cssSelector},.monaco-workbench ${codicons_1.Codicon.symbolEnum.cssSelector} { color: ${symbolIconEnumeratorColor}; }`);
        }
        const symbolIconEnumeratorMemberColor = theme.getColor(exports.SYMBOL_ICON_ENUMERATOR_MEMBER_FOREGROUND);
        if (symbolIconEnumeratorMemberColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolEnumMember.cssSelector} { color: ${symbolIconEnumeratorMemberColor}; }`);
        }
        const symbolIconEventColor = theme.getColor(exports.SYMBOL_ICON_EVENT_FOREGROUND);
        if (symbolIconEventColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolEvent.cssSelector} { color: ${symbolIconEventColor}; }`);
        }
        const symbolIconFieldColor = theme.getColor(exports.SYMBOL_ICON_FIELD_FOREGROUND);
        if (symbolIconFieldColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolField.cssSelector} { color: ${symbolIconFieldColor}; }`);
        }
        const symbolIconFileColor = theme.getColor(exports.SYMBOL_ICON_FILE_FOREGROUND);
        if (symbolIconFileColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolFile.cssSelector} { color: ${symbolIconFileColor}; }`);
        }
        const symbolIconFolderColor = theme.getColor(exports.SYMBOL_ICON_FOLDER_FOREGROUND);
        if (symbolIconFolderColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolFolder.cssSelector} { color: ${symbolIconFolderColor}; }`);
        }
        const symbolIconFunctionColor = theme.getColor(exports.SYMBOL_ICON_FUNCTION_FOREGROUND);
        if (symbolIconFunctionColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolFunction.cssSelector} { color: ${symbolIconFunctionColor}; }`);
        }
        const symbolIconInterfaceColor = theme.getColor(exports.SYMBOL_ICON_INTERFACE_FOREGROUND);
        if (symbolIconInterfaceColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolInterface.cssSelector} { color: ${symbolIconInterfaceColor}; }`);
        }
        const symbolIconKeyColor = theme.getColor(exports.SYMBOL_ICON_KEY_FOREGROUND);
        if (symbolIconKeyColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolKey.cssSelector} { color: ${symbolIconKeyColor}; }`);
        }
        const symbolIconKeywordColor = theme.getColor(exports.SYMBOL_ICON_KEYWORD_FOREGROUND);
        if (symbolIconKeywordColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolKeyword.cssSelector} { color: ${symbolIconKeywordColor}; }`);
        }
        const symbolIconModuleColor = theme.getColor(exports.SYMBOL_ICON_MODULE_FOREGROUND);
        if (symbolIconModuleColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolModule.cssSelector} { color: ${symbolIconModuleColor}; }`);
        }
        const outlineNamespaceColor = theme.getColor(exports.SYMBOL_ICON_NAMESPACE_FOREGROUND);
        if (outlineNamespaceColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolNamespace.cssSelector} { color: ${outlineNamespaceColor}; }`);
        }
        const symbolIconNullColor = theme.getColor(exports.SYMBOL_ICON_NULL_FOREGROUND);
        if (symbolIconNullColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolNull.cssSelector} { color: ${symbolIconNullColor}; }`);
        }
        const symbolIconNumberColor = theme.getColor(exports.SYMBOL_ICON_NUMBER_FOREGROUND);
        if (symbolIconNumberColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolNumber.cssSelector} { color: ${symbolIconNumberColor}; }`);
        }
        const symbolIconObjectColor = theme.getColor(exports.SYMBOL_ICON_OBJECT_FOREGROUND);
        if (symbolIconObjectColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolObject.cssSelector} { color: ${symbolIconObjectColor}; }`);
        }
        const symbolIconOperatorColor = theme.getColor(exports.SYMBOL_ICON_OPERATOR_FOREGROUND);
        if (symbolIconOperatorColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolOperator.cssSelector} { color: ${symbolIconOperatorColor}; }`);
        }
        const symbolIconPackageColor = theme.getColor(exports.SYMBOL_ICON_PACKAGE_FOREGROUND);
        if (symbolIconPackageColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolPackage.cssSelector} { color: ${symbolIconPackageColor}; }`);
        }
        const symbolIconPropertyColor = theme.getColor(exports.SYMBOL_ICON_PROPERTY_FOREGROUND);
        if (symbolIconPropertyColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolProperty.cssSelector} { color: ${symbolIconPropertyColor}; }`);
        }
        const symbolIconReferenceColor = theme.getColor(exports.SYMBOL_ICON_REFERENCE_FOREGROUND);
        if (symbolIconReferenceColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolReference.cssSelector} { color: ${symbolIconReferenceColor}; }`);
        }
        const symbolIconSnippetColor = theme.getColor(exports.SYMBOL_ICON_SNIPPET_FOREGROUND);
        if (symbolIconSnippetColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolSnippet.cssSelector} { color: ${symbolIconSnippetColor}; }`);
        }
        const symbolIconStringColor = theme.getColor(exports.SYMBOL_ICON_STRING_FOREGROUND);
        if (symbolIconStringColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolString.cssSelector} { color: ${symbolIconStringColor}; }`);
        }
        const symbolIconStructColor = theme.getColor(exports.SYMBOL_ICON_STRUCT_FOREGROUND);
        if (symbolIconStructColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolStruct.cssSelector} { color: ${symbolIconStructColor}; }`);
        }
        const symbolIconTextColor = theme.getColor(exports.SYMBOL_ICON_TEXT_FOREGROUND);
        if (symbolIconTextColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolText.cssSelector} { color: ${symbolIconTextColor}; }`);
        }
        const symbolIconTypeParameterColor = theme.getColor(exports.SYMBOL_ICON_TYPEPARAMETER_FOREGROUND);
        if (symbolIconTypeParameterColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolTypeParameter.cssSelector} { color: ${symbolIconTypeParameterColor}; }`);
        }
        const symbolIconUnitColor = theme.getColor(exports.SYMBOL_ICON_UNIT_FOREGROUND);
        if (symbolIconUnitColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolUnit.cssSelector} { color: ${symbolIconUnitColor}; }`);
        }
        const symbolIconVariableColor = theme.getColor(exports.SYMBOL_ICON_VARIABLE_FOREGROUND);
        if (symbolIconVariableColor) {
            collector.addRule(`.monaco-workbench ${codicons_1.Codicon.symbolVariable.cssSelector} { color: ${symbolIconVariableColor}; }`);
        }
    });
});
//# __sourceMappingURL=outlineTree.js.map