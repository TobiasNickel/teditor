/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/common/config/editorOptions", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/contrib/snippet/snippetController2", "vs/workbench/api/common/extHost.protocol", "vs/base/common/types", "vs/base/common/arrays", "vs/editor/browser/core/editorState", "vs/editor/contrib/snippet/snippetParser"], function (require, exports, event_1, lifecycle_1, editorOptions_1, range_1, selection_1, snippetController2_1, extHost_protocol_1, types_1, arrays_1, editorState_1, snippetParser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTextEditor = exports.MainThreadTextEditorProperties = void 0;
    class MainThreadTextEditorProperties {
        constructor(selections, options, visibleRanges) {
            this.selections = selections;
            this.options = options;
            this.visibleRanges = visibleRanges;
        }
        static readFromEditor(previousProperties, model, codeEditor) {
            const selections = MainThreadTextEditorProperties._readSelectionsFromCodeEditor(previousProperties, codeEditor);
            const options = MainThreadTextEditorProperties._readOptionsFromCodeEditor(previousProperties, model, codeEditor);
            const visibleRanges = MainThreadTextEditorProperties._readVisibleRangesFromCodeEditor(previousProperties, codeEditor);
            return new MainThreadTextEditorProperties(selections, options, visibleRanges);
        }
        static _readSelectionsFromCodeEditor(previousProperties, codeEditor) {
            let result = null;
            if (codeEditor) {
                result = codeEditor.getSelections();
            }
            if (!result && previousProperties) {
                result = previousProperties.selections;
            }
            if (!result) {
                result = [new selection_1.Selection(1, 1, 1, 1)];
            }
            return result;
        }
        static _readOptionsFromCodeEditor(previousProperties, model, codeEditor) {
            if (model.isDisposed()) {
                if (previousProperties) {
                    // shutdown time
                    return previousProperties.options;
                }
                else {
                    throw new Error('No valid properties');
                }
            }
            let cursorStyle;
            let lineNumbers;
            if (codeEditor) {
                const options = codeEditor.getOptions();
                const lineNumbersOpts = options.get(52 /* lineNumbers */);
                cursorStyle = options.get(19 /* cursorStyle */);
                lineNumbers = lineNumbersOpts.renderType;
            }
            else if (previousProperties) {
                cursorStyle = previousProperties.options.cursorStyle;
                lineNumbers = previousProperties.options.lineNumbers;
            }
            else {
                cursorStyle = editorOptions_1.TextEditorCursorStyle.Line;
                lineNumbers = 1 /* On */;
            }
            const modelOptions = model.getOptions();
            return {
                insertSpaces: modelOptions.insertSpaces,
                tabSize: modelOptions.tabSize,
                indentSize: modelOptions.indentSize,
                cursorStyle: cursorStyle,
                lineNumbers: lineNumbers
            };
        }
        static _readVisibleRangesFromCodeEditor(previousProperties, codeEditor) {
            if (codeEditor) {
                return codeEditor.getVisibleRanges();
            }
            return [];
        }
        generateDelta(oldProps, selectionChangeSource) {
            const delta = {
                options: null,
                selections: null,
                visibleRanges: null
            };
            if (!oldProps || !MainThreadTextEditorProperties._selectionsEqual(oldProps.selections, this.selections)) {
                delta.selections = {
                    selections: this.selections,
                    source: types_1.withNullAsUndefined(selectionChangeSource)
                };
            }
            if (!oldProps || !MainThreadTextEditorProperties._optionsEqual(oldProps.options, this.options)) {
                delta.options = this.options;
            }
            if (!oldProps || !MainThreadTextEditorProperties._rangesEqual(oldProps.visibleRanges, this.visibleRanges)) {
                delta.visibleRanges = this.visibleRanges;
            }
            if (delta.selections || delta.options || delta.visibleRanges) {
                // something changed
                return delta;
            }
            // nothing changed
            return null;
        }
        static _selectionsEqual(a, b) {
            return arrays_1.equals(a, b, (aValue, bValue) => aValue.equalsSelection(bValue));
        }
        static _rangesEqual(a, b) {
            return arrays_1.equals(a, b, (aValue, bValue) => aValue.equalsRange(bValue));
        }
        static _optionsEqual(a, b) {
            if (a && !b || !a && b) {
                return false;
            }
            if (!a && !b) {
                return true;
            }
            return (a.tabSize === b.tabSize
                && a.indentSize === b.indentSize
                && a.insertSpaces === b.insertSpaces
                && a.cursorStyle === b.cursorStyle
                && a.lineNumbers === b.lineNumbers);
        }
    }
    exports.MainThreadTextEditorProperties = MainThreadTextEditorProperties;
    /**
     * Text Editor that is permanently bound to the same model.
     * It can be bound or not to a CodeEditor.
     */
    class MainThreadTextEditor {
        constructor(id, model, codeEditor, focusTracker, modelService, clipboardService) {
            this._modelListeners = new lifecycle_1.DisposableStore();
            this._codeEditorListeners = new lifecycle_1.DisposableStore();
            this._id = id;
            this._model = model;
            this._codeEditor = null;
            this._properties = null;
            this._focusTracker = focusTracker;
            this._modelService = modelService;
            this._clipboardService = clipboardService;
            this._onPropertiesChanged = new event_1.Emitter();
            this._modelListeners.add(this._model.onDidChangeOptions((e) => {
                this._updatePropertiesNow(null);
            }));
            this.setCodeEditor(codeEditor);
            this._updatePropertiesNow(null);
        }
        dispose() {
            this._model = null;
            this._modelListeners.dispose();
            this._codeEditor = null;
            this._codeEditorListeners.dispose();
        }
        _updatePropertiesNow(selectionChangeSource) {
            this._setProperties(MainThreadTextEditorProperties.readFromEditor(this._properties, this._model, this._codeEditor), selectionChangeSource);
        }
        _setProperties(newProperties, selectionChangeSource) {
            const delta = newProperties.generateDelta(this._properties, selectionChangeSource);
            this._properties = newProperties;
            if (delta) {
                this._onPropertiesChanged.fire(delta);
            }
        }
        getId() {
            return this._id;
        }
        getModel() {
            return this._model;
        }
        getCodeEditor() {
            return this._codeEditor;
        }
        hasCodeEditor(codeEditor) {
            return (this._codeEditor === codeEditor);
        }
        setCodeEditor(codeEditor) {
            if (this.hasCodeEditor(codeEditor)) {
                // Nothing to do...
                return;
            }
            this._codeEditorListeners.clear();
            this._codeEditor = codeEditor;
            if (this._codeEditor) {
                // Catch early the case that this code editor gets a different model set and disassociate from this model
                this._codeEditorListeners.add(this._codeEditor.onDidChangeModel(() => {
                    this.setCodeEditor(null);
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidFocusEditorWidget(() => {
                    this._focusTracker.onGainedFocus();
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidBlurEditorWidget(() => {
                    this._focusTracker.onLostFocus();
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidChangeCursorSelection((e) => {
                    // selection
                    this._updatePropertiesNow(e.source);
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidChangeConfiguration(() => {
                    // options
                    this._updatePropertiesNow(null);
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidLayoutChange(() => {
                    // visibleRanges
                    this._updatePropertiesNow(null);
                }));
                this._codeEditorListeners.add(this._codeEditor.onDidScrollChange(() => {
                    // visibleRanges
                    this._updatePropertiesNow(null);
                }));
                this._updatePropertiesNow(null);
            }
        }
        isVisible() {
            return !!this._codeEditor;
        }
        getProperties() {
            return this._properties;
        }
        get onPropertiesChanged() {
            return this._onPropertiesChanged.event;
        }
        setSelections(selections) {
            if (this._codeEditor) {
                this._codeEditor.setSelections(selections);
                return;
            }
            const newSelections = selections.map(selection_1.Selection.liftSelection);
            this._setProperties(new MainThreadTextEditorProperties(newSelections, this._properties.options, this._properties.visibleRanges), null);
        }
        _setIndentConfiguration(newConfiguration) {
            const creationOpts = this._modelService.getCreationOptions(this._model.getLanguageIdentifier().language, this._model.uri, this._model.isForSimpleWidget);
            if (newConfiguration.tabSize === 'auto' || newConfiguration.insertSpaces === 'auto') {
                // one of the options was set to 'auto' => detect indentation
                let insertSpaces = creationOpts.insertSpaces;
                let tabSize = creationOpts.tabSize;
                if (newConfiguration.insertSpaces !== 'auto' && typeof newConfiguration.insertSpaces !== 'undefined') {
                    insertSpaces = newConfiguration.insertSpaces;
                }
                if (newConfiguration.tabSize !== 'auto' && typeof newConfiguration.tabSize !== 'undefined') {
                    tabSize = newConfiguration.tabSize;
                }
                this._model.detectIndentation(insertSpaces, tabSize);
                return;
            }
            const newOpts = {};
            if (typeof newConfiguration.insertSpaces !== 'undefined') {
                newOpts.insertSpaces = newConfiguration.insertSpaces;
            }
            if (typeof newConfiguration.tabSize !== 'undefined') {
                newOpts.tabSize = newConfiguration.tabSize;
            }
            if (typeof newConfiguration.indentSize !== 'undefined') {
                if (newConfiguration.indentSize === 'tabSize') {
                    newOpts.indentSize = newOpts.tabSize || creationOpts.tabSize;
                }
                else {
                    newOpts.indentSize = newConfiguration.indentSize;
                }
            }
            this._model.updateOptions(newOpts);
        }
        setConfiguration(newConfiguration) {
            this._setIndentConfiguration(newConfiguration);
            if (!this._codeEditor) {
                return;
            }
            if (newConfiguration.cursorStyle) {
                const newCursorStyle = editorOptions_1.cursorStyleToString(newConfiguration.cursorStyle);
                this._codeEditor.updateOptions({
                    cursorStyle: newCursorStyle
                });
            }
            if (typeof newConfiguration.lineNumbers !== 'undefined') {
                let lineNumbers;
                switch (newConfiguration.lineNumbers) {
                    case 1 /* On */:
                        lineNumbers = 'on';
                        break;
                    case 2 /* Relative */:
                        lineNumbers = 'relative';
                        break;
                    default:
                        lineNumbers = 'off';
                }
                this._codeEditor.updateOptions({
                    lineNumbers: lineNumbers
                });
            }
        }
        setDecorations(key, ranges) {
            if (!this._codeEditor) {
                return;
            }
            this._codeEditor.setDecorations(key, ranges);
        }
        setDecorationsFast(key, _ranges) {
            if (!this._codeEditor) {
                return;
            }
            const ranges = [];
            for (let i = 0, len = Math.floor(_ranges.length / 4); i < len; i++) {
                ranges[i] = new range_1.Range(_ranges[4 * i], _ranges[4 * i + 1], _ranges[4 * i + 2], _ranges[4 * i + 3]);
            }
            this._codeEditor.setDecorationsFast(key, ranges);
        }
        revealRange(range, revealType) {
            if (!this._codeEditor) {
                return;
            }
            switch (revealType) {
                case extHost_protocol_1.TextEditorRevealType.Default:
                    this._codeEditor.revealRange(range, 0 /* Smooth */);
                    break;
                case extHost_protocol_1.TextEditorRevealType.InCenter:
                    this._codeEditor.revealRangeInCenter(range, 0 /* Smooth */);
                    break;
                case extHost_protocol_1.TextEditorRevealType.InCenterIfOutsideViewport:
                    this._codeEditor.revealRangeInCenterIfOutsideViewport(range, 0 /* Smooth */);
                    break;
                case extHost_protocol_1.TextEditorRevealType.AtTop:
                    this._codeEditor.revealRangeAtTop(range, 0 /* Smooth */);
                    break;
                default:
                    console.warn(`Unknown revealType: ${revealType}`);
                    break;
            }
        }
        isFocused() {
            if (this._codeEditor) {
                return this._codeEditor.hasTextFocus();
            }
            return false;
        }
        matches(editor) {
            if (!editor) {
                return false;
            }
            return editor.getControl() === this._codeEditor;
        }
        applyEdits(versionIdCheck, edits, opts) {
            if (this._model.getVersionId() !== versionIdCheck) {
                // throw new Error('Model has changed in the meantime!');
                // model changed in the meantime
                return false;
            }
            if (!this._codeEditor) {
                // console.warn('applyEdits on invisible editor');
                return false;
            }
            if (typeof opts.setEndOfLine !== 'undefined') {
                this._model.pushEOL(opts.setEndOfLine);
            }
            const transformedEdits = edits.map((edit) => {
                return {
                    range: range_1.Range.lift(edit.range),
                    text: edit.text,
                    forceMoveMarkers: edit.forceMoveMarkers
                };
            });
            if (opts.undoStopBefore) {
                this._codeEditor.pushUndoStop();
            }
            this._codeEditor.executeEdits('MainThreadTextEditor', transformedEdits);
            if (opts.undoStopAfter) {
                this._codeEditor.pushUndoStop();
            }
            return true;
        }
        async insertSnippet(template, ranges, opts) {
            if (!this._codeEditor || !this._codeEditor.hasModel()) {
                return false;
            }
            // check if clipboard is required and only iff read it (async)
            let clipboardText;
            const needsTemplate = snippetParser_1.SnippetParser.guessNeedsClipboard(template);
            if (needsTemplate) {
                const state = new editorState_1.EditorState(this._codeEditor, 1 /* Value */ | 4 /* Position */);
                clipboardText = await this._clipboardService.readText();
                if (!state.validate(this._codeEditor)) {
                    return false;
                }
            }
            const snippetController = snippetController2_1.SnippetController2.get(this._codeEditor);
            // // cancel previous snippet mode
            // snippetController.leaveSnippet();
            // set selection, focus editor
            const selections = ranges.map(r => new selection_1.Selection(r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn));
            this._codeEditor.setSelections(selections);
            this._codeEditor.focus();
            // make modifications
            snippetController.insert(template, {
                overwriteBefore: 0, overwriteAfter: 0,
                undoStopBefore: opts.undoStopBefore, undoStopAfter: opts.undoStopAfter,
                clipboardText
            });
            return true;
        }
    }
    exports.MainThreadTextEditor = MainThreadTextEditor;
});
//# __sourceMappingURL=mainThreadEditor.js.map