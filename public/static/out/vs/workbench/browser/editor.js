/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/browser/parts/editor/baseEditor", "vs/base/common/arrays", "vs/base/common/lifecycle"], function (require, exports, platform_1, baseEditor_1, arrays_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extensions = exports.EditorDescriptor = void 0;
    /**
     * A lightweight descriptor of an editor. The descriptor is deferred so that heavy editors
     * can load lazily in the workbench.
     */
    class EditorDescriptor {
        constructor(ctor, id, name) {
            this.ctor = ctor;
            this.id = id;
            this.name = name;
        }
        static create(ctor, id, name) {
            return new EditorDescriptor(ctor, id, name);
        }
        instantiate(instantiationService) {
            return instantiationService.createInstance(this.ctor);
        }
        getId() {
            return this.id;
        }
        getName() {
            return this.name;
        }
        describes(obj) {
            return obj instanceof baseEditor_1.BaseEditor && obj.getId() === this.id;
        }
    }
    exports.EditorDescriptor = EditorDescriptor;
    class EditorRegistry {
        constructor() {
            this.editors = [];
            this.mapEditorToInputs = new Map();
        }
        registerEditor(descriptor, inputDescriptors) {
            this.mapEditorToInputs.set(descriptor, inputDescriptors);
            const remove = arrays_1.insert(this.editors, descriptor);
            return lifecycle_1.toDisposable(() => {
                this.mapEditorToInputs.delete(descriptor);
                remove();
            });
        }
        getEditor(input) {
            const findEditorDescriptors = (input, byInstanceOf) => {
                const matchingDescriptors = [];
                for (const editor of this.editors) {
                    const inputDescriptors = this.mapEditorToInputs.get(editor) || [];
                    for (const inputDescriptor of inputDescriptors) {
                        const inputClass = inputDescriptor.ctor;
                        // Direct check on constructor type (ignores prototype chain)
                        if (!byInstanceOf && input.constructor === inputClass) {
                            matchingDescriptors.push(editor);
                            break;
                        }
                        // Normal instanceof check
                        else if (byInstanceOf && input instanceof inputClass) {
                            matchingDescriptors.push(editor);
                            break;
                        }
                    }
                }
                // If no descriptors found, continue search using instanceof and prototype chain
                if (!byInstanceOf && matchingDescriptors.length === 0) {
                    return findEditorDescriptors(input, true);
                }
                if (byInstanceOf) {
                    return matchingDescriptors;
                }
                return matchingDescriptors;
            };
            const descriptors = findEditorDescriptors(input);
            if (descriptors.length > 0) {
                // Ask the input for its preferred Editor
                const preferredEditorId = input.getPreferredEditorId(descriptors.map(d => d.getId()));
                if (preferredEditorId) {
                    return this.getEditorById(preferredEditorId);
                }
                // Otherwise, first come first serve
                return descriptors[0];
            }
            return undefined;
        }
        getEditorById(editorId) {
            return this.editors.find(editor => editor.getId() === editorId);
        }
        getEditors() {
            return this.editors.slice(0);
        }
        getEditorInputs() {
            const inputClasses = [];
            for (const editor of this.editors) {
                const editorInputDescriptors = this.mapEditorToInputs.get(editor);
                if (editorInputDescriptors) {
                    inputClasses.push(...editorInputDescriptors.map(descriptor => descriptor.ctor));
                }
            }
            return inputClasses;
        }
    }
    exports.Extensions = {
        Editors: 'workbench.contributions.editors'
    };
    platform_1.Registry.add(exports.Extensions.Editors, new EditorRegistry());
});
//# __sourceMappingURL=editor.js.map