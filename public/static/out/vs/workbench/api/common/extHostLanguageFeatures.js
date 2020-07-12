/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/objects", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/base/common/async", "./extHost.protocol", "vs/base/common/strings", "vs/editor/common/core/range", "vs/base/common/arrays", "vs/base/common/types", "vs/editor/common/core/selection", "vs/base/common/lifecycle", "vs/workbench/api/common/shared/semanticTokensDto", "vs/base/common/idGenerator", "./cache"], function (require, exports, uri_1, objects_1, typeConvert, extHostTypes_1, async_1, extHostProtocol, strings_1, range_1, arrays_1, types_1, selection_1, lifecycle_1, semanticTokensDto_1, idGenerator_1, cache_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLanguageFeatures = exports.DocumentRangeSemanticTokensAdapter = exports.DocumentSemanticTokensAdapter = void 0;
    // --- adapter
    class DocumentSymbolAdapter {
        constructor(documents, provider) {
            this._documents = documents;
            this._provider = provider;
        }
        provideDocumentSymbols(resource, token) {
            const doc = this._documents.getDocument(resource);
            return async_1.asPromise(() => this._provider.provideDocumentSymbols(doc, token)).then(value => {
                if (arrays_1.isFalsyOrEmpty(value)) {
                    return undefined;
                }
                else if (value[0] instanceof extHostTypes_1.DocumentSymbol) {
                    return value.map(typeConvert.DocumentSymbol.from);
                }
                else {
                    return DocumentSymbolAdapter._asDocumentSymbolTree(value);
                }
            });
        }
        static _asDocumentSymbolTree(infos) {
            // first sort by start (and end) and then loop over all elements
            // and build a tree based on containment.
            infos = infos.slice(0).sort((a, b) => {
                let res = a.location.range.start.compareTo(b.location.range.start);
                if (res === 0) {
                    res = b.location.range.end.compareTo(a.location.range.end);
                }
                return res;
            });
            const res = [];
            const parentStack = [];
            for (const info of infos) {
                const element = {
                    name: info.name || '!!MISSING: name!!',
                    kind: typeConvert.SymbolKind.from(info.kind),
                    tags: info.tags ? info.tags.map(typeConvert.SymbolTag.from) : [],
                    detail: '',
                    containerName: info.containerName,
                    range: typeConvert.Range.from(info.location.range),
                    selectionRange: typeConvert.Range.from(info.location.range),
                    children: []
                };
                while (true) {
                    if (parentStack.length === 0) {
                        parentStack.push(element);
                        res.push(element);
                        break;
                    }
                    const parent = parentStack[parentStack.length - 1];
                    if (range_1.Range.containsRange(parent.range, element.range) && !range_1.Range.equalsRange(parent.range, element.range)) {
                        if (parent.children) {
                            parent.children.push(element);
                        }
                        parentStack.push(element);
                        break;
                    }
                    parentStack.pop();
                }
            }
            return res;
        }
    }
    class CodeLensAdapter {
        constructor(_documents, _commands, _provider) {
            this._documents = _documents;
            this._commands = _commands;
            this._provider = _provider;
            this._cache = new cache_1.Cache('CodeLens');
            this._disposables = new Map();
        }
        provideCodeLenses(resource, token) {
            const doc = this._documents.getDocument(resource);
            return async_1.asPromise(() => this._provider.provideCodeLenses(doc, token)).then(lenses => {
                if (!lenses || token.isCancellationRequested) {
                    return undefined;
                }
                const cacheId = this._cache.add(lenses);
                const disposables = new lifecycle_1.DisposableStore();
                this._disposables.set(cacheId, disposables);
                const result = {
                    cacheId,
                    lenses: [],
                };
                for (let i = 0; i < lenses.length; i++) {
                    result.lenses.push({
                        cacheId: [cacheId, i],
                        range: typeConvert.Range.from(lenses[i].range),
                        command: this._commands.toInternal(lenses[i].command, disposables)
                    });
                }
                return result;
            });
        }
        resolveCodeLens(symbol, token) {
            const lens = symbol.cacheId && this._cache.get(...symbol.cacheId);
            if (!lens) {
                return Promise.resolve(undefined);
            }
            let resolve;
            if (typeof this._provider.resolveCodeLens !== 'function' || lens.isResolved) {
                resolve = Promise.resolve(lens);
            }
            else {
                resolve = async_1.asPromise(() => this._provider.resolveCodeLens(lens, token));
            }
            return resolve.then(newLens => {
                if (token.isCancellationRequested) {
                    return undefined;
                }
                const disposables = symbol.cacheId && this._disposables.get(symbol.cacheId[0]);
                if (!disposables) {
                    // We've already been disposed of
                    return undefined;
                }
                newLens = newLens || lens;
                symbol.command = this._commands.toInternal(newLens.command || CodeLensAdapter._badCmd, disposables);
                return symbol;
            });
        }
        releaseCodeLenses(cachedId) {
            lifecycle_1.dispose(this._disposables.get(cachedId));
            this._disposables.delete(cachedId);
            this._cache.delete(cachedId);
        }
    }
    CodeLensAdapter._badCmd = { command: 'missing', title: '!!MISSING: command!!' };
    function convertToLocationLinks(value) {
        if (Array.isArray(value)) {
            return value.map(typeConvert.DefinitionLink.from);
        }
        else if (value) {
            return [typeConvert.DefinitionLink.from(value)];
        }
        return [];
    }
    class DefinitionAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideDefinition(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideDefinition(doc, pos, token)).then(convertToLocationLinks);
        }
    }
    class DeclarationAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideDeclaration(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideDeclaration(doc, pos, token)).then(convertToLocationLinks);
        }
    }
    class ImplementationAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideImplementation(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideImplementation(doc, pos, token)).then(convertToLocationLinks);
        }
    }
    class TypeDefinitionAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideTypeDefinition(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideTypeDefinition(doc, pos, token)).then(convertToLocationLinks);
        }
    }
    class HoverAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideHover(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideHover(doc, pos, token)).then(value => {
                if (!value || arrays_1.isFalsyOrEmpty(value.contents)) {
                    return undefined;
                }
                if (!value.range) {
                    value.range = doc.getWordRangeAtPosition(pos);
                }
                if (!value.range) {
                    value.range = new extHostTypes_1.Range(pos, pos);
                }
                return typeConvert.Hover.from(value);
            });
        }
    }
    class EvaluatableExpressionAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideEvaluatableExpression(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideEvaluatableExpression(doc, pos, token)).then(value => {
                if (value) {
                    return typeConvert.EvaluatableExpression.from(value);
                }
                return undefined;
            });
        }
    }
    class DocumentHighlightAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideDocumentHighlights(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideDocumentHighlights(doc, pos, token)).then(value => {
                if (Array.isArray(value)) {
                    return value.map(typeConvert.DocumentHighlight.from);
                }
                return undefined;
            });
        }
    }
    class OnTypeRenameAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideOnTypeRenameRanges(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideOnTypeRenameRanges(doc, pos, token)).then(value => {
                if (Array.isArray(value)) {
                    return arrays_1.coalesce(value.map(typeConvert.Range.from));
                }
                return undefined;
            });
        }
    }
    class ReferenceAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideReferences(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideReferences(doc, pos, context, token)).then(value => {
                if (Array.isArray(value)) {
                    return value.map(typeConvert.location.from);
                }
                return undefined;
            });
        }
    }
    class CodeActionAdapter {
        constructor(_documents, _commands, _diagnostics, _provider, _logService, _extension, _apiDeprecation) {
            this._documents = _documents;
            this._commands = _commands;
            this._diagnostics = _diagnostics;
            this._provider = _provider;
            this._logService = _logService;
            this._extension = _extension;
            this._apiDeprecation = _apiDeprecation;
            this._cache = new cache_1.Cache('CodeAction');
            this._disposables = new Map();
        }
        provideCodeActions(resource, rangeOrSelection, context, token) {
            const doc = this._documents.getDocument(resource);
            const ran = selection_1.Selection.isISelection(rangeOrSelection)
                ? typeConvert.Selection.to(rangeOrSelection)
                : typeConvert.Range.to(rangeOrSelection);
            const allDiagnostics = [];
            for (const diagnostic of this._diagnostics.getDiagnostics(resource)) {
                if (ran.intersection(diagnostic.range)) {
                    const newLen = allDiagnostics.push(diagnostic);
                    if (newLen > CodeActionAdapter._maxCodeActionsPerFile) {
                        break;
                    }
                }
            }
            const codeActionContext = {
                diagnostics: allDiagnostics,
                only: context.only ? new extHostTypes_1.CodeActionKind(context.only) : undefined
            };
            return async_1.asPromise(() => this._provider.provideCodeActions(doc, ran, codeActionContext, token)).then((commandsOrActions) => {
                var _a;
                if (!arrays_1.isNonEmptyArray(commandsOrActions) || token.isCancellationRequested) {
                    return undefined;
                }
                const cacheId = this._cache.add(commandsOrActions);
                const disposables = new lifecycle_1.DisposableStore();
                this._disposables.set(cacheId, disposables);
                const actions = [];
                for (const candidate of commandsOrActions) {
                    if (!candidate) {
                        continue;
                    }
                    if (CodeActionAdapter._isCommand(candidate)) {
                        // old school: synthetic code action
                        this._apiDeprecation.report('CodeActionProvider.provideCodeActions - return commands', this._extension, `Return 'CodeAction' instances instead.`);
                        actions.push({
                            _isSynthetic: true,
                            title: candidate.title,
                            command: this._commands.toInternal(candidate, disposables),
                        });
                    }
                    else {
                        if (codeActionContext.only) {
                            if (!candidate.kind) {
                                this._logService.warn(`${this._extension.identifier.value} - Code actions of kind '${codeActionContext.only.value} 'requested but returned code action does not have a 'kind'. Code action will be dropped. Please set 'CodeAction.kind'.`);
                            }
                            else if (!codeActionContext.only.contains(candidate.kind)) {
                                this._logService.warn(`${this._extension.identifier.value} - Code actions of kind '${codeActionContext.only.value} 'requested but returned code action is of kind '${candidate.kind.value}'. Code action will be dropped. Please check 'CodeActionContext.only' to only return requested code actions.`);
                            }
                        }
                        // new school: convert code action
                        actions.push({
                            title: candidate.title,
                            command: candidate.command && this._commands.toInternal(candidate.command, disposables),
                            diagnostics: candidate.diagnostics && candidate.diagnostics.map(typeConvert.Diagnostic.from),
                            edit: candidate.edit && typeConvert.WorkspaceEdit.from(candidate.edit),
                            kind: candidate.kind && candidate.kind.value,
                            isPreferred: candidate.isPreferred,
                            disabled: (_a = candidate.disabled) === null || _a === void 0 ? void 0 : _a.reason
                        });
                    }
                }
                return { cacheId, actions };
            });
        }
        releaseCodeActions(cachedId) {
            lifecycle_1.dispose(this._disposables.get(cachedId));
            this._disposables.delete(cachedId);
            this._cache.delete(cachedId);
        }
        static _isCommand(thing) {
            return typeof thing.command === 'string' && typeof thing.title === 'string';
        }
    }
    CodeActionAdapter._maxCodeActionsPerFile = 1000;
    class DocumentFormattingAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideDocumentFormattingEdits(resource, options, token) {
            const document = this._documents.getDocument(resource);
            return async_1.asPromise(() => this._provider.provideDocumentFormattingEdits(document, options, token)).then(value => {
                if (Array.isArray(value)) {
                    return value.map(typeConvert.TextEdit.from);
                }
                return undefined;
            });
        }
    }
    class RangeFormattingAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideDocumentRangeFormattingEdits(resource, range, options, token) {
            const document = this._documents.getDocument(resource);
            const ran = typeConvert.Range.to(range);
            return async_1.asPromise(() => this._provider.provideDocumentRangeFormattingEdits(document, ran, options, token)).then(value => {
                if (Array.isArray(value)) {
                    return value.map(typeConvert.TextEdit.from);
                }
                return undefined;
            });
        }
    }
    class OnTypeFormattingAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this.autoFormatTriggerCharacters = []; // not here
        }
        provideOnTypeFormattingEdits(resource, position, ch, options, token) {
            const document = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideOnTypeFormattingEdits(document, pos, ch, options, token)).then(value => {
                if (Array.isArray(value)) {
                    return value.map(typeConvert.TextEdit.from);
                }
                return undefined;
            });
        }
    }
    class NavigateTypeAdapter {
        constructor(_provider, _logService) {
            this._provider = _provider;
            this._logService = _logService;
            this._symbolCache = new Map();
            this._resultCache = new Map();
        }
        provideWorkspaceSymbols(search, token) {
            const result = extHostProtocol.IdObject.mixin({ symbols: [] });
            return async_1.asPromise(() => this._provider.provideWorkspaceSymbols(search, token)).then(value => {
                if (arrays_1.isNonEmptyArray(value)) {
                    for (const item of value) {
                        if (!item) {
                            // drop
                            continue;
                        }
                        if (!item.name) {
                            this._logService.warn('INVALID SymbolInformation, lacks name', item);
                            continue;
                        }
                        const symbol = extHostProtocol.IdObject.mixin(typeConvert.WorkspaceSymbol.from(item));
                        this._symbolCache.set(symbol._id, item);
                        result.symbols.push(symbol);
                    }
                }
            }).then(() => {
                if (result.symbols.length > 0) {
                    this._resultCache.set(result._id, [result.symbols[0]._id, result.symbols[result.symbols.length - 1]._id]);
                }
                return result;
            });
        }
        async resolveWorkspaceSymbol(symbol, token) {
            if (typeof this._provider.resolveWorkspaceSymbol !== 'function') {
                return symbol;
            }
            const item = this._symbolCache.get(symbol._id);
            if (item) {
                const value = await async_1.asPromise(() => this._provider.resolveWorkspaceSymbol(item, token));
                return value && objects_1.mixin(symbol, typeConvert.WorkspaceSymbol.from(value), true);
            }
            return undefined;
        }
        releaseWorkspaceSymbols(id) {
            const range = this._resultCache.get(id);
            if (range) {
                for (let [from, to] = range; from <= to; from++) {
                    this._symbolCache.delete(from);
                }
                this._resultCache.delete(id);
            }
        }
    }
    class RenameAdapter {
        constructor(_documents, _provider, _logService) {
            this._documents = _documents;
            this._provider = _provider;
            this._logService = _logService;
        }
        static supportsResolving(provider) {
            return typeof provider.prepareRename === 'function';
        }
        provideRenameEdits(resource, position, newName, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.provideRenameEdits(doc, pos, newName, token)).then(value => {
                if (!value) {
                    return undefined;
                }
                return typeConvert.WorkspaceEdit.from(value);
            }, err => {
                const rejectReason = RenameAdapter._asMessage(err);
                if (rejectReason) {
                    return { rejectReason, edits: undefined };
                }
                else {
                    // generic error
                    return Promise.reject(err);
                }
            });
        }
        resolveRenameLocation(resource, position, token) {
            if (typeof this._provider.prepareRename !== 'function') {
                return Promise.resolve(undefined);
            }
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            return async_1.asPromise(() => this._provider.prepareRename(doc, pos, token)).then(rangeOrLocation => {
                let range;
                let text;
                if (extHostTypes_1.Range.isRange(rangeOrLocation)) {
                    range = rangeOrLocation;
                    text = doc.getText(rangeOrLocation);
                }
                else if (types_1.isObject(rangeOrLocation)) {
                    range = rangeOrLocation.range;
                    text = rangeOrLocation.placeholder;
                }
                if (!range) {
                    return undefined;
                }
                if (range.start.line > pos.line || range.end.line < pos.line) {
                    this._logService.warn('INVALID rename location: position line must be within range start/end lines');
                    return undefined;
                }
                return { range: typeConvert.Range.from(range), text };
            }, err => {
                const rejectReason = RenameAdapter._asMessage(err);
                if (rejectReason) {
                    return { rejectReason, range: undefined, text: undefined };
                }
                else {
                    return Promise.reject(err);
                }
            });
        }
        static _asMessage(err) {
            if (typeof err === 'string') {
                return err;
            }
            else if (err instanceof Error && typeof err.message === 'string') {
                return err.message;
            }
            else {
                return undefined;
            }
        }
    }
    class SemanticTokensPreviousResult {
        constructor(resultId, tokens) {
            this.resultId = resultId;
            this.tokens = tokens;
        }
    }
    class DocumentSemanticTokensAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._nextResultId = 1;
            this._previousResults = new Map();
        }
        provideDocumentSemanticTokens(resource, previousResultId, token) {
            const doc = this._documents.getDocument(resource);
            const previousResult = (previousResultId !== 0 ? this._previousResults.get(previousResultId) : null);
            return async_1.asPromise(() => {
                if (previousResult && typeof previousResult.resultId === 'string' && typeof this._provider.provideDocumentSemanticTokensEdits === 'function') {
                    return this._provider.provideDocumentSemanticTokensEdits(doc, previousResult.resultId, token);
                }
                return this._provider.provideDocumentSemanticTokens(doc, token);
            }).then((value) => {
                if (previousResult) {
                    this._previousResults.delete(previousResultId);
                }
                if (!value) {
                    return null;
                }
                value = DocumentSemanticTokensAdapter._fixProvidedSemanticTokens(value);
                return this._send(DocumentSemanticTokensAdapter._convertToEdits(previousResult, value), value);
            });
        }
        async releaseDocumentSemanticColoring(semanticColoringResultId) {
            this._previousResults.delete(semanticColoringResultId);
        }
        static _fixProvidedSemanticTokens(v) {
            if (DocumentSemanticTokensAdapter._isSemanticTokens(v)) {
                if (DocumentSemanticTokensAdapter._isCorrectSemanticTokens(v)) {
                    return v;
                }
                return new extHostTypes_1.SemanticTokens(new Uint32Array(v.data), v.resultId);
            }
            else if (DocumentSemanticTokensAdapter._isSemanticTokensEdits(v)) {
                if (DocumentSemanticTokensAdapter._isCorrectSemanticTokensEdits(v)) {
                    return v;
                }
                return new extHostTypes_1.SemanticTokensEdits(v.edits.map(edit => new extHostTypes_1.SemanticTokensEdit(edit.start, edit.deleteCount, edit.data ? new Uint32Array(edit.data) : edit.data)), v.resultId);
            }
            return v;
        }
        static _isSemanticTokens(v) {
            return v && !!(v.data);
        }
        static _isCorrectSemanticTokens(v) {
            return (v.data instanceof Uint32Array);
        }
        static _isSemanticTokensEdits(v) {
            return v && Array.isArray(v.edits);
        }
        static _isCorrectSemanticTokensEdits(v) {
            for (const edit of v.edits) {
                if (!(edit.data instanceof Uint32Array)) {
                    return false;
                }
            }
            return true;
        }
        static _convertToEdits(previousResult, newResult) {
            if (!DocumentSemanticTokensAdapter._isSemanticTokens(newResult)) {
                return newResult;
            }
            if (!previousResult || !previousResult.tokens) {
                return newResult;
            }
            const oldData = previousResult.tokens;
            const oldLength = oldData.length;
            const newData = newResult.data;
            const newLength = newData.length;
            let commonPrefixLength = 0;
            const maxCommonPrefixLength = Math.min(oldLength, newLength);
            while (commonPrefixLength < maxCommonPrefixLength && oldData[commonPrefixLength] === newData[commonPrefixLength]) {
                commonPrefixLength++;
            }
            if (commonPrefixLength === oldLength && commonPrefixLength === newLength) {
                // complete overlap!
                return new extHostTypes_1.SemanticTokensEdits([], newResult.resultId);
            }
            let commonSuffixLength = 0;
            const maxCommonSuffixLength = maxCommonPrefixLength - commonPrefixLength;
            while (commonSuffixLength < maxCommonSuffixLength && oldData[oldLength - commonSuffixLength - 1] === newData[newLength - commonSuffixLength - 1]) {
                commonSuffixLength++;
            }
            return new extHostTypes_1.SemanticTokensEdits([{
                    start: commonPrefixLength,
                    deleteCount: (oldLength - commonPrefixLength - commonSuffixLength),
                    data: newData.subarray(commonPrefixLength, newLength - commonSuffixLength)
                }], newResult.resultId);
        }
        _send(value, original) {
            if (DocumentSemanticTokensAdapter._isSemanticTokens(value)) {
                const myId = this._nextResultId++;
                this._previousResults.set(myId, new SemanticTokensPreviousResult(value.resultId, value.data));
                return semanticTokensDto_1.encodeSemanticTokensDto({
                    id: myId,
                    type: 'full',
                    data: value.data
                });
            }
            if (DocumentSemanticTokensAdapter._isSemanticTokensEdits(value)) {
                const myId = this._nextResultId++;
                if (DocumentSemanticTokensAdapter._isSemanticTokens(original)) {
                    // store the original
                    this._previousResults.set(myId, new SemanticTokensPreviousResult(original.resultId, original.data));
                }
                else {
                    this._previousResults.set(myId, new SemanticTokensPreviousResult(value.resultId));
                }
                return semanticTokensDto_1.encodeSemanticTokensDto({
                    id: myId,
                    type: 'delta',
                    deltas: (value.edits || []).map(edit => ({ start: edit.start, deleteCount: edit.deleteCount, data: edit.data }))
                });
            }
            return null;
        }
    }
    exports.DocumentSemanticTokensAdapter = DocumentSemanticTokensAdapter;
    class DocumentRangeSemanticTokensAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideDocumentRangeSemanticTokens(resource, range, token) {
            const doc = this._documents.getDocument(resource);
            return async_1.asPromise(() => this._provider.provideDocumentRangeSemanticTokens(doc, typeConvert.Range.to(range), token)).then(value => {
                if (!value) {
                    return null;
                }
                return this._send(value);
            });
        }
        _send(value) {
            return semanticTokensDto_1.encodeSemanticTokensDto({
                id: 0,
                type: 'full',
                data: value.data
            });
        }
    }
    exports.DocumentRangeSemanticTokensAdapter = DocumentRangeSemanticTokensAdapter;
    class SuggestAdapter {
        constructor(_documents, _commands, _provider, _apiDeprecation, _extension) {
            this._documents = _documents;
            this._commands = _commands;
            this._provider = _provider;
            this._apiDeprecation = _apiDeprecation;
            this._extension = _extension;
            this._cache = new cache_1.Cache('CompletionItem');
            this._disposables = new Map();
        }
        static supportsResolving(provider) {
            return typeof provider.resolveCompletionItem === 'function';
        }
        async provideCompletionItems(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            // The default insert/replace ranges. It's important to compute them
            // before asynchronously asking the provider for its results. See
            // https://github.com/microsoft/vscode/issues/83400#issuecomment-546851421
            const replaceRange = doc.getWordRangeAtPosition(pos) || new extHostTypes_1.Range(pos, pos);
            const insertRange = replaceRange.with({ end: pos });
            const itemsOrList = await async_1.asPromise(() => this._provider.provideCompletionItems(doc, pos, token, typeConvert.CompletionContext.to(context)));
            if (!itemsOrList) {
                // undefined and null are valid results
                return undefined;
            }
            if (token.isCancellationRequested) {
                // cancelled -> return without further ado, esp no caching
                // of results as they will leak
                return undefined;
            }
            const list = Array.isArray(itemsOrList) ? new extHostTypes_1.CompletionList(itemsOrList) : itemsOrList;
            // keep result for providers that support resolving
            const pid = SuggestAdapter.supportsResolving(this._provider) ? this._cache.add(list.items) : this._cache.add([]);
            const disposables = new lifecycle_1.DisposableStore();
            this._disposables.set(pid, disposables);
            const completions = [];
            const result = {
                x: pid,
                ["b" /* completions */]: completions,
                ["a" /* defaultRanges */]: { replace: typeConvert.Range.from(replaceRange), insert: typeConvert.Range.from(insertRange) },
                ["c" /* isIncomplete */]: list.isIncomplete || undefined
            };
            for (let i = 0; i < list.items.length; i++) {
                const item = list.items[i];
                // check for bad completion item first
                const dto = this._convertCompletionItem(item, [pid, i], insertRange, replaceRange);
                completions.push(dto);
            }
            return result;
        }
        async resolveCompletionItem(id, token) {
            if (typeof this._provider.resolveCompletionItem !== 'function') {
                return undefined;
            }
            const item = this._cache.get(...id);
            if (!item) {
                return undefined;
            }
            const resolvedItem = await async_1.asPromise(() => this._provider.resolveCompletionItem(item, token));
            if (!resolvedItem) {
                return undefined;
            }
            return this._convertCompletionItem(resolvedItem, id);
        }
        releaseCompletionItems(id) {
            lifecycle_1.dispose(this._disposables.get(id));
            this._disposables.delete(id);
            this._cache.delete(id);
        }
        _convertCompletionItem(item, id, defaultInsertRange, defaultReplaceRange) {
            var _a;
            const disposables = this._disposables.get(id[0]);
            if (!disposables) {
                throw Error('DisposableStore is missing...');
            }
            const result = {
                //
                x: id,
                //
                ["a" /* label */]: (_a = item.label) !== null && _a !== void 0 ? _a : '',
                ["o" /* label2 */]: item.label2,
                ["b" /* kind */]: item.kind !== undefined ? typeConvert.CompletionItemKind.from(item.kind) : undefined,
                ["n" /* kindModifier */]: item.tags && item.tags.map(typeConvert.CompletionItemTag.from),
                ["c" /* detail */]: item.detail,
                ["d" /* documentation */]: typeof item.documentation === 'undefined' ? undefined : typeConvert.MarkdownString.fromStrict(item.documentation),
                ["e" /* sortText */]: item.sortText !== item.label ? item.sortText : undefined,
                ["f" /* filterText */]: item.filterText !== item.label ? item.filterText : undefined,
                ["g" /* preselect */]: item.preselect || undefined,
                ["i" /* insertTextRules */]: item.keepWhitespace ? 1 /* KeepWhitespace */ : 0,
                ["k" /* commitCharacters */]: item.commitCharacters,
                ["l" /* additionalTextEdits */]: item.additionalTextEdits && item.additionalTextEdits.map(typeConvert.TextEdit.from),
                ["m" /* command */]: this._commands.toInternal(item.command, disposables),
            };
            // 'insertText'-logic
            if (item.textEdit) {
                this._apiDeprecation.report('CompletionItem.textEdit', this._extension, `Use 'CompletionItem.insertText' and 'CompletionItem.range' instead.`);
                result["h" /* insertText */] = item.textEdit.newText;
            }
            else if (typeof item.insertText === 'string') {
                result["h" /* insertText */] = item.insertText;
            }
            else if (item.insertText instanceof extHostTypes_1.SnippetString) {
                result["h" /* insertText */] = item.insertText.value;
                result["i" /* insertTextRules */] |= 4 /* InsertAsSnippet */;
            }
            // 'overwrite[Before|After]'-logic
            let range;
            if (item.textEdit) {
                range = item.textEdit.range;
            }
            else if (item.range) {
                range = item.range;
            }
            if (extHostTypes_1.Range.isRange(range)) {
                // "old" range
                result["j" /* range */] = typeConvert.Range.from(range);
            }
            else if (range && (!(defaultInsertRange === null || defaultInsertRange === void 0 ? void 0 : defaultInsertRange.isEqual(range.inserting)) || !(defaultReplaceRange === null || defaultReplaceRange === void 0 ? void 0 : defaultReplaceRange.isEqual(range.replacing)))) {
                // ONLY send range when it's different from the default ranges (safe bandwidth)
                result["j" /* range */] = {
                    insert: typeConvert.Range.from(range.inserting),
                    replace: typeConvert.Range.from(range.replacing)
                };
            }
            return result;
        }
    }
    class SignatureHelpAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._cache = new cache_1.Cache('SignatureHelp');
        }
        provideSignatureHelp(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const vscodeContext = this.reviveContext(context);
            return async_1.asPromise(() => this._provider.provideSignatureHelp(doc, pos, token, vscodeContext)).then(value => {
                if (value) {
                    const id = this._cache.add([value]);
                    return Object.assign(Object.assign({}, typeConvert.SignatureHelp.from(value)), { id });
                }
                return undefined;
            });
        }
        reviveContext(context) {
            let activeSignatureHelp = undefined;
            if (context.activeSignatureHelp) {
                const revivedSignatureHelp = typeConvert.SignatureHelp.to(context.activeSignatureHelp);
                const saved = this._cache.get(context.activeSignatureHelp.id, 0);
                if (saved) {
                    activeSignatureHelp = saved;
                    activeSignatureHelp.activeSignature = revivedSignatureHelp.activeSignature;
                    activeSignatureHelp.activeParameter = revivedSignatureHelp.activeParameter;
                }
                else {
                    activeSignatureHelp = revivedSignatureHelp;
                }
            }
            return Object.assign(Object.assign({}, context), { activeSignatureHelp });
        }
        releaseSignatureHelp(id) {
            this._cache.delete(id);
        }
    }
    class LinkProviderAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._cache = new cache_1.Cache('DocumentLink');
        }
        provideLinks(resource, token) {
            const doc = this._documents.getDocument(resource);
            return async_1.asPromise(() => this._provider.provideDocumentLinks(doc, token)).then(links => {
                if (!Array.isArray(links) || links.length === 0) {
                    // bad result
                    return undefined;
                }
                if (token.isCancellationRequested) {
                    // cancelled -> return without further ado, esp no caching
                    // of results as they will leak
                    return undefined;
                }
                if (typeof this._provider.resolveDocumentLink !== 'function') {
                    // no resolve -> no caching
                    return { links: links.map(typeConvert.DocumentLink.from) };
                }
                else {
                    // cache links for future resolving
                    const pid = this._cache.add(links);
                    const result = { links: [], id: pid };
                    for (let i = 0; i < links.length; i++) {
                        const dto = typeConvert.DocumentLink.from(links[i]);
                        dto.cacheId = [pid, i];
                        result.links.push(dto);
                    }
                    return result;
                }
            });
        }
        resolveLink(id, token) {
            if (typeof this._provider.resolveDocumentLink !== 'function') {
                return Promise.resolve(undefined);
            }
            const item = this._cache.get(...id);
            if (!item) {
                return Promise.resolve(undefined);
            }
            return async_1.asPromise(() => this._provider.resolveDocumentLink(item, token)).then(value => {
                return value && typeConvert.DocumentLink.from(value) || undefined;
            });
        }
        releaseLinks(id) {
            this._cache.delete(id);
        }
    }
    class ColorProviderAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideColors(resource, token) {
            const doc = this._documents.getDocument(resource);
            return async_1.asPromise(() => this._provider.provideDocumentColors(doc, token)).then(colors => {
                if (!Array.isArray(colors)) {
                    return [];
                }
                const colorInfos = colors.map(ci => {
                    return {
                        color: typeConvert.Color.from(ci.color),
                        range: typeConvert.Range.from(ci.range)
                    };
                });
                return colorInfos;
            });
        }
        provideColorPresentations(resource, raw, token) {
            const document = this._documents.getDocument(resource);
            const range = typeConvert.Range.to(raw.range);
            const color = typeConvert.Color.to(raw.color);
            return async_1.asPromise(() => this._provider.provideColorPresentations(color, { document, range }, token)).then(value => {
                if (!Array.isArray(value)) {
                    return undefined;
                }
                return value.map(typeConvert.ColorPresentation.from);
            });
        }
    }
    class FoldingProviderAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        provideFoldingRanges(resource, context, token) {
            const doc = this._documents.getDocument(resource);
            return async_1.asPromise(() => this._provider.provideFoldingRanges(doc, context, token)).then(ranges => {
                if (!Array.isArray(ranges)) {
                    return undefined;
                }
                return ranges.map(typeConvert.FoldingRange.from);
            });
        }
    }
    class SelectionRangeAdapter {
        constructor(_documents, _provider, _logService) {
            this._documents = _documents;
            this._provider = _provider;
            this._logService = _logService;
        }
        provideSelectionRanges(resource, pos, token) {
            const document = this._documents.getDocument(resource);
            const positions = pos.map(typeConvert.Position.to);
            return async_1.asPromise(() => this._provider.provideSelectionRanges(document, positions, token)).then(allProviderRanges => {
                if (!arrays_1.isNonEmptyArray(allProviderRanges)) {
                    return [];
                }
                if (allProviderRanges.length !== positions.length) {
                    this._logService.warn('BAD selection ranges, provider must return ranges for each position');
                    return [];
                }
                const allResults = [];
                for (let i = 0; i < positions.length; i++) {
                    const oneResult = [];
                    allResults.push(oneResult);
                    let last = positions[i];
                    let selectionRange = allProviderRanges[i];
                    while (true) {
                        if (!selectionRange.range.contains(last)) {
                            throw new Error('INVALID selection range, must contain the previous range');
                        }
                        oneResult.push(typeConvert.SelectionRange.from(selectionRange));
                        if (!selectionRange.parent) {
                            break;
                        }
                        last = selectionRange.range;
                        selectionRange = selectionRange.parent;
                    }
                }
                return allResults;
            });
        }
    }
    class CallHierarchyAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._idPool = new idGenerator_1.IdGenerator('');
            this._cache = new Map();
        }
        async prepareSession(uri, position, token) {
            const doc = this._documents.getDocument(uri);
            const pos = typeConvert.Position.to(position);
            const items = await this._provider.prepareCallHierarchy(doc, pos, token);
            if (!items) {
                return undefined;
            }
            const sessionId = this._idPool.nextId();
            this._cache.set(sessionId, new Map());
            if (Array.isArray(items)) {
                return items.map(item => this._cacheAndConvertItem(sessionId, item));
            }
            else {
                return [this._cacheAndConvertItem(sessionId, items)];
            }
        }
        async provideCallsTo(sessionId, itemId, token) {
            const item = this._itemFromCache(sessionId, itemId);
            if (!item) {
                throw new Error('missing call hierarchy item');
            }
            const calls = await this._provider.provideCallHierarchyIncomingCalls(item, token);
            if (!calls) {
                return undefined;
            }
            return calls.map(call => {
                return {
                    from: this._cacheAndConvertItem(sessionId, call.from),
                    fromRanges: call.fromRanges.map(r => typeConvert.Range.from(r))
                };
            });
        }
        async provideCallsFrom(sessionId, itemId, token) {
            const item = this._itemFromCache(sessionId, itemId);
            if (!item) {
                throw new Error('missing call hierarchy item');
            }
            const calls = await this._provider.provideCallHierarchyOutgoingCalls(item, token);
            if (!calls) {
                return undefined;
            }
            return calls.map(call => {
                return {
                    to: this._cacheAndConvertItem(sessionId, call.to),
                    fromRanges: call.fromRanges.map(r => typeConvert.Range.from(r))
                };
            });
        }
        releaseSession(sessionId) {
            this._cache.delete(sessionId);
        }
        _cacheAndConvertItem(sessionId, item) {
            const map = this._cache.get(sessionId);
            const dto = {
                _sessionId: sessionId,
                _itemId: map.size.toString(36),
                name: item.name,
                detail: item.detail,
                kind: typeConvert.SymbolKind.from(item.kind),
                uri: item.uri,
                range: typeConvert.Range.from(item.range),
                selectionRange: typeConvert.Range.from(item.selectionRange),
            };
            map.set(dto._itemId, item);
            return dto;
        }
        _itemFromCache(sessionId, itemId) {
            const map = this._cache.get(sessionId);
            return map === null || map === void 0 ? void 0 : map.get(itemId);
        }
    }
    class AdapterData {
        constructor(adapter, extension) {
            this.adapter = adapter;
            this.extension = extension;
        }
    }
    class ExtHostLanguageFeatures {
        constructor(mainContext, uriTransformer, documents, commands, diagnostics, logService, apiDeprecationService) {
            this._adapter = new Map();
            this._uriTransformer = uriTransformer;
            this._proxy = mainContext.getProxy(extHostProtocol.MainContext.MainThreadLanguageFeatures);
            this._documents = documents;
            this._commands = commands;
            this._diagnostics = diagnostics;
            this._logService = logService;
            this._apiDeprecation = apiDeprecationService;
        }
        _transformDocumentSelector(selector) {
            return arrays_1.coalesce(arrays_1.asArray(selector).map(sel => this._doTransformDocumentSelector(sel)));
        }
        _doTransformDocumentSelector(selector) {
            if (typeof selector === 'string') {
                return {
                    $serialized: true,
                    language: selector
                };
            }
            if (selector) {
                return {
                    $serialized: true,
                    language: selector.language,
                    scheme: this._transformScheme(selector.scheme),
                    pattern: typeof selector.pattern === 'undefined' ? undefined : typeConvert.GlobPattern.from(selector.pattern),
                    exclusive: selector.exclusive
                };
            }
            return undefined;
        }
        _transformScheme(scheme) {
            if (this._uriTransformer && typeof scheme === 'string') {
                return this._uriTransformer.transformOutgoingScheme(scheme);
            }
            return scheme;
        }
        _createDisposable(handle) {
            return new extHostTypes_1.Disposable(() => {
                this._adapter.delete(handle);
                this._proxy.$unregister(handle);
            });
        }
        _nextHandle() {
            return ExtHostLanguageFeatures._handlePool++;
        }
        _withAdapter(handle, ctor, callback, fallbackValue) {
            const data = this._adapter.get(handle);
            if (!data) {
                return Promise.resolve(fallbackValue);
            }
            if (data.adapter instanceof ctor) {
                let t1;
                if (data.extension) {
                    t1 = Date.now();
                    this._logService.trace(`[${data.extension.identifier.value}] INVOKE provider '${ctor.name}'`);
                }
                const p = callback(data.adapter, data.extension);
                const extension = data.extension;
                if (extension) {
                    Promise.resolve(p).then(() => this._logService.trace(`[${extension.identifier.value}] provider DONE after ${Date.now() - t1}ms`), err => {
                        this._logService.error(`[${extension.identifier.value}] provider FAILED`);
                        this._logService.error(err);
                    });
                }
                return p;
            }
            return Promise.reject(new Error('no adapter found'));
        }
        _addNewAdapter(adapter, extension) {
            const handle = this._nextHandle();
            this._adapter.set(handle, new AdapterData(adapter, extension));
            return handle;
        }
        static _extLabel(ext) {
            return ext.displayName || ext.name;
        }
        // --- outline
        registerDocumentSymbolProvider(extension, selector, provider, metadata) {
            const handle = this._addNewAdapter(new DocumentSymbolAdapter(this._documents, provider), extension);
            const displayName = (metadata && metadata.label) || ExtHostLanguageFeatures._extLabel(extension);
            this._proxy.$registerDocumentSymbolProvider(handle, this._transformDocumentSelector(selector), displayName);
            return this._createDisposable(handle);
        }
        $provideDocumentSymbols(handle, resource, token) {
            return this._withAdapter(handle, DocumentSymbolAdapter, adapter => adapter.provideDocumentSymbols(uri_1.URI.revive(resource), token), undefined);
        }
        // --- code lens
        registerCodeLensProvider(extension, selector, provider) {
            const handle = this._nextHandle();
            const eventHandle = typeof provider.onDidChangeCodeLenses === 'function' ? this._nextHandle() : undefined;
            this._adapter.set(handle, new AdapterData(new CodeLensAdapter(this._documents, this._commands.converter, provider), extension));
            this._proxy.$registerCodeLensSupport(handle, this._transformDocumentSelector(selector), eventHandle);
            let result = this._createDisposable(handle);
            if (eventHandle !== undefined) {
                const subscription = provider.onDidChangeCodeLenses(_ => this._proxy.$emitCodeLensEvent(eventHandle));
                result = extHostTypes_1.Disposable.from(result, subscription);
            }
            return result;
        }
        $provideCodeLenses(handle, resource, token) {
            return this._withAdapter(handle, CodeLensAdapter, adapter => adapter.provideCodeLenses(uri_1.URI.revive(resource), token), undefined);
        }
        $resolveCodeLens(handle, symbol, token) {
            return this._withAdapter(handle, CodeLensAdapter, adapter => adapter.resolveCodeLens(symbol, token), undefined);
        }
        $releaseCodeLenses(handle, cacheId) {
            this._withAdapter(handle, CodeLensAdapter, adapter => Promise.resolve(adapter.releaseCodeLenses(cacheId)), undefined);
        }
        // --- declaration
        registerDefinitionProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DefinitionAdapter(this._documents, provider), extension);
            this._proxy.$registerDefinitionSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideDefinition(handle, resource, position, token) {
            return this._withAdapter(handle, DefinitionAdapter, adapter => adapter.provideDefinition(uri_1.URI.revive(resource), position, token), []);
        }
        registerDeclarationProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DeclarationAdapter(this._documents, provider), extension);
            this._proxy.$registerDeclarationSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideDeclaration(handle, resource, position, token) {
            return this._withAdapter(handle, DeclarationAdapter, adapter => adapter.provideDeclaration(uri_1.URI.revive(resource), position, token), []);
        }
        registerImplementationProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new ImplementationAdapter(this._documents, provider), extension);
            this._proxy.$registerImplementationSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideImplementation(handle, resource, position, token) {
            return this._withAdapter(handle, ImplementationAdapter, adapter => adapter.provideImplementation(uri_1.URI.revive(resource), position, token), []);
        }
        registerTypeDefinitionProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new TypeDefinitionAdapter(this._documents, provider), extension);
            this._proxy.$registerTypeDefinitionSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideTypeDefinition(handle, resource, position, token) {
            return this._withAdapter(handle, TypeDefinitionAdapter, adapter => adapter.provideTypeDefinition(uri_1.URI.revive(resource), position, token), []);
        }
        // --- extra info
        registerHoverProvider(extension, selector, provider, extensionId) {
            const handle = this._addNewAdapter(new HoverAdapter(this._documents, provider), extension);
            this._proxy.$registerHoverProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideHover(handle, resource, position, token) {
            return this._withAdapter(handle, HoverAdapter, adapter => adapter.provideHover(uri_1.URI.revive(resource), position, token), undefined);
        }
        // --- debug hover
        registerEvaluatableExpressionProvider(extension, selector, provider, extensionId) {
            const handle = this._addNewAdapter(new EvaluatableExpressionAdapter(this._documents, provider), extension);
            this._proxy.$registerEvaluatableExpressionProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideEvaluatableExpression(handle, resource, position, token) {
            return this._withAdapter(handle, EvaluatableExpressionAdapter, adapter => adapter.provideEvaluatableExpression(uri_1.URI.revive(resource), position, token), undefined);
        }
        // --- occurrences
        registerDocumentHighlightProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DocumentHighlightAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentHighlightProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideDocumentHighlights(handle, resource, position, token) {
            return this._withAdapter(handle, DocumentHighlightAdapter, adapter => adapter.provideDocumentHighlights(uri_1.URI.revive(resource), position, token), undefined);
        }
        // --- on type rename
        registerOnTypeRenameProvider(extension, selector, provider, stopPattern) {
            const handle = this._addNewAdapter(new OnTypeRenameAdapter(this._documents, provider), extension);
            const serializedStopPattern = stopPattern ? ExtHostLanguageFeatures._serializeRegExp(stopPattern) : undefined;
            this._proxy.$registerOnTypeRenameProvider(handle, this._transformDocumentSelector(selector), serializedStopPattern);
            return this._createDisposable(handle);
        }
        $provideOnTypeRenameRanges(handle, resource, position, token) {
            return this._withAdapter(handle, OnTypeRenameAdapter, adapter => adapter.provideOnTypeRenameRanges(uri_1.URI.revive(resource), position, token), undefined);
        }
        // --- references
        registerReferenceProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new ReferenceAdapter(this._documents, provider), extension);
            this._proxy.$registerReferenceSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideReferences(handle, resource, position, context, token) {
            return this._withAdapter(handle, ReferenceAdapter, adapter => adapter.provideReferences(uri_1.URI.revive(resource), position, context, token), undefined);
        }
        // --- quick fix
        registerCodeActionProvider(extension, selector, provider, metadata) {
            var _a, _b;
            const store = new lifecycle_1.DisposableStore();
            const handle = this._addNewAdapter(new CodeActionAdapter(this._documents, this._commands.converter, this._diagnostics, provider, this._logService, extension, this._apiDeprecation), extension);
            this._proxy.$registerQuickFixSupport(handle, this._transformDocumentSelector(selector), {
                providedKinds: (_a = metadata === null || metadata === void 0 ? void 0 : metadata.providedCodeActionKinds) === null || _a === void 0 ? void 0 : _a.map(kind => kind.value),
                documentation: (_b = metadata === null || metadata === void 0 ? void 0 : metadata.documentation) === null || _b === void 0 ? void 0 : _b.map(x => ({
                    kind: x.kind.value,
                    command: this._commands.converter.toInternal(x.command, store),
                }))
            }, ExtHostLanguageFeatures._extLabel(extension));
            store.add(this._createDisposable(handle));
            return store;
        }
        $provideCodeActions(handle, resource, rangeOrSelection, context, token) {
            return this._withAdapter(handle, CodeActionAdapter, adapter => adapter.provideCodeActions(uri_1.URI.revive(resource), rangeOrSelection, context, token), undefined);
        }
        $releaseCodeActions(handle, cacheId) {
            this._withAdapter(handle, CodeActionAdapter, adapter => Promise.resolve(adapter.releaseCodeActions(cacheId)), undefined);
        }
        // --- formatting
        registerDocumentFormattingEditProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DocumentFormattingAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentFormattingSupport(handle, this._transformDocumentSelector(selector), extension.identifier, extension.displayName || extension.name);
            return this._createDisposable(handle);
        }
        $provideDocumentFormattingEdits(handle, resource, options, token) {
            return this._withAdapter(handle, DocumentFormattingAdapter, adapter => adapter.provideDocumentFormattingEdits(uri_1.URI.revive(resource), options, token), undefined);
        }
        registerDocumentRangeFormattingEditProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new RangeFormattingAdapter(this._documents, provider), extension);
            this._proxy.$registerRangeFormattingSupport(handle, this._transformDocumentSelector(selector), extension.identifier, extension.displayName || extension.name);
            return this._createDisposable(handle);
        }
        $provideDocumentRangeFormattingEdits(handle, resource, range, options, token) {
            return this._withAdapter(handle, RangeFormattingAdapter, adapter => adapter.provideDocumentRangeFormattingEdits(uri_1.URI.revive(resource), range, options, token), undefined);
        }
        registerOnTypeFormattingEditProvider(extension, selector, provider, triggerCharacters) {
            const handle = this._addNewAdapter(new OnTypeFormattingAdapter(this._documents, provider), extension);
            this._proxy.$registerOnTypeFormattingSupport(handle, this._transformDocumentSelector(selector), triggerCharacters, extension.identifier);
            return this._createDisposable(handle);
        }
        $provideOnTypeFormattingEdits(handle, resource, position, ch, options, token) {
            return this._withAdapter(handle, OnTypeFormattingAdapter, adapter => adapter.provideOnTypeFormattingEdits(uri_1.URI.revive(resource), position, ch, options, token), undefined);
        }
        // --- navigate types
        registerWorkspaceSymbolProvider(extension, provider) {
            const handle = this._addNewAdapter(new NavigateTypeAdapter(provider, this._logService), extension);
            this._proxy.$registerNavigateTypeSupport(handle);
            return this._createDisposable(handle);
        }
        $provideWorkspaceSymbols(handle, search, token) {
            return this._withAdapter(handle, NavigateTypeAdapter, adapter => adapter.provideWorkspaceSymbols(search, token), { symbols: [] });
        }
        $resolveWorkspaceSymbol(handle, symbol, token) {
            return this._withAdapter(handle, NavigateTypeAdapter, adapter => adapter.resolveWorkspaceSymbol(symbol, token), undefined);
        }
        $releaseWorkspaceSymbols(handle, id) {
            this._withAdapter(handle, NavigateTypeAdapter, adapter => adapter.releaseWorkspaceSymbols(id), undefined);
        }
        // --- rename
        registerRenameProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new RenameAdapter(this._documents, provider, this._logService), extension);
            this._proxy.$registerRenameSupport(handle, this._transformDocumentSelector(selector), RenameAdapter.supportsResolving(provider));
            return this._createDisposable(handle);
        }
        $provideRenameEdits(handle, resource, position, newName, token) {
            return this._withAdapter(handle, RenameAdapter, adapter => adapter.provideRenameEdits(uri_1.URI.revive(resource), position, newName, token), undefined);
        }
        $resolveRenameLocation(handle, resource, position, token) {
            return this._withAdapter(handle, RenameAdapter, adapter => adapter.resolveRenameLocation(uri_1.URI.revive(resource), position, token), undefined);
        }
        //#region semantic coloring
        registerDocumentSemanticTokensProvider(extension, selector, provider, legend) {
            const handle = this._nextHandle();
            const eventHandle = (typeof provider.onDidChangeSemanticTokens === 'function' ? this._nextHandle() : undefined);
            this._adapter.set(handle, new AdapterData(new DocumentSemanticTokensAdapter(this._documents, provider), extension));
            this._proxy.$registerDocumentSemanticTokensProvider(handle, this._transformDocumentSelector(selector), legend, eventHandle);
            let result = this._createDisposable(handle);
            if (eventHandle) {
                const subscription = provider.onDidChangeSemanticTokens(_ => this._proxy.$emitDocumentSemanticTokensEvent(eventHandle));
                result = extHostTypes_1.Disposable.from(result, subscription);
            }
            return result;
        }
        $provideDocumentSemanticTokens(handle, resource, previousResultId, token) {
            return this._withAdapter(handle, DocumentSemanticTokensAdapter, adapter => adapter.provideDocumentSemanticTokens(uri_1.URI.revive(resource), previousResultId, token), null);
        }
        $releaseDocumentSemanticTokens(handle, semanticColoringResultId) {
            this._withAdapter(handle, DocumentSemanticTokensAdapter, adapter => adapter.releaseDocumentSemanticColoring(semanticColoringResultId), undefined);
        }
        registerDocumentRangeSemanticTokensProvider(extension, selector, provider, legend) {
            const handle = this._addNewAdapter(new DocumentRangeSemanticTokensAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentRangeSemanticTokensProvider(handle, this._transformDocumentSelector(selector), legend);
            return this._createDisposable(handle);
        }
        $provideDocumentRangeSemanticTokens(handle, resource, range, token) {
            return this._withAdapter(handle, DocumentRangeSemanticTokensAdapter, adapter => adapter.provideDocumentRangeSemanticTokens(uri_1.URI.revive(resource), range, token), null);
        }
        //#endregion
        // --- suggestion
        registerCompletionItemProvider(extension, selector, provider, triggerCharacters) {
            const handle = this._addNewAdapter(new SuggestAdapter(this._documents, this._commands.converter, provider, this._apiDeprecation, extension), extension);
            this._proxy.$registerSuggestSupport(handle, this._transformDocumentSelector(selector), triggerCharacters, SuggestAdapter.supportsResolving(provider), extension.identifier);
            return this._createDisposable(handle);
        }
        $provideCompletionItems(handle, resource, position, context, token) {
            return this._withAdapter(handle, SuggestAdapter, adapter => adapter.provideCompletionItems(uri_1.URI.revive(resource), position, context, token), undefined);
        }
        $resolveCompletionItem(handle, id, token) {
            return this._withAdapter(handle, SuggestAdapter, adapter => adapter.resolveCompletionItem(id, token), undefined);
        }
        $releaseCompletionItems(handle, id) {
            this._withAdapter(handle, SuggestAdapter, adapter => adapter.releaseCompletionItems(id), undefined);
        }
        // --- parameter hints
        registerSignatureHelpProvider(extension, selector, provider, metadataOrTriggerChars) {
            const metadata = Array.isArray(metadataOrTriggerChars)
                ? { triggerCharacters: metadataOrTriggerChars, retriggerCharacters: [] }
                : metadataOrTriggerChars;
            const handle = this._addNewAdapter(new SignatureHelpAdapter(this._documents, provider), extension);
            this._proxy.$registerSignatureHelpProvider(handle, this._transformDocumentSelector(selector), metadata);
            return this._createDisposable(handle);
        }
        $provideSignatureHelp(handle, resource, position, context, token) {
            return this._withAdapter(handle, SignatureHelpAdapter, adapter => adapter.provideSignatureHelp(uri_1.URI.revive(resource), position, context, token), undefined);
        }
        $releaseSignatureHelp(handle, id) {
            this._withAdapter(handle, SignatureHelpAdapter, adapter => adapter.releaseSignatureHelp(id), undefined);
        }
        // --- links
        registerDocumentLinkProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new LinkProviderAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentLinkProvider(handle, this._transformDocumentSelector(selector), typeof provider.resolveDocumentLink === 'function');
            return this._createDisposable(handle);
        }
        $provideDocumentLinks(handle, resource, token) {
            return this._withAdapter(handle, LinkProviderAdapter, adapter => adapter.provideLinks(uri_1.URI.revive(resource), token), undefined);
        }
        $resolveDocumentLink(handle, id, token) {
            return this._withAdapter(handle, LinkProviderAdapter, adapter => adapter.resolveLink(id, token), undefined);
        }
        $releaseDocumentLinks(handle, id) {
            this._withAdapter(handle, LinkProviderAdapter, adapter => adapter.releaseLinks(id), undefined);
        }
        registerColorProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new ColorProviderAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentColorProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideDocumentColors(handle, resource, token) {
            return this._withAdapter(handle, ColorProviderAdapter, adapter => adapter.provideColors(uri_1.URI.revive(resource), token), []);
        }
        $provideColorPresentations(handle, resource, colorInfo, token) {
            return this._withAdapter(handle, ColorProviderAdapter, adapter => adapter.provideColorPresentations(uri_1.URI.revive(resource), colorInfo, token), undefined);
        }
        registerFoldingRangeProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new FoldingProviderAdapter(this._documents, provider), extension);
            this._proxy.$registerFoldingRangeProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideFoldingRanges(handle, resource, context, token) {
            return this._withAdapter(handle, FoldingProviderAdapter, adapter => adapter.provideFoldingRanges(uri_1.URI.revive(resource), context, token), undefined);
        }
        // --- smart select
        registerSelectionRangeProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new SelectionRangeAdapter(this._documents, provider, this._logService), extension);
            this._proxy.$registerSelectionRangeProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideSelectionRanges(handle, resource, positions, token) {
            return this._withAdapter(handle, SelectionRangeAdapter, adapter => adapter.provideSelectionRanges(uri_1.URI.revive(resource), positions, token), []);
        }
        // --- call hierarchy
        registerCallHierarchyProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new CallHierarchyAdapter(this._documents, provider), extension);
            this._proxy.$registerCallHierarchyProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $prepareCallHierarchy(handle, resource, position, token) {
            return this._withAdapter(handle, CallHierarchyAdapter, adapter => Promise.resolve(adapter.prepareSession(uri_1.URI.revive(resource), position, token)), undefined);
        }
        $provideCallHierarchyIncomingCalls(handle, sessionId, itemId, token) {
            return this._withAdapter(handle, CallHierarchyAdapter, adapter => adapter.provideCallsTo(sessionId, itemId, token), undefined);
        }
        $provideCallHierarchyOutgoingCalls(handle, sessionId, itemId, token) {
            return this._withAdapter(handle, CallHierarchyAdapter, adapter => adapter.provideCallsFrom(sessionId, itemId, token), undefined);
        }
        $releaseCallHierarchy(handle, sessionId) {
            this._withAdapter(handle, CallHierarchyAdapter, adapter => Promise.resolve(adapter.releaseSession(sessionId)), undefined);
        }
        // --- configuration
        static _serializeRegExp(regExp) {
            return {
                pattern: regExp.source,
                flags: strings_1.regExpFlags(regExp),
            };
        }
        static _serializeIndentationRule(indentationRule) {
            return {
                decreaseIndentPattern: ExtHostLanguageFeatures._serializeRegExp(indentationRule.decreaseIndentPattern),
                increaseIndentPattern: ExtHostLanguageFeatures._serializeRegExp(indentationRule.increaseIndentPattern),
                indentNextLinePattern: indentationRule.indentNextLinePattern ? ExtHostLanguageFeatures._serializeRegExp(indentationRule.indentNextLinePattern) : undefined,
                unIndentedLinePattern: indentationRule.unIndentedLinePattern ? ExtHostLanguageFeatures._serializeRegExp(indentationRule.unIndentedLinePattern) : undefined,
            };
        }
        static _serializeOnEnterRule(onEnterRule) {
            return {
                beforeText: ExtHostLanguageFeatures._serializeRegExp(onEnterRule.beforeText),
                afterText: onEnterRule.afterText ? ExtHostLanguageFeatures._serializeRegExp(onEnterRule.afterText) : undefined,
                oneLineAboveText: onEnterRule.oneLineAboveText ? ExtHostLanguageFeatures._serializeRegExp(onEnterRule.oneLineAboveText) : undefined,
                action: onEnterRule.action
            };
        }
        static _serializeOnEnterRules(onEnterRules) {
            return onEnterRules.map(ExtHostLanguageFeatures._serializeOnEnterRule);
        }
        setLanguageConfiguration(extension, languageId, configuration) {
            let { wordPattern } = configuration;
            // check for a valid word pattern
            if (wordPattern && strings_1.regExpLeadsToEndlessLoop(wordPattern)) {
                throw new Error(`Invalid language configuration: wordPattern '${wordPattern}' is not allowed to match the empty string.`);
            }
            // word definition
            if (wordPattern) {
                this._documents.setWordDefinitionFor(languageId, wordPattern);
            }
            else {
                this._documents.setWordDefinitionFor(languageId, undefined);
            }
            if (configuration.__electricCharacterSupport) {
                this._apiDeprecation.report('LanguageConfiguration.__electricCharacterSupport', extension, `Do not use.`);
            }
            if (configuration.__characterPairSupport) {
                this._apiDeprecation.report('LanguageConfiguration.__characterPairSupport', extension, `Do not use.`);
            }
            const handle = this._nextHandle();
            const serializedConfiguration = {
                comments: configuration.comments,
                brackets: configuration.brackets,
                wordPattern: configuration.wordPattern ? ExtHostLanguageFeatures._serializeRegExp(configuration.wordPattern) : undefined,
                indentationRules: configuration.indentationRules ? ExtHostLanguageFeatures._serializeIndentationRule(configuration.indentationRules) : undefined,
                onEnterRules: configuration.onEnterRules ? ExtHostLanguageFeatures._serializeOnEnterRules(configuration.onEnterRules) : undefined,
                __electricCharacterSupport: configuration.__electricCharacterSupport,
                __characterPairSupport: configuration.__characterPairSupport,
            };
            this._proxy.$setLanguageConfiguration(handle, languageId, serializedConfiguration);
            return this._createDisposable(handle);
        }
        $setWordDefinitions(wordDefinitions) {
            for (const wordDefinition of wordDefinitions) {
                this._documents.setWordDefinitionFor(wordDefinition.languageId, new RegExp(wordDefinition.regexSource, wordDefinition.regexFlags));
            }
        }
    }
    exports.ExtHostLanguageFeatures = ExtHostLanguageFeatures;
    ExtHostLanguageFeatures._handlePool = 0;
});
//# __sourceMappingURL=extHostLanguageFeatures.js.map