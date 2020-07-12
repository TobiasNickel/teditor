/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/async"], function (require, exports, path_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.compareByPrefix = exports.compareAnything = exports.comparePaths = exports.compareFileExtensionsNumeric = exports.compareFileExtensions = exports.noIntlCompareFileNames = exports.compareFileNamesNumeric = exports.compareFileNames = void 0;
    // When comparing large numbers of strings, such as in sorting large arrays, is better for
    // performance to create an Intl.Collator object and use the function provided by its compare
    // property than it is to use String.prototype.localeCompare()
    // A collator with numeric sorting enabled, and no sensitivity to case or to accents
    const intlFileNameCollatorBaseNumeric = new async_1.IdleValue(() => {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        return {
            collator: collator,
            collatorIsNumeric: collator.resolvedOptions().numeric
        };
    });
    // A collator with numeric sorting enabled.
    const intlFileNameCollatorNumeric = new async_1.IdleValue(() => {
        const collator = new Intl.Collator(undefined, { numeric: true });
        return {
            collator: collator
        };
    });
    // A collator with numeric sorting enabled, and sensitivity to accents and diacritics but not case.
    const intlFileNameCollatorNumericCaseInsenstive = new async_1.IdleValue(() => {
        const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'accent' });
        return {
            collator: collator
        };
    });
    function compareFileNames(one, other, caseSensitive = false) {
        const a = one || '';
        const b = other || '';
        const result = intlFileNameCollatorBaseNumeric.value.collator.compare(a, b);
        // Using the numeric option in the collator will
        // make compare(`foo1`, `foo01`) === 0. We must disambiguate.
        if (intlFileNameCollatorBaseNumeric.value.collatorIsNumeric && result === 0 && a !== b) {
            return a < b ? -1 : 1;
        }
        return result;
    }
    exports.compareFileNames = compareFileNames;
    /** Compares filenames by name then extension, sorting numbers numerically instead of alphabetically. */
    function compareFileNamesNumeric(one, other) {
        const [oneName, oneExtension] = extractNameAndExtension(one, true);
        const [otherName, otherExtension] = extractNameAndExtension(other, true);
        const collatorNumeric = intlFileNameCollatorNumeric.value.collator;
        const collatorNumericCaseInsensitive = intlFileNameCollatorNumericCaseInsenstive.value.collator;
        let result;
        // Check for name differences, comparing numbers numerically instead of alphabetically.
        result = compareAndDisambiguateByLength(collatorNumeric, oneName, otherName);
        if (result !== 0) {
            return result;
        }
        // Check for case insensitive extension differences, comparing numbers numerically instead of alphabetically.
        result = compareAndDisambiguateByLength(collatorNumericCaseInsensitive, oneExtension, otherExtension);
        if (result !== 0) {
            return result;
        }
        // Disambiguate the extension case if needed.
        if (oneExtension !== otherExtension) {
            return collatorNumeric.compare(oneExtension, otherExtension);
        }
        return 0;
    }
    exports.compareFileNamesNumeric = compareFileNamesNumeric;
    const FileNameMatch = /^(.*?)(\.([^.]*))?$/;
    function noIntlCompareFileNames(one, other, caseSensitive = false) {
        if (!caseSensitive) {
            one = one && one.toLowerCase();
            other = other && other.toLowerCase();
        }
        const [oneName, oneExtension] = extractNameAndExtension(one);
        const [otherName, otherExtension] = extractNameAndExtension(other);
        if (oneName !== otherName) {
            return oneName < otherName ? -1 : 1;
        }
        if (oneExtension === otherExtension) {
            return 0;
        }
        return oneExtension < otherExtension ? -1 : 1;
    }
    exports.noIntlCompareFileNames = noIntlCompareFileNames;
    function compareFileExtensions(one, other) {
        const [oneName, oneExtension] = extractNameAndExtension(one);
        const [otherName, otherExtension] = extractNameAndExtension(other);
        let result = intlFileNameCollatorBaseNumeric.value.collator.compare(oneExtension, otherExtension);
        if (result === 0) {
            // Using the numeric option in the collator will
            // make compare(`foo1`, `foo01`) === 0. We must disambiguate.
            if (intlFileNameCollatorBaseNumeric.value.collatorIsNumeric && oneExtension !== otherExtension) {
                return oneExtension < otherExtension ? -1 : 1;
            }
            // Extensions are equal, compare filenames
            result = intlFileNameCollatorBaseNumeric.value.collator.compare(oneName, otherName);
            if (intlFileNameCollatorBaseNumeric.value.collatorIsNumeric && result === 0 && oneName !== otherName) {
                return oneName < otherName ? -1 : 1;
            }
        }
        return result;
    }
    exports.compareFileExtensions = compareFileExtensions;
    /** Compares filenames by extenson, then by name. Sorts numbers numerically, not alphabetically. */
    function compareFileExtensionsNumeric(one, other) {
        const [oneName, oneExtension] = extractNameAndExtension(one, true);
        const [otherName, otherExtension] = extractNameAndExtension(other, true);
        const collatorNumeric = intlFileNameCollatorNumeric.value.collator;
        const collatorNumericCaseInsensitive = intlFileNameCollatorNumericCaseInsenstive.value.collator;
        let result;
        // Check for extension differences, ignoring differences in case and comparing numbers numerically.
        result = compareAndDisambiguateByLength(collatorNumericCaseInsensitive, oneExtension, otherExtension);
        if (result !== 0) {
            return result;
        }
        // Compare names.
        result = compareAndDisambiguateByLength(collatorNumeric, oneName, otherName);
        if (result !== 0) {
            return result;
        }
        // Disambiguate extension case if needed.
        if (oneExtension !== otherExtension) {
            return collatorNumeric.compare(oneExtension, otherExtension);
        }
        return 0;
    }
    exports.compareFileExtensionsNumeric = compareFileExtensionsNumeric;
    /** Extracts the name and extension from a full filename, with optional special handling for dotfiles */
    function extractNameAndExtension(str, dotfilesAsNames = false) {
        const match = str ? FileNameMatch.exec(str) : [];
        let result = [(match && match[1]) || '', (match && match[3]) || ''];
        // if the dotfilesAsNames option is selected, treat an empty filename with an extension,
        // or a filename that starts with a dot, as a dotfile name
        if (dotfilesAsNames && (!result[0] && result[1] || result[0] && result[0].charAt(0) === '.')) {
            result = [result[0] + '.' + result[1], ''];
        }
        return result;
    }
    function compareAndDisambiguateByLength(collator, one, other) {
        // Check for differences
        let result = collator.compare(one, other);
        if (result !== 0) {
            return result;
        }
        // In a numeric comparison, `foo1` and `foo01` will compare as equivalent.
        // Disambiguate by sorting the shorter string first.
        if (one.length !== other.length) {
            return one.length < other.length ? -1 : 1;
        }
        return 0;
    }
    function comparePathComponents(one, other, caseSensitive = false) {
        if (!caseSensitive) {
            one = one && one.toLowerCase();
            other = other && other.toLowerCase();
        }
        if (one === other) {
            return 0;
        }
        return one < other ? -1 : 1;
    }
    function comparePaths(one, other, caseSensitive = false) {
        const oneParts = one.split(path_1.sep);
        const otherParts = other.split(path_1.sep);
        const lastOne = oneParts.length - 1;
        const lastOther = otherParts.length - 1;
        let endOne, endOther;
        for (let i = 0;; i++) {
            endOne = lastOne === i;
            endOther = lastOther === i;
            if (endOne && endOther) {
                return compareFileNames(oneParts[i], otherParts[i], caseSensitive);
            }
            else if (endOne) {
                return -1;
            }
            else if (endOther) {
                return 1;
            }
            const result = comparePathComponents(oneParts[i], otherParts[i], caseSensitive);
            if (result !== 0) {
                return result;
            }
        }
    }
    exports.comparePaths = comparePaths;
    function compareAnything(one, other, lookFor) {
        const elementAName = one.toLowerCase();
        const elementBName = other.toLowerCase();
        // Sort prefix matches over non prefix matches
        const prefixCompare = compareByPrefix(one, other, lookFor);
        if (prefixCompare) {
            return prefixCompare;
        }
        // Sort suffix matches over non suffix matches
        const elementASuffixMatch = elementAName.endsWith(lookFor);
        const elementBSuffixMatch = elementBName.endsWith(lookFor);
        if (elementASuffixMatch !== elementBSuffixMatch) {
            return elementASuffixMatch ? -1 : 1;
        }
        // Understand file names
        const r = compareFileNames(elementAName, elementBName);
        if (r !== 0) {
            return r;
        }
        // Compare by name
        return elementAName.localeCompare(elementBName);
    }
    exports.compareAnything = compareAnything;
    function compareByPrefix(one, other, lookFor) {
        const elementAName = one.toLowerCase();
        const elementBName = other.toLowerCase();
        // Sort prefix matches over non prefix matches
        const elementAPrefixMatch = elementAName.startsWith(lookFor);
        const elementBPrefixMatch = elementBName.startsWith(lookFor);
        if (elementAPrefixMatch !== elementBPrefixMatch) {
            return elementAPrefixMatch ? -1 : 1;
        }
        // Same prefix: Sort shorter matches to the top to have those on top that match more precisely
        else if (elementAPrefixMatch && elementBPrefixMatch) {
            if (elementAName.length < elementBName.length) {
                return -1;
            }
            if (elementAName.length > elementBName.length) {
                return 1;
            }
        }
        return 0;
    }
    exports.compareByPrefix = compareByPrefix;
});
//# __sourceMappingURL=comparers.js.map