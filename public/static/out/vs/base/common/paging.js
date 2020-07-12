/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/arrays"], function (require, exports, types_1, cancellation_1, errors_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mergePagers = exports.mapPager = exports.DelayedPagedModel = exports.PagedModel = exports.singlePagePager = void 0;
    function createPage(elements) {
        return {
            isResolved: !!elements,
            promise: null,
            cts: null,
            promiseIndexes: new Set(),
            elements: elements || []
        };
    }
    function singlePagePager(elements) {
        return {
            firstPage: elements,
            total: elements.length,
            pageSize: elements.length,
            getPage: (pageIndex, cancellationToken) => {
                return Promise.resolve(elements);
            }
        };
    }
    exports.singlePagePager = singlePagePager;
    class PagedModel {
        constructor(arg) {
            this.pages = [];
            this.pager = types_1.isArray(arg) ? singlePagePager(arg) : arg;
            const totalPages = Math.ceil(this.pager.total / this.pager.pageSize);
            this.pages = [
                createPage(this.pager.firstPage.slice()),
                ...arrays_1.range(totalPages - 1).map(() => createPage())
            ];
        }
        get length() { return this.pager.total; }
        isResolved(index) {
            const pageIndex = Math.floor(index / this.pager.pageSize);
            const page = this.pages[pageIndex];
            return !!page.isResolved;
        }
        get(index) {
            const pageIndex = Math.floor(index / this.pager.pageSize);
            const indexInPage = index % this.pager.pageSize;
            const page = this.pages[pageIndex];
            return page.elements[indexInPage];
        }
        resolve(index, cancellationToken) {
            if (cancellationToken.isCancellationRequested) {
                return Promise.reject(errors_1.canceled());
            }
            const pageIndex = Math.floor(index / this.pager.pageSize);
            const indexInPage = index % this.pager.pageSize;
            const page = this.pages[pageIndex];
            if (page.isResolved) {
                return Promise.resolve(page.elements[indexInPage]);
            }
            if (!page.promise) {
                page.cts = new cancellation_1.CancellationTokenSource();
                page.promise = this.pager.getPage(pageIndex, page.cts.token)
                    .then(elements => {
                    page.elements = elements;
                    page.isResolved = true;
                    page.promise = null;
                    page.cts = null;
                }, err => {
                    page.isResolved = false;
                    page.promise = null;
                    page.cts = null;
                    return Promise.reject(err);
                });
            }
            cancellationToken.onCancellationRequested(() => {
                if (!page.cts) {
                    return;
                }
                page.promiseIndexes.delete(index);
                if (page.promiseIndexes.size === 0) {
                    page.cts.cancel();
                }
            });
            page.promiseIndexes.add(index);
            return page.promise.then(() => page.elements[indexInPage]);
        }
    }
    exports.PagedModel = PagedModel;
    class DelayedPagedModel {
        constructor(model, timeout = 500) {
            this.model = model;
            this.timeout = timeout;
        }
        get length() { return this.model.length; }
        isResolved(index) {
            return this.model.isResolved(index);
        }
        get(index) {
            return this.model.get(index);
        }
        resolve(index, cancellationToken) {
            return new Promise((c, e) => {
                if (cancellationToken.isCancellationRequested) {
                    return e(errors_1.canceled());
                }
                const timer = setTimeout(() => {
                    if (cancellationToken.isCancellationRequested) {
                        return e(errors_1.canceled());
                    }
                    timeoutCancellation.dispose();
                    this.model.resolve(index, cancellationToken).then(c, e);
                }, this.timeout);
                const timeoutCancellation = cancellationToken.onCancellationRequested(() => {
                    clearTimeout(timer);
                    timeoutCancellation.dispose();
                    e(errors_1.canceled());
                });
            });
        }
    }
    exports.DelayedPagedModel = DelayedPagedModel;
    /**
     * Similar to array.map, `mapPager` lets you map the elements of an
     * abstract paged collection to another type.
     */
    function mapPager(pager, fn) {
        return {
            firstPage: pager.firstPage.map(fn),
            total: pager.total,
            pageSize: pager.pageSize,
            getPage: (pageIndex, token) => pager.getPage(pageIndex, token).then(r => r.map(fn))
        };
    }
    exports.mapPager = mapPager;
    /**
     * Merges two pagers.
     */
    function mergePagers(one, other) {
        return {
            firstPage: [...one.firstPage, ...other.firstPage],
            total: one.total + other.total,
            pageSize: one.pageSize + other.pageSize,
            getPage(pageIndex, token) {
                return Promise.all([one.getPage(pageIndex, token), other.getPage(pageIndex, token)])
                    .then(([onePage, otherPage]) => [...onePage, ...otherPage]);
            }
        };
    }
    exports.mergePagers = mergePagers;
});
//# __sourceMappingURL=paging.js.map