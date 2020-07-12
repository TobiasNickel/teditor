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
define(["require", "exports", "vs/base/common/map", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/base/common/lifecycle", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/notebookEditorInput", "vs/platform/instantiation/common/extensions", "vs/workbench/services/editor/common/editorService"], function (require, exports, map_1, notebookEditorWidget_1, lifecycle_1, editorGroupsService_1, instantiation_1, notebookEditorInput_1, extensions_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.INotebookEditorWidgetService = void 0;
    exports.INotebookEditorWidgetService = instantiation_1.createDecorator('INotebookEditorWidgetService');
    let NotebookEditorWidgetService = class NotebookEditorWidgetService {
        constructor(editorGroupService, editorService) {
            this._tokenPool = 1;
            this._notebookWidgets = new Map();
            this._disposables = new lifecycle_1.DisposableStore();
            const groupListener = new Map();
            const onNewGroup = (group) => {
                const { id } = group;
                const listener = group.onDidGroupChange(e => {
                    const widgets = this._notebookWidgets.get(group.id);
                    if (!widgets || e.kind !== 3 /* EDITOR_CLOSE */ || !(e.editor instanceof notebookEditorInput_1.NotebookEditorInput)) {
                        return;
                    }
                    const value = widgets.get(e.editor.resource);
                    if (!value) {
                        return;
                    }
                    value.token = undefined;
                    this._disposeWidget(value.widget);
                    widgets.delete(e.editor.resource);
                });
                groupListener.set(id, listener);
            };
            this._disposables.add(editorGroupService.onDidAddGroup(onNewGroup));
            editorGroupService.groups.forEach(onNewGroup);
            // group removed -> clean up listeners, clean up widgets
            this._disposables.add(editorGroupService.onDidRemoveGroup(group => {
                const listener = groupListener.get(group.id);
                if (listener) {
                    listener.dispose();
                    groupListener.delete(group.id);
                }
                const widgets = this._notebookWidgets.get(group.id);
                this._notebookWidgets.delete(group.id);
                if (widgets) {
                    for (let value of widgets.values()) {
                        value.token = undefined;
                        this._disposeWidget(value.widget);
                    }
                }
            }));
            // HACK
            // we use the open override to spy on tab movements because that's the only
            // way to do that...
            this._disposables.add(editorService.overrideOpenEditor({
                open: (input, _options, group, context) => {
                    if (input instanceof notebookEditorInput_1.NotebookEditorInput && context === 2 /* MOVE_EDITOR */) {
                        // when moving a notebook editor we release it from its current tab and we
                        // "place" it into its future slot so that the editor can pick it up from there
                        this._freeWidget(input, editorGroupService.activeGroup, group);
                    }
                    return undefined;
                }
            }));
        }
        _disposeWidget(widget) {
            widget.onWillHide();
            widget.getDomNode().remove();
            widget.dispose();
        }
        _freeWidget(input, source, target) {
            var _a, _b, _c;
            const targetWidget = (_a = this._notebookWidgets.get(target.id)) === null || _a === void 0 ? void 0 : _a.get(input.resource);
            if (targetWidget) {
                // not needed
                return;
            }
            const widget = (_b = this._notebookWidgets.get(source.id)) === null || _b === void 0 ? void 0 : _b.get(input.resource);
            if (!widget) {
                throw new Error('no widget at source group');
            }
            (_c = this._notebookWidgets.get(source.id)) === null || _c === void 0 ? void 0 : _c.delete(input.resource);
            widget.token = undefined;
            let targetMap = this._notebookWidgets.get(target.id);
            if (!targetMap) {
                targetMap = new map_1.ResourceMap();
                this._notebookWidgets.set(target.id, targetMap);
            }
            targetMap.set(input.resource, widget);
        }
        retrieveWidget(accessor, group, input) {
            var _a;
            let value = (_a = this._notebookWidgets.get(group.id)) === null || _a === void 0 ? void 0 : _a.get(input.resource);
            if (!value) {
                // NEW widget
                const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                const widget = instantiationService.createInstance(notebookEditorWidget_1.NotebookEditorWidget);
                widget.createEditor();
                const token = this._tokenPool++;
                value = { widget, token };
                let map = this._notebookWidgets.get(group.id);
                if (!map) {
                    map = new map_1.ResourceMap();
                    this._notebookWidgets.set(group.id, map);
                }
                map.set(input.resource, value);
            }
            else {
                // reuse a widget which was either free'ed before or which
                // is simply being reused...
                value.token = this._tokenPool++;
            }
            return this._createBorrowValue(value.token, value);
        }
        _createBorrowValue(myToken, widget) {
            return {
                get value() {
                    return widget.token === myToken ? widget.widget : undefined;
                }
            };
        }
    };
    NotebookEditorWidgetService = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, editorService_1.IEditorService)
    ], NotebookEditorWidgetService);
    extensions_1.registerSingleton(exports.INotebookEditorWidgetService, NotebookEditorWidgetService, true);
});
//# __sourceMappingURL=notebookEditorWidgetService.js.map