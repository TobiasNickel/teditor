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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "vs/editor/contrib/find/findModel", "vs/editor/contrib/find/findOptionsWidget", "vs/editor/contrib/find/findState", "vs/editor/contrib/find/findWidget", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/platform/notification/common/notification", "vs/platform/userDataSync/common/storageKeys"], function (require, exports, nls, async_1, lifecycle_1, strings, editorExtensions_1, editorContextKeys_1, findModel_1, findOptionsWidget_1, findState_1, findWidget_1, actions_1, clipboardService_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, storage_1, themeService_1, notification_1, storageKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StartFindReplaceAction = exports.PreviousSelectionMatchFindAction = exports.NextSelectionMatchFindAction = exports.SelectionMatchFindAction = exports.PreviousMatchFindAction2 = exports.PreviousMatchFindAction = exports.NextMatchFindAction2 = exports.NextMatchFindAction = exports.MatchFindAction = exports.StartFindWithSelectionAction = exports.StartFindAction = exports.FindController = exports.CommonFindController = exports.FindStartFocusAction = exports.getSelectionSearchString = void 0;
    const SEARCH_STRING_MAX_LENGTH = 524288;
    function getSelectionSearchString(editor) {
        if (!editor.hasModel()) {
            return null;
        }
        const selection = editor.getSelection();
        // if selection spans multiple lines, default search string to empty
        if (selection.startLineNumber === selection.endLineNumber) {
            if (selection.isEmpty()) {
                const wordAtPosition = editor.getConfiguredWordAtPosition(selection.getStartPosition());
                if (wordAtPosition) {
                    return wordAtPosition.word;
                }
            }
            else {
                if (editor.getModel().getValueLengthInRange(selection) < SEARCH_STRING_MAX_LENGTH) {
                    return editor.getModel().getValueInRange(selection);
                }
            }
        }
        return null;
    }
    exports.getSelectionSearchString = getSelectionSearchString;
    var FindStartFocusAction;
    (function (FindStartFocusAction) {
        FindStartFocusAction[FindStartFocusAction["NoFocusChange"] = 0] = "NoFocusChange";
        FindStartFocusAction[FindStartFocusAction["FocusFindInput"] = 1] = "FocusFindInput";
        FindStartFocusAction[FindStartFocusAction["FocusReplaceInput"] = 2] = "FocusReplaceInput";
    })(FindStartFocusAction = exports.FindStartFocusAction || (exports.FindStartFocusAction = {}));
    let CommonFindController = class CommonFindController extends lifecycle_1.Disposable {
        constructor(editor, contextKeyService, storageService, clipboardService) {
            super();
            this._editor = editor;
            this._findWidgetVisible = findModel_1.CONTEXT_FIND_WIDGET_VISIBLE.bindTo(contextKeyService);
            this._contextKeyService = contextKeyService;
            this._storageService = storageService;
            this._clipboardService = clipboardService;
            this._updateHistoryDelayer = new async_1.Delayer(500);
            this._state = this._register(new findState_1.FindReplaceState());
            this.loadQueryState();
            this._register(this._state.onFindReplaceStateChange((e) => this._onStateChanged(e)));
            this._model = null;
            this._register(this._editor.onDidChangeModel(() => {
                let shouldRestartFind = (this._editor.getModel() && this._state.isRevealed);
                this.disposeModel();
                this._state.change({
                    searchScope: null,
                    matchCase: this._storageService.getBoolean('editor.matchCase', 1 /* WORKSPACE */, false),
                    wholeWord: this._storageService.getBoolean('editor.wholeWord', 1 /* WORKSPACE */, false),
                    isRegex: this._storageService.getBoolean('editor.isRegex', 1 /* WORKSPACE */, false),
                    preserveCase: this._storageService.getBoolean('editor.preserveCase', 1 /* WORKSPACE */, false)
                }, false);
                if (shouldRestartFind) {
                    this._start({
                        forceRevealReplace: false,
                        seedSearchStringFromSelection: false && this._editor.getOption(29 /* find */).seedSearchStringFromSelection,
                        seedSearchStringFromGlobalClipboard: false,
                        shouldFocus: 0 /* NoFocusChange */,
                        shouldAnimate: false,
                        updateSearchScope: false,
                        loop: this._editor.getOption(29 /* find */).loop
                    });
                }
            }));
        }
        static get(editor) {
            return editor.getContribution(CommonFindController.ID);
        }
        dispose() {
            this.disposeModel();
            super.dispose();
        }
        disposeModel() {
            if (this._model) {
                this._model.dispose();
                this._model = null;
            }
        }
        _onStateChanged(e) {
            this.saveQueryState(e);
            if (e.isRevealed) {
                if (this._state.isRevealed) {
                    this._findWidgetVisible.set(true);
                }
                else {
                    this._findWidgetVisible.reset();
                    this.disposeModel();
                }
            }
            if (e.searchString) {
                this.setGlobalBufferTerm(this._state.searchString);
            }
        }
        saveQueryState(e) {
            if (e.isRegex) {
                this._storageService.store('editor.isRegex', this._state.actualIsRegex, 1 /* WORKSPACE */);
            }
            if (e.wholeWord) {
                this._storageService.store('editor.wholeWord', this._state.actualWholeWord, 1 /* WORKSPACE */);
            }
            if (e.matchCase) {
                this._storageService.store('editor.matchCase', this._state.actualMatchCase, 1 /* WORKSPACE */);
            }
            if (e.preserveCase) {
                this._storageService.store('editor.preserveCase', this._state.actualPreserveCase, 1 /* WORKSPACE */);
            }
        }
        loadQueryState() {
            this._state.change({
                matchCase: this._storageService.getBoolean('editor.matchCase', 1 /* WORKSPACE */, this._state.matchCase),
                wholeWord: this._storageService.getBoolean('editor.wholeWord', 1 /* WORKSPACE */, this._state.wholeWord),
                isRegex: this._storageService.getBoolean('editor.isRegex', 1 /* WORKSPACE */, this._state.isRegex),
                preserveCase: this._storageService.getBoolean('editor.preserveCase', 1 /* WORKSPACE */, this._state.preserveCase)
            }, false);
        }
        isFindInputFocused() {
            return !!findModel_1.CONTEXT_FIND_INPUT_FOCUSED.getValue(this._contextKeyService);
        }
        getState() {
            return this._state;
        }
        closeFindWidget() {
            this._state.change({
                isRevealed: false,
                searchScope: null
            }, false);
            this._editor.focus();
        }
        toggleCaseSensitive() {
            this._state.change({ matchCase: !this._state.matchCase }, false);
            if (!this._state.isRevealed) {
                this.highlightFindOptions();
            }
        }
        toggleWholeWords() {
            this._state.change({ wholeWord: !this._state.wholeWord }, false);
            if (!this._state.isRevealed) {
                this.highlightFindOptions();
            }
        }
        toggleRegex() {
            this._state.change({ isRegex: !this._state.isRegex }, false);
            if (!this._state.isRevealed) {
                this.highlightFindOptions();
            }
        }
        togglePreserveCase() {
            this._state.change({ preserveCase: !this._state.preserveCase }, false);
            this.highlightFindOptions();
        }
        toggleSearchScope() {
            if (this._state.searchScope) {
                this._state.change({ searchScope: null }, true);
            }
            else {
                if (this._editor.hasModel()) {
                    let selection = this._editor.getSelection();
                    if (selection.endColumn === 1 && selection.endLineNumber > selection.startLineNumber) {
                        selection = selection.setEndPosition(selection.endLineNumber - 1, this._editor.getModel().getLineMaxColumn(selection.endLineNumber - 1));
                    }
                    if (!selection.isEmpty()) {
                        this._state.change({ searchScope: selection }, true);
                    }
                }
            }
        }
        setSearchString(searchString) {
            if (this._state.isRegex) {
                searchString = strings.escapeRegExpCharacters(searchString);
            }
            this._state.change({ searchString: searchString }, false);
        }
        highlightFindOptions() {
            // overwritten in subclass
        }
        async _start(opts) {
            this.disposeModel();
            if (!this._editor.hasModel()) {
                // cannot do anything with an editor that doesn't have a model...
                return;
            }
            let stateChanges = {
                isRevealed: true
            };
            if (opts.seedSearchStringFromSelection) {
                let selectionSearchString = getSelectionSearchString(this._editor);
                if (selectionSearchString) {
                    if (this._state.isRegex) {
                        stateChanges.searchString = strings.escapeRegExpCharacters(selectionSearchString);
                    }
                    else {
                        stateChanges.searchString = selectionSearchString;
                    }
                }
            }
            if (!stateChanges.searchString && opts.seedSearchStringFromGlobalClipboard) {
                let selectionSearchString = await this.getGlobalBufferTerm();
                if (selectionSearchString) {
                    stateChanges.searchString = selectionSearchString;
                }
            }
            // Overwrite isReplaceRevealed
            if (opts.forceRevealReplace) {
                stateChanges.isReplaceRevealed = true;
            }
            else if (!this._findWidgetVisible.get()) {
                stateChanges.isReplaceRevealed = false;
            }
            if (opts.updateSearchScope) {
                let currentSelection = this._editor.getSelection();
                if (!currentSelection.isEmpty()) {
                    stateChanges.searchScope = currentSelection;
                }
            }
            stateChanges.loop = opts.loop;
            this._state.change(stateChanges, false);
            if (!this._model) {
                this._model = new findModel_1.FindModelBoundToEditorModel(this._editor, this._state);
            }
        }
        start(opts) {
            return this._start(opts);
        }
        moveToNextMatch() {
            if (this._model) {
                this._model.moveToNextMatch();
                return true;
            }
            return false;
        }
        moveToPrevMatch() {
            if (this._model) {
                this._model.moveToPrevMatch();
                return true;
            }
            return false;
        }
        replace() {
            if (this._model) {
                this._model.replace();
                return true;
            }
            return false;
        }
        replaceAll() {
            if (this._model) {
                this._model.replaceAll();
                return true;
            }
            return false;
        }
        selectAllMatches() {
            if (this._model) {
                this._model.selectAllMatches();
                this._editor.focus();
                return true;
            }
            return false;
        }
        async getGlobalBufferTerm() {
            if (this._editor.getOption(29 /* find */).globalFindClipboard
                && this._clipboardService
                && this._editor.hasModel()
                && !this._editor.getModel().isTooLargeForSyncing()) {
                return this._clipboardService.readFindText();
            }
            return '';
        }
        async setGlobalBufferTerm(text) {
            if (this._editor.getOption(29 /* find */).globalFindClipboard
                && this._clipboardService
                && this._editor.hasModel()
                && !this._editor.getModel().isTooLargeForSyncing()) {
                await this._clipboardService.writeFindText(text);
            }
        }
    };
    CommonFindController.ID = 'editor.contrib.findController';
    CommonFindController = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, storage_1.IStorageService),
        __param(3, clipboardService_1.IClipboardService)
    ], CommonFindController);
    exports.CommonFindController = CommonFindController;
    let FindController = class FindController extends CommonFindController {
        constructor(editor, _contextViewService, _contextKeyService, _keybindingService, _themeService, _notificationService, _storageService, _storageKeysSyncRegistryService, clipboardService) {
            super(editor, _contextKeyService, _storageService, clipboardService);
            this._contextViewService = _contextViewService;
            this._keybindingService = _keybindingService;
            this._themeService = _themeService;
            this._notificationService = _notificationService;
            this._storageKeysSyncRegistryService = _storageKeysSyncRegistryService;
            this._widget = null;
            this._findOptionsWidget = null;
        }
        async _start(opts) {
            if (!this._widget) {
                this._createFindWidget();
            }
            const selection = this._editor.getSelection();
            let updateSearchScope = false;
            switch (this._editor.getOption(29 /* find */).autoFindInSelection) {
                case 'always':
                    updateSearchScope = true;
                    break;
                case 'never':
                    updateSearchScope = false;
                    break;
                case 'multiline':
                    const isSelectionMultipleLine = !!selection && selection.startLineNumber !== selection.endLineNumber;
                    updateSearchScope = isSelectionMultipleLine;
                    break;
                default:
                    break;
            }
            opts.updateSearchScope = updateSearchScope;
            await super._start(opts);
            if (opts.shouldFocus === 2 /* FocusReplaceInput */) {
                this._widget.focusReplaceInput();
            }
            else if (opts.shouldFocus === 1 /* FocusFindInput */) {
                this._widget.focusFindInput();
            }
        }
        highlightFindOptions() {
            if (!this._widget) {
                this._createFindWidget();
            }
            if (this._state.isRevealed) {
                this._widget.highlightFindOptions();
            }
            else {
                this._findOptionsWidget.highlightFindOptions();
            }
        }
        _createFindWidget() {
            this._widget = this._register(new findWidget_1.FindWidget(this._editor, this, this._state, this._contextViewService, this._keybindingService, this._contextKeyService, this._themeService, this._storageService, this._notificationService, this._storageKeysSyncRegistryService));
            this._findOptionsWidget = this._register(new findOptionsWidget_1.FindOptionsWidget(this._editor, this._state, this._keybindingService, this._themeService));
        }
    };
    FindController = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, themeService_1.IThemeService),
        __param(5, notification_1.INotificationService),
        __param(6, storage_1.IStorageService),
        __param(7, storageKeys_1.IStorageKeysSyncRegistryService),
        __param(8, instantiation_1.optional(clipboardService_1.IClipboardService))
    ], FindController);
    exports.FindController = FindController;
    class StartFindAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.StartFindAction,
                label: nls.localize('startFindAction', "Find"),
                alias: 'Find',
                precondition: undefined,
                kbOpts: {
                    kbExpr: null,
                    primary: 2048 /* CtrlCmd */ | 36 /* KEY_F */,
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarEditMenu,
                    group: '3_find',
                    title: nls.localize({ key: 'miFind', comment: ['&& denotes a mnemonic'] }, "&&Find"),
                    order: 1
                }
            });
        }
        run(accessor, editor) {
            let controller = CommonFindController.get(editor);
            if (controller) {
                controller.start({
                    forceRevealReplace: false,
                    seedSearchStringFromSelection: editor.getOption(29 /* find */).seedSearchStringFromSelection,
                    seedSearchStringFromGlobalClipboard: editor.getOption(29 /* find */).globalFindClipboard,
                    shouldFocus: 1 /* FocusFindInput */,
                    shouldAnimate: true,
                    updateSearchScope: false,
                    loop: editor.getOption(29 /* find */).loop
                });
            }
        }
    }
    exports.StartFindAction = StartFindAction;
    class StartFindWithSelectionAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.StartFindWithSelection,
                label: nls.localize('startFindWithSelectionAction', "Find With Selection"),
                alias: 'Find With Selection',
                precondition: undefined,
                kbOpts: {
                    kbExpr: null,
                    primary: 0,
                    mac: {
                        primary: 2048 /* CtrlCmd */ | 35 /* KEY_E */,
                    },
                    weight: 100 /* EditorContrib */
                }
            });
        }
        async run(accessor, editor) {
            let controller = CommonFindController.get(editor);
            if (controller) {
                controller.start({
                    forceRevealReplace: false,
                    seedSearchStringFromSelection: true,
                    seedSearchStringFromGlobalClipboard: false,
                    shouldFocus: 0 /* NoFocusChange */,
                    shouldAnimate: true,
                    updateSearchScope: false,
                    loop: editor.getOption(29 /* find */).loop
                });
                return controller.setGlobalBufferTerm(controller.getState().searchString);
            }
        }
    }
    exports.StartFindWithSelectionAction = StartFindWithSelectionAction;
    class MatchFindAction extends editorExtensions_1.EditorAction {
        run(accessor, editor) {
            let controller = CommonFindController.get(editor);
            if (controller && !this._run(controller)) {
                controller.start({
                    forceRevealReplace: false,
                    seedSearchStringFromSelection: (controller.getState().searchString.length === 0) && editor.getOption(29 /* find */).seedSearchStringFromSelection,
                    seedSearchStringFromGlobalClipboard: true,
                    shouldFocus: 0 /* NoFocusChange */,
                    shouldAnimate: true,
                    updateSearchScope: false,
                    loop: editor.getOption(29 /* find */).loop
                });
                this._run(controller);
            }
        }
    }
    exports.MatchFindAction = MatchFindAction;
    class NextMatchFindAction extends MatchFindAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.NextMatchFindAction,
                label: nls.localize('findNextMatchAction', "Find Next"),
                alias: 'Find Next',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 61 /* F3 */,
                    mac: { primary: 2048 /* CtrlCmd */ | 37 /* KEY_G */, secondary: [61 /* F3 */] },
                    weight: 100 /* EditorContrib */
                }
            });
        }
        _run(controller) {
            return controller.moveToNextMatch();
        }
    }
    exports.NextMatchFindAction = NextMatchFindAction;
    class NextMatchFindAction2 extends MatchFindAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.NextMatchFindAction,
                label: nls.localize('findNextMatchAction', "Find Next"),
                alias: 'Find Next',
                precondition: undefined,
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.focus, findModel_1.CONTEXT_FIND_INPUT_FOCUSED),
                    primary: 3 /* Enter */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        _run(controller) {
            return controller.moveToNextMatch();
        }
    }
    exports.NextMatchFindAction2 = NextMatchFindAction2;
    class PreviousMatchFindAction extends MatchFindAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.PreviousMatchFindAction,
                label: nls.localize('findPreviousMatchAction', "Find Previous"),
                alias: 'Find Previous',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 1024 /* Shift */ | 61 /* F3 */,
                    mac: { primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 37 /* KEY_G */, secondary: [1024 /* Shift */ | 61 /* F3 */] },
                    weight: 100 /* EditorContrib */
                }
            });
        }
        _run(controller) {
            return controller.moveToPrevMatch();
        }
    }
    exports.PreviousMatchFindAction = PreviousMatchFindAction;
    class PreviousMatchFindAction2 extends MatchFindAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.PreviousMatchFindAction,
                label: nls.localize('findPreviousMatchAction', "Find Previous"),
                alias: 'Find Previous',
                precondition: undefined,
                kbOpts: {
                    kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.focus, findModel_1.CONTEXT_FIND_INPUT_FOCUSED),
                    primary: 1024 /* Shift */ | 3 /* Enter */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        _run(controller) {
            return controller.moveToPrevMatch();
        }
    }
    exports.PreviousMatchFindAction2 = PreviousMatchFindAction2;
    class SelectionMatchFindAction extends editorExtensions_1.EditorAction {
        run(accessor, editor) {
            let controller = CommonFindController.get(editor);
            if (!controller) {
                return;
            }
            let selectionSearchString = getSelectionSearchString(editor);
            if (selectionSearchString) {
                controller.setSearchString(selectionSearchString);
            }
            if (!this._run(controller)) {
                controller.start({
                    forceRevealReplace: false,
                    seedSearchStringFromSelection: editor.getOption(29 /* find */).seedSearchStringFromSelection,
                    seedSearchStringFromGlobalClipboard: false,
                    shouldFocus: 0 /* NoFocusChange */,
                    shouldAnimate: true,
                    updateSearchScope: false,
                    loop: editor.getOption(29 /* find */).loop
                });
                this._run(controller);
            }
        }
    }
    exports.SelectionMatchFindAction = SelectionMatchFindAction;
    class NextSelectionMatchFindAction extends SelectionMatchFindAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.NextSelectionMatchFindAction,
                label: nls.localize('nextSelectionMatchFindAction', "Find Next Selection"),
                alias: 'Find Next Selection',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 2048 /* CtrlCmd */ | 61 /* F3 */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        _run(controller) {
            return controller.moveToNextMatch();
        }
    }
    exports.NextSelectionMatchFindAction = NextSelectionMatchFindAction;
    class PreviousSelectionMatchFindAction extends SelectionMatchFindAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.PreviousSelectionMatchFindAction,
                label: nls.localize('previousSelectionMatchFindAction', "Find Previous Selection"),
                alias: 'Find Previous Selection',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 61 /* F3 */,
                    weight: 100 /* EditorContrib */
                }
            });
        }
        _run(controller) {
            return controller.moveToPrevMatch();
        }
    }
    exports.PreviousSelectionMatchFindAction = PreviousSelectionMatchFindAction;
    class StartFindReplaceAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: findModel_1.FIND_IDS.StartFindReplaceAction,
                label: nls.localize('startReplace', "Replace"),
                alias: 'Replace',
                precondition: undefined,
                kbOpts: {
                    kbExpr: null,
                    primary: 2048 /* CtrlCmd */ | 38 /* KEY_H */,
                    mac: { primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 36 /* KEY_F */ },
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarEditMenu,
                    group: '3_find',
                    title: nls.localize({ key: 'miReplace', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
                    order: 2
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel() || editor.getOption(72 /* readOnly */)) {
                return;
            }
            let controller = CommonFindController.get(editor);
            let currentSelection = editor.getSelection();
            let findInputFocused = controller.isFindInputFocused();
            // we only seed search string from selection when the current selection is single line and not empty,
            // + the find input is not focused
            let seedSearchStringFromSelection = !currentSelection.isEmpty()
                && currentSelection.startLineNumber === currentSelection.endLineNumber && editor.getOption(29 /* find */).seedSearchStringFromSelection
                && !findInputFocused;
            /*
             * if the existing search string in find widget is empty and we don't seed search string from selection, it means the Find Input is still empty, so we should focus the Find Input instead of Replace Input.
    
             * findInputFocused true -> seedSearchStringFromSelection false, FocusReplaceInput
             * findInputFocused false, seedSearchStringFromSelection true FocusReplaceInput
             * findInputFocused false seedSearchStringFromSelection false FocusFindInput
             */
            let shouldFocus = (findInputFocused || seedSearchStringFromSelection) ?
                2 /* FocusReplaceInput */ : 1 /* FocusFindInput */;
            if (controller) {
                controller.start({
                    forceRevealReplace: true,
                    seedSearchStringFromSelection: seedSearchStringFromSelection,
                    seedSearchStringFromGlobalClipboard: editor.getOption(29 /* find */).seedSearchStringFromSelection,
                    shouldFocus: shouldFocus,
                    shouldAnimate: true,
                    updateSearchScope: false,
                    loop: editor.getOption(29 /* find */).loop
                });
            }
        }
    }
    exports.StartFindReplaceAction = StartFindReplaceAction;
    editorExtensions_1.registerEditorContribution(CommonFindController.ID, FindController);
    editorExtensions_1.registerEditorAction(StartFindAction);
    editorExtensions_1.registerEditorAction(StartFindWithSelectionAction);
    editorExtensions_1.registerEditorAction(NextMatchFindAction);
    editorExtensions_1.registerEditorAction(NextMatchFindAction2);
    editorExtensions_1.registerEditorAction(PreviousMatchFindAction);
    editorExtensions_1.registerEditorAction(PreviousMatchFindAction2);
    editorExtensions_1.registerEditorAction(NextSelectionMatchFindAction);
    editorExtensions_1.registerEditorAction(PreviousSelectionMatchFindAction);
    editorExtensions_1.registerEditorAction(StartFindReplaceAction);
    const FindCommand = editorExtensions_1.EditorCommand.bindToContribution(CommonFindController.get);
    editorExtensions_1.registerEditorCommand(new FindCommand({
        id: findModel_1.FIND_IDS.CloseFindWidgetCommand,
        precondition: findModel_1.CONTEXT_FIND_WIDGET_VISIBLE,
        handler: x => x.closeFindWidget(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 9 /* Escape */,
            secondary: [1024 /* Shift */ | 9 /* Escape */]
        }
    }));
    editorExtensions_1.registerEditorCommand(new FindCommand({
        id: findModel_1.FIND_IDS.ToggleCaseSensitiveCommand,
        precondition: undefined,
        handler: x => x.toggleCaseSensitive(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: findModel_1.ToggleCaseSensitiveKeybinding.primary,
            mac: findModel_1.ToggleCaseSensitiveKeybinding.mac,
            win: findModel_1.ToggleCaseSensitiveKeybinding.win,
            linux: findModel_1.ToggleCaseSensitiveKeybinding.linux
        }
    }));
    editorExtensions_1.registerEditorCommand(new FindCommand({
        id: findModel_1.FIND_IDS.ToggleWholeWordCommand,
        precondition: undefined,
        handler: x => x.toggleWholeWords(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: findModel_1.ToggleWholeWordKeybinding.primary,
            mac: findModel_1.ToggleWholeWordKeybinding.mac,
            win: findModel_1.ToggleWholeWordKeybinding.win,
            linux: findModel_1.ToggleWholeWordKeybinding.linux
        }
    }));
    editorExtensions_1.registerEditorCommand(new FindCommand({
        id: findModel_1.FIND_IDS.ToggleRegexCommand,
        precondition: undefined,
        handler: x => x.toggleRegex(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: findModel_1.ToggleRegexKeybinding.primary,
            mac: findModel_1.ToggleRegexKeybinding.mac,
            win: findModel_1.ToggleRegexKeybinding.win,
            linux: findModel_1.ToggleRegexKeybinding.linux
        }
    }));
    editorExtensions_1.registerEditorCommand(new FindCommand({
        id: findModel_1.FIND_IDS.ToggleSearchScopeCommand,
        precondition: undefined,
        handler: x => x.toggleSearchScope(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: findModel_1.ToggleSearchScopeKeybinding.primary,
            mac: findModel_1.ToggleSearchScopeKeybinding.mac,
            win: findModel_1.ToggleSearchScopeKeybinding.win,
            linux: findModel_1.ToggleSearchScopeKeybinding.linux
        }
    }));
    editorExtensions_1.registerEditorCommand(new FindCommand({
        id: findModel_1.FIND_IDS.ReplaceOneAction,
        precondition: findModel_1.CONTEXT_FIND_WIDGET_VISIBLE,
        handler: x => x.replace(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 2048 /* CtrlCmd */ | 1024 /* Shift */ | 22 /* KEY_1 */
        }
    }));
    editorExtensions_1.registerEditorCommand(new FindCommand({
        id: findModel_1.FIND_IDS.ReplaceOneAction,
        precondition: findModel_1.CONTEXT_FIND_WIDGET_VISIBLE,
        handler: x => x.replace(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 5,
            kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.focus, findModel_1.CONTEXT_REPLACE_INPUT_FOCUSED),
            primary: 3 /* Enter */
        }
    }));
    editorExtensions_1.registerEditorCommand(new FindCommand({
        id: findModel_1.FIND_IDS.ReplaceAllAction,
        precondition: findModel_1.CONTEXT_FIND_WIDGET_VISIBLE,
        handler: x => x.replaceAll(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 2048 /* CtrlCmd */ | 512 /* Alt */ | 3 /* Enter */
        }
    }));
    editorExtensions_1.registerEditorCommand(new FindCommand({
        id: findModel_1.FIND_IDS.ReplaceAllAction,
        precondition: findModel_1.CONTEXT_FIND_WIDGET_VISIBLE,
        handler: x => x.replaceAll(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 5,
            kbExpr: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.focus, findModel_1.CONTEXT_REPLACE_INPUT_FOCUSED),
            primary: undefined,
            mac: {
                primary: 2048 /* CtrlCmd */ | 3 /* Enter */,
            }
        }
    }));
    editorExtensions_1.registerEditorCommand(new FindCommand({
        id: findModel_1.FIND_IDS.SelectAllMatchesAction,
        precondition: findModel_1.CONTEXT_FIND_WIDGET_VISIBLE,
        handler: x => x.selectAllMatches(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 5,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 512 /* Alt */ | 3 /* Enter */
        }
    }));
});
//# __sourceMappingURL=findController.js.map