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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/core/position", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/keybinding/common/keybinding", "vs/css!./renameInputField"], function (require, exports, lifecycle_1, position_1, nls_1, contextkey_1, colorRegistry_1, themeService_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RenameInputField = exports.CONTEXT_RENAME_INPUT_VISIBLE = void 0;
    exports.CONTEXT_RENAME_INPUT_VISIBLE = new contextkey_1.RawContextKey('renameInputVisible', false);
    let RenameInputField = class RenameInputField {
        constructor(_editor, _acceptKeybindings, _themeService, _keybindingService, contextKeyService) {
            this._editor = _editor;
            this._acceptKeybindings = _acceptKeybindings;
            this._themeService = _themeService;
            this._keybindingService = _keybindingService;
            this._disposables = new lifecycle_1.DisposableStore();
            this.allowEditorOverflow = true;
            this._visibleContextKey = exports.CONTEXT_RENAME_INPUT_VISIBLE.bindTo(contextKeyService);
            this._editor.addContentWidget(this);
            this._disposables.add(this._editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(36 /* fontInfo */)) {
                    this._updateFont();
                }
            }));
            this._disposables.add(_themeService.onDidColorThemeChange(this._updateStyles, this));
        }
        dispose() {
            this._disposables.dispose();
            this._editor.removeContentWidget(this);
        }
        getId() {
            return '__renameInputWidget';
        }
        getDomNode() {
            if (!this._domNode) {
                this._domNode = document.createElement('div');
                this._domNode.className = 'monaco-editor rename-box';
                this._input = document.createElement('input');
                this._input.className = 'rename-input';
                this._input.type = 'text';
                this._input.setAttribute('aria-label', nls_1.localize('renameAriaLabel', "Rename input. Type new name and press Enter to commit."));
                this._domNode.appendChild(this._input);
                this._label = document.createElement('div');
                this._label.className = 'rename-label';
                this._domNode.appendChild(this._label);
                const updateLabel = () => {
                    var _a, _b;
                    const [accept, preview] = this._acceptKeybindings;
                    this._keybindingService.lookupKeybinding(accept);
                    this._label.innerText = nls_1.localize({ key: 'label', comment: ['placeholders are keybindings, e.g "F2 to Rename, Shift+F2 to Preview"'] }, "{0} to Rename, {1} to Preview", (_a = this._keybindingService.lookupKeybinding(accept)) === null || _a === void 0 ? void 0 : _a.getLabel(), (_b = this._keybindingService.lookupKeybinding(preview)) === null || _b === void 0 ? void 0 : _b.getLabel());
                };
                updateLabel();
                this._disposables.add(this._keybindingService.onDidUpdateKeybindings(updateLabel));
                this._updateFont();
                this._updateStyles(this._themeService.getColorTheme());
            }
            return this._domNode;
        }
        _updateStyles(theme) {
            var _a, _b, _c, _d;
            if (!this._input || !this._domNode) {
                return;
            }
            const widgetShadowColor = theme.getColor(colorRegistry_1.widgetShadow);
            this._domNode.style.backgroundColor = String((_a = theme.getColor(colorRegistry_1.editorWidgetBackground)) !== null && _a !== void 0 ? _a : '');
            this._domNode.style.boxShadow = widgetShadowColor ? ` 0 2px 8px ${widgetShadowColor}` : '';
            this._domNode.style.color = String((_b = theme.getColor(colorRegistry_1.inputForeground)) !== null && _b !== void 0 ? _b : '');
            this._input.style.backgroundColor = String((_c = theme.getColor(colorRegistry_1.inputBackground)) !== null && _c !== void 0 ? _c : '');
            // this._input.style.color = String(theme.getColor(inputForeground) ?? '');
            const border = theme.getColor(colorRegistry_1.inputBorder);
            this._input.style.borderWidth = border ? '1px' : '0px';
            this._input.style.borderStyle = border ? 'solid' : 'none';
            this._input.style.borderColor = (_d = border === null || border === void 0 ? void 0 : border.toString()) !== null && _d !== void 0 ? _d : 'none';
        }
        _updateFont() {
            if (!this._input || !this._label) {
                return;
            }
            const fontInfo = this._editor.getOption(36 /* fontInfo */);
            this._input.style.fontFamily = fontInfo.fontFamily;
            this._input.style.fontWeight = fontInfo.fontWeight;
            this._input.style.fontSize = `${fontInfo.fontSize}px`;
            this._label.style.fontSize = `${fontInfo.fontSize * 0.8}px`;
        }
        getPosition() {
            if (!this._visible) {
                return null;
            }
            return {
                position: this._position,
                preference: [2 /* BELOW */, 1 /* ABOVE */]
            };
        }
        acceptInput(wantsPreview) {
            if (this._currentAcceptInput) {
                this._currentAcceptInput(wantsPreview);
            }
        }
        cancelInput(focusEditor) {
            if (this._currentCancelInput) {
                this._currentCancelInput(focusEditor);
            }
        }
        getInput(where, value, selectionStart, selectionEnd, supportPreview, token) {
            this._domNode.classList.toggle('preview', supportPreview);
            this._position = new position_1.Position(where.startLineNumber, where.startColumn);
            this._input.value = value;
            this._input.setAttribute('selectionStart', selectionStart.toString());
            this._input.setAttribute('selectionEnd', selectionEnd.toString());
            this._input.size = Math.max((where.endColumn - where.startColumn) * 1.1, 20);
            const disposeOnDone = new lifecycle_1.DisposableStore();
            return new Promise(resolve => {
                this._currentCancelInput = (focusEditor) => {
                    this._currentAcceptInput = undefined;
                    this._currentCancelInput = undefined;
                    resolve(focusEditor);
                    return true;
                };
                this._currentAcceptInput = (wantsPreview) => {
                    if (this._input.value.trim().length === 0 || this._input.value === value) {
                        // empty or whitespace only or not changed
                        this.cancelInput(true);
                        return;
                    }
                    this._currentAcceptInput = undefined;
                    this._currentCancelInput = undefined;
                    resolve({
                        newName: this._input.value,
                        wantsPreview: supportPreview && wantsPreview
                    });
                };
                token.onCancellationRequested(() => this.cancelInput(true));
                disposeOnDone.add(this._editor.onDidBlurEditorWidget(() => this.cancelInput(false)));
                this._show();
            }).finally(() => {
                disposeOnDone.dispose();
                this._hide();
            });
        }
        _show() {
            this._editor.revealLineInCenterIfOutsideViewport(this._position.lineNumber, 0 /* Smooth */);
            this._visible = true;
            this._visibleContextKey.set(true);
            this._editor.layoutContentWidget(this);
            setTimeout(() => {
                this._input.focus();
                this._input.setSelectionRange(parseInt(this._input.getAttribute('selectionStart')), parseInt(this._input.getAttribute('selectionEnd')));
            }, 100);
        }
        _hide() {
            this._visible = false;
            this._visibleContextKey.reset();
            this._editor.layoutContentWidget(this);
        }
    };
    RenameInputField = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, contextkey_1.IContextKeyService)
    ], RenameInputField);
    exports.RenameInputField = RenameInputField;
});
//# __sourceMappingURL=renameInputField.js.map