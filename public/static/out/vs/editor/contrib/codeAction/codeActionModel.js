/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/core/range", "vs/editor/common/modes", "vs/platform/contextkey/common/contextkey", "vs/platform/progress/common/progress", "./codeAction", "vs/base/common/resources"], function (require, exports, async_1, event_1, lifecycle_1, range_1, modes_1, contextkey_1, progress_1, codeAction_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeActionModel = exports.CodeActionsState = exports.SUPPORTED_CODE_ACTIONS = void 0;
    exports.SUPPORTED_CODE_ACTIONS = new contextkey_1.RawContextKey('supportedCodeAction', '');
    class CodeActionOracle extends lifecycle_1.Disposable {
        constructor(_editor, _markerService, _signalChange, _delay = 250) {
            super();
            this._editor = _editor;
            this._markerService = _markerService;
            this._signalChange = _signalChange;
            this._delay = _delay;
            this._autoTriggerTimer = this._register(new async_1.TimeoutTimer());
            this._register(this._markerService.onMarkerChanged(e => this._onMarkerChanges(e)));
            this._register(this._editor.onDidChangeCursorPosition(() => this._onCursorChange()));
        }
        trigger(trigger) {
            const selection = this._getRangeOfSelectionUnlessWhitespaceEnclosed(trigger);
            return this._createEventAndSignalChange(trigger, selection);
        }
        _onMarkerChanges(resources) {
            const model = this._editor.getModel();
            if (!model) {
                return;
            }
            if (resources.some(resource => resources_1.isEqual(resource, model.uri))) {
                this._autoTriggerTimer.cancelAndSet(() => {
                    this.trigger({ type: 1 /* Auto */ });
                }, this._delay);
            }
        }
        _onCursorChange() {
            this._autoTriggerTimer.cancelAndSet(() => {
                this.trigger({ type: 1 /* Auto */ });
            }, this._delay);
        }
        _getRangeOfMarker(selection) {
            const model = this._editor.getModel();
            if (!model) {
                return undefined;
            }
            for (const marker of this._markerService.read({ resource: model.uri })) {
                const markerRange = model.validateRange(marker);
                if (range_1.Range.intersectRanges(markerRange, selection)) {
                    return range_1.Range.lift(markerRange);
                }
            }
            return undefined;
        }
        _getRangeOfSelectionUnlessWhitespaceEnclosed(trigger) {
            if (!this._editor.hasModel()) {
                return undefined;
            }
            const model = this._editor.getModel();
            const selection = this._editor.getSelection();
            if (selection.isEmpty() && trigger.type === 1 /* Auto */) {
                const { lineNumber, column } = selection.getPosition();
                const line = model.getLineContent(lineNumber);
                if (line.length === 0) {
                    // empty line
                    return undefined;
                }
                else if (column === 1) {
                    // look only right
                    if (/\s/.test(line[0])) {
                        return undefined;
                    }
                }
                else if (column === model.getLineMaxColumn(lineNumber)) {
                    // look only left
                    if (/\s/.test(line[line.length - 1])) {
                        return undefined;
                    }
                }
                else {
                    // look left and right
                    if (/\s/.test(line[column - 2]) && /\s/.test(line[column - 1])) {
                        return undefined;
                    }
                }
            }
            return selection;
        }
        _createEventAndSignalChange(trigger, selection) {
            const model = this._editor.getModel();
            if (!selection || !model) {
                // cancel
                this._signalChange(undefined);
                return undefined;
            }
            const markerRange = this._getRangeOfMarker(selection);
            const position = markerRange ? markerRange.getStartPosition() : selection.getStartPosition();
            const e = {
                trigger,
                selection,
                position
            };
            this._signalChange(e);
            return e;
        }
    }
    var CodeActionsState;
    (function (CodeActionsState) {
        let Type;
        (function (Type) {
            Type[Type["Empty"] = 0] = "Empty";
            Type[Type["Triggered"] = 1] = "Triggered";
        })(Type = CodeActionsState.Type || (CodeActionsState.Type = {}));
        CodeActionsState.Empty = { type: 0 /* Empty */ };
        class Triggered {
            constructor(trigger, rangeOrSelection, position, actions) {
                this.trigger = trigger;
                this.rangeOrSelection = rangeOrSelection;
                this.position = position;
                this.actions = actions;
                this.type = 1 /* Triggered */;
            }
        }
        CodeActionsState.Triggered = Triggered;
    })(CodeActionsState = exports.CodeActionsState || (exports.CodeActionsState = {}));
    class CodeActionModel extends lifecycle_1.Disposable {
        constructor(_editor, _markerService, contextKeyService, _progressService) {
            super();
            this._editor = _editor;
            this._markerService = _markerService;
            this._progressService = _progressService;
            this._codeActionOracle = this._register(new lifecycle_1.MutableDisposable());
            this._state = CodeActionsState.Empty;
            this._onDidChangeState = this._register(new event_1.Emitter());
            this.onDidChangeState = this._onDidChangeState.event;
            this._supportedCodeActions = exports.SUPPORTED_CODE_ACTIONS.bindTo(contextKeyService);
            this._register(this._editor.onDidChangeModel(() => this._update()));
            this._register(this._editor.onDidChangeModelLanguage(() => this._update()));
            this._register(modes_1.CodeActionProviderRegistry.onDidChange(() => this._update()));
            this._update();
        }
        dispose() {
            super.dispose();
            this.setState(CodeActionsState.Empty, true);
        }
        _update() {
            this._codeActionOracle.value = undefined;
            this.setState(CodeActionsState.Empty);
            const model = this._editor.getModel();
            if (model
                && modes_1.CodeActionProviderRegistry.has(model)
                && !this._editor.getOption(72 /* readOnly */)) {
                const supportedActions = [];
                for (const provider of modes_1.CodeActionProviderRegistry.all(model)) {
                    if (Array.isArray(provider.providedCodeActionKinds)) {
                        supportedActions.push(...provider.providedCodeActionKinds);
                    }
                }
                this._supportedCodeActions.set(supportedActions.join(' '));
                this._codeActionOracle.value = new CodeActionOracle(this._editor, this._markerService, trigger => {
                    if (!trigger) {
                        this.setState(CodeActionsState.Empty);
                        return;
                    }
                    const actions = async_1.createCancelablePromise(token => codeAction_1.getCodeActions(model, trigger.selection, trigger.trigger, progress_1.Progress.None, token));
                    if (this._progressService && trigger.trigger.type === 2 /* Manual */) {
                        this._progressService.showWhile(actions, 250);
                    }
                    this.setState(new CodeActionsState.Triggered(trigger.trigger, trigger.selection, trigger.position, actions));
                }, undefined);
                this._codeActionOracle.value.trigger({ type: 1 /* Auto */ });
            }
            else {
                this._supportedCodeActions.reset();
            }
        }
        trigger(trigger) {
            if (this._codeActionOracle.value) {
                this._codeActionOracle.value.trigger(trigger);
            }
        }
        setState(newState, skipNotify) {
            if (newState === this._state) {
                return;
            }
            // Cancel old request
            if (this._state.type === 1 /* Triggered */) {
                this._state.actions.cancel();
            }
            this._state = newState;
            if (!skipNotify) {
                this._onDidChangeState.fire(newState);
            }
        }
    }
    exports.CodeActionModel = CodeActionModel;
});
//# __sourceMappingURL=codeActionModel.js.map