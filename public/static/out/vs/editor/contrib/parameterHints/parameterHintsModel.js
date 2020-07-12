/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/characterClassifier", "vs/editor/common/modes", "vs/editor/contrib/parameterHints/provideSignatureHelp"], function (require, exports, async_1, errors_1, event_1, lifecycle_1, characterClassifier_1, modes, provideSignatureHelp_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ParameterHintsModel = void 0;
    var ParameterHintState;
    (function (ParameterHintState) {
        let Type;
        (function (Type) {
            Type[Type["Default"] = 0] = "Default";
            Type[Type["Active"] = 1] = "Active";
            Type[Type["Pending"] = 2] = "Pending";
        })(Type = ParameterHintState.Type || (ParameterHintState.Type = {}));
        ParameterHintState.Default = { type: 0 /* Default */ };
        class Pending {
            constructor(request) {
                this.request = request;
                this.type = 2 /* Pending */;
            }
        }
        ParameterHintState.Pending = Pending;
        class Active {
            constructor(hints) {
                this.hints = hints;
                this.type = 1 /* Active */;
            }
        }
        ParameterHintState.Active = Active;
    })(ParameterHintState || (ParameterHintState = {}));
    class ParameterHintsModel extends lifecycle_1.Disposable {
        constructor(editor, delay = ParameterHintsModel.DEFAULT_DELAY) {
            super();
            this._onChangedHints = this._register(new event_1.Emitter());
            this.onChangedHints = this._onChangedHints.event;
            this.triggerOnType = false;
            this._state = ParameterHintState.Default;
            this._pendingTriggers = [];
            this._lastSignatureHelpResult = this._register(new lifecycle_1.MutableDisposable());
            this.triggerChars = new characterClassifier_1.CharacterSet();
            this.retriggerChars = new characterClassifier_1.CharacterSet();
            this.triggerId = 0;
            this.editor = editor;
            this.throttledDelayer = new async_1.Delayer(delay);
            this._register(this.editor.onDidChangeConfiguration(() => this.onEditorConfigurationChange()));
            this._register(this.editor.onDidChangeModel(e => this.onModelChanged()));
            this._register(this.editor.onDidChangeModelLanguage(_ => this.onModelChanged()));
            this._register(this.editor.onDidChangeCursorSelection(e => this.onCursorChange(e)));
            this._register(this.editor.onDidChangeModelContent(e => this.onModelContentChange()));
            this._register(modes.SignatureHelpProviderRegistry.onDidChange(this.onModelChanged, this));
            this._register(this.editor.onDidType(text => this.onDidType(text)));
            this.onEditorConfigurationChange();
            this.onModelChanged();
        }
        get state() { return this._state; }
        set state(value) {
            if (this._state.type === 2 /* Pending */) {
                this._state.request.cancel();
            }
            this._state = value;
        }
        cancel(silent = false) {
            this.state = ParameterHintState.Default;
            this.throttledDelayer.cancel();
            if (!silent) {
                this._onChangedHints.fire(undefined);
            }
        }
        trigger(context, delay) {
            const model = this.editor.getModel();
            if (!model || !modes.SignatureHelpProviderRegistry.has(model)) {
                return;
            }
            const triggerId = ++this.triggerId;
            this._pendingTriggers.push(context);
            this.throttledDelayer.trigger(() => {
                return this.doTrigger(triggerId);
            }, delay)
                .catch(errors_1.onUnexpectedError);
        }
        next() {
            if (this.state.type !== 1 /* Active */) {
                return;
            }
            const length = this.state.hints.signatures.length;
            const activeSignature = this.state.hints.activeSignature;
            const last = (activeSignature % length) === (length - 1);
            const cycle = this.editor.getOption(67 /* parameterHints */).cycle;
            // If there is only one signature, or we're on last signature of list
            if ((length < 2 || last) && !cycle) {
                this.cancel();
                return;
            }
            this.updateActiveSignature(last && cycle ? 0 : activeSignature + 1);
        }
        previous() {
            if (this.state.type !== 1 /* Active */) {
                return;
            }
            const length = this.state.hints.signatures.length;
            const activeSignature = this.state.hints.activeSignature;
            const first = activeSignature === 0;
            const cycle = this.editor.getOption(67 /* parameterHints */).cycle;
            // If there is only one signature, or we're on first signature of list
            if ((length < 2 || first) && !cycle) {
                this.cancel();
                return;
            }
            this.updateActiveSignature(first && cycle ? length - 1 : activeSignature - 1);
        }
        updateActiveSignature(activeSignature) {
            if (this.state.type !== 1 /* Active */) {
                return;
            }
            this.state = new ParameterHintState.Active(Object.assign(Object.assign({}, this.state.hints), { activeSignature }));
            this._onChangedHints.fire(this.state.hints);
        }
        async doTrigger(triggerId) {
            const isRetrigger = this.state.type === 1 /* Active */ || this.state.type === 2 /* Pending */;
            const activeSignatureHelp = this.state.type === 1 /* Active */ ? this.state.hints : undefined;
            this.cancel(true);
            if (this._pendingTriggers.length === 0) {
                return false;
            }
            const context = this._pendingTriggers.reduce(mergeTriggerContexts);
            this._pendingTriggers = [];
            const triggerContext = {
                triggerKind: context.triggerKind,
                triggerCharacter: context.triggerCharacter,
                isRetrigger: isRetrigger,
                activeSignatureHelp: activeSignatureHelp
            };
            if (!this.editor.hasModel()) {
                return false;
            }
            const model = this.editor.getModel();
            const position = this.editor.getPosition();
            this.state = new ParameterHintState.Pending(async_1.createCancelablePromise(token => provideSignatureHelp_1.provideSignatureHelp(model, position, triggerContext, token)));
            try {
                const result = await this.state.request;
                // Check that we are still resolving the correct signature help
                if (triggerId !== this.triggerId) {
                    result === null || result === void 0 ? void 0 : result.dispose();
                    return false;
                }
                if (!result || !result.value.signatures || result.value.signatures.length === 0) {
                    result === null || result === void 0 ? void 0 : result.dispose();
                    this._lastSignatureHelpResult.clear();
                    this.cancel();
                    return false;
                }
                else {
                    this.state = new ParameterHintState.Active(result.value);
                    this._lastSignatureHelpResult.value = result;
                    this._onChangedHints.fire(this.state.hints);
                    return true;
                }
            }
            catch (error) {
                if (triggerId === this.triggerId) {
                    this.state = ParameterHintState.Default;
                }
                errors_1.onUnexpectedError(error);
                return false;
            }
        }
        get isTriggered() {
            return this.state.type === 1 /* Active */
                || this.state.type === 2 /* Pending */
                || this.throttledDelayer.isTriggered();
        }
        onModelChanged() {
            this.cancel();
            // Update trigger characters
            this.triggerChars = new characterClassifier_1.CharacterSet();
            this.retriggerChars = new characterClassifier_1.CharacterSet();
            const model = this.editor.getModel();
            if (!model) {
                return;
            }
            for (const support of modes.SignatureHelpProviderRegistry.ordered(model)) {
                for (const ch of support.signatureHelpTriggerCharacters || []) {
                    this.triggerChars.add(ch.charCodeAt(0));
                    // All trigger characters are also considered retrigger characters
                    this.retriggerChars.add(ch.charCodeAt(0));
                }
                for (const ch of support.signatureHelpRetriggerCharacters || []) {
                    this.retriggerChars.add(ch.charCodeAt(0));
                }
            }
        }
        onDidType(text) {
            if (!this.triggerOnType) {
                return;
            }
            const lastCharIndex = text.length - 1;
            const triggerCharCode = text.charCodeAt(lastCharIndex);
            if (this.triggerChars.has(triggerCharCode) || this.isTriggered && this.retriggerChars.has(triggerCharCode)) {
                this.trigger({
                    triggerKind: modes.SignatureHelpTriggerKind.TriggerCharacter,
                    triggerCharacter: text.charAt(lastCharIndex),
                });
            }
        }
        onCursorChange(e) {
            if (e.source === 'mouse') {
                this.cancel();
            }
            else if (this.isTriggered) {
                this.trigger({ triggerKind: modes.SignatureHelpTriggerKind.ContentChange });
            }
        }
        onModelContentChange() {
            if (this.isTriggered) {
                this.trigger({ triggerKind: modes.SignatureHelpTriggerKind.ContentChange });
            }
        }
        onEditorConfigurationChange() {
            this.triggerOnType = this.editor.getOption(67 /* parameterHints */).enabled;
            if (!this.triggerOnType) {
                this.cancel();
            }
        }
        dispose() {
            this.cancel(true);
            super.dispose();
        }
    }
    exports.ParameterHintsModel = ParameterHintsModel;
    ParameterHintsModel.DEFAULT_DELAY = 120; // ms
    function mergeTriggerContexts(previous, current) {
        switch (current.triggerKind) {
            case modes.SignatureHelpTriggerKind.Invoke:
                // Invoke overrides previous triggers.
                return current;
            case modes.SignatureHelpTriggerKind.ContentChange:
                // Ignore content changes triggers
                return previous;
            case modes.SignatureHelpTriggerKind.TriggerCharacter:
            default:
                return current;
        }
    }
});
//# __sourceMappingURL=parameterHintsModel.js.map