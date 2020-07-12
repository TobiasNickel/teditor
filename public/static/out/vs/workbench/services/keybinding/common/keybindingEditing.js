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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/json", "vs/base/common/jsonEdit", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/services/resolverService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/textfile/common/textfiles", "vs/platform/instantiation/common/extensions"], function (require, exports, nls_1, async_1, json, jsonEdit_1, lifecycle_1, types_1, editOperation_1, range_1, selection_1, resolverService_1, configuration_1, contextkey_1, environment_1, files_1, instantiation_1, textfiles_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingsEditingService = exports.IKeybindingEditingService = void 0;
    exports.IKeybindingEditingService = instantiation_1.createDecorator('keybindingEditingService');
    let KeybindingsEditingService = class KeybindingsEditingService extends lifecycle_1.Disposable {
        constructor(textModelResolverService, textFileService, fileService, configurationService, environmentService) {
            super();
            this.textModelResolverService = textModelResolverService;
            this.textFileService = textFileService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.resource = this.environmentService.keybindingsResource;
            this.queue = new async_1.Queue();
        }
        editKeybinding(keybindingItem, key, when) {
            return this.queue.queue(() => this.doEditKeybinding(keybindingItem, key, when)); // queue up writes to prevent race conditions
        }
        resetKeybinding(keybindingItem) {
            return this.queue.queue(() => this.doResetKeybinding(keybindingItem)); // queue up writes to prevent race conditions
        }
        removeKeybinding(keybindingItem) {
            return this.queue.queue(() => this.doRemoveKeybinding(keybindingItem)); // queue up writes to prevent race conditions
        }
        doEditKeybinding(keybindingItem, key, when) {
            return this.resolveAndValidate()
                .then(reference => {
                const model = reference.object.textEditorModel;
                const userKeybindingEntries = json.parse(model.getValue());
                const userKeybindingEntryIndex = this.findUserKeybindingEntryIndex(keybindingItem, userKeybindingEntries);
                this.updateKeybinding(keybindingItem, key, when, model, userKeybindingEntryIndex);
                if (keybindingItem.isDefault && keybindingItem.resolvedKeybinding) {
                    this.removeDefaultKeybinding(keybindingItem, model);
                }
                return this.save().finally(() => reference.dispose());
            });
        }
        doRemoveKeybinding(keybindingItem) {
            return this.resolveAndValidate()
                .then(reference => {
                const model = reference.object.textEditorModel;
                if (keybindingItem.isDefault) {
                    this.removeDefaultKeybinding(keybindingItem, model);
                }
                else {
                    this.removeUserKeybinding(keybindingItem, model);
                }
                return this.save().finally(() => reference.dispose());
            });
        }
        doResetKeybinding(keybindingItem) {
            return this.resolveAndValidate()
                .then(reference => {
                const model = reference.object.textEditorModel;
                if (!keybindingItem.isDefault) {
                    this.removeUserKeybinding(keybindingItem, model);
                    this.removeUnassignedDefaultKeybinding(keybindingItem, model);
                }
                return this.save().finally(() => reference.dispose());
            });
        }
        save() {
            return this.textFileService.save(this.resource);
        }
        updateKeybinding(keybindingItem, newKey, when, model, userKeybindingEntryIndex) {
            const { tabSize, insertSpaces } = model.getOptions();
            const eol = model.getEOL();
            if (userKeybindingEntryIndex !== -1) {
                // Update the keybinding with new key
                this.applyEditsToBuffer(jsonEdit_1.setProperty(model.getValue(), [userKeybindingEntryIndex, 'key'], newKey, { tabSize, insertSpaces, eol })[0], model);
                const edits = jsonEdit_1.setProperty(model.getValue(), [userKeybindingEntryIndex, 'when'], when, { tabSize, insertSpaces, eol });
                if (edits.length > 0) {
                    this.applyEditsToBuffer(edits[0], model);
                }
            }
            else {
                // Add the new keybinding with new key
                this.applyEditsToBuffer(jsonEdit_1.setProperty(model.getValue(), [-1], this.asObject(newKey, keybindingItem.command, when, false), { tabSize, insertSpaces, eol })[0], model);
            }
        }
        removeUserKeybinding(keybindingItem, model) {
            const { tabSize, insertSpaces } = model.getOptions();
            const eol = model.getEOL();
            const userKeybindingEntries = json.parse(model.getValue());
            const userKeybindingEntryIndex = this.findUserKeybindingEntryIndex(keybindingItem, userKeybindingEntries);
            if (userKeybindingEntryIndex !== -1) {
                this.applyEditsToBuffer(jsonEdit_1.setProperty(model.getValue(), [userKeybindingEntryIndex], undefined, { tabSize, insertSpaces, eol })[0], model);
            }
        }
        removeDefaultKeybinding(keybindingItem, model) {
            const { tabSize, insertSpaces } = model.getOptions();
            const eol = model.getEOL();
            const key = keybindingItem.resolvedKeybinding ? keybindingItem.resolvedKeybinding.getUserSettingsLabel() : null;
            if (key) {
                this.applyEditsToBuffer(jsonEdit_1.setProperty(model.getValue(), [-1], this.asObject(key, keybindingItem.command, keybindingItem.when ? keybindingItem.when.serialize() : undefined, true), { tabSize, insertSpaces, eol })[0], model);
            }
        }
        removeUnassignedDefaultKeybinding(keybindingItem, model) {
            const { tabSize, insertSpaces } = model.getOptions();
            const eol = model.getEOL();
            const userKeybindingEntries = json.parse(model.getValue());
            const indices = this.findUnassignedDefaultKeybindingEntryIndex(keybindingItem, userKeybindingEntries).reverse();
            for (const index of indices) {
                this.applyEditsToBuffer(jsonEdit_1.setProperty(model.getValue(), [index], undefined, { tabSize, insertSpaces, eol })[0], model);
            }
        }
        findUserKeybindingEntryIndex(keybindingItem, userKeybindingEntries) {
            for (let index = 0; index < userKeybindingEntries.length; index++) {
                const keybinding = userKeybindingEntries[index];
                if (keybinding.command === keybindingItem.command) {
                    if (!keybinding.when && !keybindingItem.when) {
                        return index;
                    }
                    if (keybinding.when && keybindingItem.when) {
                        const contextKeyExpr = contextkey_1.ContextKeyExpr.deserialize(keybinding.when);
                        if (contextKeyExpr && contextKeyExpr.serialize() === keybindingItem.when.serialize()) {
                            return index;
                        }
                    }
                }
            }
            return -1;
        }
        findUnassignedDefaultKeybindingEntryIndex(keybindingItem, userKeybindingEntries) {
            const indices = [];
            for (let index = 0; index < userKeybindingEntries.length; index++) {
                if (userKeybindingEntries[index].command === `-${keybindingItem.command}`) {
                    indices.push(index);
                }
            }
            return indices;
        }
        asObject(key, command, when, negate) {
            const object = { key };
            if (command) {
                object['command'] = negate ? `-${command}` : command;
            }
            if (when) {
                object['when'] = when;
            }
            return object;
        }
        applyEditsToBuffer(edit, model) {
            const startPosition = model.getPositionAt(edit.offset);
            const endPosition = model.getPositionAt(edit.offset + edit.length);
            const range = new range_1.Range(startPosition.lineNumber, startPosition.column, endPosition.lineNumber, endPosition.column);
            let currentText = model.getValueInRange(range);
            const editOperation = currentText ? editOperation_1.EditOperation.replace(range, edit.content) : editOperation_1.EditOperation.insert(startPosition, edit.content);
            model.pushEditOperations([new selection_1.Selection(startPosition.lineNumber, startPosition.column, startPosition.lineNumber, startPosition.column)], [editOperation], () => []);
        }
        resolveModelReference() {
            return this.fileService.exists(this.resource)
                .then(exists => {
                const EOL = this.configurationService.getValue('files', { overrideIdentifier: 'json' })['eol'];
                const result = exists ? Promise.resolve(null) : this.textFileService.write(this.resource, this.getEmptyContent(EOL), { encoding: 'utf8' });
                return result.then(() => this.textModelResolverService.createModelReference(this.resource));
            });
        }
        resolveAndValidate() {
            // Target cannot be dirty if not writing into buffer
            if (this.textFileService.isDirty(this.resource)) {
                return Promise.reject(new Error(nls_1.localize('errorKeybindingsFileDirty', "Unable to write because the keybindings configuration file is dirty. Please save it first and then try again.")));
            }
            return this.resolveModelReference()
                .then(reference => {
                const model = reference.object.textEditorModel;
                const EOL = model.getEOL();
                if (model.getValue()) {
                    const parsed = this.parse(model);
                    if (parsed.parseErrors.length) {
                        reference.dispose();
                        return Promise.reject(new Error(nls_1.localize('parseErrors', "Unable to write to the keybindings configuration file. Please open it to correct errors/warnings in the file and try again.")));
                    }
                    if (parsed.result) {
                        if (!types_1.isArray(parsed.result)) {
                            reference.dispose();
                            return Promise.reject(new Error(nls_1.localize('errorInvalidConfiguration', "Unable to write to the keybindings configuration file. It has an object which is not of type Array. Please open the file to clean up and try again.")));
                        }
                    }
                    else {
                        const content = EOL + '[]';
                        this.applyEditsToBuffer({ content, length: content.length, offset: model.getValue().length }, model);
                    }
                }
                else {
                    const content = this.getEmptyContent(EOL);
                    this.applyEditsToBuffer({ content, length: content.length, offset: 0 }, model);
                }
                return reference;
            });
        }
        parse(model) {
            const parseErrors = [];
            const result = json.parse(model.getValue(), parseErrors, { allowTrailingComma: true, allowEmptyContent: true });
            return { result, parseErrors };
        }
        getEmptyContent(EOL) {
            return '// ' + nls_1.localize('emptyKeybindingsHeader', "Place your key bindings in this file to override the defaults") + EOL + '[]';
        }
    };
    KeybindingsEditingService = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, files_1.IFileService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, environment_1.IEnvironmentService)
    ], KeybindingsEditingService);
    exports.KeybindingsEditingService = KeybindingsEditingService;
    extensions_1.registerSingleton(exports.IKeybindingEditingService, KeybindingsEditingService, true);
});
//# __sourceMappingURL=keybindingEditing.js.map