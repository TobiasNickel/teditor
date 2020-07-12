/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/async"], function (require, exports, cancellation_1, lifecycle_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PickerQuickAccessProvider = exports.TriggerAction = void 0;
    var TriggerAction;
    (function (TriggerAction) {
        /**
         * Do nothing after the button was clicked.
         */
        TriggerAction[TriggerAction["NO_ACTION"] = 0] = "NO_ACTION";
        /**
         * Close the picker.
         */
        TriggerAction[TriggerAction["CLOSE_PICKER"] = 1] = "CLOSE_PICKER";
        /**
         * Update the results of the picker.
         */
        TriggerAction[TriggerAction["REFRESH_PICKER"] = 2] = "REFRESH_PICKER";
        /**
         * Remove the item from the picker.
         */
        TriggerAction[TriggerAction["REMOVE_ITEM"] = 3] = "REMOVE_ITEM";
    })(TriggerAction = exports.TriggerAction || (exports.TriggerAction = {}));
    function isPicksWithActive(obj) {
        const candidate = obj;
        return Array.isArray(candidate.items);
    }
    function isFastAndSlowPicks(obj) {
        const candidate = obj;
        return !!candidate.picks && candidate.additionalPicks instanceof Promise;
    }
    class PickerQuickAccessProvider extends lifecycle_1.Disposable {
        constructor(prefix, options) {
            super();
            this.prefix = prefix;
            this.options = options;
        }
        provide(picker, token) {
            var _a;
            const disposables = new lifecycle_1.DisposableStore();
            // Apply options if any
            picker.canAcceptInBackground = !!((_a = this.options) === null || _a === void 0 ? void 0 : _a.canAcceptInBackground);
            // Disable filtering & sorting, we control the results
            picker.matchOnLabel = picker.matchOnDescription = picker.matchOnDetail = picker.sortByLabel = false;
            // Set initial picks and update on type
            let picksCts = undefined;
            const picksDisposable = disposables.add(new lifecycle_1.MutableDisposable());
            const updatePickerItems = async () => {
                const picksDisposables = picksDisposable.value = new lifecycle_1.DisposableStore();
                // Cancel any previous ask for picks and busy
                picksCts === null || picksCts === void 0 ? void 0 : picksCts.dispose(true);
                picker.busy = false;
                // Create new cancellation source for this run
                picksCts = new cancellation_1.CancellationTokenSource(token);
                // Collect picks and support both long running and short or combined
                const picksToken = picksCts.token;
                const picksFilter = picker.value.substr(this.prefix.length).trim();
                const providedPicks = this.getPicks(picksFilter, picksDisposables, picksToken);
                const applyPicks = (picks, skipEmpty) => {
                    var _a;
                    let items;
                    let activeItem = undefined;
                    if (isPicksWithActive(picks)) {
                        items = picks.items;
                        activeItem = picks.active;
                    }
                    else {
                        items = picks;
                    }
                    if (items.length === 0) {
                        if (skipEmpty) {
                            return false;
                        }
                        if (picksFilter.length > 0 && ((_a = this.options) === null || _a === void 0 ? void 0 : _a.noResultsPick)) {
                            items = [this.options.noResultsPick];
                        }
                    }
                    picker.items = items;
                    if (activeItem) {
                        picker.activeItems = [activeItem];
                    }
                    return true;
                };
                // No Picks
                if (providedPicks === null) {
                    // Ignore
                }
                // Fast and Slow Picks
                else if (isFastAndSlowPicks(providedPicks)) {
                    let fastPicksApplied = false;
                    let slowPicksApplied = false;
                    await Promise.all([
                        // Fast Picks: to reduce amount of flicker, we race against
                        // the slow picks over 500ms and then set the fast picks.
                        // If the slow picks are faster, we reduce the flicker by
                        // only setting the items once.
                        (async () => {
                            await async_1.timeout(PickerQuickAccessProvider.FAST_PICKS_RACE_DELAY);
                            if (picksToken.isCancellationRequested) {
                                return;
                            }
                            if (!slowPicksApplied) {
                                fastPicksApplied = applyPicks(providedPicks.picks, true /* skip over empty to reduce flicker */);
                            }
                        })(),
                        // Slow Picks: we await the slow picks and then set them at
                        // once together with the fast picks, but only if we actually
                        // have additional results.
                        (async () => {
                            picker.busy = true;
                            try {
                                const awaitedAdditionalPicks = await providedPicks.additionalPicks;
                                if (picksToken.isCancellationRequested) {
                                    return;
                                }
                                let picks;
                                let activePick = undefined;
                                if (isPicksWithActive(providedPicks.picks)) {
                                    picks = providedPicks.picks.items;
                                    activePick = providedPicks.picks.active;
                                }
                                else {
                                    picks = providedPicks.picks;
                                }
                                let additionalPicks;
                                let additionalActivePick = undefined;
                                if (isPicksWithActive(awaitedAdditionalPicks)) {
                                    additionalPicks = awaitedAdditionalPicks.items;
                                    additionalActivePick = awaitedAdditionalPicks.active;
                                }
                                else {
                                    additionalPicks = awaitedAdditionalPicks;
                                }
                                if (additionalPicks.length > 0 || !fastPicksApplied) {
                                    applyPicks({
                                        items: [...picks, ...additionalPicks],
                                        active: activePick || additionalActivePick
                                    });
                                }
                            }
                            finally {
                                if (!picksToken.isCancellationRequested) {
                                    picker.busy = false;
                                }
                                slowPicksApplied = true;
                            }
                        })()
                    ]);
                }
                // Fast Picks
                else if (!(providedPicks instanceof Promise)) {
                    applyPicks(providedPicks);
                }
                // Slow Picks
                else {
                    picker.busy = true;
                    try {
                        const awaitedPicks = await providedPicks;
                        if (picksToken.isCancellationRequested) {
                            return;
                        }
                        applyPicks(awaitedPicks);
                    }
                    finally {
                        if (!picksToken.isCancellationRequested) {
                            picker.busy = false;
                        }
                    }
                }
            };
            disposables.add(picker.onDidChangeValue(() => updatePickerItems()));
            updatePickerItems();
            // Accept the pick on accept and hide picker
            disposables.add(picker.onDidAccept(event => {
                const [item] = picker.selectedItems;
                if (typeof (item === null || item === void 0 ? void 0 : item.accept) === 'function') {
                    if (!event.inBackground) {
                        picker.hide(); // hide picker unless we accept in background
                    }
                    item.accept(picker.keyMods, event);
                }
            }));
            // Trigger the pick with button index if button triggered
            disposables.add(picker.onDidTriggerItemButton(async ({ button, item }) => {
                var _a, _b;
                if (typeof item.trigger === 'function') {
                    const buttonIndex = (_b = (_a = item.buttons) === null || _a === void 0 ? void 0 : _a.indexOf(button)) !== null && _b !== void 0 ? _b : -1;
                    if (buttonIndex >= 0) {
                        const result = item.trigger(buttonIndex, picker.keyMods);
                        const action = (typeof result === 'number') ? result : await result;
                        if (token.isCancellationRequested) {
                            return;
                        }
                        switch (action) {
                            case TriggerAction.NO_ACTION:
                                break;
                            case TriggerAction.CLOSE_PICKER:
                                picker.hide();
                                break;
                            case TriggerAction.REFRESH_PICKER:
                                updatePickerItems();
                                break;
                            case TriggerAction.REMOVE_ITEM:
                                const index = picker.items.indexOf(item);
                                if (index !== -1) {
                                    const items = picker.items.slice();
                                    items.splice(index, 1);
                                    picker.items = items;
                                }
                                break;
                        }
                    }
                }
            }));
            return disposables;
        }
    }
    exports.PickerQuickAccessProvider = PickerQuickAccessProvider;
    PickerQuickAccessProvider.FAST_PICKS_RACE_DELAY = 200; // timeout before we accept fast results before slow results are present
});
//# __sourceMappingURL=pickerQuickAccess.js.map