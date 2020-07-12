/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./strings", "vs/nls"], function (require, exports, strings_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.toLocalISOString = exports.fromNow = void 0;
    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = day * 365;
    function fromNow(date, appendAgoLabel) {
        if (typeof date !== 'number') {
            date = date.getTime();
        }
        const seconds = Math.round((new Date().getTime() - date) / 1000);
        if (seconds < -30) {
            return nls_1.localize('date.fromNow.in', 'in {0}', fromNow(new Date().getTime() + seconds * 1000, false));
        }
        if (seconds < 30) {
            return nls_1.localize('date.fromNow.now', 'now');
        }
        let value;
        if (seconds < minute) {
            value = seconds;
            if (appendAgoLabel) {
                return value === 1
                    ? nls_1.localize('date.fromNow.seconds.singular.ago', '{0} sec ago', value)
                    : nls_1.localize('date.fromNow.seconds.plural.ago', '{0} secs ago', value);
            }
            else {
                return value === 1
                    ? nls_1.localize('date.fromNow.seconds.singular', '{0} sec', value)
                    : nls_1.localize('date.fromNow.seconds.plural', '{0} secs', value);
            }
        }
        if (seconds < hour) {
            value = Math.floor(seconds / minute);
            if (appendAgoLabel) {
                return value === 1
                    ? nls_1.localize('date.fromNow.minutes.singular.ago', '{0} min ago', value)
                    : nls_1.localize('date.fromNow.minutes.plural.ago', '{0} mins ago', value);
            }
            else {
                return value === 1
                    ? nls_1.localize('date.fromNow.minutes.singular', '{0} min', value)
                    : nls_1.localize('date.fromNow.minutes.plural', '{0} mins', value);
            }
        }
        if (seconds < day) {
            value = Math.floor(seconds / hour);
            if (appendAgoLabel) {
                return value === 1
                    ? nls_1.localize('date.fromNow.hours.singular.ago', '{0} hr ago', value)
                    : nls_1.localize('date.fromNow.hours.plural.ago', '{0} hrs ago', value);
            }
            else {
                return value === 1
                    ? nls_1.localize('date.fromNow.hours.singular', '{0} hr', value)
                    : nls_1.localize('date.fromNow.hours.plural', '{0} hrs', value);
            }
        }
        if (seconds < week) {
            value = Math.floor(seconds / day);
            if (appendAgoLabel) {
                return value === 1
                    ? nls_1.localize('date.fromNow.days.singular.ago', '{0} day ago', value)
                    : nls_1.localize('date.fromNow.days.plural.ago', '{0} days ago', value);
            }
            else {
                return value === 1
                    ? nls_1.localize('date.fromNow.days.singular', '{0} day', value)
                    : nls_1.localize('date.fromNow.days.plural', '{0} days', value);
            }
        }
        if (seconds < month) {
            value = Math.floor(seconds / week);
            if (appendAgoLabel) {
                return value === 1
                    ? nls_1.localize('date.fromNow.weeks.singular.ago', '{0} wk ago', value)
                    : nls_1.localize('date.fromNow.weeks.plural.ago', '{0} wks ago', value);
            }
            else {
                return value === 1
                    ? nls_1.localize('date.fromNow.weeks.singular', '{0} wk', value)
                    : nls_1.localize('date.fromNow.weeks.plural', '{0} wks', value);
            }
        }
        if (seconds < year) {
            value = Math.floor(seconds / month);
            if (appendAgoLabel) {
                return value === 1
                    ? nls_1.localize('date.fromNow.months.singular.ago', '{0} mo ago', value)
                    : nls_1.localize('date.fromNow.months.plural.ago', '{0} mos ago', value);
            }
            else {
                return value === 1
                    ? nls_1.localize('date.fromNow.months.singular', '{0} mo', value)
                    : nls_1.localize('date.fromNow.months.plural', '{0} mos', value);
            }
        }
        value = Math.floor(seconds / year);
        if (appendAgoLabel) {
            return value === 1
                ? nls_1.localize('date.fromNow.years.singular.ago', '{0} yr ago', value)
                : nls_1.localize('date.fromNow.years.plural.ago', '{0} yrs ago', value);
        }
        else {
            return value === 1
                ? nls_1.localize('date.fromNow.years.singular', '{0} yr', value)
                : nls_1.localize('date.fromNow.years.plural', '{0} yrs', value);
        }
    }
    exports.fromNow = fromNow;
    function toLocalISOString(date) {
        return date.getFullYear() +
            '-' + strings_1.pad(date.getMonth() + 1, 2) +
            '-' + strings_1.pad(date.getDate(), 2) +
            'T' + strings_1.pad(date.getHours(), 2) +
            ':' + strings_1.pad(date.getMinutes(), 2) +
            ':' + strings_1.pad(date.getSeconds(), 2) +
            '.' + (date.getMilliseconds() / 1000).toFixed(3).slice(2, 5) +
            'Z';
    }
    exports.toLocalISOString = toLocalISOString;
});
//# __sourceMappingURL=date.js.map