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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/browser/editorExtensions", "vs/editor/common/editorContextKeys", "./gotoErrorWidget", "vs/editor/browser/services/codeEditorService", "vs/platform/actions/common/actions", "vs/base/common/codicons", "vs/platform/instantiation/common/instantiation", "vs/editor/contrib/gotoError/markerNavigationService"], function (require, exports, nls, lifecycle_1, contextkey_1, position_1, range_1, editorExtensions_1, editorContextKeys_1, gotoErrorWidget_1, codeEditorService_1, actions_1, codicons_1, instantiation_1, markerNavigationService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NextMarkerAction = exports.MarkerController = void 0;
    let MarkerController = class MarkerController {
        constructor(editor, _markerNavigationService, _contextKeyService, _editorService, _instantiationService) {
            this._markerNavigationService = _markerNavigationService;
            this._contextKeyService = _contextKeyService;
            this._editorService = _editorService;
            this._instantiationService = _instantiationService;
            this._sessionDispoables = new lifecycle_1.DisposableStore();
            this._editor = editor;
            this._widgetVisible = CONTEXT_MARKERS_NAVIGATION_VISIBLE.bindTo(this._contextKeyService);
        }
        static get(editor) {
            return editor.getContribution(MarkerController.ID);
        }
        dispose() {
            this._cleanUp();
            this._sessionDispoables.dispose();
        }
        _cleanUp() {
            this._widgetVisible.reset();
            this._sessionDispoables.clear();
            this._widget = undefined;
            this._model = undefined;
        }
        _getOrCreateModel(uri) {
            if (this._model && this._model.matches(uri)) {
                return this._model;
            }
            let reusePosition = false;
            if (this._model) {
                reusePosition = true;
                this._cleanUp();
            }
            this._model = this._markerNavigationService.getMarkerList(uri);
            if (reusePosition) {
                this._model.move(true, this._editor.getModel(), this._editor.getPosition());
            }
            this._widget = this._instantiationService.createInstance(gotoErrorWidget_1.MarkerNavigationWidget, this._editor);
            this._widget.onDidClose(() => this.close(), this, this._sessionDispoables);
            this._widgetVisible.set(true);
            this._sessionDispoables.add(this._model);
            this._sessionDispoables.add(this._widget);
            // follow cursor
            this._sessionDispoables.add(this._editor.onDidChangeCursorPosition(e => {
                var _a, _b, _c;
                if (!((_a = this._model) === null || _a === void 0 ? void 0 : _a.selected) || !range_1.Range.containsPosition((_b = this._model) === null || _b === void 0 ? void 0 : _b.selected.marker, e.position)) {
                    (_c = this._model) === null || _c === void 0 ? void 0 : _c.resetIndex();
                }
            }));
            // update markers
            this._sessionDispoables.add(this._model.onDidChange(() => {
                if (!this._widget || !this._widget.position || !this._model) {
                    return;
                }
                const info = this._model.find(this._editor.getModel().uri, this._widget.position);
                if (info) {
                    this._widget.updateMarker(info.marker);
                }
                else {
                    this._widget.showStale();
                }
            }));
            // open related
            this._sessionDispoables.add(this._widget.onDidSelectRelatedInformation(related => {
                this._editorService.openCodeEditor({
                    resource: related.resource,
                    options: { pinned: true, revealIfOpened: true, selection: range_1.Range.lift(related).collapseToStart() }
                }, this._editor);
                this.close(false);
            }));
            this._sessionDispoables.add(this._editor.onDidChangeModel(() => this._cleanUp()));
            return this._model;
        }
        close(focusEditor = true) {
            this._cleanUp();
            if (focusEditor) {
                this._editor.focus();
            }
        }
        showAtMarker(marker) {
            if (this._editor.hasModel()) {
                const model = this._getOrCreateModel(this._editor.getModel().uri);
                model.resetIndex();
                model.move(true, this._editor.getModel(), new position_1.Position(marker.startLineNumber, marker.startColumn));
                if (model.selected) {
                    this._widget.showAtMarker(model.selected.marker, model.selected.index, model.selected.total);
                }
            }
        }
        async nagivate(next, multiFile) {
            if (this._editor.hasModel()) {
                const model = this._getOrCreateModel(multiFile ? undefined : this._editor.getModel().uri);
                model.move(next, this._editor.getModel(), this._editor.getPosition());
                if (!model.selected) {
                    return;
                }
                if (model.selected.marker.resource.toString() !== this._editor.getModel().uri.toString()) {
                    // show in different editor
                    this._cleanUp();
                    const otherEditor = await this._editorService.openCodeEditor({
                        resource: model.selected.marker.resource,
                        options: { pinned: false, revealIfOpened: true, selectionRevealType: 2 /* NearTop */, selection: model.selected.marker }
                    }, this._editor);
                    if (otherEditor) {
                        MarkerController.get(otherEditor).close();
                        MarkerController.get(otherEditor).nagivate(next, multiFile);
                    }
                }
                else {
                    // show in this editor
                    this._widget.showAtMarker(model.selected.marker, model.selected.index, model.selected.total);
                }
            }
        }
    };
    MarkerController.ID = 'editor.contrib.markerController';
    MarkerController = __decorate([
        __param(1, markerNavigationService_1.IMarkerNavigationService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, instantiation_1.IInstantiationService)
    ], MarkerController);
    exports.MarkerController = MarkerController;
    class MarkerNavigationAction extends editorExtensions_1.EditorAction {
        constructor(_next, _multiFile, opts) {
            super(opts);
            this._next = _next;
            this._multiFile = _multiFile;
        }
        async run(_accessor, editor) {
            if (editor.hasModel()) {
                MarkerController.get(editor).nagivate(this._next, this._multiFile);
            }
        }
    }
    class NextMarkerAction extends MarkerNavigationAction {
        constructor() {
            super(true, false, {
                id: NextMarkerAction.ID,
                label: NextMarkerAction.LABEL,
                alias: 'Go to Next Problem (Error, Warning, Info)',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 512 /* Alt */ | 66 /* F8 */,
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    menuId: gotoErrorWidget_1.MarkerNavigationWidget.TitleMenu,
                    title: NextMarkerAction.LABEL,
                    icon: codicons_1.registerIcon('marker-navigation-next', codicons_1.Codicon.chevronDown),
                    group: 'navigation',
                    order: 1
                }
            });
        }
    }
    exports.NextMarkerAction = NextMarkerAction;
    NextMarkerAction.ID = 'editor.action.marker.next';
    NextMarkerAction.LABEL = nls.localize('markerAction.next.label', "Go to Next Problem (Error, Warning, Info)");
    class PrevMarkerAction extends MarkerNavigationAction {
        constructor() {
            super(false, false, {
                id: PrevMarkerAction.ID,
                label: PrevMarkerAction.LABEL,
                alias: 'Go to Previous Problem (Error, Warning, Info)',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 1024 /* Shift */ | 512 /* Alt */ | 66 /* F8 */,
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    menuId: gotoErrorWidget_1.MarkerNavigationWidget.TitleMenu,
                    title: NextMarkerAction.LABEL,
                    icon: codicons_1.registerIcon('marker-navigation-previous', codicons_1.Codicon.chevronUp),
                    group: 'navigation',
                    order: 2
                }
            });
        }
    }
    PrevMarkerAction.ID = 'editor.action.marker.prev';
    PrevMarkerAction.LABEL = nls.localize('markerAction.previous.label', "Go to Previous Problem (Error, Warning, Info)");
    class NextMarkerInFilesAction extends MarkerNavigationAction {
        constructor() {
            super(true, true, {
                id: 'editor.action.marker.nextInFiles',
                label: nls.localize('markerAction.nextInFiles.label', "Go to Next Problem in Files (Error, Warning, Info)"),
                alias: 'Go to Next Problem in Files (Error, Warning, Info)',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 66 /* F8 */,
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarGoMenu,
                    title: nls.localize({ key: 'miGotoNextProblem', comment: ['&& denotes a mnemonic'] }, "Next &&Problem"),
                    group: '6_problem_nav',
                    order: 1
                }
            });
        }
    }
    class PrevMarkerInFilesAction extends MarkerNavigationAction {
        constructor() {
            super(false, true, {
                id: 'editor.action.marker.prevInFiles',
                label: nls.localize('markerAction.previousInFiles.label', "Go to Previous Problem in Files (Error, Warning, Info)"),
                alias: 'Go to Previous Problem in Files (Error, Warning, Info)',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 1024 /* Shift */ | 66 /* F8 */,
                    weight: 100 /* EditorContrib */
                },
                menuOpts: {
                    menuId: actions_1.MenuId.MenubarGoMenu,
                    title: nls.localize({ key: 'miGotoPreviousProblem', comment: ['&& denotes a mnemonic'] }, "Previous &&Problem"),
                    group: '6_problem_nav',
                    order: 2
                }
            });
        }
    }
    editorExtensions_1.registerEditorContribution(MarkerController.ID, MarkerController);
    editorExtensions_1.registerEditorAction(NextMarkerAction);
    editorExtensions_1.registerEditorAction(PrevMarkerAction);
    editorExtensions_1.registerEditorAction(NextMarkerInFilesAction);
    editorExtensions_1.registerEditorAction(PrevMarkerInFilesAction);
    const CONTEXT_MARKERS_NAVIGATION_VISIBLE = new contextkey_1.RawContextKey('markersNavigationVisible', false);
    const MarkerCommand = editorExtensions_1.EditorCommand.bindToContribution(MarkerController.get);
    editorExtensions_1.registerEditorCommand(new MarkerCommand({
        id: 'closeMarkersNavigation',
        precondition: CONTEXT_MARKERS_NAVIGATION_VISIBLE,
        handler: x => x.close(),
        kbOpts: {
            weight: 100 /* EditorContrib */ + 50,
            kbExpr: editorContextKeys_1.EditorContextKeys.focus,
            primary: 9 /* Escape */,
            secondary: [1024 /* Shift */ | 9 /* Escape */]
        }
    }));
});
//# __sourceMappingURL=gotoError.js.map