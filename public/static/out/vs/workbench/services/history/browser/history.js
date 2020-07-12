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
define(["require", "exports", "vs/base/common/uri", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/history/common/history", "vs/platform/files/common/files", "vs/editor/common/core/selection", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/platform/registry/common/platform", "vs/base/common/event", "vs/platform/configuration/common/configuration", "vs/workbench/services/editor/common/editorGroupsService", "vs/editor/browser/editorBrowser", "vs/workbench/services/search/common/search", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/layout/browser/layoutService", "vs/platform/contextkey/common/contextkey", "vs/base/common/arrays", "vs/platform/instantiation/common/extensions", "vs/base/common/types", "vs/base/browser/dom", "vs/platform/workspaces/common/workspaces", "vs/base/common/network", "vs/base/common/errors", "vs/base/common/resources"], function (require, exports, uri_1, editor_1, editorService_1, history_1, files_1, selection_1, workspace_1, lifecycle_1, storage_1, platform_1, event_1, configuration_1, editorGroupsService_1, editorBrowser_1, search_1, instantiation_1, layoutService_1, contextkey_1, arrays_1, extensions_1, types_1, dom_1, workspaces_1, network_1, errors_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HistoryService = exports.TextEditorState = void 0;
    /**
     * Stores the selection & view state of an editor and allows to compare it to other selection states.
     */
    class TextEditorState {
        constructor(_editorInput, _selection) {
            this._editorInput = _editorInput;
            this._selection = _selection;
        }
        get editorInput() {
            return this._editorInput;
        }
        get selection() {
            return types_1.withNullAsUndefined(this._selection);
        }
        justifiesNewPushState(other, event) {
            if ((event === null || event === void 0 ? void 0 : event.source) === 'api') {
                return true; // always let API source win (e.g. "Go to definition" should add a history entry)
            }
            if (!this._editorInput.matches(other._editorInput)) {
                return true; // different editor inputs
            }
            if (!selection_1.Selection.isISelection(this._selection) || !selection_1.Selection.isISelection(other._selection)) {
                return true; // unknown selections
            }
            const thisLineNumber = Math.min(this._selection.selectionStartLineNumber, this._selection.positionLineNumber);
            const otherLineNumber = Math.min(other._selection.selectionStartLineNumber, other._selection.positionLineNumber);
            if (Math.abs(thisLineNumber - otherLineNumber) < TextEditorState.EDITOR_SELECTION_THRESHOLD) {
                return false; // ignore selection changes in the range of EditorState.EDITOR_SELECTION_THRESHOLD lines
            }
            return true;
        }
    }
    exports.TextEditorState = TextEditorState;
    TextEditorState.EDITOR_SELECTION_THRESHOLD = 10; // number of lines to move in editor to justify for new state
    let HistoryService = class HistoryService extends lifecycle_1.Disposable {
        constructor(editorService, editorGroupService, contextService, storageService, configurationService, fileService, workspacesService, instantiationService, layoutService, contextKeyService) {
            super();
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.contextService = contextService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.fileService = fileService;
            this.workspacesService = workspacesService;
            this.instantiationService = instantiationService;
            this.layoutService = layoutService;
            this.contextKeyService = contextKeyService;
            this.activeEditorListeners = this._register(new lifecycle_1.DisposableStore());
            this.editorHistoryListeners = new Map();
            this.editorStackListeners = new Map();
            this.editorInputFactory = platform_1.Registry.as(editor_1.Extensions.EditorInputFactories);
            this.navigationStack = [];
            this.navigationStackIndex = -1;
            this.lastNavigationStackIndex = -1;
            this.navigatingInStack = false;
            this.currentTextEditorState = null;
            this.recentlyClosedEditors = [];
            //#endregion
            //#region Context Keys
            this.canNavigateBackContextKey = (new contextkey_1.RawContextKey('canNavigateBack', false)).bindTo(this.contextKeyService);
            this.canNavigateForwardContextKey = (new contextkey_1.RawContextKey('canNavigateForward', false)).bindTo(this.contextKeyService);
            this.canNavigateToLastEditLocationContextKey = (new contextkey_1.RawContextKey('canNavigateToLastEditLocation', false)).bindTo(this.contextKeyService);
            this.canReopenClosedEditorContextKey = (new contextkey_1.RawContextKey('canReopenClosedEditor', false)).bindTo(this.contextKeyService);
            this.history = undefined;
            this.resourceExcludeMatcher = this._register(search_1.createResourceExcludeMatcher(this.instantiationService, this.configurationService));
            //#endregion
            //#region Editor Most Recently Used History
            this.recentlyUsedEditorsStack = undefined;
            this.recentlyUsedEditorsStackIndex = 0;
            this.recentlyUsedEditorsInGroupStack = undefined;
            this.recentlyUsedEditorsInGroupStackIndex = 0;
            this.navigatingInRecentlyUsedEditorsStack = false;
            this.navigatingInRecentlyUsedEditorsInGroupStack = false;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.editorService.onDidActiveEditorChange(() => this.onActiveEditorChanged()));
            this._register(this.editorService.onDidOpenEditorFail(event => this.remove(event.editor)));
            this._register(this.editorService.onDidCloseEditor(event => this.onEditorClosed(event)));
            this._register(this.storageService.onWillSaveState(() => this.saveState()));
            this._register(this.fileService.onDidFilesChange(event => this.onDidFilesChange(event)));
            this._register(this.resourceExcludeMatcher.onExpressionChange(() => this.removeExcludedFromHistory()));
            this._register(this.editorService.onDidMostRecentlyActiveEditorsChange(() => this.handleEditorEventInRecentEditorsStack()));
            // if the service is created late enough that an editor is already opened
            // make sure to trigger the onActiveEditorChanged() to track the editor
            // properly (fixes https://github.com/Microsoft/vscode/issues/59908)
            if (this.editorService.activeEditorPane) {
                this.onActiveEditorChanged();
            }
            // Mouse back/forward support
            const mouseBackForwardSupportListener = this._register(new lifecycle_1.DisposableStore());
            const handleMouseBackForwardSupport = () => {
                mouseBackForwardSupportListener.clear();
                if (this.configurationService.getValue('workbench.editor.mouseBackForwardToNavigate')) {
                    mouseBackForwardSupportListener.add(dom_1.addDisposableListener(this.layoutService.container, dom_1.EventType.MOUSE_DOWN, e => this.onMouseDown(e)));
                }
            };
            this._register(this.configurationService.onDidChangeConfiguration(event => {
                if (event.affectsConfiguration('workbench.editor.mouseBackForwardToNavigate')) {
                    handleMouseBackForwardSupport();
                }
            }));
            handleMouseBackForwardSupport();
        }
        onMouseDown(e) {
            // Support to navigate in history when mouse buttons 4/5 are pressed
            switch (e.button) {
                case 3:
                    dom_1.EventHelper.stop(e);
                    this.back();
                    break;
                case 4:
                    dom_1.EventHelper.stop(e);
                    this.forward();
                    break;
            }
        }
        onActiveEditorChanged() {
            const activeEditorPane = this.editorService.activeEditorPane;
            if (this.lastActiveEditor && this.matchesEditor(this.lastActiveEditor, activeEditorPane)) {
                return; // return if the active editor is still the same
            }
            // Remember as last active editor (can be undefined if none opened)
            this.lastActiveEditor = (activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.input) && activeEditorPane.group ? { editor: activeEditorPane.input, groupId: activeEditorPane.group.id } : undefined;
            // Dispose old listeners
            this.activeEditorListeners.clear();
            // Propagate to history
            this.handleActiveEditorChange(activeEditorPane);
            // Apply listener for selection changes if this is a text editor
            const activeTextEditorControl = editorBrowser_1.getCodeEditor(this.editorService.activeTextEditorControl);
            const activeEditor = this.editorService.activeEditor;
            if (activeTextEditorControl) {
                // Debounce the event with a timeout of 0ms so that multiple calls to
                // editor.setSelection() are folded into one. We do not want to record
                // subsequent history navigations for such API calls.
                this.activeEditorListeners.add(event_1.Event.debounce(activeTextEditorControl.onDidChangeCursorPosition, (last, event) => event, 0)((event => {
                    this.handleEditorSelectionChangeEvent(activeEditorPane, event);
                })));
                // Track the last edit location by tracking model content change events
                // Use a debouncer to make sure to capture the correct cursor position
                // after the model content has changed.
                this.activeEditorListeners.add(event_1.Event.debounce(activeTextEditorControl.onDidChangeModelContent, (last, event) => event, 0)((event => {
                    if (activeEditor) {
                        this.rememberLastEditLocation(activeEditor, activeTextEditorControl);
                    }
                })));
            }
        }
        matchesEditor(identifier, editor) {
            if (!editor || !editor.group) {
                return false;
            }
            if (identifier.groupId !== editor.group.id) {
                return false;
            }
            return identifier.editor.matches(editor.input);
        }
        onDidFilesChange(e) {
            if (e.gotDeleted()) {
                this.remove(e); // remove from history files that got deleted or moved
            }
        }
        handleEditorSelectionChangeEvent(editor, event) {
            this.handleEditorEventInNavigationStack(editor, event);
        }
        handleActiveEditorChange(editor) {
            this.handleEditorEventInHistory(editor);
            this.handleEditorEventInNavigationStack(editor);
        }
        onEditorDispose(editor, listener, mapEditorToDispose) {
            const toDispose = event_1.Event.once(editor.onDispose)(() => listener());
            let disposables = mapEditorToDispose.get(editor);
            if (!disposables) {
                disposables = new lifecycle_1.DisposableStore();
                mapEditorToDispose.set(editor, disposables);
            }
            disposables.add(toDispose);
        }
        clearOnEditorDispose(editor, mapEditorToDispose) {
            if (editor instanceof editor_1.EditorInput) {
                const disposables = mapEditorToDispose.get(editor);
                if (disposables) {
                    lifecycle_1.dispose(disposables);
                    mapEditorToDispose.delete(editor);
                }
            }
        }
        remove(arg1) {
            this.removeFromHistory(arg1);
            this.removeFromNavigationStack(arg1);
            this.removeFromRecentlyClosedEditors(arg1);
            this.removeFromRecentlyOpened(arg1);
        }
        removeFromRecentlyOpened(arg1) {
            if (arg1 instanceof editor_1.EditorInput || arg1 instanceof files_1.FileChangesEvent) {
                return; // for now do not delete from file events since recently open are likely out of workspace files for which there are no delete events
            }
            const input = arg1;
            this.workspacesService.removeRecentlyOpened([input.resource]);
        }
        clear() {
            // History
            this.clearRecentlyOpened();
            // Navigation (next, previous)
            this.navigationStackIndex = -1;
            this.lastNavigationStackIndex = -1;
            this.navigationStack.splice(0);
            this.editorStackListeners.forEach(listeners => lifecycle_1.dispose(listeners));
            this.editorStackListeners.clear();
            // Recently closed editors
            this.recentlyClosedEditors = [];
            // Context Keys
            this.updateContextKeys();
        }
        forward() {
            if (this.navigationStack.length > this.navigationStackIndex + 1) {
                this.setIndex(this.navigationStackIndex + 1);
                this.navigate();
            }
        }
        back() {
            if (this.navigationStackIndex > 0) {
                this.setIndex(this.navigationStackIndex - 1);
                this.navigate();
            }
        }
        last() {
            if (this.lastNavigationStackIndex === -1) {
                this.back();
            }
            else {
                this.setIndex(this.lastNavigationStackIndex);
                this.navigate();
            }
        }
        setIndex(value) {
            this.lastNavigationStackIndex = this.navigationStackIndex;
            this.navigationStackIndex = value;
            // Context Keys
            this.updateContextKeys();
        }
        navigate() {
            this.navigatingInStack = true;
            const navigateToStackEntry = this.navigationStack[this.navigationStackIndex];
            this.doNavigate(navigateToStackEntry).finally(() => { this.navigatingInStack = false; });
        }
        doNavigate(location) {
            const options = {
                revealIfOpened: true,
                selection: location.selection,
                selectionRevealType: 1 /* CenterIfOutsideViewport */
            };
            if (location.input instanceof editor_1.EditorInput) {
                return this.editorService.openEditor(location.input, options);
            }
            return this.editorService.openEditor({ resource: location.input.resource, options });
        }
        handleEditorEventInNavigationStack(control, event) {
            const codeEditor = control ? editorBrowser_1.getCodeEditor(control.getControl()) : undefined;
            // treat editor changes that happen as part of stack navigation specially
            // we do not want to add a new stack entry as a matter of navigating the
            // stack but we need to keep our currentTextEditorState up to date with
            // the navigtion that occurs.
            if (this.navigatingInStack) {
                if (codeEditor && (control === null || control === void 0 ? void 0 : control.input) && !control.input.isDisposed()) {
                    this.currentTextEditorState = new TextEditorState(control.input, codeEditor.getSelection());
                }
                else {
                    this.currentTextEditorState = null; // we navigated to a non text or disposed editor
                }
            }
            // normal navigation not part of history navigation
            else {
                // navigation inside text editor
                if (codeEditor && (control === null || control === void 0 ? void 0 : control.input) && !control.input.isDisposed()) {
                    this.handleTextEditorEventInNavigationStack(control, codeEditor, event);
                }
                // navigation to non-text disposed editor
                else {
                    this.currentTextEditorState = null; // at this time we have no active text editor view state
                    if ((control === null || control === void 0 ? void 0 : control.input) && !control.input.isDisposed()) {
                        this.handleNonTextEditorEventInNavigationStack(control);
                    }
                }
            }
        }
        handleTextEditorEventInNavigationStack(editor, editorControl, event) {
            if (!editor.input) {
                return;
            }
            const stateCandidate = new TextEditorState(editor.input, editorControl.getSelection());
            // Add to stack if we dont have a current state or this new state justifies a push
            if (!this.currentTextEditorState || this.currentTextEditorState.justifiesNewPushState(stateCandidate, event)) {
                this.addToNavigationStack(editor.input, stateCandidate.selection);
            }
            // Otherwise we replace the current stack entry with this one
            else {
                this.replaceInNavigationStack(editor.input, stateCandidate.selection);
            }
            // Update our current text editor state
            this.currentTextEditorState = stateCandidate;
        }
        handleNonTextEditorEventInNavigationStack(editor) {
            if (!editor.input) {
                return;
            }
            const currentStack = this.navigationStack[this.navigationStackIndex];
            if (currentStack && this.matches(editor.input, currentStack.input)) {
                return; // do not push same editor input again
            }
            this.addToNavigationStack(editor.input);
        }
        addToNavigationStack(input, selection) {
            if (!this.navigatingInStack) {
                this.doAddOrReplaceInNavigationStack(input, selection);
            }
        }
        replaceInNavigationStack(input, selection) {
            if (!this.navigatingInStack) {
                this.doAddOrReplaceInNavigationStack(input, selection, true /* force replace */);
            }
        }
        doAddOrReplaceInNavigationStack(input, selection, forceReplace) {
            // Overwrite an entry in the stack if we have a matching input that comes
            // with editor options to indicate that this entry is more specific. Also
            // prevent entries that have the exact same options. Finally, Overwrite
            // entries if we detect that the change came in very fast which indicates
            // that it was not coming in from a user change but rather rapid programmatic
            // changes. We just take the last of the changes to not cause too many entries
            // on the stack.
            // We can also be instructed to force replace the last entry.
            let replace = false;
            const currentEntry = this.navigationStack[this.navigationStackIndex];
            if (currentEntry) {
                if (forceReplace) {
                    replace = true; // replace if we are forced to
                }
                else if (this.matches(input, currentEntry.input) && this.sameSelection(currentEntry.selection, selection)) {
                    replace = true; // replace if the input is the same as the current one and the selection as well
                }
            }
            const stackEditorInput = this.preferResourceEditorInput(input);
            const entry = { input: stackEditorInput, selection };
            // Replace at current position
            let removedEntries = [];
            if (replace) {
                removedEntries.push(this.navigationStack[this.navigationStackIndex]);
                this.navigationStack[this.navigationStackIndex] = entry;
            }
            // Add to stack at current position
            else {
                // If we are not at the end of history, we remove anything after
                if (this.navigationStack.length > this.navigationStackIndex + 1) {
                    for (let i = this.navigationStackIndex + 1; i < this.navigationStack.length; i++) {
                        removedEntries.push(this.navigationStack[i]);
                    }
                    this.navigationStack = this.navigationStack.slice(0, this.navigationStackIndex + 1);
                }
                // Insert entry at index
                this.navigationStack.splice(this.navigationStackIndex + 1, 0, entry);
                // Check for limit
                if (this.navigationStack.length > HistoryService.MAX_NAVIGATION_STACK_ITEMS) {
                    removedEntries.push(this.navigationStack.shift()); // remove first
                    if (this.lastNavigationStackIndex >= 0) {
                        this.lastNavigationStackIndex--;
                    }
                }
                else {
                    this.setIndex(this.navigationStackIndex + 1);
                }
            }
            // Clear editor listeners from removed entries
            removedEntries.forEach(removedEntry => this.clearOnEditorDispose(removedEntry.input, this.editorStackListeners));
            // Remove this from the stack unless the stack input is a resource
            // that can easily be restored even when the input gets disposed
            if (stackEditorInput instanceof editor_1.EditorInput) {
                this.onEditorDispose(stackEditorInput, () => this.removeFromNavigationStack(stackEditorInput), this.editorStackListeners);
            }
            // Context Keys
            this.updateContextKeys();
        }
        preferResourceEditorInput(input) {
            const resource = input.resource;
            if (resource && (resource.scheme === network_1.Schemas.file || resource.scheme === network_1.Schemas.vscodeRemote || resource.scheme === network_1.Schemas.userData)) {
                // for now, only prefer well known schemes that we control to prevent
                // issues such as https://github.com/microsoft/vscode/issues/85204
                return { resource };
            }
            return input;
        }
        sameSelection(selectionA, selectionB) {
            if (!selectionA && !selectionB) {
                return true;
            }
            if (!selectionA || !selectionB) {
                return false;
            }
            return selectionA.startLineNumber === selectionB.startLineNumber; // we consider the history entry same if we are on the same line
        }
        removeFromNavigationStack(arg1) {
            this.navigationStack = this.navigationStack.filter(e => {
                const matches = this.matches(arg1, e.input);
                // Cleanup any listeners associated with the input when removing
                if (matches) {
                    this.clearOnEditorDispose(arg1, this.editorStackListeners);
                }
                return !matches;
            });
            this.navigationStackIndex = this.navigationStack.length - 1; // reset index
            this.lastNavigationStackIndex = -1;
            // Context Keys
            this.updateContextKeys();
        }
        matches(arg1, inputB) {
            if (arg1 instanceof files_1.FileChangesEvent) {
                if (inputB instanceof editor_1.EditorInput) {
                    return false; // we only support this for IResourceEditorInput
                }
                const resourceEditorInputB = inputB;
                return arg1.contains(resourceEditorInputB.resource, 2 /* DELETED */);
            }
            if (arg1 instanceof editor_1.EditorInput && inputB instanceof editor_1.EditorInput) {
                return arg1.matches(inputB);
            }
            if (arg1 instanceof editor_1.EditorInput) {
                return this.matchesFile(inputB.resource, arg1);
            }
            if (inputB instanceof editor_1.EditorInput) {
                return this.matchesFile(arg1.resource, inputB);
            }
            const resourceEditorInputA = arg1;
            const resourceEditorInputB = inputB;
            return resourceEditorInputA && resourceEditorInputB && resources_1.extUri.isEqual(resourceEditorInputA.resource, resourceEditorInputB.resource);
        }
        matchesFile(resource, arg2) {
            if (arg2 instanceof files_1.FileChangesEvent) {
                return arg2.contains(resource, 2 /* DELETED */);
            }
            if (arg2 instanceof editor_1.EditorInput) {
                const inputResource = arg2.resource;
                if (!inputResource) {
                    return false;
                }
                if (this.layoutService.isRestored() && !this.fileService.canHandleResource(inputResource)) {
                    return false; // make sure to only check this when workbench has restored (for https://github.com/Microsoft/vscode/issues/48275)
                }
                return resources_1.extUri.isEqual(inputResource, resource);
            }
            const resourceEditorInput = arg2;
            return resources_1.extUri.isEqual(resourceEditorInput === null || resourceEditorInput === void 0 ? void 0 : resourceEditorInput.resource, resource);
        }
        onEditorClosed(event) {
            const { editor, replaced } = event;
            if (replaced) {
                return; // ignore if editor was replaced
            }
            const factory = this.editorInputFactory.getEditorInputFactory(editor.getTypeId());
            if (!factory || !factory.canSerialize(editor)) {
                return; // we need a factory from this point that can serialize this editor
            }
            const serialized = factory.serialize(editor);
            if (typeof serialized !== 'string') {
                return; // we need something to deserialize from
            }
            const associatedResources = [];
            const editorResource = editor_1.toResource(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH });
            if (uri_1.URI.isUri(editorResource)) {
                associatedResources.push(editorResource);
            }
            else if (editorResource) {
                associatedResources.push(...arrays_1.coalesce([editorResource.primary, editorResource.secondary]));
            }
            // Remove from list of recently closed before...
            this.removeFromRecentlyClosedEditors(editor);
            // ...adding it as last recently closed
            this.recentlyClosedEditors.push({
                resource: editor.resource,
                associatedResources,
                serialized: { typeId: editor.getTypeId(), value: serialized },
                index: event.index,
                sticky: event.sticky
            });
            // Bounding
            if (this.recentlyClosedEditors.length > HistoryService.MAX_RECENTLY_CLOSED_EDITORS) {
                this.recentlyClosedEditors.shift();
            }
            // Context
            this.canReopenClosedEditorContextKey.set(true);
        }
        reopenLastClosedEditor() {
            // Open editor if we have one
            const lastClosedEditor = this.recentlyClosedEditors.pop();
            if (lastClosedEditor) {
                this.doReopenLastClosedEditor(lastClosedEditor);
            }
            // Update context
            this.canReopenClosedEditorContextKey.set(this.recentlyClosedEditors.length > 0);
        }
        async doReopenLastClosedEditor(lastClosedEditor) {
            var _a;
            // Determine editor options
            let options;
            if (lastClosedEditor.sticky) {
                // Sticky: in case the target index is outside of the range of
                // sticky editors, we make sure to not provide the index as
                // option. Otherwise the index will cause the sticky flag to
                // be ignored.
                if (!this.editorGroupService.activeGroup.isSticky(lastClosedEditor.index)) {
                    options = { pinned: true, sticky: true, ignoreError: true };
                }
                else {
                    options = { pinned: true, sticky: true, index: lastClosedEditor.index, ignoreError: true };
                }
            }
            else {
                options = { pinned: true, index: lastClosedEditor.index, ignoreError: true };
            }
            // Deserialize and open editor unless already opened
            const restoredEditor = (_a = this.editorInputFactory.getEditorInputFactory(lastClosedEditor.serialized.typeId)) === null || _a === void 0 ? void 0 : _a.deserialize(this.instantiationService, lastClosedEditor.serialized.value);
            let editorPane = undefined;
            if (restoredEditor && !this.editorGroupService.activeGroup.isOpened(restoredEditor)) {
                editorPane = await this.editorService.openEditor(restoredEditor, options);
            }
            // If no editor was opened, try with the next one
            if (!editorPane) {
                // Fix for https://github.com/Microsoft/vscode/issues/67882
                // If opening of the editor fails, make sure to try the next one
                // but make sure to remove this one from the list to prevent
                // endless loops.
                arrays_1.remove(this.recentlyClosedEditors, lastClosedEditor);
                this.reopenLastClosedEditor();
            }
        }
        removeFromRecentlyClosedEditors(arg1) {
            this.recentlyClosedEditors = this.recentlyClosedEditors.filter(recentlyClosedEditor => {
                if (recentlyClosedEditor.resource && this.matchesFile(recentlyClosedEditor.resource, arg1)) {
                    return false; // editor matches directly
                }
                if (recentlyClosedEditor.associatedResources.some(associatedResource => this.matchesFile(associatedResource, arg1))) {
                    return false; // an associated resource matches
                }
                return true;
            });
            // Update context
            this.canReopenClosedEditorContextKey.set(this.recentlyClosedEditors.length > 0);
        }
        rememberLastEditLocation(activeEditor, activeTextEditorControl) {
            this.lastEditLocation = { input: activeEditor };
            this.canNavigateToLastEditLocationContextKey.set(true);
            const position = activeTextEditorControl.getPosition();
            if (position) {
                this.lastEditLocation.selection = new selection_1.Selection(position.lineNumber, position.column, position.lineNumber, position.column);
            }
        }
        openLastEditLocation() {
            if (this.lastEditLocation) {
                this.doNavigate(this.lastEditLocation);
            }
        }
        updateContextKeys() {
            this.canNavigateBackContextKey.set(this.navigationStack.length > 0 && this.navigationStackIndex > 0);
            this.canNavigateForwardContextKey.set(this.navigationStack.length > 0 && this.navigationStackIndex < this.navigationStack.length - 1);
            this.canNavigateToLastEditLocationContextKey.set(!!this.lastEditLocation);
            this.canReopenClosedEditorContextKey.set(this.recentlyClosedEditors.length > 0);
        }
        handleEditorEventInHistory(editor) {
            // Ensure we have not configured to exclude input and don't track invalid inputs
            const input = editor === null || editor === void 0 ? void 0 : editor.input;
            if (!input || input.isDisposed() || !this.include(input)) {
                return;
            }
            const historyInput = this.preferResourceEditorInput(input);
            // Remove any existing entry and add to the beginning
            this.ensureHistoryLoaded(this.history);
            this.removeFromHistory(input);
            this.history.unshift(historyInput);
            // Respect max entries setting
            if (this.history.length > HistoryService.MAX_HISTORY_ITEMS) {
                this.clearOnEditorDispose(this.history.pop(), this.editorHistoryListeners);
            }
            // Remove this from the history unless the history input is a resource
            // that can easily be restored even when the input gets disposed
            if (historyInput instanceof editor_1.EditorInput) {
                this.onEditorDispose(historyInput, () => this.removeFromHistory(historyInput), this.editorHistoryListeners);
            }
        }
        include(input) {
            if (input instanceof editor_1.EditorInput) {
                return true; // include any non files
            }
            const resourceEditorInput = input;
            return !this.resourceExcludeMatcher.matches(resourceEditorInput.resource);
        }
        removeExcludedFromHistory() {
            this.ensureHistoryLoaded(this.history);
            this.history = this.history.filter(e => {
                const include = this.include(e);
                // Cleanup any listeners associated with the input when removing from history
                if (!include) {
                    this.clearOnEditorDispose(e, this.editorHistoryListeners);
                }
                return include;
            });
        }
        removeFromHistory(arg1) {
            this.ensureHistoryLoaded(this.history);
            this.history = this.history.filter(e => {
                const matches = this.matches(arg1, e);
                // Cleanup any listeners associated with the input when removing from history
                if (matches) {
                    this.clearOnEditorDispose(arg1, this.editorHistoryListeners);
                }
                return !matches;
            });
        }
        clearRecentlyOpened() {
            this.history = [];
            this.editorHistoryListeners.forEach(listeners => lifecycle_1.dispose(listeners));
            this.editorHistoryListeners.clear();
        }
        getHistory() {
            this.ensureHistoryLoaded(this.history);
            return this.history.slice(0);
        }
        ensureHistoryLoaded(history) {
            if (!this.history) {
                this.history = this.loadHistory();
            }
        }
        loadHistory() {
            let entries = [];
            const entriesRaw = this.storageService.get(HistoryService.HISTORY_STORAGE_KEY, 1 /* WORKSPACE */);
            if (entriesRaw) {
                try {
                    entries = arrays_1.coalesce(JSON.parse(entriesRaw));
                }
                catch (error) {
                    errors_1.onUnexpectedError(error); // https://github.com/microsoft/vscode/issues/99075
                }
            }
            return arrays_1.coalesce(entries.map(entry => {
                try {
                    return this.safeLoadHistoryEntry(entry);
                }
                catch (error) {
                    return undefined; // https://github.com/Microsoft/vscode/issues/60960
                }
            }));
        }
        safeLoadHistoryEntry(entry) {
            const serializedEditorHistoryEntry = entry;
            // File resource: via URI.revive()
            if (serializedEditorHistoryEntry.resourceJSON) {
                return { resource: uri_1.URI.revive(serializedEditorHistoryEntry.resourceJSON) };
            }
            // Editor input: via factory
            const { editorInputJSON } = serializedEditorHistoryEntry;
            if (editorInputJSON === null || editorInputJSON === void 0 ? void 0 : editorInputJSON.deserialized) {
                const factory = this.editorInputFactory.getEditorInputFactory(editorInputJSON.typeId);
                if (factory) {
                    const input = factory.deserialize(this.instantiationService, editorInputJSON.deserialized);
                    if (input) {
                        this.onEditorDispose(input, () => this.removeFromHistory(input), this.editorHistoryListeners);
                    }
                    return types_1.withNullAsUndefined(input);
                }
            }
            return undefined;
        }
        saveState() {
            if (!this.history) {
                return; // nothing to save because history was not used
            }
            const entries = arrays_1.coalesce(this.history.map((input) => {
                // Editor input: try via factory
                if (input instanceof editor_1.EditorInput) {
                    const factory = this.editorInputFactory.getEditorInputFactory(input.getTypeId());
                    if (factory) {
                        const deserialized = factory.serialize(input);
                        if (deserialized) {
                            return { editorInputJSON: { typeId: input.getTypeId(), deserialized } };
                        }
                    }
                }
                // File resource: via URI.toJSON()
                else {
                    return { resourceJSON: input.resource.toJSON() };
                }
                return undefined;
            }));
            this.storageService.store(HistoryService.HISTORY_STORAGE_KEY, JSON.stringify(entries), 1 /* WORKSPACE */);
        }
        //#endregion
        //#region Last Active Workspace/File
        getLastActiveWorkspaceRoot(schemeFilter) {
            // No Folder: return early
            const folders = this.contextService.getWorkspace().folders;
            if (folders.length === 0) {
                return undefined;
            }
            // Single Folder: return early
            if (folders.length === 1) {
                const resource = folders[0].uri;
                if (!schemeFilter || resource.scheme === schemeFilter) {
                    return resource;
                }
                return undefined;
            }
            // Multiple folders: find the last active one
            for (const input of this.getHistory()) {
                if (input instanceof editor_1.EditorInput) {
                    continue;
                }
                const resourceEditorInput = input;
                if (schemeFilter && resourceEditorInput.resource.scheme !== schemeFilter) {
                    continue;
                }
                const resourceWorkspace = this.contextService.getWorkspaceFolder(resourceEditorInput.resource);
                if (resourceWorkspace) {
                    return resourceWorkspace.uri;
                }
            }
            // fallback to first workspace matching scheme filter if any
            for (const folder of folders) {
                const resource = folder.uri;
                if (!schemeFilter || resource.scheme === schemeFilter) {
                    return resource;
                }
            }
            return undefined;
        }
        getLastActiveFile(filterByScheme) {
            for (const input of this.getHistory()) {
                let resource;
                if (input instanceof editor_1.EditorInput) {
                    resource = editor_1.toResource(input, { filterByScheme });
                }
                else {
                    resource = input.resource;
                }
                if ((resource === null || resource === void 0 ? void 0 : resource.scheme) === filterByScheme) {
                    return resource;
                }
            }
            return undefined;
        }
        openNextRecentlyUsedEditor(groupId) {
            const [stack, index] = this.ensureRecentlyUsedStack(index => index - 1, groupId);
            this.doNavigateInRecentlyUsedEditorsStack(stack[index], groupId);
        }
        openPreviouslyUsedEditor(groupId) {
            const [stack, index] = this.ensureRecentlyUsedStack(index => index + 1, groupId);
            this.doNavigateInRecentlyUsedEditorsStack(stack[index], groupId);
        }
        doNavigateInRecentlyUsedEditorsStack(editorIdentifier, groupId) {
            if (editorIdentifier) {
                const acrossGroups = typeof groupId !== 'number' || !this.editorGroupService.getGroup(groupId);
                if (acrossGroups) {
                    this.navigatingInRecentlyUsedEditorsStack = true;
                }
                else {
                    this.navigatingInRecentlyUsedEditorsInGroupStack = true;
                }
                this.editorService.openEditor(editorIdentifier.editor, undefined, editorIdentifier.groupId).finally(() => {
                    if (acrossGroups) {
                        this.navigatingInRecentlyUsedEditorsStack = false;
                    }
                    else {
                        this.navigatingInRecentlyUsedEditorsInGroupStack = false;
                    }
                });
            }
        }
        ensureRecentlyUsedStack(indexModifier, groupId) {
            let editors;
            let index;
            const group = typeof groupId === 'number' ? this.editorGroupService.getGroup(groupId) : undefined;
            // Across groups
            if (!group) {
                editors = this.recentlyUsedEditorsStack || this.editorService.getEditors(0 /* MOST_RECENTLY_ACTIVE */);
                index = this.recentlyUsedEditorsStackIndex;
            }
            // Within group
            else {
                editors = this.recentlyUsedEditorsInGroupStack || group.getEditors(0 /* MOST_RECENTLY_ACTIVE */).map(editor => ({ groupId: group.id, editor }));
                index = this.recentlyUsedEditorsInGroupStackIndex;
            }
            // Adjust index
            let newIndex = indexModifier(index);
            if (newIndex < 0) {
                newIndex = 0;
            }
            else if (newIndex > editors.length - 1) {
                newIndex = editors.length - 1;
            }
            // Remember index and editors
            if (!group) {
                this.recentlyUsedEditorsStack = editors;
                this.recentlyUsedEditorsStackIndex = newIndex;
            }
            else {
                this.recentlyUsedEditorsInGroupStack = editors;
                this.recentlyUsedEditorsInGroupStackIndex = newIndex;
            }
            return [editors, newIndex];
        }
        handleEditorEventInRecentEditorsStack() {
            // Drop all-editors stack unless navigating in all editors
            if (!this.navigatingInRecentlyUsedEditorsStack) {
                this.recentlyUsedEditorsStack = undefined;
                this.recentlyUsedEditorsStackIndex = 0;
            }
            // Drop in-group-editors stack unless navigating in group
            if (!this.navigatingInRecentlyUsedEditorsInGroupStack) {
                this.recentlyUsedEditorsInGroupStack = undefined;
                this.recentlyUsedEditorsInGroupStackIndex = 0;
            }
        }
    };
    //#region Navigation (Go Forward, Go Backward)
    HistoryService.MAX_NAVIGATION_STACK_ITEMS = 50;
    //#endregion
    //#region Recently Closed Editors
    HistoryService.MAX_RECENTLY_CLOSED_EDITORS = 20;
    //#endregion
    //#region History
    HistoryService.MAX_HISTORY_ITEMS = 200;
    HistoryService.HISTORY_STORAGE_KEY = 'history.entries';
    HistoryService = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, editorGroupsService_1.IEditorGroupsService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, files_1.IFileService),
        __param(6, workspaces_1.IWorkspacesService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, layoutService_1.IWorkbenchLayoutService),
        __param(9, contextkey_1.IContextKeyService)
    ], HistoryService);
    exports.HistoryService = HistoryService;
    extensions_1.registerSingleton(history_1.IHistoryService, HistoryService);
});
//# __sourceMappingURL=history.js.map