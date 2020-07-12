/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createMatchers = void 0;
    function createMatchers(selector, matchesName, results) {
        const tokenizer = newTokenizer(selector);
        let token = tokenizer.next();
        while (token !== null) {
            let priority = 0;
            if (token.length === 2 && token.charAt(1) === ':') {
                switch (token.charAt(0)) {
                    case 'R':
                        priority = 1;
                        break;
                    case 'L':
                        priority = -1;
                        break;
                    default:
                        console.log(`Unknown priority ${token} in scope selector`);
                }
                token = tokenizer.next();
            }
            let matcher = parseConjunction();
            if (matcher) {
                results.push({ matcher, priority });
            }
            if (token !== ',') {
                break;
            }
            token = tokenizer.next();
        }
        function parseOperand() {
            if (token === '-') {
                token = tokenizer.next();
                const expressionToNegate = parseOperand();
                if (!expressionToNegate) {
                    return null;
                }
                return matcherInput => {
                    const score = expressionToNegate(matcherInput);
                    return score < 0 ? 0 : -1;
                };
            }
            if (token === '(') {
                token = tokenizer.next();
                const expressionInParents = parseInnerExpression();
                if (token === ')') {
                    token = tokenizer.next();
                }
                return expressionInParents;
            }
            if (isIdentifier(token)) {
                const identifiers = [];
                do {
                    identifiers.push(token);
                    token = tokenizer.next();
                } while (isIdentifier(token));
                return matcherInput => matchesName(identifiers, matcherInput);
            }
            return null;
        }
        function parseConjunction() {
            let matcher = parseOperand();
            if (!matcher) {
                return null;
            }
            const matchers = [];
            while (matcher) {
                matchers.push(matcher);
                matcher = parseOperand();
            }
            return matcherInput => {
                let min = matchers[0](matcherInput);
                for (let i = 1; min >= 0 && i < matchers.length; i++) {
                    min = Math.min(min, matchers[i](matcherInput));
                }
                return min;
            };
        }
        function parseInnerExpression() {
            let matcher = parseConjunction();
            if (!matcher) {
                return null;
            }
            const matchers = [];
            while (matcher) {
                matchers.push(matcher);
                if (token === '|' || token === ',') {
                    do {
                        token = tokenizer.next();
                    } while (token === '|' || token === ','); // ignore subsequent commas
                }
                else {
                    break;
                }
                matcher = parseConjunction();
            }
            return matcherInput => {
                let max = matchers[0](matcherInput);
                for (let i = 1; i < matchers.length; i++) {
                    max = Math.max(max, matchers[i](matcherInput));
                }
                return max;
            };
        }
    }
    exports.createMatchers = createMatchers;
    function isIdentifier(token) {
        return !!token && !!token.match(/[\w\.:]+/);
    }
    function newTokenizer(input) {
        let regex = /([LR]:|[\w\.:][\w\.:\-]*|[\,\|\-\(\)])/g;
        let match = regex.exec(input);
        return {
            next: () => {
                if (!match) {
                    return null;
                }
                const res = match[0];
                match = regex.exec(input);
                return res;
            }
        };
    }
});
//# __sourceMappingURL=textMateScopeMatcher.js.map