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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/htmlContent", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/platform/keybinding/common/keybinding", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/editor/common/core/range", "vs/editor/browser/editorExtensions", "vs/editor/contrib/snippet/snippetController2", "vs/workbench/contrib/preferences/common/smartSnippetInserter", "vs/workbench/contrib/preferences/browser/keybindingWidgets", "vs/workbench/browser/parts/editor/editorWidgets", "vs/base/common/json", "vs/base/common/scanCode", "vs/editor/common/editorContextKeys", "vs/workbench/services/keybinding/common/windowsKeyboardMapper", "vs/platform/theme/common/themeService", "vs/editor/common/view/editorColorRegistry", "vs/editor/common/model", "vs/base/common/keybindingParser", "vs/base/common/arrays", "vs/base/common/types", "vs/platform/environment/common/environment", "vs/base/common/resources"], function (require, exports, nls, async_1, htmlContent_1, keyCodes_1, lifecycle_1, keybinding_1, instantiation_1, contextkey_1, range_1, editorExtensions_1, snippetController2_1, smartSnippetInserter_1, keybindingWidgets_1, editorWidgets_1, json_1, scanCode_1, editorContextKeys_1, windowsKeyboardMapper_1, themeService_1, editorColorRegistry_1, model_1, keybindingParser_1, arrays_1, types_1, environment_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingEditorDecorationsRenderer = exports.KeybindingWidgetRenderer = exports.DefineKeybindingController = void 0;
    const NLS_LAUNCH_MESSAGE = nls.localize('defineKeybinding.start', "Define Keybinding");
    const NLS_KB_LAYOUT_ERROR_MESSAGE = nls.localize('defineKeybinding.kbLayoutErrorMessage', "You won't be able to produce this key combination under your current keyboard layout.");
    let DefineKeybindingController = class DefineKeybindingController extends lifecycle_1.Disposable {
        constructor(_editor, _instantiationService, _environmentService) {
            super();
            this._editor = _editor;
            this._instantiationService = _instantiationService;
            this._environmentService = _environmentService;
            this._register(this._editor.onDidChangeModel(e => this._update()));
            this._update();
        }
        static get(editor) {
            return editor.getContribution(DefineKeybindingController.ID);
        }
        get keybindingWidgetRenderer() {
            return this._keybindingWidgetRenderer;
        }
        dispose() {
            this._disposeKeybindingWidgetRenderer();
            this._disposeKeybindingDecorationRenderer();
            super.dispose();
        }
        _update() {
            if (!isInterestingEditorModel(this._editor, this._environmentService)) {
                this._disposeKeybindingWidgetRenderer();
                this._disposeKeybindingDecorationRenderer();
                return;
            }
            // Decorations are shown for the default keybindings.json **and** for the user keybindings.json
            this._createKeybindingDecorationRenderer();
            // The button to define keybindings is shown only for the user keybindings.json
            if (!this._editor.getOption(72 /* readOnly */)) {
                this._createKeybindingWidgetRenderer();
            }
            else {
                this._disposeKeybindingWidgetRenderer();
            }
        }
        _createKeybindingWidgetRenderer() {
            if (!this._keybindingWidgetRenderer) {
                this._keybindingWidgetRenderer = this._instantiationService.createInstance(KeybindingWidgetRenderer, this._editor);
            }
        }
        _disposeKeybindingWidgetRenderer() {
            if (this._keybindingWidgetRenderer) {
                this._keybindingWidgetRenderer.dispose();
                this._keybindingWidgetRenderer = undefined;
            }
        }
        _createKeybindingDecorationRenderer() {
            if (!this._keybindingDecorationRenderer) {
                this._keybindingDecorationRenderer = this._instantiationService.createInstance(KeybindingEditorDecorationsRenderer, this._editor);
            }
        }
        _disposeKeybindingDecorationRenderer() {
            if (this._keybindingDecorationRenderer) {
                this._keybindingDecorationRenderer.dispose();
                this._keybindingDecorationRenderer = undefined;
            }
        }
    };
    DefineKeybindingController.ID = 'editor.contrib.defineKeybinding';
    DefineKeybindingController = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, environment_1.IEnvironmentService)
    ], DefineKeybindingController);
    exports.DefineKeybindingController = DefineKeybindingController;
    let KeybindingWidgetRenderer = class KeybindingWidgetRenderer extends lifecycle_1.Disposable {
        constructor(_editor, _instantiationService) {
            super();
            this._editor = _editor;
            this._instantiationService = _instantiationService;
            this._launchWidget = this._register(this._instantiationService.createInstance(editorWidgets_1.FloatingClickWidget, this._editor, NLS_LAUNCH_MESSAGE, DefineKeybindingCommand.ID));
            this._register(this._launchWidget.onClick(() => this.showDefineKeybindingWidget()));
            this._defineWidget = this._register(this._instantiationService.createInstance(keybindingWidgets_1.DefineKeybindingOverlayWidget, this._editor));
            this._launchWidget.render();
        }
        showDefineKeybindingWidget() {
            this._defineWidget.start().then(keybinding => this._onAccepted(keybinding));
        }
        _onAccepted(keybinding) {
            this._editor.focus();
            if (keybinding && this._editor.hasModel()) {
                const regexp = new RegExp(/\\/g);
                const backslash = regexp.test(keybinding);
                if (backslash) {
                    keybinding = keybinding.slice(0, -1) + '\\\\';
                }
                let snippetText = [
                    '{',
                    '\t"key": ' + JSON.stringify(keybinding) + ',',
                    '\t"command": "${1:commandId}",',
                    '\t"when": "${2:editorTextFocus}"',
                    '}$0'
                ].join('\n');
                const smartInsertInfo = smartSnippetInserter_1.SmartSnippetInserter.insertSnippet(this._editor.getModel(), this._editor.getPosition());
                snippetText = smartInsertInfo.prepend + snippetText + smartInsertInfo.append;
                this._editor.setPosition(smartInsertInfo.position);
                snippetController2_1.SnippetController2.get(this._editor).insert(snippetText, { overwriteBefore: 0, overwriteAfter: 0 });
            }
        }
    };
    KeybindingWidgetRenderer = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], KeybindingWidgetRenderer);
    exports.KeybindingWidgetRenderer = KeybindingWidgetRenderer;
    let KeybindingEditorDecorationsRenderer = class KeybindingEditorDecorationsRenderer extends lifecycle_1.Disposable {
        constructor(_editor, _keybindingService) {
            super();
            this._editor = _editor;
            this._keybindingService = _keybindingService;
            this._dec = [];
            this._updateDecorations = this._register(new async_1.RunOnceScheduler(() => this._updateDecorationsNow(), 500));
            const model = types_1.assertIsDefined(this._editor.getModel());
            this._register(model.onDidChangeContent(() => this._updateDecorations.schedule()));
            this._register(this._keybindingService.onDidUpdateKeybindings((e) => this._updateDecorations.schedule()));
            this._register({
                dispose: () => {
                    this._dec = this._editor.deltaDecorations(this._dec, []);
                    this._updateDecorations.cancel();
                }
            });
            this._updateDecorations.schedule();
        }
        _updateDecorationsNow() {
            const model = types_1.assertIsDefined(this._editor.getModel());
            const newDecorations = [];
            const root = json_1.parseTree(model.getValue());
            if (root && Array.isArray(root.children)) {
                for (let i = 0, len = root.children.length; i < len; i++) {
                    const entry = root.children[i];
                    const dec = this._getDecorationForEntry(model, entry);
                    if (dec !== null) {
                        newDecorations.push(dec);
                    }
                }
            }
            this._dec = this._editor.deltaDecorations(this._dec, newDecorations);
        }
        _getDecorationForEntry(model, entry) {
            if (!Array.isArray(entry.children)) {
                return null;
            }
            for (let i = 0, len = entry.children.length; i < len; i++) {
                const prop = entry.children[i];
                if (prop.type !== 'property') {
                    continue;
                }
                if (!Array.isArray(prop.children) || prop.children.length !== 2) {
                    continue;
                }
                const key = prop.children[0];
                if (key.value !== 'key') {
                    continue;
                }
                const value = prop.children[1];
                if (value.type !== 'string') {
                    continue;
                }
                const resolvedKeybindings = this._keybindingService.resolveUserBinding(value.value);
                if (resolvedKeybindings.length === 0) {
                    return this._createDecoration(true, null, null, model, value);
                }
                const resolvedKeybinding = resolvedKeybindings[0];
                let usLabel = null;
                if (resolvedKeybinding instanceof windowsKeyboardMapper_1.WindowsNativeResolvedKeybinding) {
                    usLabel = resolvedKeybinding.getUSLabel();
                }
                if (!resolvedKeybinding.isWYSIWYG()) {
                    const uiLabel = resolvedKeybinding.getLabel();
                    if (typeof uiLabel === 'string' && value.value.toLowerCase() === uiLabel.toLowerCase()) {
                        // coincidentally, this is actually WYSIWYG
                        return null;
                    }
                    return this._createDecoration(false, resolvedKeybinding.getLabel(), usLabel, model, value);
                }
                if (/abnt_|oem_/.test(value.value)) {
                    return this._createDecoration(false, resolvedKeybinding.getLabel(), usLabel, model, value);
                }
                const expectedUserSettingsLabel = resolvedKeybinding.getUserSettingsLabel();
                if (typeof expectedUserSettingsLabel === 'string' && !KeybindingEditorDecorationsRenderer._userSettingsFuzzyEquals(value.value, expectedUserSettingsLabel)) {
                    return this._createDecoration(false, resolvedKeybinding.getLabel(), usLabel, model, value);
                }
                return null;
            }
            return null;
        }
        static _userSettingsFuzzyEquals(a, b) {
            a = a.trim().toLowerCase();
            b = b.trim().toLowerCase();
            if (a === b) {
                return true;
            }
            const aParts = keybindingParser_1.KeybindingParser.parseUserBinding(a);
            const bParts = keybindingParser_1.KeybindingParser.parseUserBinding(b);
            return arrays_1.equals(aParts, bParts, (a, b) => this._userBindingEquals(a, b));
        }
        static _userBindingEquals(a, b) {
            if (a === null && b === null) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            if (a instanceof keyCodes_1.SimpleKeybinding && b instanceof keyCodes_1.SimpleKeybinding) {
                return a.equals(b);
            }
            if (a instanceof scanCode_1.ScanCodeBinding && b instanceof scanCode_1.ScanCodeBinding) {
                return a.equals(b);
            }
            return false;
        }
        _createDecoration(isError, uiLabel, usLabel, model, keyNode) {
            let msg;
            let className;
            let overviewRulerColor;
            if (isError) {
                // this is the error case
                msg = new htmlContent_1.MarkdownString().appendText(NLS_KB_LAYOUT_ERROR_MESSAGE);
                className = 'keybindingError';
                overviewRulerColor = themeService_1.themeColorFromId(editorColorRegistry_1.overviewRulerError);
            }
            else {
                // this is the info case
                if (usLabel && uiLabel !== usLabel) {
                    msg = new htmlContent_1.MarkdownString(nls.localize({
                        key: 'defineKeybinding.kbLayoutLocalAndUSMessage',
                        comment: [
                            'Please translate maintaining the stars (*) around the placeholders such that they will be rendered in bold.',
                            'The placeholders will contain a keyboard combination e.g. Ctrl+Shift+/'
                        ]
                    }, "**{0}** for your current keyboard layout (**{1}** for US standard).", uiLabel, usLabel));
                }
                else {
                    msg = new htmlContent_1.MarkdownString(nls.localize({
                        key: 'defineKeybinding.kbLayoutLocalMessage',
                        comment: [
                            'Please translate maintaining the stars (*) around the placeholder such that it will be rendered in bold.',
                            'The placeholder will contain a keyboard combination e.g. Ctrl+Shift+/'
                        ]
                    }, "**{0}** for your current keyboard layout.", uiLabel));
                }
                className = 'keybindingInfo';
                overviewRulerColor = themeService_1.themeColorFromId(editorColorRegistry_1.overviewRulerInfo);
            }
            const startPosition = model.getPositionAt(keyNode.offset);
            const endPosition = model.getPositionAt(keyNode.offset + keyNode.length);
            const range = new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
            // icon + highlight + message decoration
            return {
                range: range,
                options: {
                    stickiness: 1 /* NeverGrowsWhenTypingAtEdges */,
                    className: className,
                    hoverMessage: msg,
                    overviewRuler: {
                        color: overviewRulerColor,
                        position: model_1.OverviewRulerLane.Right
                    }
                }
            };
        }
    };
    KeybindingEditorDecorationsRenderer = __decorate([
        __param(1, keybinding_1.IKeybindingService)
    ], KeybindingEditorDecorationsRenderer);
    exports.KeybindingEditorDecorationsRenderer = KeybindingEditorDecorationsRenderer;
    class DefineKeybindingCommand extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: DefineKeybindingCommand.ID,
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.writable, editorContextKeys_1.EditorContextKeys.languageId.isEqualTo('jsonc')),
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: keyCodes_1.KeyChord(2048 /* CtrlCmd */ | 41 /* KEY_K */, 2048 /* CtrlCmd */ | 41 /* KEY_K */),
                    weight: 100 /* EditorContrib */
                }
            });
        }
        runEditorCommand(accessor, editor) {
            if (!isInterestingEditorModel(editor, accessor.get(environment_1.IEnvironmentService)) || editor.getOption(72 /* readOnly */)) {
                return;
            }
            const controller = DefineKeybindingController.get(editor);
            if (controller && controller.keybindingWidgetRenderer) {
                controller.keybindingWidgetRenderer.showDefineKeybindingWidget();
            }
        }
    }
    DefineKeybindingCommand.ID = 'editor.action.defineKeybinding';
    function isInterestingEditorModel(editor, environmentService) {
        const model = editor.getModel();
        if (!model) {
            return false;
        }
        return resources_1.isEqual(model.uri, environmentService.keybindingsResource);
    }
    editorExtensions_1.registerEditorContribution(DefineKeybindingController.ID, DefineKeybindingController);
    editorExtensions_1.registerEditorCommand(new DefineKeybindingCommand());
});
//# __sourceMappingURL=keybindingsEditorContribution.js.map