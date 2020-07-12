/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/base/common/actions", "vs/base/common/arrays"], function (require, exports, nls_1, event_1, types_1, uri_1, lifecycle_1, instantiation_1, contextkey_1, platform_1, actions_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.computeEditorAriaLabel = exports.EditorsOrder = exports.pathsToEditors = exports.Extensions = exports.CloseDirection = exports.toResource = exports.SideBySideEditor = exports.EditorCommandsContextActionRunner = exports.TextEditorOptions = exports.EditorOptions = exports.isEditorInputWithOptions = exports.EditorModel = exports.SideBySideEditorInput = exports.EncodingMode = exports.EditorInput = exports.SaveReason = exports.Verbosity = exports.isTextEditorPane = exports.BINARY_DIFF_EDITOR_ID = exports.TEXT_DIFF_EDITOR_ID = exports.EditorAreaVisibleContext = exports.SplitEditorsVertically = exports.IsCenteredLayoutContext = exports.InEditorZenModeContext = exports.SingleEditorGroupsContext = exports.MultipleEditorGroupsContext = exports.ActiveEditorGroupLastContext = exports.ActiveEditorGroupIndexContext = exports.ActiveEditorGroupEmptyContext = exports.TextCompareEditorActiveContext = exports.TextCompareEditorVisibleContext = exports.NoEditorsVisibleContext = exports.EditorGroupEditorsCountContext = exports.EditorGroupActiveEditorDirtyContext = exports.EditorStickyContext = exports.EditorPinnedContext = exports.EditorsVisibleContext = exports.ActiveEditorAvailableEditorIdsContext = exports.ActiveEditorIsReadonlyContext = exports.ActiveEditorContext = exports.DirtyWorkingCopiesContext = void 0;
    exports.DirtyWorkingCopiesContext = new contextkey_1.RawContextKey('dirtyWorkingCopies', false);
    exports.ActiveEditorContext = new contextkey_1.RawContextKey('activeEditor', null);
    exports.ActiveEditorIsReadonlyContext = new contextkey_1.RawContextKey('activeEditorIsReadonly', false);
    exports.ActiveEditorAvailableEditorIdsContext = new contextkey_1.RawContextKey('activeEditorAvailableEditorIds', '');
    exports.EditorsVisibleContext = new contextkey_1.RawContextKey('editorIsOpen', false);
    exports.EditorPinnedContext = new contextkey_1.RawContextKey('editorPinned', false);
    exports.EditorStickyContext = new contextkey_1.RawContextKey('editorSticky', false);
    exports.EditorGroupActiveEditorDirtyContext = new contextkey_1.RawContextKey('groupActiveEditorDirty', false);
    exports.EditorGroupEditorsCountContext = new contextkey_1.RawContextKey('groupEditorsCount', 0);
    exports.NoEditorsVisibleContext = exports.EditorsVisibleContext.toNegated();
    exports.TextCompareEditorVisibleContext = new contextkey_1.RawContextKey('textCompareEditorVisible', false);
    exports.TextCompareEditorActiveContext = new contextkey_1.RawContextKey('textCompareEditorActive', false);
    exports.ActiveEditorGroupEmptyContext = new contextkey_1.RawContextKey('activeEditorGroupEmpty', false);
    exports.ActiveEditorGroupIndexContext = new contextkey_1.RawContextKey('activeEditorGroupIndex', 0);
    exports.ActiveEditorGroupLastContext = new contextkey_1.RawContextKey('activeEditorGroupLast', false);
    exports.MultipleEditorGroupsContext = new contextkey_1.RawContextKey('multipleEditorGroups', false);
    exports.SingleEditorGroupsContext = exports.MultipleEditorGroupsContext.toNegated();
    exports.InEditorZenModeContext = new contextkey_1.RawContextKey('inZenMode', false);
    exports.IsCenteredLayoutContext = new contextkey_1.RawContextKey('isCenteredLayout', false);
    exports.SplitEditorsVertically = new contextkey_1.RawContextKey('splitEditorsVertically', false);
    exports.EditorAreaVisibleContext = new contextkey_1.RawContextKey('editorAreaVisible', true);
    /**
     * Text diff editor id.
     */
    exports.TEXT_DIFF_EDITOR_ID = 'workbench.editors.textDiffEditor';
    /**
     * Binary diff editor id.
     */
    exports.BINARY_DIFF_EDITOR_ID = 'workbench.editors.binaryResourceDiffEditor';
    function isTextEditorPane(thing) {
        const candidate = thing;
        return typeof (candidate === null || candidate === void 0 ? void 0 : candidate.getViewState) === 'function';
    }
    exports.isTextEditorPane = isTextEditorPane;
    var Verbosity;
    (function (Verbosity) {
        Verbosity[Verbosity["SHORT"] = 0] = "SHORT";
        Verbosity[Verbosity["MEDIUM"] = 1] = "MEDIUM";
        Verbosity[Verbosity["LONG"] = 2] = "LONG";
    })(Verbosity = exports.Verbosity || (exports.Verbosity = {}));
    var SaveReason;
    (function (SaveReason) {
        /**
         * Explicit user gesture.
         */
        SaveReason[SaveReason["EXPLICIT"] = 1] = "EXPLICIT";
        /**
         * Auto save after a timeout.
         */
        SaveReason[SaveReason["AUTO"] = 2] = "AUTO";
        /**
         * Auto save after editor focus change.
         */
        SaveReason[SaveReason["FOCUS_CHANGE"] = 3] = "FOCUS_CHANGE";
        /**
         * Auto save after window change.
         */
        SaveReason[SaveReason["WINDOW_CHANGE"] = 4] = "WINDOW_CHANGE";
    })(SaveReason = exports.SaveReason || (exports.SaveReason = {}));
    /**
     * Editor inputs are lightweight objects that can be passed to the workbench API to open inside the editor part.
     * Each editor input is mapped to an editor that is capable of opening it through the Platform facade.
     */
    class EditorInput extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidChangeLabel = this._register(new event_1.Emitter());
            this.onDidChangeLabel = this._onDidChangeLabel.event;
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
            this.disposed = false;
        }
        getName() {
            return `Editor ${this.getTypeId()}`;
        }
        getDescription(verbosity) {
            return undefined;
        }
        getTitle(verbosity) {
            return this.getName();
        }
        getAriaLabel() {
            return this.getTitle(0 /* SHORT */);
        }
        /**
         * Returns the preferred editor for this input. A list of candidate editors is passed in that whee registered
         * for the input. This allows subclasses to decide late which editor to use for the input on a case by case basis.
         */
        getPreferredEditorId(candidates) {
            return arrays_1.firstOrDefault(candidates);
        }
        /**
        * Returns a descriptor suitable for telemetry events.
        *
        * Subclasses should extend if they can contribute.
        */
        getTelemetryDescriptor() {
            /* __GDPR__FRAGMENT__
                "EditorTelemetryDescriptor" : {
                    "typeId" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            return { typeId: this.getTypeId() };
        }
        isReadonly() {
            return true;
        }
        isUntitled() {
            return false;
        }
        isDirty() {
            return false;
        }
        isSaving() {
            return false;
        }
        async resolve() {
            return null;
        }
        async save(group, options) {
            return this;
        }
        async saveAs(group, options) {
            return this;
        }
        async revert(group, options) { }
        rename(group, target) {
            return undefined;
        }
        supportsSplitEditor() {
            return true;
        }
        matches(otherInput) {
            return this === otherInput;
        }
        isDisposed() {
            return this.disposed;
        }
        dispose() {
            if (!this.disposed) {
                this.disposed = true;
                this._onDispose.fire();
            }
            super.dispose();
        }
    }
    exports.EditorInput = EditorInput;
    var EncodingMode;
    (function (EncodingMode) {
        /**
         * Instructs the encoding support to encode the current input with the provided encoding
         */
        EncodingMode[EncodingMode["Encode"] = 0] = "Encode";
        /**
         * Instructs the encoding support to decode the current input with the provided encoding
         */
        EncodingMode[EncodingMode["Decode"] = 1] = "Decode";
    })(EncodingMode = exports.EncodingMode || (exports.EncodingMode = {}));
    /**
     * Side by side editor inputs that have a primary and secondary side.
     */
    class SideBySideEditorInput extends EditorInput {
        constructor(name, description, _secondary, _primary) {
            super();
            this.name = name;
            this.description = description;
            this._secondary = _secondary;
            this._primary = _primary;
            this.registerListeners();
        }
        registerListeners() {
            // When the primary or secondary input gets disposed, dispose this diff editor input
            const onceSecondaryDisposed = event_1.Event.once(this.secondary.onDispose);
            this._register(onceSecondaryDisposed(() => {
                if (!this.isDisposed()) {
                    this.dispose();
                }
            }));
            const oncePrimaryDisposed = event_1.Event.once(this.primary.onDispose);
            this._register(oncePrimaryDisposed(() => {
                if (!this.isDisposed()) {
                    this.dispose();
                }
            }));
            // Reemit some events from the primary side to the outside
            this._register(this.primary.onDidChangeDirty(() => this._onDidChangeDirty.fire()));
            this._register(this.primary.onDidChangeLabel(() => this._onDidChangeLabel.fire()));
        }
        get resource() {
            return undefined;
        }
        get primary() {
            return this._primary;
        }
        get secondary() {
            return this._secondary;
        }
        getTypeId() {
            return SideBySideEditorInput.ID;
        }
        getName() {
            if (!this.name) {
                return nls_1.localize('sideBySideLabels', "{0} - {1}", this._secondary.getName(), this._primary.getName());
            }
            return this.name;
        }
        getDescription() {
            return this.description;
        }
        isReadonly() {
            return this.primary.isReadonly();
        }
        isUntitled() {
            return this.primary.isUntitled();
        }
        isDirty() {
            return this.primary.isDirty();
        }
        isSaving() {
            return this.primary.isSaving();
        }
        save(group, options) {
            return this.primary.save(group, options);
        }
        saveAs(group, options) {
            return this.primary.saveAs(group, options);
        }
        revert(group, options) {
            return this.primary.revert(group, options);
        }
        getTelemetryDescriptor() {
            const descriptor = this.primary.getTelemetryDescriptor();
            return Object.assign(descriptor, super.getTelemetryDescriptor());
        }
        matches(otherInput) {
            if (otherInput === this) {
                return true;
            }
            if (otherInput instanceof SideBySideEditorInput) {
                return this.primary.matches(otherInput.primary) && this.secondary.matches(otherInput.secondary);
            }
            return false;
        }
    }
    exports.SideBySideEditorInput = SideBySideEditorInput;
    SideBySideEditorInput.ID = 'workbench.editorinputs.sidebysideEditorInput';
    /**
     * The editor model is the heavyweight counterpart of editor input. Depending on the editor input, it
     * connects to the disk to retrieve content and may allow for saving it back or reverting it. Editor models
     * are typically cached for some while because they are expensive to construct.
     */
    class EditorModel extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDispose = this._register(new event_1.Emitter());
            this.onDispose = this._onDispose.event;
        }
        /**
         * Causes this model to load returning a promise when loading is completed.
         */
        async load() {
            return this;
        }
        /**
         * Returns whether this model was loaded or not.
         */
        isResolved() {
            return true;
        }
        /**
         * Subclasses should implement to free resources that have been claimed through loading.
         */
        dispose() {
            this._onDispose.fire();
            super.dispose();
        }
    }
    exports.EditorModel = EditorModel;
    function isEditorInputWithOptions(obj) {
        const editorInputWithOptions = obj;
        return !!editorInputWithOptions && !!editorInputWithOptions.editor;
    }
    exports.isEditorInputWithOptions = isEditorInputWithOptions;
    /**
     * The editor options is the base class of options that can be passed in when opening an editor.
     */
    class EditorOptions {
        /**
         * Helper to create EditorOptions inline.
         */
        static create(settings) {
            const options = new EditorOptions();
            options.overwrite(settings);
            return options;
        }
        /**
         * Overwrites option values from the provided bag.
         */
        overwrite(options) {
            if (typeof options.forceReload === 'boolean') {
                this.forceReload = options.forceReload;
            }
            if (typeof options.revealIfVisible === 'boolean') {
                this.revealIfVisible = options.revealIfVisible;
            }
            if (typeof options.revealIfOpened === 'boolean') {
                this.revealIfOpened = options.revealIfOpened;
            }
            if (typeof options.preserveFocus === 'boolean') {
                this.preserveFocus = options.preserveFocus;
            }
            if (typeof options.activation === 'number') {
                this.activation = options.activation;
            }
            if (typeof options.pinned === 'boolean') {
                this.pinned = options.pinned;
            }
            if (typeof options.sticky === 'boolean') {
                this.sticky = options.sticky;
            }
            if (typeof options.inactive === 'boolean') {
                this.inactive = options.inactive;
            }
            if (typeof options.ignoreError === 'boolean') {
                this.ignoreError = options.ignoreError;
            }
            if (typeof options.index === 'number') {
                this.index = options.index;
            }
            if (typeof options.override === 'string' || options.override === false) {
                this.override = options.override;
            }
            if (typeof options.context === 'number') {
                this.context = options.context;
            }
            return this;
        }
    }
    exports.EditorOptions = EditorOptions;
    /**
     * Base Text Editor Options.
     */
    class TextEditorOptions extends EditorOptions {
        static from(input) {
            if (!(input === null || input === void 0 ? void 0 : input.options)) {
                return undefined;
            }
            return TextEditorOptions.create(input.options);
        }
        /**
         * Helper to convert options bag to real class
         */
        static create(options = Object.create(null)) {
            const textEditorOptions = new TextEditorOptions();
            textEditorOptions.overwrite(options);
            return textEditorOptions;
        }
        /**
         * Overwrites option values from the provided bag.
         */
        overwrite(options) {
            var _a, _b;
            super.overwrite(options);
            if (options.selection) {
                this.selection = {
                    startLineNumber: options.selection.startLineNumber,
                    startColumn: options.selection.startColumn,
                    endLineNumber: (_a = options.selection.endLineNumber) !== null && _a !== void 0 ? _a : options.selection.startLineNumber,
                    endColumn: (_b = options.selection.endColumn) !== null && _b !== void 0 ? _b : options.selection.startColumn
                };
            }
            if (options.viewState) {
                this.editorViewState = options.viewState;
            }
            if (typeof options.selectionRevealType !== 'undefined') {
                this.selectionRevealType = options.selectionRevealType;
            }
            return this;
        }
        /**
         * Returns if this options object has objects defined for the editor.
         */
        hasOptionsDefined() {
            return !!this.editorViewState || !!this.selectionRevealType || !!this.selection;
        }
        /**
         * Create a TextEditorOptions inline to be used when the editor is opening.
         */
        static fromEditor(editor, settings) {
            const options = TextEditorOptions.create(settings);
            // View state
            options.editorViewState = types_1.withNullAsUndefined(editor.saveViewState());
            return options;
        }
        /**
         * Apply the view state or selection to the given editor.
         *
         * @return if something was applied
         */
        apply(editor, scrollType) {
            var _a, _b;
            let gotApplied = false;
            // First try viewstate
            if (this.editorViewState) {
                editor.restoreViewState(this.editorViewState);
                gotApplied = true;
            }
            // Otherwise check for selection
            else if (this.selection) {
                const range = {
                    startLineNumber: this.selection.startLineNumber,
                    startColumn: this.selection.startColumn,
                    endLineNumber: (_a = this.selection.endLineNumber) !== null && _a !== void 0 ? _a : this.selection.startLineNumber,
                    endColumn: (_b = this.selection.endColumn) !== null && _b !== void 0 ? _b : this.selection.startColumn
                };
                editor.setSelection(range);
                if (this.selectionRevealType === 2 /* NearTop */) {
                    editor.revealRangeNearTop(range, scrollType);
                }
                else if (this.selectionRevealType === 3 /* NearTopIfOutsideViewport */) {
                    editor.revealRangeNearTopIfOutsideViewport(range, scrollType);
                }
                else if (this.selectionRevealType === 1 /* CenterIfOutsideViewport */) {
                    editor.revealRangeInCenterIfOutsideViewport(range, scrollType);
                }
                else {
                    editor.revealRangeInCenter(range, scrollType);
                }
                gotApplied = true;
            }
            return gotApplied;
        }
    }
    exports.TextEditorOptions = TextEditorOptions;
    class EditorCommandsContextActionRunner extends actions_1.ActionRunner {
        constructor(context) {
            super();
            this.context = context;
        }
        run(action) {
            return super.run(action, this.context);
        }
    }
    exports.EditorCommandsContextActionRunner = EditorCommandsContextActionRunner;
    var SideBySideEditor;
    (function (SideBySideEditor) {
        SideBySideEditor[SideBySideEditor["PRIMARY"] = 1] = "PRIMARY";
        SideBySideEditor[SideBySideEditor["SECONDARY"] = 2] = "SECONDARY";
        SideBySideEditor[SideBySideEditor["BOTH"] = 3] = "BOTH";
    })(SideBySideEditor = exports.SideBySideEditor || (exports.SideBySideEditor = {}));
    function toResource(editor, options) {
        if (!editor) {
            return undefined;
        }
        if ((options === null || options === void 0 ? void 0 : options.supportSideBySide) && editor instanceof SideBySideEditorInput) {
            if ((options === null || options === void 0 ? void 0 : options.supportSideBySide) === SideBySideEditor.BOTH) {
                return {
                    primary: toResource(editor.primary, { filterByScheme: options.filterByScheme }),
                    secondary: toResource(editor.secondary, { filterByScheme: options.filterByScheme })
                };
            }
            editor = options.supportSideBySide === SideBySideEditor.PRIMARY ? editor.primary : editor.secondary;
        }
        const resource = editor.resource;
        if (!resource || !options || !options.filterByScheme) {
            return resource;
        }
        if (Array.isArray(options.filterByScheme)) {
            if (options.filterByScheme.some(scheme => resource.scheme === scheme)) {
                return resource;
            }
        }
        else {
            if (options.filterByScheme === resource.scheme) {
                return resource;
            }
        }
        return undefined;
    }
    exports.toResource = toResource;
    var CloseDirection;
    (function (CloseDirection) {
        CloseDirection[CloseDirection["LEFT"] = 0] = "LEFT";
        CloseDirection[CloseDirection["RIGHT"] = 1] = "RIGHT";
    })(CloseDirection = exports.CloseDirection || (exports.CloseDirection = {}));
    class EditorInputFactoryRegistry {
        constructor() {
            this.customEditorInputFactoryInstances = new Map();
            this.editorInputFactoryConstructors = new Map();
            this.editorInputFactoryInstances = new Map();
        }
        start(accessor) {
            const instantiationService = this.instantiationService = accessor.get(instantiation_1.IInstantiationService);
            this.editorInputFactoryConstructors.forEach((ctor, key) => {
                this.createEditorInputFactory(key, ctor, instantiationService);
            });
            this.editorInputFactoryConstructors.clear();
        }
        createEditorInputFactory(editorInputId, ctor, instantiationService) {
            const instance = instantiationService.createInstance(ctor);
            this.editorInputFactoryInstances.set(editorInputId, instance);
        }
        registerFileEditorInputFactory(factory) {
            this.fileEditorInputFactory = factory;
        }
        getFileEditorInputFactory() {
            return types_1.assertIsDefined(this.fileEditorInputFactory);
        }
        registerCustomEditorInputFactory(scheme, factory) {
            this.customEditorInputFactoryInstances.set(scheme, factory);
        }
        getCustomEditorInputFactory(scheme) {
            return this.customEditorInputFactoryInstances.get(scheme);
        }
        registerEditorInputFactory(editorInputId, ctor) {
            if (!this.instantiationService) {
                this.editorInputFactoryConstructors.set(editorInputId, ctor);
            }
            else {
                this.createEditorInputFactory(editorInputId, ctor, this.instantiationService);
            }
            return lifecycle_1.toDisposable(() => {
                this.editorInputFactoryConstructors.delete(editorInputId);
                this.editorInputFactoryInstances.delete(editorInputId);
            });
        }
        getEditorInputFactory(editorInputId) {
            return this.editorInputFactoryInstances.get(editorInputId);
        }
    }
    exports.Extensions = {
        EditorInputFactories: 'workbench.contributions.editor.inputFactories'
    };
    platform_1.Registry.add(exports.Extensions.EditorInputFactories, new EditorInputFactoryRegistry());
    async function pathsToEditors(paths, fileService) {
        if (!paths || !paths.length) {
            return [];
        }
        const editors = await Promise.all(paths.map(async (path) => {
            const resource = uri_1.URI.revive(path.fileUri);
            if (!resource || !fileService.canHandleResource(resource)) {
                return;
            }
            const exists = (typeof path.exists === 'boolean') ? path.exists : await fileService.exists(resource);
            if (!exists && path.openOnlyIfExists) {
                return;
            }
            const options = (exists && typeof path.lineNumber === 'number') ? {
                selection: {
                    startLineNumber: path.lineNumber,
                    startColumn: path.columnNumber || 1
                },
                pinned: true,
                override: path.overrideId
            } : {
                pinned: true,
                override: path.overrideId
            };
            let input;
            if (!exists) {
                input = { resource, options, forceUntitled: true };
            }
            else {
                input = { resource, options, forceFile: true };
            }
            return input;
        }));
        return arrays_1.coalesce(editors);
    }
    exports.pathsToEditors = pathsToEditors;
    var EditorsOrder;
    (function (EditorsOrder) {
        /**
         * Editors sorted by most recent activity (most recent active first)
         */
        EditorsOrder[EditorsOrder["MOST_RECENTLY_ACTIVE"] = 0] = "MOST_RECENTLY_ACTIVE";
        /**
         * Editors sorted by sequential order
         */
        EditorsOrder[EditorsOrder["SEQUENTIAL"] = 1] = "SEQUENTIAL";
    })(EditorsOrder = exports.EditorsOrder || (exports.EditorsOrder = {}));
    function computeEditorAriaLabel(input, index, group, groupCount) {
        let ariaLabel = input.getAriaLabel();
        if (group && !group.isPinned(input)) {
            ariaLabel = nls_1.localize('preview', "{0}, preview", ariaLabel);
        }
        if (group && group.isSticky(index !== null && index !== void 0 ? index : input)) {
            ariaLabel = nls_1.localize('pinned', "{0}, pinned", ariaLabel);
        }
        // Apply group information to help identify in
        // which group we are (only if more than one group
        // is actually opened)
        if (group && groupCount > 1) {
            ariaLabel = `${ariaLabel}, ${group.ariaLabel}`;
        }
        return ariaLabel;
    }
    exports.computeEditorAriaLabel = computeEditorAriaLabel;
});
//# __sourceMappingURL=editor.js.map