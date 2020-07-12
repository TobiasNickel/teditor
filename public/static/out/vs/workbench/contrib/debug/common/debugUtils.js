/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/path", "vs/base/common/objects"], function (require, exports, strings_1, uri_1, path_1, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getVisibleAndSorted = exports.convertToVSCPaths = exports.convertToDAPaths = exports.isUri = exports.getExactExpressionStartAndEnd = exports.isDebuggerMainContribution = exports.getExtensionHostDebugSession = exports.isSessionAttach = exports.filterExceptionsFromTelemetry = exports.formatPII = void 0;
    const _formatPIIRegexp = /{([^}]+)}/g;
    function formatPII(value, excludePII, args) {
        return value.replace(_formatPIIRegexp, function (match, group) {
            if (excludePII && group.length > 0 && group[0] !== '_') {
                return match;
            }
            return args && args.hasOwnProperty(group) ?
                args[group] :
                match;
        });
    }
    exports.formatPII = formatPII;
    /**
     * Filters exceptions (keys marked with "!") from the given object. Used to
     * ensure exception data is not sent on web remotes, see #97628.
     */
    function filterExceptionsFromTelemetry(data) {
        const output = {};
        for (const key of Object.keys(data)) {
            if (!key.startsWith('!')) {
                output[key] = data[key];
            }
        }
        return output;
    }
    exports.filterExceptionsFromTelemetry = filterExceptionsFromTelemetry;
    function isSessionAttach(session) {
        return session.configuration.request === 'attach' && !getExtensionHostDebugSession(session);
    }
    exports.isSessionAttach = isSessionAttach;
    /**
     * Returns the session or any parent which is an extension host debug session.
     * Returns undefined if there's none.
     */
    function getExtensionHostDebugSession(session) {
        let type = session.configuration.type;
        if (!type) {
            return;
        }
        if (type === 'vslsShare') {
            type = session.configuration.adapterProxy.configuration.type;
        }
        if (strings_1.equalsIgnoreCase(type, 'extensionhost') || strings_1.equalsIgnoreCase(type, 'pwa-extensionhost')) {
            return session;
        }
        return session.parentSession ? getExtensionHostDebugSession(session.parentSession) : undefined;
    }
    exports.getExtensionHostDebugSession = getExtensionHostDebugSession;
    // only a debugger contributions with a label, program, or runtime attribute is considered a "defining" or "main" debugger contribution
    function isDebuggerMainContribution(dbg) {
        return dbg.type && (dbg.label || dbg.program || dbg.runtime);
    }
    exports.isDebuggerMainContribution = isDebuggerMainContribution;
    function getExactExpressionStartAndEnd(lineContent, looseStart, looseEnd) {
        let matchingExpression = undefined;
        let startOffset = 0;
        // Some example supported expressions: myVar.prop, a.b.c.d, myVar?.prop, myVar->prop, MyClass::StaticProp, *myVar
        // Match any character except a set of characters which often break interesting sub-expressions
        let expression = /([^()\[\]{}<>\s+\-/%~#^;=|,`!]|\->)+/g;
        let result = null;
        // First find the full expression under the cursor
        while (result = expression.exec(lineContent)) {
            let start = result.index + 1;
            let end = start + result[0].length;
            if (start <= looseStart && end >= looseEnd) {
                matchingExpression = result[0];
                startOffset = start;
                break;
            }
        }
        // If there are non-word characters after the cursor, we want to truncate the expression then.
        // For example in expression 'a.b.c.d', if the focus was under 'b', 'a.b' would be evaluated.
        if (matchingExpression) {
            let subExpression = /\w+/g;
            let subExpressionResult = null;
            while (subExpressionResult = subExpression.exec(matchingExpression)) {
                let subEnd = subExpressionResult.index + 1 + startOffset + subExpressionResult[0].length;
                if (subEnd >= looseEnd) {
                    break;
                }
            }
            if (subExpressionResult) {
                matchingExpression = matchingExpression.substring(0, subExpression.lastIndex);
            }
        }
        return matchingExpression ?
            { start: startOffset, end: startOffset + matchingExpression.length - 1 } :
            { start: 0, end: 0 };
    }
    exports.getExactExpressionStartAndEnd = getExactExpressionStartAndEnd;
    // RFC 2396, Appendix A: https://www.ietf.org/rfc/rfc2396.txt
    const _schemePattern = /^[a-zA-Z][a-zA-Z0-9\+\-\.]+:/;
    function isUri(s) {
        // heuristics: a valid uri starts with a scheme and
        // the scheme has at least 2 characters so that it doesn't look like a drive letter.
        return !!(s && s.match(_schemePattern));
    }
    exports.isUri = isUri;
    function stringToUri(source) {
        if (typeof source.path === 'string') {
            if (typeof source.sourceReference === 'number' && source.sourceReference > 0) {
                // if there is a source reference, don't touch path
            }
            else {
                if (isUri(source.path)) {
                    return uri_1.URI.parse(source.path);
                }
                else {
                    // assume path
                    if (path_1.isAbsolute(source.path)) {
                        return uri_1.URI.file(source.path);
                    }
                    else {
                        // leave relative path as is
                    }
                }
            }
        }
        return source.path;
    }
    function uriToString(source) {
        if (typeof source.path === 'object') {
            const u = uri_1.URI.revive(source.path);
            if (u) {
                if (u.scheme === 'file') {
                    return u.fsPath;
                }
                else {
                    return u.toString();
                }
            }
        }
        return source.path;
    }
    function convertToDAPaths(message, toUri) {
        const fixPath = toUri ? stringToUri : uriToString;
        // since we modify Source.paths in the message in place, we need to make a copy of it (see #61129)
        const msg = objects_1.deepClone(message);
        convertPaths(msg, (toDA, source) => {
            if (toDA && source) {
                source.path = fixPath(source);
            }
        });
        return msg;
    }
    exports.convertToDAPaths = convertToDAPaths;
    function convertToVSCPaths(message, toUri) {
        const fixPath = toUri ? stringToUri : uriToString;
        // since we modify Source.paths in the message in place, we need to make a copy of it (see #61129)
        const msg = objects_1.deepClone(message);
        convertPaths(msg, (toDA, source) => {
            if (!toDA && source) {
                source.path = fixPath(source);
            }
        });
        return msg;
    }
    exports.convertToVSCPaths = convertToVSCPaths;
    function convertPaths(msg, fixSourcePath) {
        switch (msg.type) {
            case 'event':
                const event = msg;
                switch (event.event) {
                    case 'output':
                        fixSourcePath(false, event.body.source);
                        break;
                    case 'loadedSource':
                        fixSourcePath(false, event.body.source);
                        break;
                    case 'breakpoint':
                        fixSourcePath(false, event.body.breakpoint.source);
                        break;
                    default:
                        break;
                }
                break;
            case 'request':
                const request = msg;
                switch (request.command) {
                    case 'setBreakpoints':
                        fixSourcePath(true, request.arguments.source);
                        break;
                    case 'breakpointLocations':
                        fixSourcePath(true, request.arguments.source);
                        break;
                    case 'source':
                        fixSourcePath(true, request.arguments.source);
                        break;
                    case 'gotoTargets':
                        fixSourcePath(true, request.arguments.source);
                        break;
                    case 'launchVSCode':
                        request.arguments.args.forEach((arg) => fixSourcePath(false, arg));
                        break;
                    default:
                        break;
                }
                break;
            case 'response':
                const response = msg;
                if (response.success && response.body) {
                    switch (response.command) {
                        case 'stackTrace':
                            response.body.stackFrames.forEach(frame => fixSourcePath(false, frame.source));
                            break;
                        case 'loadedSources':
                            response.body.sources.forEach(source => fixSourcePath(false, source));
                            break;
                        case 'scopes':
                            response.body.scopes.forEach(scope => fixSourcePath(false, scope.source));
                            break;
                        case 'setFunctionBreakpoints':
                            response.body.breakpoints.forEach(bp => fixSourcePath(false, bp.source));
                            break;
                        case 'setBreakpoints':
                            response.body.breakpoints.forEach(bp => fixSourcePath(false, bp.source));
                            break;
                        default:
                            break;
                    }
                }
                break;
        }
    }
    function getVisibleAndSorted(array) {
        return array.filter(config => { var _a; return !((_a = config.presentation) === null || _a === void 0 ? void 0 : _a.hidden); }).sort((first, second) => {
            if (!first.presentation) {
                if (!second.presentation) {
                    return 0;
                }
                return 1;
            }
            if (!second.presentation) {
                return -1;
            }
            if (!first.presentation.group) {
                if (!second.presentation.group) {
                    return compareOrders(first.presentation.order, second.presentation.order);
                }
                return 1;
            }
            if (!second.presentation.group) {
                return -1;
            }
            if (first.presentation.group !== second.presentation.group) {
                return first.presentation.group.localeCompare(second.presentation.group);
            }
            return compareOrders(first.presentation.order, second.presentation.order);
        });
    }
    exports.getVisibleAndSorted = getVisibleAndSorted;
    function compareOrders(first, second) {
        if (typeof first !== 'number') {
            if (typeof second !== 'number') {
                return 0;
            }
            return 1;
        }
        if (typeof second !== 'number') {
            return -1;
        }
        return first - second;
    }
});
//# __sourceMappingURL=debugUtils.js.map