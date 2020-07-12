/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostDocumentData", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/types", "vs/base/common/objects"], function (require, exports, event_1, lifecycle_1, uri_1, extHost_protocol_1, extHostDocumentData_1, TypeConverters, types_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDocuments = void 0;
    class ExtHostDocuments {
        constructor(mainContext, documentsAndEditors) {
            this._onDidAddDocument = new event_1.Emitter();
            this._onDidRemoveDocument = new event_1.Emitter();
            this._onDidChangeDocument = new event_1.Emitter();
            this._onDidSaveDocument = new event_1.Emitter();
            this.onDidAddDocument = this._onDidAddDocument.event;
            this.onDidRemoveDocument = this._onDidRemoveDocument.event;
            this.onDidChangeDocument = this._onDidChangeDocument.event;
            this.onDidSaveDocument = this._onDidSaveDocument.event;
            this._toDispose = new lifecycle_1.DisposableStore();
            this._documentLoader = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadDocuments);
            this._documentsAndEditors = documentsAndEditors;
            this._documentsAndEditors.onDidRemoveDocuments(documents => {
                for (const data of documents) {
                    this._onDidRemoveDocument.fire(data.document);
                }
            }, undefined, this._toDispose);
            this._documentsAndEditors.onDidAddDocuments(documents => {
                for (const data of documents) {
                    this._onDidAddDocument.fire(data.document);
                }
            }, undefined, this._toDispose);
        }
        dispose() {
            this._toDispose.dispose();
        }
        getAllDocumentData() {
            return this._documentsAndEditors.allDocuments();
        }
        getDocumentData(resource) {
            if (!resource) {
                return undefined;
            }
            const data = this._documentsAndEditors.getDocument(resource);
            if (data) {
                return data;
            }
            return undefined;
        }
        getDocument(resource) {
            const data = this.getDocumentData(resource);
            if (!data || !data.document) {
                throw new Error('Unable to retrieve document from URI');
            }
            return data.document;
        }
        ensureDocumentData(uri) {
            const cached = this._documentsAndEditors.getDocument(uri);
            if (cached) {
                return Promise.resolve(cached);
            }
            let promise = this._documentLoader.get(uri.toString());
            if (!promise) {
                promise = this._proxy.$tryOpenDocument(uri).then(uriData => {
                    this._documentLoader.delete(uri.toString());
                    const canonicalUri = uri_1.URI.revive(uriData);
                    return types_1.assertIsDefined(this._documentsAndEditors.getDocument(canonicalUri));
                }, err => {
                    this._documentLoader.delete(uri.toString());
                    return Promise.reject(err);
                });
                this._documentLoader.set(uri.toString(), promise);
            }
            return promise;
        }
        createDocumentData(options) {
            return this._proxy.$tryCreateDocument(options).then(data => uri_1.URI.revive(data));
        }
        $acceptModelModeChanged(uriComponents, oldModeId, newModeId) {
            const uri = uri_1.URI.revive(uriComponents);
            const data = this._documentsAndEditors.getDocument(uri);
            if (!data) {
                throw new Error('unknown document');
            }
            // Treat a mode change as a remove + add
            this._onDidRemoveDocument.fire(data.document);
            data._acceptLanguageId(newModeId);
            this._onDidAddDocument.fire(data.document);
        }
        $acceptModelSaved(uriComponents) {
            const uri = uri_1.URI.revive(uriComponents);
            const data = this._documentsAndEditors.getDocument(uri);
            if (!data) {
                throw new Error('unknown document');
            }
            this.$acceptDirtyStateChanged(uriComponents, false);
            this._onDidSaveDocument.fire(data.document);
        }
        $acceptDirtyStateChanged(uriComponents, isDirty) {
            const uri = uri_1.URI.revive(uriComponents);
            const data = this._documentsAndEditors.getDocument(uri);
            if (!data) {
                throw new Error('unknown document');
            }
            data._acceptIsDirty(isDirty);
            this._onDidChangeDocument.fire({
                document: data.document,
                contentChanges: []
            });
        }
        $acceptModelChanged(uriComponents, events, isDirty) {
            const uri = uri_1.URI.revive(uriComponents);
            const data = this._documentsAndEditors.getDocument(uri);
            if (!data) {
                throw new Error('unknown document');
            }
            data._acceptIsDirty(isDirty);
            data.onEvents(events);
            this._onDidChangeDocument.fire(objects_1.deepFreeze({
                document: data.document,
                contentChanges: events.changes.map((change) => {
                    return {
                        range: TypeConverters.Range.to(change.range),
                        rangeOffset: change.rangeOffset,
                        rangeLength: change.rangeLength,
                        text: change.text
                    };
                })
            }));
        }
        setWordDefinitionFor(modeId, wordDefinition) {
            extHostDocumentData_1.setWordDefinitionFor(modeId, wordDefinition);
        }
    }
    exports.ExtHostDocuments = ExtHostDocuments;
});
//# __sourceMappingURL=extHostDocuments.js.map