/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/errors", "vs/workbench/api/common/extHostTypes", "vs/workbench/api/common/extHostTypeConverters", "vs/base/common/linkedList"], function (require, exports, uri_1, errors_1, extHostTypes_1, extHostTypeConverters_1, linkedList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostDocumentSaveParticipant = void 0;
    class ExtHostDocumentSaveParticipant {
        constructor(_logService, _documents, _mainThreadEditors, _thresholds = { timeout: 1500, errors: 3 }) {
            this._logService = _logService;
            this._documents = _documents;
            this._mainThreadEditors = _mainThreadEditors;
            this._thresholds = _thresholds;
            this._callbacks = new linkedList_1.LinkedList();
            this._badListeners = new WeakMap();
            //
        }
        dispose() {
            this._callbacks.clear();
        }
        getOnWillSaveTextDocumentEvent(extension) {
            return (listener, thisArg, disposables) => {
                const remove = this._callbacks.push([listener, thisArg, extension]);
                const result = { dispose: remove };
                if (Array.isArray(disposables)) {
                    disposables.push(result);
                }
                return result;
            };
        }
        async $participateInSave(data, reason) {
            const resource = uri_1.URI.revive(data);
            let didTimeout = false;
            const didTimeoutHandle = setTimeout(() => didTimeout = true, this._thresholds.timeout);
            const results = [];
            try {
                for (let listener of [...this._callbacks]) { // copy to prevent concurrent modifications
                    if (didTimeout) {
                        // timeout - no more listeners
                        break;
                    }
                    const document = this._documents.getDocument(resource);
                    const success = await this._deliverEventAsyncAndBlameBadListeners(listener, { document, reason: extHostTypeConverters_1.TextDocumentSaveReason.to(reason) });
                    results.push(success);
                }
            }
            finally {
                clearTimeout(didTimeoutHandle);
            }
            return results;
        }
        _deliverEventAsyncAndBlameBadListeners([listener, thisArg, extension], stubEvent) {
            const errors = this._badListeners.get(listener);
            if (typeof errors === 'number' && errors > this._thresholds.errors) {
                // bad listener - ignore
                return Promise.resolve(false);
            }
            return this._deliverEventAsync(extension, listener, thisArg, stubEvent).then(() => {
                // don't send result across the wire
                return true;
            }, err => {
                this._logService.error(`onWillSaveTextDocument-listener from extension '${extension.identifier.value}' threw ERROR`);
                this._logService.error(err);
                if (!(err instanceof Error) || err.message !== 'concurrent_edits') {
                    const errors = this._badListeners.get(listener);
                    this._badListeners.set(listener, !errors ? 1 : errors + 1);
                    if (typeof errors === 'number' && errors > this._thresholds.errors) {
                        this._logService.info(`onWillSaveTextDocument-listener from extension '${extension.identifier.value}' will now be IGNORED because of timeouts and/or errors`);
                    }
                }
                return false;
            });
        }
        _deliverEventAsync(extension, listener, thisArg, stubEvent) {
            const promises = [];
            const t1 = Date.now();
            const { document, reason } = stubEvent;
            const { version } = document;
            const event = Object.freeze({
                document,
                reason,
                waitUntil(p) {
                    if (Object.isFrozen(promises)) {
                        throw errors_1.illegalState('waitUntil can not be called async');
                    }
                    promises.push(Promise.resolve(p));
                }
            });
            try {
                // fire event
                listener.apply(thisArg, [event]);
            }
            catch (err) {
                return Promise.reject(err);
            }
            // freeze promises after event call
            Object.freeze(promises);
            return new Promise((resolve, reject) => {
                // join on all listener promises, reject after timeout
                const handle = setTimeout(() => reject(new Error('timeout')), this._thresholds.timeout);
                return Promise.all(promises).then(edits => {
                    this._logService.debug(`onWillSaveTextDocument-listener from extension '${extension.identifier.value}' finished after ${(Date.now() - t1)}ms`);
                    clearTimeout(handle);
                    resolve(edits);
                }).catch(err => {
                    clearTimeout(handle);
                    reject(err);
                });
            }).then(values => {
                const dto = { edits: [] };
                for (const value of values) {
                    if (Array.isArray(value) && value.every(e => e instanceof extHostTypes_1.TextEdit)) {
                        for (const { newText, newEol, range } of value) {
                            dto.edits.push({
                                resource: document.uri,
                                edit: {
                                    range: range && extHostTypeConverters_1.Range.from(range),
                                    text: newText,
                                    eol: newEol && extHostTypeConverters_1.EndOfLine.from(newEol)
                                }
                            });
                        }
                    }
                }
                // apply edits if any and if document
                // didn't change somehow in the meantime
                if (dto.edits.length === 0) {
                    return undefined;
                }
                if (version === document.version) {
                    return this._mainThreadEditors.$tryApplyWorkspaceEdit(dto);
                }
                return Promise.reject(new Error('concurrent_edits'));
            });
        }
    }
    exports.ExtHostDocumentSaveParticipant = ExtHostDocumentSaveParticipant;
});
//# __sourceMappingURL=extHostDocumentSaveParticipant.js.map