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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey", "vs/editor/browser/editorExtensions", "./parameterHintsWidget", "vs/editor/contrib/parameterHints/provideSignatureHelp", "vs/editor/common/modes"], function (require, exports, nls, lifecycle_1, instantiation_1, editorContextKeys_1, contextkey_1, editorExtensions_1, parameterHintsWidget_1, provideSignatureHelp_1, modes) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TriggerParameterHintsAction = void 0;
    let ParameterHintsController = class ParameterHintsController extends lifecycle_1.Disposable {
        constructor(editor, instantiationService) {
            super();
            this.editor = editor;
            this.widget = this._register(instantiationService.createInstance(parameterHintsWidget_1.ParameterHintsWidget, this.editor));
        }
        static get(editor) {
            return editor.getContribution(ParameterHintsController.ID);
        }
        cancel() {
            this.widget.cancel();
        }
        previous() {
            this.widget.previous();
        }
        next() {
            this.widget.next();
        }
        trigger(context) {
            this.widget.trigger(context);
        }
    };
    ParameterHintsController.ID = 'editor.controller.parameterHints';
    ParameterHintsController = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ParameterHintsController);
    class TriggerParameterHintsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.triggerParameterHints',
                label: nls.localize('parameterHints.trigger.label', "Trigger Parameter Hints"),
                alias: 'Trigger Parameter Hints',
                precondition: editorContextKeys_1.EditorContextKeys.hasSignatureHelpProvider,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 10 /* Space */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const controller = ParameterHintsController.get(editor);
            if (controller) {
                controller.trigger({
                    triggerKind: modes.SignatureHelpTriggerKind.Invoke
                });
            }
        }
    }
    exports.TriggerParameterHintsAction = TriggerParameterHintsAction;
    editorExtensions_1.registerEditorContribution(ParameterHintsController.ID, ParameterHintsController);
    editorExtensions_1.registerEditorAction(TriggerParameterHintsAction);
    const weight = 100 /* EditorContrib */ + 75;
    const ParameterHintsCommand = editorExtensions_1.EditorCommand.bindToContribution(ParameterHintsController.get);
    editorExtensions_1.registerEditorCommand(new ParameterHintsCommand({
        id: 'closeParameterHints',
        precondition: provideSignatureHelp_1.Context.Visible,
        handler: x => x.cancel(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 9 /* Escape */,
            secondary: [1024 /* Shift */ | 9 /* Escape */]
        }
    }));
    editorExtensions_1.registerEditorCommand(new ParameterHintsCommand({
        id: 'showPrevParameterHint',
        precondition: contextkey_1.ContextKeyExpr.and(provideSignatureHelp_1.Context.Visible, provideSignatureHelp_1.Context.MultipleSignatures),
        handler: x => x.previous(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 16 /* UpArrow */,
            secondary: [512 /* Alt */ | 16 /* UpArrow */],
            mac: { primary: 16 /* UpArrow */, secondary: [512 /* Alt */ | 16 /* UpArrow */, 256 /* WinCtrl */ | 46 /* KEY_P */] }
        }
    }));
    editorExtensions_1.registerEditorCommand(new ParameterHintsCommand({
        id: 'showNextParameterHint',
        precondition: contextkey_1.ContextKeyExpr.and(provideSignatureHelp_1.Context.Visible, provideSignatureHelp_1.Context.MultipleSignatures),
        handler: x => x.next(),
        kbOpts: {
            weight: weight,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 18 /* DownArrow */,
            secondary: [512 /* Alt */ | 18 /* DownArrow */],
            mac: { primary: 18 /* DownArrow */, secondary: [512 /* Alt */ | 18 /* DownArrow */, 256 /* WinCtrl */ | 44 /* KEY_N */] }
        }
    }));
});
//# __sourceMappingURL=parameterHints.js.map