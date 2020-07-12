/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/comparers", "vs/base/common/filters", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/strings"], function (require, exports, comparers_1, filters_1, path_1, platform_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.pieceToQuery = exports.prepareQuery = exports.compareItemsByFuzzyScore = exports.scoreItemFuzzy = exports.scoreFuzzy2 = exports.scoreFuzzy = void 0;
    const NO_MATCH = 0;
    const NO_SCORE = [NO_MATCH, []];
    // const DEBUG = false;
    // const DEBUG_MATRIX = false;
    function scoreFuzzy(target, query, queryLower, fuzzy) {
        if (!target || !query) {
            return NO_SCORE; // return early if target or query are undefined
        }
        const targetLength = target.length;
        const queryLength = query.length;
        if (targetLength < queryLength) {
            return NO_SCORE; // impossible for query to be contained in target
        }
        // if (DEBUG) {
        // 	console.group(`Target: ${target}, Query: ${query}`);
        // }
        const targetLower = target.toLowerCase();
        // When not searching fuzzy, we require the query to be contained fully
        // in the target string contiguously.
        if (!fuzzy) {
            const indexOfQueryInTarget = targetLower.indexOf(queryLower);
            if (indexOfQueryInTarget === -1) {
                // if (DEBUG) {
                // 	console.log(`Characters not matching consecutively ${queryLower} within ${targetLower}`);
                // }
                return NO_SCORE;
            }
        }
        const res = doScoreFuzzy(query, queryLower, queryLength, target, targetLower, targetLength);
        // if (DEBUG) {
        // 	console.log(`%cFinal Score: ${res[0]}`, 'font-weight: bold');
        // 	console.groupEnd();
        // }
        return res;
    }
    exports.scoreFuzzy = scoreFuzzy;
    function doScoreFuzzy(query, queryLower, queryLength, target, targetLower, targetLength) {
        const scores = [];
        const matches = [];
        //
        // Build Scorer Matrix:
        //
        // The matrix is composed of query q and target t. For each index we score
        // q[i] with t[i] and compare that with the previous score. If the score is
        // equal or larger, we keep the match. In addition to the score, we also keep
        // the length of the consecutive matches to use as boost for the score.
        //
        //      t   a   r   g   e   t
        //  q
        //  u
        //  e
        //  r
        //  y
        //
        for (let queryIndex = 0; queryIndex < queryLength; queryIndex++) {
            const queryIndexOffset = queryIndex * targetLength;
            const queryIndexPreviousOffset = queryIndexOffset - targetLength;
            const queryIndexGtNull = queryIndex > 0;
            const queryCharAtIndex = query[queryIndex];
            const queryLowerCharAtIndex = queryLower[queryIndex];
            for (let targetIndex = 0; targetIndex < targetLength; targetIndex++) {
                const targetIndexGtNull = targetIndex > 0;
                const currentIndex = queryIndexOffset + targetIndex;
                const leftIndex = currentIndex - 1;
                const diagIndex = queryIndexPreviousOffset + targetIndex - 1;
                const leftScore = targetIndexGtNull ? scores[leftIndex] : 0;
                const diagScore = queryIndexGtNull && targetIndexGtNull ? scores[diagIndex] : 0;
                const matchesSequenceLength = queryIndexGtNull && targetIndexGtNull ? matches[diagIndex] : 0;
                // If we are not matching on the first query character any more, we only produce a
                // score if we had a score previously for the last query index (by looking at the diagScore).
                // This makes sure that the query always matches in sequence on the target. For example
                // given a target of "ede" and a query of "de", we would otherwise produce a wrong high score
                // for query[1] ("e") matching on target[0] ("e") because of the "beginning of word" boost.
                let score;
                if (!diagScore && queryIndexGtNull) {
                    score = 0;
                }
                else {
                    score = computeCharScore(queryCharAtIndex, queryLowerCharAtIndex, target, targetLower, targetIndex, matchesSequenceLength);
                }
                // We have a score and its equal or larger than the left score
                // Match: sequence continues growing from previous diag value
                // Score: increases by diag score value
                if (score && diagScore + score >= leftScore) {
                    matches[currentIndex] = matchesSequenceLength + 1;
                    scores[currentIndex] = diagScore + score;
                }
                // We either have no score or the score is lower than the left score
                // Match: reset to 0
                // Score: pick up from left hand side
                else {
                    matches[currentIndex] = NO_MATCH;
                    scores[currentIndex] = leftScore;
                }
            }
        }
        // Restore Positions (starting from bottom right of matrix)
        const positions = [];
        let queryIndex = queryLength - 1;
        let targetIndex = targetLength - 1;
        while (queryIndex >= 0 && targetIndex >= 0) {
            const currentIndex = queryIndex * targetLength + targetIndex;
            const match = matches[currentIndex];
            if (match === NO_MATCH) {
                targetIndex--; // go left
            }
            else {
                positions.push(targetIndex);
                // go up and left
                queryIndex--;
                targetIndex--;
            }
        }
        // Print matrix
        // if (DEBUG_MATRIX) {
        // printMatrix(query, target, matches, scores);
        // }
        return [scores[queryLength * targetLength - 1], positions.reverse()];
    }
    function computeCharScore(queryCharAtIndex, queryLowerCharAtIndex, target, targetLower, targetIndex, matchesSequenceLength) {
        let score = 0;
        if (!considerAsEqual(queryLowerCharAtIndex, targetLower[targetIndex])) {
            return score; // no match of characters
        }
        // Character match bonus
        score += 1;
        // if (DEBUG) {
        // 	console.groupCollapsed(`%cCharacter match bonus: +1 (char: ${queryLower[queryIndex]} at index ${targetIndex}, total score: ${score})`, 'font-weight: normal');
        // }
        // Consecutive match bonus
        if (matchesSequenceLength > 0) {
            score += (matchesSequenceLength * 5);
            // if (DEBUG) {
            // 	console.log('Consecutive match bonus: ' + (matchesSequenceLength * 5));
            // }
        }
        // Same case bonus
        if (queryCharAtIndex === target[targetIndex]) {
            score += 1;
            // if (DEBUG) {
            // 	console.log('Same case bonus: +1');
            // }
        }
        // Start of word bonus
        if (targetIndex === 0) {
            score += 8;
            // if (DEBUG) {
            // 	console.log('Start of word bonus: +8');
            // }
        }
        else {
            // After separator bonus
            const separatorBonus = scoreSeparatorAtPos(target.charCodeAt(targetIndex - 1));
            if (separatorBonus) {
                score += separatorBonus;
                // if (DEBUG) {
                // 	console.log('After separtor bonus: +4');
                // }
            }
            // Inside word upper case bonus (camel case)
            else if (filters_1.isUpper(target.charCodeAt(targetIndex))) {
                score += 1;
                // if (DEBUG) {
                // 	console.log('Inside word upper case bonus: +1');
                // }
            }
        }
        // if (DEBUG) {
        // 	console.groupEnd();
        // }
        return score;
    }
    function considerAsEqual(a, b) {
        if (a === b) {
            return true;
        }
        // Special case path spearators: ignore platform differences
        if (a === '/' || a === '\\') {
            return b === '/' || b === '\\';
        }
        return false;
    }
    function scoreSeparatorAtPos(charCode) {
        switch (charCode) {
            case 47 /* Slash */:
            case 92 /* Backslash */:
                return 5; // prefer path separators...
            case 95 /* Underline */:
            case 45 /* Dash */:
            case 46 /* Period */:
            case 32 /* Space */:
            case 39 /* SingleQuote */:
            case 34 /* DoubleQuote */:
            case 58 /* Colon */:
                return 4; // ...over other separators
            default:
                return 0;
        }
    }
    const NO_SCORE2 = [undefined, []];
    function scoreFuzzy2(target, query, patternStart = 0, wordStart = 0) {
        // Score: multiple inputs
        const preparedQuery = query;
        if (preparedQuery.values && preparedQuery.values.length > 1) {
            return doScoreFuzzy2Multiple(target, preparedQuery.values, patternStart, wordStart);
        }
        // Score: single input
        return doScoreFuzzy2Single(target, query, patternStart, wordStart);
    }
    exports.scoreFuzzy2 = scoreFuzzy2;
    function doScoreFuzzy2Multiple(target, query, patternStart, wordStart) {
        let totalScore = 0;
        const totalMatches = [];
        for (const queryPiece of query) {
            const [score, matches] = doScoreFuzzy2Single(target, queryPiece, patternStart, wordStart);
            if (typeof score !== 'number') {
                // if a single query value does not match, return with
                // no score entirely, we require all queries to match
                return NO_SCORE2;
            }
            totalScore += score;
            totalMatches.push(...matches);
        }
        // if we have a score, ensure that the positions are
        // sorted in ascending order and distinct
        return [totalScore, normalizeMatches(totalMatches)];
    }
    function doScoreFuzzy2Single(target, query, patternStart, wordStart) {
        const score = filters_1.fuzzyScore(query.original, query.originalLowercase, patternStart, target, target.toLowerCase(), wordStart, true);
        if (!score) {
            return NO_SCORE2;
        }
        return [score[0], filters_1.createMatches(score)];
    }
    const NO_ITEM_SCORE = Object.freeze({ score: 0 });
    const PATH_IDENTITY_SCORE = 1 << 18;
    const LABEL_PREFIX_SCORE_MATCHCASE = 1 << 17;
    const LABEL_PREFIX_SCORE_IGNORECASE = 1 << 16;
    const LABEL_CAMELCASE_SCORE = 1 << 15;
    const LABEL_SCORE_THRESHOLD = 1 << 14;
    function scoreItemFuzzy(item, query, fuzzy, accessor, cache) {
        if (!item || !query.normalized) {
            return NO_ITEM_SCORE; // we need an item and query to score on at least
        }
        const label = accessor.getItemLabel(item);
        if (!label) {
            return NO_ITEM_SCORE; // we need a label at least
        }
        const description = accessor.getItemDescription(item);
        let cacheHash;
        if (description) {
            cacheHash = `${label}${description}${query.normalized}${fuzzy}`;
        }
        else {
            cacheHash = `${label}${query.normalized}${fuzzy}`;
        }
        const cached = cache[cacheHash];
        if (cached) {
            return cached;
        }
        const itemScore = doScoreItemFuzzy(label, description, accessor.getItemPath(item), query, fuzzy);
        cache[cacheHash] = itemScore;
        return itemScore;
    }
    exports.scoreItemFuzzy = scoreItemFuzzy;
    function doScoreItemFuzzy(label, description, path, query, fuzzy) {
        const preferLabelMatches = !path || !query.containsPathSeparator;
        // Treat identity matches on full path highest
        if (path && (platform_1.isLinux ? query.pathNormalized === path : strings_1.equalsIgnoreCase(query.pathNormalized, path))) {
            return { score: PATH_IDENTITY_SCORE, labelMatch: [{ start: 0, end: label.length }], descriptionMatch: description ? [{ start: 0, end: description.length }] : undefined };
        }
        // Score: multiple inputs
        if (query.values && query.values.length > 1) {
            return doScoreItemFuzzyMultiple(label, description, path, query.values, preferLabelMatches, fuzzy);
        }
        // Score: single input
        return doScoreItemFuzzySingle(label, description, path, query, preferLabelMatches, fuzzy);
    }
    function doScoreItemFuzzyMultiple(label, description, path, query, preferLabelMatches, fuzzy) {
        let totalScore = 0;
        const totalLabelMatches = [];
        const totalDescriptionMatches = [];
        for (const queryPiece of query) {
            const { score, labelMatch, descriptionMatch } = doScoreItemFuzzySingle(label, description, path, queryPiece, preferLabelMatches, fuzzy);
            if (score === NO_MATCH) {
                // if a single query value does not match, return with
                // no score entirely, we require all queries to match
                return NO_ITEM_SCORE;
            }
            totalScore += score;
            if (labelMatch) {
                totalLabelMatches.push(...labelMatch);
            }
            if (descriptionMatch) {
                totalDescriptionMatches.push(...descriptionMatch);
            }
        }
        // if we have a score, ensure that the positions are
        // sorted in ascending order and distinct
        return {
            score: totalScore,
            labelMatch: normalizeMatches(totalLabelMatches),
            descriptionMatch: normalizeMatches(totalDescriptionMatches)
        };
    }
    function doScoreItemFuzzySingle(label, description, path, query, preferLabelMatches, fuzzy) {
        // Prefer label matches if told so
        if (preferLabelMatches) {
            // Treat prefix matches on the label highest
            const prefixLabelMatchIgnoreCase = filters_1.matchesPrefix(query.normalized, label);
            if (prefixLabelMatchIgnoreCase) {
                const prefixLabelMatchStrictCase = filters_1.matchesStrictPrefix(query.normalized, label);
                return { score: prefixLabelMatchStrictCase ? LABEL_PREFIX_SCORE_MATCHCASE : LABEL_PREFIX_SCORE_IGNORECASE, labelMatch: prefixLabelMatchStrictCase || prefixLabelMatchIgnoreCase };
            }
            // Treat camelcase matches on the label second highest
            const camelcaseLabelMatch = filters_1.matchesCamelCase(query.normalized, label);
            if (camelcaseLabelMatch) {
                return { score: LABEL_CAMELCASE_SCORE, labelMatch: camelcaseLabelMatch };
            }
            // Prefer scores on the label if any
            const [labelScore, labelPositions] = scoreFuzzy(label, query.normalized, query.normalizedLowercase, fuzzy);
            if (labelScore) {
                return { score: labelScore + LABEL_SCORE_THRESHOLD, labelMatch: createMatches(labelPositions) };
            }
        }
        // Finally compute description + label scores if we have a description
        if (description) {
            let descriptionPrefix = description;
            if (!!path) {
                descriptionPrefix = `${description}${path_1.sep}`; // assume this is a file path
            }
            const descriptionPrefixLength = descriptionPrefix.length;
            const descriptionAndLabel = `${descriptionPrefix}${label}`;
            const [labelDescriptionScore, labelDescriptionPositions] = scoreFuzzy(descriptionAndLabel, query.normalized, query.normalizedLowercase, fuzzy);
            if (labelDescriptionScore) {
                const labelDescriptionMatches = createMatches(labelDescriptionPositions);
                const labelMatch = [];
                const descriptionMatch = [];
                // We have to split the matches back onto the label and description portions
                labelDescriptionMatches.forEach(h => {
                    // Match overlaps label and description part, we need to split it up
                    if (h.start < descriptionPrefixLength && h.end > descriptionPrefixLength) {
                        labelMatch.push({ start: 0, end: h.end - descriptionPrefixLength });
                        descriptionMatch.push({ start: h.start, end: descriptionPrefixLength });
                    }
                    // Match on label part
                    else if (h.start >= descriptionPrefixLength) {
                        labelMatch.push({ start: h.start - descriptionPrefixLength, end: h.end - descriptionPrefixLength });
                    }
                    // Match on description part
                    else {
                        descriptionMatch.push(h);
                    }
                });
                return { score: labelDescriptionScore, labelMatch, descriptionMatch };
            }
        }
        return NO_ITEM_SCORE;
    }
    function createMatches(offsets) {
        const ret = [];
        if (!offsets) {
            return ret;
        }
        let last;
        for (const pos of offsets) {
            if (last && last.end === pos) {
                last.end += 1;
            }
            else {
                last = { start: pos, end: pos + 1 };
                ret.push(last);
            }
        }
        return ret;
    }
    function normalizeMatches(matches) {
        // sort matches by start to be able to normalize
        const sortedMatches = matches.sort((matchA, matchB) => {
            return matchA.start - matchB.start;
        });
        // merge matches that overlap
        const normalizedMatches = [];
        let currentMatch = undefined;
        for (const match of sortedMatches) {
            // if we have no current match or the matches
            // do not overlap, we take it as is and remember
            // it for future merging
            if (!currentMatch || !matchOverlaps(currentMatch, match)) {
                currentMatch = match;
                normalizedMatches.push(match);
            }
            // otherwise we merge the matches
            else {
                currentMatch.start = Math.min(currentMatch.start, match.start);
                currentMatch.end = Math.max(currentMatch.end, match.end);
            }
        }
        return normalizedMatches;
    }
    function matchOverlaps(matchA, matchB) {
        if (matchA.end < matchB.start) {
            return false; // A ends before B starts
        }
        if (matchB.end < matchA.start) {
            return false; // B ends before A starts
        }
        return true;
    }
    //#endregion
    //#region Comparers
    function compareItemsByFuzzyScore(itemA, itemB, query, fuzzy, accessor, cache) {
        const itemScoreA = scoreItemFuzzy(itemA, query, fuzzy, accessor, cache);
        const itemScoreB = scoreItemFuzzy(itemB, query, fuzzy, accessor, cache);
        const scoreA = itemScoreA.score;
        const scoreB = itemScoreB.score;
        // 1.) prefer identity matches
        if (scoreA === PATH_IDENTITY_SCORE || scoreB === PATH_IDENTITY_SCORE) {
            if (scoreA !== scoreB) {
                return scoreA === PATH_IDENTITY_SCORE ? -1 : 1;
            }
        }
        // 2.) prefer label prefix matches (match case)
        if (scoreA === LABEL_PREFIX_SCORE_MATCHCASE || scoreB === LABEL_PREFIX_SCORE_MATCHCASE) {
            if (scoreA !== scoreB) {
                return scoreA === LABEL_PREFIX_SCORE_MATCHCASE ? -1 : 1;
            }
            const labelA = accessor.getItemLabel(itemA) || '';
            const labelB = accessor.getItemLabel(itemB) || '';
            // prefer shorter names when both match on label prefix
            if (labelA.length !== labelB.length) {
                return labelA.length - labelB.length;
            }
        }
        // 3.) prefer label prefix matches (ignore case)
        if (scoreA === LABEL_PREFIX_SCORE_IGNORECASE || scoreB === LABEL_PREFIX_SCORE_IGNORECASE) {
            if (scoreA !== scoreB) {
                return scoreA === LABEL_PREFIX_SCORE_IGNORECASE ? -1 : 1;
            }
            const labelA = accessor.getItemLabel(itemA) || '';
            const labelB = accessor.getItemLabel(itemB) || '';
            // prefer shorter names when both match on label prefix
            if (labelA.length !== labelB.length) {
                return labelA.length - labelB.length;
            }
        }
        // 4.) prefer camelcase matches
        if (scoreA === LABEL_CAMELCASE_SCORE || scoreB === LABEL_CAMELCASE_SCORE) {
            if (scoreA !== scoreB) {
                return scoreA === LABEL_CAMELCASE_SCORE ? -1 : 1;
            }
            const labelA = accessor.getItemLabel(itemA) || '';
            const labelB = accessor.getItemLabel(itemB) || '';
            // prefer more compact camel case matches over longer
            const comparedByMatchLength = compareByMatchLength(itemScoreA.labelMatch, itemScoreB.labelMatch);
            if (comparedByMatchLength !== 0) {
                return comparedByMatchLength;
            }
            // prefer shorter names when both match on label camelcase
            if (labelA.length !== labelB.length) {
                return labelA.length - labelB.length;
            }
        }
        // 5.) prefer label scores
        if (scoreA > LABEL_SCORE_THRESHOLD || scoreB > LABEL_SCORE_THRESHOLD) {
            if (scoreB < LABEL_SCORE_THRESHOLD) {
                return -1;
            }
            if (scoreA < LABEL_SCORE_THRESHOLD) {
                return 1;
            }
        }
        // 6.) compare by score
        if (scoreA !== scoreB) {
            return scoreA > scoreB ? -1 : 1;
        }
        // 7.) prefer matches in label over non-label matches
        const itemAHasLabelMatches = Array.isArray(itemScoreA.labelMatch) && itemScoreA.labelMatch.length > 0;
        const itemBHasLabelMatches = Array.isArray(itemScoreB.labelMatch) && itemScoreB.labelMatch.length > 0;
        if (itemAHasLabelMatches && !itemBHasLabelMatches) {
            return -1;
        }
        else if (itemBHasLabelMatches && !itemAHasLabelMatches) {
            return 1;
        }
        // 8.) scores are identical, prefer more compact matches (label and description)
        const itemAMatchDistance = computeLabelAndDescriptionMatchDistance(itemA, itemScoreA, accessor);
        const itemBMatchDistance = computeLabelAndDescriptionMatchDistance(itemB, itemScoreB, accessor);
        if (itemAMatchDistance && itemBMatchDistance && itemAMatchDistance !== itemBMatchDistance) {
            return itemBMatchDistance > itemAMatchDistance ? -1 : 1;
        }
        // 9.) at this point, scores are identical and match compactness as well
        // for both items so we start to use the fallback compare
        return fallbackCompare(itemA, itemB, query, accessor);
    }
    exports.compareItemsByFuzzyScore = compareItemsByFuzzyScore;
    function computeLabelAndDescriptionMatchDistance(item, score, accessor) {
        let matchStart = -1;
        let matchEnd = -1;
        // If we have description matches, the start is first of description match
        if (score.descriptionMatch && score.descriptionMatch.length) {
            matchStart = score.descriptionMatch[0].start;
        }
        // Otherwise, the start is the first label match
        else if (score.labelMatch && score.labelMatch.length) {
            matchStart = score.labelMatch[0].start;
        }
        // If we have label match, the end is the last label match
        // If we had a description match, we add the length of the description
        // as offset to the end to indicate this.
        if (score.labelMatch && score.labelMatch.length) {
            matchEnd = score.labelMatch[score.labelMatch.length - 1].end;
            if (score.descriptionMatch && score.descriptionMatch.length) {
                const itemDescription = accessor.getItemDescription(item);
                if (itemDescription) {
                    matchEnd += itemDescription.length;
                }
            }
        }
        // If we have just a description match, the end is the last description match
        else if (score.descriptionMatch && score.descriptionMatch.length) {
            matchEnd = score.descriptionMatch[score.descriptionMatch.length - 1].end;
        }
        return matchEnd - matchStart;
    }
    function compareByMatchLength(matchesA, matchesB) {
        if ((!matchesA && !matchesB) || ((!matchesA || !matchesA.length) && (!matchesB || !matchesB.length))) {
            return 0; // make sure to not cause bad comparing when matches are not provided
        }
        if (!matchesB || !matchesB.length) {
            return -1;
        }
        if (!matchesA || !matchesA.length) {
            return 1;
        }
        // Compute match length of A (first to last match)
        const matchStartA = matchesA[0].start;
        const matchEndA = matchesA[matchesA.length - 1].end;
        const matchLengthA = matchEndA - matchStartA;
        // Compute match length of B (first to last match)
        const matchStartB = matchesB[0].start;
        const matchEndB = matchesB[matchesB.length - 1].end;
        const matchLengthB = matchEndB - matchStartB;
        // Prefer shorter match length
        return matchLengthA === matchLengthB ? 0 : matchLengthB < matchLengthA ? 1 : -1;
    }
    function fallbackCompare(itemA, itemB, query, accessor) {
        // check for label + description length and prefer shorter
        const labelA = accessor.getItemLabel(itemA) || '';
        const labelB = accessor.getItemLabel(itemB) || '';
        const descriptionA = accessor.getItemDescription(itemA);
        const descriptionB = accessor.getItemDescription(itemB);
        const labelDescriptionALength = labelA.length + (descriptionA ? descriptionA.length : 0);
        const labelDescriptionBLength = labelB.length + (descriptionB ? descriptionB.length : 0);
        if (labelDescriptionALength !== labelDescriptionBLength) {
            return labelDescriptionALength - labelDescriptionBLength;
        }
        // check for path length and prefer shorter
        const pathA = accessor.getItemPath(itemA);
        const pathB = accessor.getItemPath(itemB);
        if (pathA && pathB && pathA.length !== pathB.length) {
            return pathA.length - pathB.length;
        }
        // 7.) finally we have equal scores and equal length, we fallback to comparer
        // compare by label
        if (labelA !== labelB) {
            return comparers_1.compareAnything(labelA, labelB, query.normalized);
        }
        // compare by description
        if (descriptionA && descriptionB && descriptionA !== descriptionB) {
            return comparers_1.compareAnything(descriptionA, descriptionB, query.normalized);
        }
        // compare by path
        if (pathA && pathB && pathA !== pathB) {
            return comparers_1.compareAnything(pathA, pathB, query.normalized);
        }
        // equal
        return 0;
    }
    /**
     * Helper function to prepare a search value for scoring by removing unwanted characters
     * and allowing to score on multiple pieces separated by whitespace character.
     */
    const MULTIPLE_QUERY_VALUES_SEPARATOR = ' ';
    function prepareQuery(original) {
        if (typeof original !== 'string') {
            original = '';
        }
        const originalLowercase = original.toLowerCase();
        const { pathNormalized, normalized, normalizedLowercase } = normalizeQuery(original);
        const containsPathSeparator = pathNormalized.indexOf(path_1.sep) >= 0;
        let values = undefined;
        const originalSplit = original.split(MULTIPLE_QUERY_VALUES_SEPARATOR);
        if (originalSplit.length > 1) {
            for (const originalPiece of originalSplit) {
                const { pathNormalized: pathNormalizedPiece, normalized: normalizedPiece, normalizedLowercase: normalizedLowercasePiece } = normalizeQuery(originalPiece);
                if (normalizedPiece) {
                    if (!values) {
                        values = [];
                    }
                    values.push({
                        original: originalPiece,
                        originalLowercase: originalPiece.toLowerCase(),
                        pathNormalized: pathNormalizedPiece,
                        normalized: normalizedPiece,
                        normalizedLowercase: normalizedLowercasePiece
                    });
                }
            }
        }
        return { original, originalLowercase, pathNormalized, normalized, normalizedLowercase, values, containsPathSeparator };
    }
    exports.prepareQuery = prepareQuery;
    function normalizeQuery(original) {
        let pathNormalized;
        if (platform_1.isWindows) {
            pathNormalized = original.replace(/\//g, path_1.sep); // Help Windows users to search for paths when using slash
        }
        else {
            pathNormalized = original.replace(/\\/g, path_1.sep); // Help macOS/Linux users to search for paths when using backslash
        }
        const normalized = strings_1.stripWildcards(pathNormalized).replace(/\s/g, '');
        return {
            pathNormalized,
            normalized,
            normalizedLowercase: normalized.toLowerCase()
        };
    }
    function pieceToQuery(arg1) {
        if (Array.isArray(arg1)) {
            return prepareQuery(arg1.map(piece => piece.original).join(MULTIPLE_QUERY_VALUES_SEPARATOR));
        }
        return prepareQuery(arg1.original);
    }
    exports.pieceToQuery = pieceToQuery;
});
//#endregion
//# __sourceMappingURL=fuzzyScorer.js.map