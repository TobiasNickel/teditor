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
define(["require", "exports", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, storage_1, types_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchHistoryService = exports.ISearchHistoryService = void 0;
    exports.ISearchHistoryService = instantiation_1.createDecorator('searchHistoryService');
    let SearchHistoryService = class SearchHistoryService {
        constructor(storageService) {
            this.storageService = storageService;
            this._onDidClearHistory = new event_1.Emitter();
            this.onDidClearHistory = this._onDidClearHistory.event;
        }
        clearHistory() {
            this.storageService.remove(SearchHistoryService.SEARCH_HISTORY_KEY, 1 /* WORKSPACE */);
            this._onDidClearHistory.fire();
        }
        load() {
            let result;
            const raw = this.storageService.get(SearchHistoryService.SEARCH_HISTORY_KEY, 1 /* WORKSPACE */);
            if (raw) {
                try {
                    result = JSON.parse(raw);
                }
                catch (e) {
                    // Invalid data
                }
            }
            return result || {};
        }
        save(history) {
            if (types_1.isEmptyObject(history)) {
                this.storageService.remove(SearchHistoryService.SEARCH_HISTORY_KEY, 1 /* WORKSPACE */);
            }
            else {
                this.storageService.store(SearchHistoryService.SEARCH_HISTORY_KEY, JSON.stringify(history), 1 /* WORKSPACE */);
            }
        }
    };
    SearchHistoryService.SEARCH_HISTORY_KEY = 'workbench.search.history';
    SearchHistoryService = __decorate([
        __param(0, storage_1.IStorageService)
    ], SearchHistoryService);
    exports.SearchHistoryService = SearchHistoryService;
});
//# __sourceMappingURL=searchHistoryService.js.map