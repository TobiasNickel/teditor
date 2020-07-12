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
define(["require", "exports", "vs/base/common/event", "vs/platform/log/common/log", "./timeline", "vs/workbench/common/views"], function (require, exports, event_1, log_1, timeline_1, views_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimelineService = void 0;
    let TimelineService = class TimelineService {
        constructor(logService, viewsService) {
            // let source = 'fast-source';
            // this.registerTimelineProvider({
            // 	scheme: '*',
            // 	id: source,
            // 	label: 'Fast Source',
            // 	provideTimeline(uri: URI, options: TimelineOptions, token: CancellationToken, internalOptions?: { cacheResults?: boolean | undefined; }) {
            // 		if (options.cursor === undefined) {
            // 			return Promise.resolve<Timeline>({
            // 				source: source,
            // 				items: [
            // 					{
            // 						handle: `${source}|1`,
            // 						id: '1',
            // 						label: 'Fast Timeline1',
            // 						description: '',
            // 						timestamp: Date.now(),
            // 						source: source
            // 					},
            // 					{
            // 						handle: `${source}|2`,
            // 						id: '2',
            // 						label: 'Fast Timeline2',
            // 						description: '',
            // 						timestamp: Date.now() - 3000000000,
            // 						source: source
            // 					}
            // 				],
            // 				paging: {
            // 					cursor: 'next'
            // 				}
            // 			});
            // 		}
            // 		return Promise.resolve<Timeline>({
            // 			source: source,
            // 			items: [
            // 				{
            // 					handle: `${source}|3`,
            // 					id: '3',
            // 					label: 'Fast Timeline3',
            // 					description: '',
            // 					timestamp: Date.now() - 4000000000,
            // 					source: source
            // 				},
            // 				{
            // 					handle: `${source}|4`,
            // 					id: '4',
            // 					label: 'Fast Timeline4',
            // 					description: '',
            // 					timestamp: Date.now() - 300000000000,
            // 					source: source
            // 				}
            // 			],
            // 			paging: {
            // 				cursor: undefined
            // 			}
            // 		});
            // 	},
            // 	dispose() { }
            // });
            this.logService = logService;
            this.viewsService = viewsService;
            this._onDidChangeProviders = new event_1.Emitter();
            this.onDidChangeProviders = this._onDidChangeProviders.event;
            this._onDidChangeTimeline = new event_1.Emitter();
            this.onDidChangeTimeline = this._onDidChangeTimeline.event;
            this._onDidChangeUri = new event_1.Emitter();
            this.onDidChangeUri = this._onDidChangeUri.event;
            this.providers = new Map();
            this.providerSubscriptions = new Map();
            // let source = 'slow-source';
            // this.registerTimelineProvider({
            // 	scheme: '*',
            // 	id: source,
            // 	label: 'Slow Source',
            // 	provideTimeline(uri: URI, options: TimelineOptions, token: CancellationToken, internalOptions?: { cacheResults?: boolean | undefined; }) {
            // 		return new Promise<Timeline>(resolve => setTimeout(() => {
            // 			resolve({
            // 				source: source,
            // 				items: [
            // 					{
            // 						handle: `${source}|1`,
            // 						id: '1',
            // 						label: 'Slow Timeline1',
            // 						description: basename(uri.fsPath),
            // 						timestamp: Date.now(),
            // 						source: source
            // 					},
            // 					{
            // 						handle: `${source}|2`,
            // 						id: '2',
            // 						label: 'Slow Timeline2',
            // 						description: basename(uri.fsPath),
            // 						timestamp: new Date(0).getTime(),
            // 						source: source
            // 					}
            // 				]
            // 			});
            // 		}, 5000));
            // 	},
            // 	dispose() { }
            // });
            // source = 'very-slow-source';
            // this.registerTimelineProvider({
            // 	scheme: '*',
            // 	id: source,
            // 	label: 'Very Slow Source',
            // 	provideTimeline(uri: URI, options: TimelineOptions, token: CancellationToken, internalOptions?: { cacheResults?: boolean | undefined; }) {
            // 		return new Promise<Timeline>(resolve => setTimeout(() => {
            // 			resolve({
            // 				source: source,
            // 				items: [
            // 					{
            // 						handle: `${source}|1`,
            // 						id: '1',
            // 						label: 'VERY Slow Timeline1',
            // 						description: basename(uri.fsPath),
            // 						timestamp: Date.now(),
            // 						source: source
            // 					},
            // 					{
            // 						handle: `${source}|2`,
            // 						id: '2',
            // 						label: 'VERY Slow Timeline2',
            // 						description: basename(uri.fsPath),
            // 						timestamp: new Date(0).getTime(),
            // 						source: source
            // 					}
            // 				]
            // 			});
            // 		}, 10000));
            // 	},
            // 	dispose() { }
            // });
        }
        getSources() {
            return [...this.providers.values()].map(p => ({ id: p.id, label: p.label }));
        }
        getTimeline(id, uri, options, tokenSource, internalOptions) {
            this.logService.trace(`TimelineService#getTimeline(${id}): uri=${uri.toString(true)}`);
            const provider = this.providers.get(id);
            if (provider === undefined) {
                return undefined;
            }
            if (typeof provider.scheme === 'string') {
                if (provider.scheme !== '*' && provider.scheme !== uri.scheme) {
                    return undefined;
                }
            }
            else if (!provider.scheme.includes(uri.scheme)) {
                return undefined;
            }
            return {
                result: provider.provideTimeline(uri, options, tokenSource.token, internalOptions)
                    .then(result => {
                    if (result === undefined) {
                        return undefined;
                    }
                    result.items = result.items.map(item => (Object.assign(Object.assign({}, item), { source: provider.id })));
                    result.items.sort((a, b) => (b.timestamp - a.timestamp) || b.source.localeCompare(a.source, undefined, { numeric: true, sensitivity: 'base' }));
                    return result;
                }),
                options: options,
                source: provider.id,
                tokenSource: tokenSource,
                uri: uri
            };
        }
        registerTimelineProvider(provider) {
            this.logService.trace(`TimelineService#registerTimelineProvider: id=${provider.id}`);
            const id = provider.id;
            const existing = this.providers.get(id);
            if (existing) {
                // For now to deal with https://github.com/microsoft/vscode/issues/89553 allow any overwritting here (still will be blocked in the Extension Host)
                // TODO@eamodio: Ultimately will need to figure out a way to unregister providers when the Extension Host restarts/crashes
                // throw new Error(`Timeline Provider ${id} already exists.`);
                try {
                    existing === null || existing === void 0 ? void 0 : existing.dispose();
                }
                catch (_a) { }
            }
            this.providers.set(id, provider);
            if (provider.onDidChange) {
                this.providerSubscriptions.set(id, provider.onDidChange(e => this._onDidChangeTimeline.fire(e)));
            }
            this._onDidChangeProviders.fire({ added: [id] });
            return {
                dispose: () => {
                    this.providers.delete(id);
                    this._onDidChangeProviders.fire({ removed: [id] });
                }
            };
        }
        unregisterTimelineProvider(id) {
            this.logService.trace(`TimelineService#unregisterTimelineProvider: id=${id}`);
            if (!this.providers.has(id)) {
                return;
            }
            this.providers.delete(id);
            this.providerSubscriptions.delete(id);
            this._onDidChangeProviders.fire({ removed: [id] });
        }
        setUri(uri) {
            this.viewsService.openView(timeline_1.TimelinePaneId, true);
            this._onDidChangeUri.fire(uri);
        }
    };
    TimelineService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, views_1.IViewsService)
    ], TimelineService);
    exports.TimelineService = TimelineService;
});
//# __sourceMappingURL=timelineService.js.map