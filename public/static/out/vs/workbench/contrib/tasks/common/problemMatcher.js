/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/strings", "vs/base/common/assert", "vs/base/common/path", "vs/base/common/types", "vs/base/common/uuid", "vs/base/common/platform", "vs/base/common/severity", "vs/base/common/uri", "vs/base/common/parsers", "vs/platform/markers/common/markers", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/base/common/event"], function (require, exports, nls_1, Objects, Strings, Assert, path_1, Types, UUID, Platform, severity_1, uri_1, parsers_1, markers_1, extensionsRegistry_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProblemMatcherRegistry = exports.ProblemMatcherParser = exports.ProblemPatternRegistry = exports.Schemas = exports.ExtensionRegistryReporter = exports.ProblemPatternParser = exports.Config = exports.createLineMatcher = exports.getResource = exports.isNamedProblemMatcher = exports.ApplyToKind = exports.ProblemLocationKind = exports.FileLocationKind = void 0;
    var FileLocationKind;
    (function (FileLocationKind) {
        FileLocationKind[FileLocationKind["Default"] = 0] = "Default";
        FileLocationKind[FileLocationKind["Relative"] = 1] = "Relative";
        FileLocationKind[FileLocationKind["Absolute"] = 2] = "Absolute";
        FileLocationKind[FileLocationKind["AutoDetect"] = 3] = "AutoDetect";
    })(FileLocationKind = exports.FileLocationKind || (exports.FileLocationKind = {}));
    (function (FileLocationKind) {
        function fromString(value) {
            value = value.toLowerCase();
            if (value === 'absolute') {
                return FileLocationKind.Absolute;
            }
            else if (value === 'relative') {
                return FileLocationKind.Relative;
            }
            else if (value === 'autodetect') {
                return FileLocationKind.AutoDetect;
            }
            else {
                return undefined;
            }
        }
        FileLocationKind.fromString = fromString;
    })(FileLocationKind = exports.FileLocationKind || (exports.FileLocationKind = {}));
    var ProblemLocationKind;
    (function (ProblemLocationKind) {
        ProblemLocationKind[ProblemLocationKind["File"] = 0] = "File";
        ProblemLocationKind[ProblemLocationKind["Location"] = 1] = "Location";
    })(ProblemLocationKind = exports.ProblemLocationKind || (exports.ProblemLocationKind = {}));
    (function (ProblemLocationKind) {
        function fromString(value) {
            value = value.toLowerCase();
            if (value === 'file') {
                return ProblemLocationKind.File;
            }
            else if (value === 'location') {
                return ProblemLocationKind.Location;
            }
            else {
                return undefined;
            }
        }
        ProblemLocationKind.fromString = fromString;
    })(ProblemLocationKind = exports.ProblemLocationKind || (exports.ProblemLocationKind = {}));
    var ApplyToKind;
    (function (ApplyToKind) {
        ApplyToKind[ApplyToKind["allDocuments"] = 0] = "allDocuments";
        ApplyToKind[ApplyToKind["openDocuments"] = 1] = "openDocuments";
        ApplyToKind[ApplyToKind["closedDocuments"] = 2] = "closedDocuments";
    })(ApplyToKind = exports.ApplyToKind || (exports.ApplyToKind = {}));
    (function (ApplyToKind) {
        function fromString(value) {
            value = value.toLowerCase();
            if (value === 'alldocuments') {
                return ApplyToKind.allDocuments;
            }
            else if (value === 'opendocuments') {
                return ApplyToKind.openDocuments;
            }
            else if (value === 'closeddocuments') {
                return ApplyToKind.closedDocuments;
            }
            else {
                return undefined;
            }
        }
        ApplyToKind.fromString = fromString;
    })(ApplyToKind = exports.ApplyToKind || (exports.ApplyToKind = {}));
    function isNamedProblemMatcher(value) {
        return value && Types.isString(value.name) ? true : false;
    }
    exports.isNamedProblemMatcher = isNamedProblemMatcher;
    async function getResource(filename, matcher, fileService) {
        let kind = matcher.fileLocation;
        let fullPath;
        if (kind === FileLocationKind.Absolute) {
            fullPath = filename;
        }
        else if ((kind === FileLocationKind.Relative) && matcher.filePrefix) {
            fullPath = path_1.join(matcher.filePrefix, filename);
        }
        else if (kind === FileLocationKind.AutoDetect) {
            const matcherClone = Objects.deepClone(matcher);
            matcherClone.fileLocation = FileLocationKind.Relative;
            if (fileService) {
                const relative = await getResource(filename, matcherClone);
                let stat = undefined;
                try {
                    stat = await fileService.resolve(relative);
                }
                catch (ex) {
                    // Do nothing, we just need to catch file resolution errors.
                }
                if (stat) {
                    return relative;
                }
            }
            matcherClone.fileLocation = FileLocationKind.Absolute;
            return getResource(filename, matcherClone);
        }
        if (fullPath === undefined) {
            throw new Error('FileLocationKind is not actionable. Does the matcher have a filePrefix? This should never happen.');
        }
        fullPath = path_1.normalize(fullPath);
        fullPath = fullPath.replace(/\\/g, '/');
        if (fullPath[0] !== '/') {
            fullPath = '/' + fullPath;
        }
        if (matcher.uriProvider !== undefined) {
            return matcher.uriProvider(fullPath);
        }
        else {
            return uri_1.URI.file(fullPath);
        }
    }
    exports.getResource = getResource;
    function createLineMatcher(matcher, fileService) {
        let pattern = matcher.pattern;
        if (Types.isArray(pattern)) {
            return new MultiLineMatcher(matcher, fileService);
        }
        else {
            return new SingleLineMatcher(matcher, fileService);
        }
    }
    exports.createLineMatcher = createLineMatcher;
    const endOfLine = Platform.OS === 1 /* Windows */ ? '\r\n' : '\n';
    class AbstractLineMatcher {
        constructor(matcher, fileService) {
            this.matcher = matcher;
            this.fileService = fileService;
        }
        handle(lines, start = 0) {
            return { match: null, continue: false };
        }
        next(line) {
            return null;
        }
        fillProblemData(data, pattern, matches) {
            if (data) {
                this.fillProperty(data, 'file', pattern, matches, true);
                this.appendProperty(data, 'message', pattern, matches, true);
                this.fillProperty(data, 'code', pattern, matches, true);
                this.fillProperty(data, 'severity', pattern, matches, true);
                this.fillProperty(data, 'location', pattern, matches, true);
                this.fillProperty(data, 'line', pattern, matches);
                this.fillProperty(data, 'character', pattern, matches);
                this.fillProperty(data, 'endLine', pattern, matches);
                this.fillProperty(data, 'endCharacter', pattern, matches);
                return true;
            }
            else {
                return false;
            }
        }
        appendProperty(data, property, pattern, matches, trim = false) {
            const patternProperty = pattern[property];
            if (Types.isUndefined(data[property])) {
                this.fillProperty(data, property, pattern, matches, trim);
            }
            else if (!Types.isUndefined(patternProperty) && patternProperty < matches.length) {
                let value = matches[patternProperty];
                if (trim) {
                    value = Strings.trim(value);
                }
                data[property] += endOfLine + value;
            }
        }
        fillProperty(data, property, pattern, matches, trim = false) {
            const patternAtProperty = pattern[property];
            if (Types.isUndefined(data[property]) && !Types.isUndefined(patternAtProperty) && patternAtProperty < matches.length) {
                let value = matches[patternAtProperty];
                if (value !== undefined) {
                    if (trim) {
                        value = Strings.trim(value);
                    }
                    data[property] = value;
                }
            }
        }
        getMarkerMatch(data) {
            try {
                let location = this.getLocation(data);
                if (data.file && location && data.message) {
                    let marker = {
                        severity: this.getSeverity(data),
                        startLineNumber: location.startLineNumber,
                        startColumn: location.startCharacter,
                        endLineNumber: location.endLineNumber,
                        endColumn: location.endCharacter,
                        message: data.message
                    };
                    if (data.code !== undefined) {
                        marker.code = data.code;
                    }
                    if (this.matcher.source !== undefined) {
                        marker.source = this.matcher.source;
                    }
                    return {
                        description: this.matcher,
                        resource: this.getResource(data.file),
                        marker: marker
                    };
                }
            }
            catch (err) {
                console.error(`Failed to convert problem data into match: ${JSON.stringify(data)}`);
            }
            return undefined;
        }
        getResource(filename) {
            return getResource(filename, this.matcher, this.fileService);
        }
        getLocation(data) {
            if (data.kind === ProblemLocationKind.File) {
                return this.createLocation(0, 0, 0, 0);
            }
            if (data.location) {
                return this.parseLocationInfo(data.location);
            }
            if (!data.line) {
                return null;
            }
            let startLine = parseInt(data.line);
            let startColumn = data.character ? parseInt(data.character) : undefined;
            let endLine = data.endLine ? parseInt(data.endLine) : undefined;
            let endColumn = data.endCharacter ? parseInt(data.endCharacter) : undefined;
            return this.createLocation(startLine, startColumn, endLine, endColumn);
        }
        parseLocationInfo(value) {
            if (!value || !value.match(/(\d+|\d+,\d+|\d+,\d+,\d+,\d+)/)) {
                return null;
            }
            let parts = value.split(',');
            let startLine = parseInt(parts[0]);
            let startColumn = parts.length > 1 ? parseInt(parts[1]) : undefined;
            if (parts.length > 3) {
                return this.createLocation(startLine, startColumn, parseInt(parts[2]), parseInt(parts[3]));
            }
            else {
                return this.createLocation(startLine, startColumn, undefined, undefined);
            }
        }
        createLocation(startLine, startColumn, endLine, endColumn) {
            if (startColumn !== undefined && endColumn !== undefined) {
                return { startLineNumber: startLine, startCharacter: startColumn, endLineNumber: endLine || startLine, endCharacter: endColumn };
            }
            if (startColumn !== undefined) {
                return { startLineNumber: startLine, startCharacter: startColumn, endLineNumber: startLine, endCharacter: startColumn };
            }
            return { startLineNumber: startLine, startCharacter: 1, endLineNumber: startLine, endCharacter: Number.MAX_VALUE };
        }
        getSeverity(data) {
            let result = null;
            if (data.severity) {
                let value = data.severity;
                if (value) {
                    result = severity_1.default.fromValue(value);
                    if (result === severity_1.default.Ignore) {
                        if (value === 'E') {
                            result = severity_1.default.Error;
                        }
                        else if (value === 'W') {
                            result = severity_1.default.Warning;
                        }
                        else if (value === 'I') {
                            result = severity_1.default.Info;
                        }
                        else if (Strings.equalsIgnoreCase(value, 'hint')) {
                            result = severity_1.default.Info;
                        }
                        else if (Strings.equalsIgnoreCase(value, 'note')) {
                            result = severity_1.default.Info;
                        }
                    }
                }
            }
            if (result === null || result === severity_1.default.Ignore) {
                result = this.matcher.severity || severity_1.default.Error;
            }
            return markers_1.MarkerSeverity.fromSeverity(result);
        }
    }
    class SingleLineMatcher extends AbstractLineMatcher {
        constructor(matcher, fileService) {
            super(matcher, fileService);
            this.pattern = matcher.pattern;
        }
        get matchLength() {
            return 1;
        }
        handle(lines, start = 0) {
            Assert.ok(lines.length - start === 1);
            let data = Object.create(null);
            if (this.pattern.kind !== undefined) {
                data.kind = this.pattern.kind;
            }
            let matches = this.pattern.regexp.exec(lines[start]);
            if (matches) {
                this.fillProblemData(data, this.pattern, matches);
                let match = this.getMarkerMatch(data);
                if (match) {
                    return { match: match, continue: false };
                }
            }
            return { match: null, continue: false };
        }
        next(line) {
            return null;
        }
    }
    class MultiLineMatcher extends AbstractLineMatcher {
        constructor(matcher, fileService) {
            super(matcher, fileService);
            this.patterns = matcher.pattern;
        }
        get matchLength() {
            return this.patterns.length;
        }
        handle(lines, start = 0) {
            Assert.ok(lines.length - start === this.patterns.length);
            this.data = Object.create(null);
            let data = this.data;
            data.kind = this.patterns[0].kind;
            for (let i = 0; i < this.patterns.length; i++) {
                let pattern = this.patterns[i];
                let matches = pattern.regexp.exec(lines[i + start]);
                if (!matches) {
                    return { match: null, continue: false };
                }
                else {
                    // Only the last pattern can loop
                    if (pattern.loop && i === this.patterns.length - 1) {
                        data = Objects.deepClone(data);
                    }
                    this.fillProblemData(data, pattern, matches);
                }
            }
            let loop = !!this.patterns[this.patterns.length - 1].loop;
            if (!loop) {
                this.data = undefined;
            }
            const markerMatch = data ? this.getMarkerMatch(data) : null;
            return { match: markerMatch ? markerMatch : null, continue: loop };
        }
        next(line) {
            let pattern = this.patterns[this.patterns.length - 1];
            Assert.ok(pattern.loop === true && this.data !== null);
            let matches = pattern.regexp.exec(line);
            if (!matches) {
                this.data = undefined;
                return null;
            }
            let data = Objects.deepClone(this.data);
            let problemMatch;
            if (this.fillProblemData(data, pattern, matches)) {
                problemMatch = this.getMarkerMatch(data);
            }
            return problemMatch ? problemMatch : null;
        }
    }
    var Config;
    (function (Config) {
        let CheckedProblemPattern;
        (function (CheckedProblemPattern) {
            function is(value) {
                let candidate = value;
                return candidate && Types.isString(candidate.regexp);
            }
            CheckedProblemPattern.is = is;
        })(CheckedProblemPattern = Config.CheckedProblemPattern || (Config.CheckedProblemPattern = {}));
        let NamedProblemPattern;
        (function (NamedProblemPattern) {
            function is(value) {
                let candidate = value;
                return candidate && Types.isString(candidate.name);
            }
            NamedProblemPattern.is = is;
        })(NamedProblemPattern = Config.NamedProblemPattern || (Config.NamedProblemPattern = {}));
        let NamedCheckedProblemPattern;
        (function (NamedCheckedProblemPattern) {
            function is(value) {
                let candidate = value;
                return candidate && NamedProblemPattern.is(candidate) && Types.isString(candidate.regexp);
            }
            NamedCheckedProblemPattern.is = is;
        })(NamedCheckedProblemPattern = Config.NamedCheckedProblemPattern || (Config.NamedCheckedProblemPattern = {}));
        let MultiLineProblemPattern;
        (function (MultiLineProblemPattern) {
            function is(value) {
                return value && Types.isArray(value);
            }
            MultiLineProblemPattern.is = is;
        })(MultiLineProblemPattern = Config.MultiLineProblemPattern || (Config.MultiLineProblemPattern = {}));
        let MultiLineCheckedProblemPattern;
        (function (MultiLineCheckedProblemPattern) {
            function is(value) {
                if (!MultiLineProblemPattern.is(value)) {
                    return false;
                }
                for (const element of value) {
                    if (!Config.CheckedProblemPattern.is(element)) {
                        return false;
                    }
                }
                return true;
            }
            MultiLineCheckedProblemPattern.is = is;
        })(MultiLineCheckedProblemPattern = Config.MultiLineCheckedProblemPattern || (Config.MultiLineCheckedProblemPattern = {}));
        let NamedMultiLineCheckedProblemPattern;
        (function (NamedMultiLineCheckedProblemPattern) {
            function is(value) {
                let candidate = value;
                return candidate && Types.isString(candidate.name) && Types.isArray(candidate.patterns) && MultiLineCheckedProblemPattern.is(candidate.patterns);
            }
            NamedMultiLineCheckedProblemPattern.is = is;
        })(NamedMultiLineCheckedProblemPattern = Config.NamedMultiLineCheckedProblemPattern || (Config.NamedMultiLineCheckedProblemPattern = {}));
        function isNamedProblemMatcher(value) {
            return Types.isString(value.name);
        }
        Config.isNamedProblemMatcher = isNamedProblemMatcher;
    })(Config = exports.Config || (exports.Config = {}));
    class ProblemPatternParser extends parsers_1.Parser {
        constructor(logger) {
            super(logger);
        }
        parse(value) {
            if (Config.NamedMultiLineCheckedProblemPattern.is(value)) {
                return this.createNamedMultiLineProblemPattern(value);
            }
            else if (Config.MultiLineCheckedProblemPattern.is(value)) {
                return this.createMultiLineProblemPattern(value);
            }
            else if (Config.NamedCheckedProblemPattern.is(value)) {
                let result = this.createSingleProblemPattern(value);
                result.name = value.name;
                return result;
            }
            else if (Config.CheckedProblemPattern.is(value)) {
                return this.createSingleProblemPattern(value);
            }
            else {
                this.error(nls_1.localize('ProblemPatternParser.problemPattern.missingRegExp', 'The problem pattern is missing a regular expression.'));
                return null;
            }
        }
        createSingleProblemPattern(value) {
            let result = this.doCreateSingleProblemPattern(value, true);
            if (result === undefined) {
                return null;
            }
            else if (result.kind === undefined) {
                result.kind = ProblemLocationKind.Location;
            }
            return this.validateProblemPattern([result]) ? result : null;
        }
        createNamedMultiLineProblemPattern(value) {
            const validPatterns = this.createMultiLineProblemPattern(value.patterns);
            if (!validPatterns) {
                return null;
            }
            let result = {
                name: value.name,
                label: value.label ? value.label : value.name,
                patterns: validPatterns
            };
            return result;
        }
        createMultiLineProblemPattern(values) {
            let result = [];
            for (let i = 0; i < values.length; i++) {
                let pattern = this.doCreateSingleProblemPattern(values[i], false);
                if (pattern === undefined) {
                    return null;
                }
                if (i < values.length - 1) {
                    if (!Types.isUndefined(pattern.loop) && pattern.loop) {
                        pattern.loop = false;
                        this.error(nls_1.localize('ProblemPatternParser.loopProperty.notLast', 'The loop property is only supported on the last line matcher.'));
                    }
                }
                result.push(pattern);
            }
            if (result[0].kind === undefined) {
                result[0].kind = ProblemLocationKind.Location;
            }
            return this.validateProblemPattern(result) ? result : null;
        }
        doCreateSingleProblemPattern(value, setDefaults) {
            const regexp = this.createRegularExpression(value.regexp);
            if (regexp === undefined) {
                return undefined;
            }
            let result = { regexp };
            if (value.kind) {
                result.kind = ProblemLocationKind.fromString(value.kind);
            }
            function copyProperty(result, source, resultKey, sourceKey) {
                const value = source[sourceKey];
                if (typeof value === 'number') {
                    result[resultKey] = value;
                }
            }
            copyProperty(result, value, 'file', 'file');
            copyProperty(result, value, 'location', 'location');
            copyProperty(result, value, 'line', 'line');
            copyProperty(result, value, 'character', 'column');
            copyProperty(result, value, 'endLine', 'endLine');
            copyProperty(result, value, 'endCharacter', 'endColumn');
            copyProperty(result, value, 'severity', 'severity');
            copyProperty(result, value, 'code', 'code');
            copyProperty(result, value, 'message', 'message');
            if (value.loop === true || value.loop === false) {
                result.loop = value.loop;
            }
            if (setDefaults) {
                if (result.location || result.kind === ProblemLocationKind.File) {
                    let defaultValue = {
                        file: 1,
                        message: 0
                    };
                    result = Objects.mixin(result, defaultValue, false);
                }
                else {
                    let defaultValue = {
                        file: 1,
                        line: 2,
                        character: 3,
                        message: 0
                    };
                    result = Objects.mixin(result, defaultValue, false);
                }
            }
            return result;
        }
        validateProblemPattern(values) {
            let file = false, message = false, location = false, line = false;
            let locationKind = (values[0].kind === undefined) ? ProblemLocationKind.Location : values[0].kind;
            values.forEach((pattern, i) => {
                if (i !== 0 && pattern.kind) {
                    this.error(nls_1.localize('ProblemPatternParser.problemPattern.kindProperty.notFirst', 'The problem pattern is invalid. The kind property must be provided only in the first element'));
                }
                file = file || !Types.isUndefined(pattern.file);
                message = message || !Types.isUndefined(pattern.message);
                location = location || !Types.isUndefined(pattern.location);
                line = line || !Types.isUndefined(pattern.line);
            });
            if (!(file && message)) {
                this.error(nls_1.localize('ProblemPatternParser.problemPattern.missingProperty', 'The problem pattern is invalid. It must have at least have a file and a message.'));
                return false;
            }
            if (locationKind === ProblemLocationKind.Location && !(location || line)) {
                this.error(nls_1.localize('ProblemPatternParser.problemPattern.missingLocation', 'The problem pattern is invalid. It must either have kind: "file" or have a line or location match group.'));
                return false;
            }
            return true;
        }
        createRegularExpression(value) {
            let result;
            try {
                result = new RegExp(value);
            }
            catch (err) {
                this.error(nls_1.localize('ProblemPatternParser.invalidRegexp', 'Error: The string {0} is not a valid regular expression.\n', value));
            }
            return result;
        }
    }
    exports.ProblemPatternParser = ProblemPatternParser;
    class ExtensionRegistryReporter {
        constructor(_collector, _validationStatus = new parsers_1.ValidationStatus()) {
            this._collector = _collector;
            this._validationStatus = _validationStatus;
        }
        info(message) {
            this._validationStatus.state = 1 /* Info */;
            this._collector.info(message);
        }
        warn(message) {
            this._validationStatus.state = 2 /* Warning */;
            this._collector.warn(message);
        }
        error(message) {
            this._validationStatus.state = 3 /* Error */;
            this._collector.error(message);
        }
        fatal(message) {
            this._validationStatus.state = 4 /* Fatal */;
            this._collector.error(message);
        }
        get status() {
            return this._validationStatus;
        }
    }
    exports.ExtensionRegistryReporter = ExtensionRegistryReporter;
    var Schemas;
    (function (Schemas) {
        Schemas.ProblemPattern = {
            default: {
                regexp: '^([^\\\\s].*)\\\\((\\\\d+,\\\\d+)\\\\):\\\\s*(.*)$',
                file: 1,
                location: 2,
                message: 3
            },
            type: 'object',
            additionalProperties: false,
            properties: {
                regexp: {
                    type: 'string',
                    description: nls_1.localize('ProblemPatternSchema.regexp', 'The regular expression to find an error, warning or info in the output.')
                },
                kind: {
                    type: 'string',
                    description: nls_1.localize('ProblemPatternSchema.kind', 'whether the pattern matches a location (file and line) or only a file.')
                },
                file: {
                    type: 'integer',
                    description: nls_1.localize('ProblemPatternSchema.file', 'The match group index of the filename. If omitted 1 is used.')
                },
                location: {
                    type: 'integer',
                    description: nls_1.localize('ProblemPatternSchema.location', 'The match group index of the problem\'s location. Valid location patterns are: (line), (line,column) and (startLine,startColumn,endLine,endColumn). If omitted (line,column) is assumed.')
                },
                line: {
                    type: 'integer',
                    description: nls_1.localize('ProblemPatternSchema.line', 'The match group index of the problem\'s line. Defaults to 2')
                },
                column: {
                    type: 'integer',
                    description: nls_1.localize('ProblemPatternSchema.column', 'The match group index of the problem\'s line character. Defaults to 3')
                },
                endLine: {
                    type: 'integer',
                    description: nls_1.localize('ProblemPatternSchema.endLine', 'The match group index of the problem\'s end line. Defaults to undefined')
                },
                endColumn: {
                    type: 'integer',
                    description: nls_1.localize('ProblemPatternSchema.endColumn', 'The match group index of the problem\'s end line character. Defaults to undefined')
                },
                severity: {
                    type: 'integer',
                    description: nls_1.localize('ProblemPatternSchema.severity', 'The match group index of the problem\'s severity. Defaults to undefined')
                },
                code: {
                    type: 'integer',
                    description: nls_1.localize('ProblemPatternSchema.code', 'The match group index of the problem\'s code. Defaults to undefined')
                },
                message: {
                    type: 'integer',
                    description: nls_1.localize('ProblemPatternSchema.message', 'The match group index of the message. If omitted it defaults to 4 if location is specified. Otherwise it defaults to 5.')
                },
                loop: {
                    type: 'boolean',
                    description: nls_1.localize('ProblemPatternSchema.loop', 'In a multi line matcher loop indicated whether this pattern is executed in a loop as long as it matches. Can only specified on a last pattern in a multi line pattern.')
                }
            }
        };
        Schemas.NamedProblemPattern = Objects.deepClone(Schemas.ProblemPattern);
        Schemas.NamedProblemPattern.properties = Objects.deepClone(Schemas.NamedProblemPattern.properties) || {};
        Schemas.NamedProblemPattern.properties['name'] = {
            type: 'string',
            description: nls_1.localize('NamedProblemPatternSchema.name', 'The name of the problem pattern.')
        };
        Schemas.MultiLineProblemPattern = {
            type: 'array',
            items: Schemas.ProblemPattern
        };
        Schemas.NamedMultiLineProblemPattern = {
            type: 'object',
            additionalProperties: false,
            properties: {
                name: {
                    type: 'string',
                    description: nls_1.localize('NamedMultiLineProblemPatternSchema.name', 'The name of the problem multi line problem pattern.')
                },
                patterns: {
                    type: 'array',
                    description: nls_1.localize('NamedMultiLineProblemPatternSchema.patterns', 'The actual patterns.'),
                    items: Schemas.ProblemPattern
                }
            }
        };
    })(Schemas = exports.Schemas || (exports.Schemas = {}));
    const problemPatternExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'problemPatterns',
        jsonSchema: {
            description: nls_1.localize('ProblemPatternExtPoint', 'Contributes problem patterns'),
            type: 'array',
            items: {
                anyOf: [
                    Schemas.NamedProblemPattern,
                    Schemas.NamedMultiLineProblemPattern
                ]
            }
        }
    });
    class ProblemPatternRegistryImpl {
        constructor() {
            this.patterns = Object.create(null);
            this.fillDefaults();
            this.readyPromise = new Promise((resolve, reject) => {
                problemPatternExtPoint.setHandler((extensions, delta) => {
                    // We get all statically know extension during startup in one batch
                    try {
                        delta.removed.forEach(extension => {
                            let problemPatterns = extension.value;
                            for (let pattern of problemPatterns) {
                                if (this.patterns[pattern.name]) {
                                    delete this.patterns[pattern.name];
                                }
                            }
                        });
                        delta.added.forEach(extension => {
                            let problemPatterns = extension.value;
                            let parser = new ProblemPatternParser(new ExtensionRegistryReporter(extension.collector));
                            for (let pattern of problemPatterns) {
                                if (Config.NamedMultiLineCheckedProblemPattern.is(pattern)) {
                                    let result = parser.parse(pattern);
                                    if (parser.problemReporter.status.state < 3 /* Error */) {
                                        this.add(result.name, result.patterns);
                                    }
                                    else {
                                        extension.collector.error(nls_1.localize('ProblemPatternRegistry.error', 'Invalid problem pattern. The pattern will be ignored.'));
                                        extension.collector.error(JSON.stringify(pattern, undefined, 4));
                                    }
                                }
                                else if (Config.NamedProblemPattern.is(pattern)) {
                                    let result = parser.parse(pattern);
                                    if (parser.problemReporter.status.state < 3 /* Error */) {
                                        this.add(pattern.name, result);
                                    }
                                    else {
                                        extension.collector.error(nls_1.localize('ProblemPatternRegistry.error', 'Invalid problem pattern. The pattern will be ignored.'));
                                        extension.collector.error(JSON.stringify(pattern, undefined, 4));
                                    }
                                }
                                parser.reset();
                            }
                        });
                    }
                    catch (error) {
                        // Do nothing
                    }
                    resolve(undefined);
                });
            });
        }
        onReady() {
            return this.readyPromise;
        }
        add(key, value) {
            this.patterns[key] = value;
        }
        get(key) {
            return this.patterns[key];
        }
        fillDefaults() {
            this.add('msCompile', {
                regexp: /^(?:\s+\d+\>)?([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\)\s*:\s+(error|warning|info)\s+(\w{1,2}\d+)\s*:\s*(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                severity: 3,
                code: 4,
                message: 5
            });
            this.add('gulp-tsc', {
                regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(\d+)\s+(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                code: 3,
                message: 4
            });
            this.add('cpp', {
                regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(C\d+)\s*:\s*(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                severity: 3,
                code: 4,
                message: 5
            });
            this.add('csc', {
                regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(CS\d+)\s*:\s*(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                severity: 3,
                code: 4,
                message: 5
            });
            this.add('vb', {
                regexp: /^([^\s].*)\((\d+|\d+,\d+|\d+,\d+,\d+,\d+)\):\s+(error|warning|info)\s+(BC\d+)\s*:\s*(.*)$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                location: 2,
                severity: 3,
                code: 4,
                message: 5
            });
            this.add('lessCompile', {
                regexp: /^\s*(.*) in file (.*) line no. (\d+)$/,
                kind: ProblemLocationKind.Location,
                message: 1,
                file: 2,
                line: 3
            });
            this.add('jshint', {
                regexp: /^(.*):\s+line\s+(\d+),\s+col\s+(\d+),\s(.+?)(?:\s+\((\w)(\d+)\))?$/,
                kind: ProblemLocationKind.Location,
                file: 1,
                line: 2,
                character: 3,
                message: 4,
                severity: 5,
                code: 6
            });
            this.add('jshint-stylish', [
                {
                    regexp: /^(.+)$/,
                    kind: ProblemLocationKind.Location,
                    file: 1
                },
                {
                    regexp: /^\s+line\s+(\d+)\s+col\s+(\d+)\s+(.+?)(?:\s+\((\w)(\d+)\))?$/,
                    line: 1,
                    character: 2,
                    message: 3,
                    severity: 4,
                    code: 5,
                    loop: true
                }
            ]);
            this.add('eslint-compact', {
                regexp: /^(.+):\sline\s(\d+),\scol\s(\d+),\s(Error|Warning|Info)\s-\s(.+)\s\((.+)\)$/,
                file: 1,
                kind: ProblemLocationKind.Location,
                line: 2,
                character: 3,
                severity: 4,
                message: 5,
                code: 6
            });
            this.add('eslint-stylish', [
                {
                    regexp: /^([^\s].*)$/,
                    kind: ProblemLocationKind.Location,
                    file: 1
                },
                {
                    regexp: /^\s+(\d+):(\d+)\s+(error|warning|info)\s+(.+?)(?:\s\s+(.*))?$/,
                    line: 1,
                    character: 2,
                    severity: 3,
                    message: 4,
                    code: 5,
                    loop: true
                }
            ]);
            this.add('go', {
                regexp: /^([^:]*: )?((.:)?[^:]*):(\d+)(:(\d+))?: (.*)$/,
                kind: ProblemLocationKind.Location,
                file: 2,
                line: 4,
                character: 6,
                message: 7
            });
        }
    }
    exports.ProblemPatternRegistry = new ProblemPatternRegistryImpl();
    class ProblemMatcherParser extends parsers_1.Parser {
        constructor(logger) {
            super(logger);
        }
        parse(json) {
            let result = this.createProblemMatcher(json);
            if (!this.checkProblemMatcherValid(json, result)) {
                return undefined;
            }
            this.addWatchingMatcher(json, result);
            return result;
        }
        checkProblemMatcherValid(externalProblemMatcher, problemMatcher) {
            if (!problemMatcher) {
                this.error(nls_1.localize('ProblemMatcherParser.noProblemMatcher', 'Error: the description can\'t be converted into a problem matcher:\n{0}\n', JSON.stringify(externalProblemMatcher, null, 4)));
                return false;
            }
            if (!problemMatcher.pattern) {
                this.error(nls_1.localize('ProblemMatcherParser.noProblemPattern', 'Error: the description doesn\'t define a valid problem pattern:\n{0}\n', JSON.stringify(externalProblemMatcher, null, 4)));
                return false;
            }
            if (!problemMatcher.owner) {
                this.error(nls_1.localize('ProblemMatcherParser.noOwner', 'Error: the description doesn\'t define an owner:\n{0}\n', JSON.stringify(externalProblemMatcher, null, 4)));
                return false;
            }
            if (Types.isUndefined(problemMatcher.fileLocation)) {
                this.error(nls_1.localize('ProblemMatcherParser.noFileLocation', 'Error: the description doesn\'t define a file location:\n{0}\n', JSON.stringify(externalProblemMatcher, null, 4)));
                return false;
            }
            return true;
        }
        createProblemMatcher(description) {
            let result = null;
            let owner = Types.isString(description.owner) ? description.owner : UUID.generateUuid();
            let source = Types.isString(description.source) ? description.source : undefined;
            let applyTo = Types.isString(description.applyTo) ? ApplyToKind.fromString(description.applyTo) : ApplyToKind.allDocuments;
            if (!applyTo) {
                applyTo = ApplyToKind.allDocuments;
            }
            let fileLocation = undefined;
            let filePrefix = undefined;
            let kind;
            if (Types.isUndefined(description.fileLocation)) {
                fileLocation = FileLocationKind.Relative;
                filePrefix = '${workspaceFolder}';
            }
            else if (Types.isString(description.fileLocation)) {
                kind = FileLocationKind.fromString(description.fileLocation);
                if (kind) {
                    fileLocation = kind;
                    if ((kind === FileLocationKind.Relative) || (kind === FileLocationKind.AutoDetect)) {
                        filePrefix = '${workspaceFolder}';
                    }
                }
            }
            else if (Types.isStringArray(description.fileLocation)) {
                let values = description.fileLocation;
                if (values.length > 0) {
                    kind = FileLocationKind.fromString(values[0]);
                    if (values.length === 1 && kind === FileLocationKind.Absolute) {
                        fileLocation = kind;
                    }
                    else if (values.length === 2 && (kind === FileLocationKind.Relative || kind === FileLocationKind.AutoDetect) && values[1]) {
                        fileLocation = kind;
                        filePrefix = values[1];
                    }
                }
            }
            let pattern = description.pattern ? this.createProblemPattern(description.pattern) : undefined;
            let severity = description.severity ? severity_1.default.fromValue(description.severity) : undefined;
            if (severity === severity_1.default.Ignore) {
                this.info(nls_1.localize('ProblemMatcherParser.unknownSeverity', 'Info: unknown severity {0}. Valid values are error, warning and info.\n', description.severity));
                severity = severity_1.default.Error;
            }
            if (Types.isString(description.base)) {
                let variableName = description.base;
                if (variableName.length > 1 && variableName[0] === '$') {
                    let base = exports.ProblemMatcherRegistry.get(variableName.substring(1));
                    if (base) {
                        result = Objects.deepClone(base);
                        if (description.owner !== undefined && owner !== undefined) {
                            result.owner = owner;
                        }
                        if (description.source !== undefined && source !== undefined) {
                            result.source = source;
                        }
                        if (description.fileLocation !== undefined && fileLocation !== undefined) {
                            result.fileLocation = fileLocation;
                            result.filePrefix = filePrefix;
                        }
                        if (description.pattern !== undefined && pattern !== undefined && pattern !== null) {
                            result.pattern = pattern;
                        }
                        if (description.severity !== undefined && severity !== undefined) {
                            result.severity = severity;
                        }
                        if (description.applyTo !== undefined && applyTo !== undefined) {
                            result.applyTo = applyTo;
                        }
                    }
                }
            }
            else if (fileLocation && pattern) {
                result = {
                    owner: owner,
                    applyTo: applyTo,
                    fileLocation: fileLocation,
                    pattern: pattern,
                };
                if (source) {
                    result.source = source;
                }
                if (filePrefix) {
                    result.filePrefix = filePrefix;
                }
                if (severity) {
                    result.severity = severity;
                }
            }
            if (Config.isNamedProblemMatcher(description)) {
                result.name = description.name;
                result.label = Types.isString(description.label) ? description.label : description.name;
            }
            return result;
        }
        createProblemPattern(value) {
            if (Types.isString(value)) {
                let variableName = value;
                if (variableName.length > 1 && variableName[0] === '$') {
                    let result = exports.ProblemPatternRegistry.get(variableName.substring(1));
                    if (!result) {
                        this.error(nls_1.localize('ProblemMatcherParser.noDefinedPatter', 'Error: the pattern with the identifier {0} doesn\'t exist.', variableName));
                    }
                    return result;
                }
                else {
                    if (variableName.length === 0) {
                        this.error(nls_1.localize('ProblemMatcherParser.noIdentifier', 'Error: the pattern property refers to an empty identifier.'));
                    }
                    else {
                        this.error(nls_1.localize('ProblemMatcherParser.noValidIdentifier', 'Error: the pattern property {0} is not a valid pattern variable name.', variableName));
                    }
                }
            }
            else if (value) {
                let problemPatternParser = new ProblemPatternParser(this.problemReporter);
                if (Array.isArray(value)) {
                    return problemPatternParser.parse(value);
                }
                else {
                    return problemPatternParser.parse(value);
                }
            }
            return null;
        }
        addWatchingMatcher(external, internal) {
            let oldBegins = this.createRegularExpression(external.watchedTaskBeginsRegExp);
            let oldEnds = this.createRegularExpression(external.watchedTaskEndsRegExp);
            if (oldBegins && oldEnds) {
                internal.watching = {
                    activeOnStart: false,
                    beginsPattern: { regexp: oldBegins },
                    endsPattern: { regexp: oldEnds }
                };
                return;
            }
            let backgroundMonitor = external.background || external.watching;
            if (Types.isUndefinedOrNull(backgroundMonitor)) {
                return;
            }
            let begins = this.createWatchingPattern(backgroundMonitor.beginsPattern);
            let ends = this.createWatchingPattern(backgroundMonitor.endsPattern);
            if (begins && ends) {
                internal.watching = {
                    activeOnStart: Types.isBoolean(backgroundMonitor.activeOnStart) ? backgroundMonitor.activeOnStart : false,
                    beginsPattern: begins,
                    endsPattern: ends
                };
                return;
            }
            if (begins || ends) {
                this.error(nls_1.localize('ProblemMatcherParser.problemPattern.watchingMatcher', 'A problem matcher must define both a begin pattern and an end pattern for watching.'));
            }
        }
        createWatchingPattern(external) {
            if (Types.isUndefinedOrNull(external)) {
                return null;
            }
            let regexp;
            let file;
            if (Types.isString(external)) {
                regexp = this.createRegularExpression(external);
            }
            else {
                regexp = this.createRegularExpression(external.regexp);
                if (Types.isNumber(external.file)) {
                    file = external.file;
                }
            }
            if (!regexp) {
                return null;
            }
            return file ? { regexp, file } : { regexp, file: 1 };
        }
        createRegularExpression(value) {
            let result = null;
            if (!value) {
                return result;
            }
            try {
                result = new RegExp(value);
            }
            catch (err) {
                this.error(nls_1.localize('ProblemMatcherParser.invalidRegexp', 'Error: The string {0} is not a valid regular expression.\n', value));
            }
            return result;
        }
    }
    exports.ProblemMatcherParser = ProblemMatcherParser;
    (function (Schemas) {
        Schemas.WatchingPattern = {
            type: 'object',
            additionalProperties: false,
            properties: {
                regexp: {
                    type: 'string',
                    description: nls_1.localize('WatchingPatternSchema.regexp', 'The regular expression to detect the begin or end of a background task.')
                },
                file: {
                    type: 'integer',
                    description: nls_1.localize('WatchingPatternSchema.file', 'The match group index of the filename. Can be omitted.')
                },
            }
        };
        Schemas.PatternType = {
            anyOf: [
                {
                    type: 'string',
                    description: nls_1.localize('PatternTypeSchema.name', 'The name of a contributed or predefined pattern')
                },
                Schemas.ProblemPattern,
                Schemas.MultiLineProblemPattern
            ],
            description: nls_1.localize('PatternTypeSchema.description', 'A problem pattern or the name of a contributed or predefined problem pattern. Can be omitted if base is specified.')
        };
        Schemas.ProblemMatcher = {
            type: 'object',
            additionalProperties: false,
            properties: {
                base: {
                    type: 'string',
                    description: nls_1.localize('ProblemMatcherSchema.base', 'The name of a base problem matcher to use.')
                },
                owner: {
                    type: 'string',
                    description: nls_1.localize('ProblemMatcherSchema.owner', 'The owner of the problem inside Code. Can be omitted if base is specified. Defaults to \'external\' if omitted and base is not specified.')
                },
                source: {
                    type: 'string',
                    description: nls_1.localize('ProblemMatcherSchema.source', 'A human-readable string describing the source of this diagnostic, e.g. \'typescript\' or \'super lint\'.')
                },
                severity: {
                    type: 'string',
                    enum: ['error', 'warning', 'info'],
                    description: nls_1.localize('ProblemMatcherSchema.severity', 'The default severity for captures problems. Is used if the pattern doesn\'t define a match group for severity.')
                },
                applyTo: {
                    type: 'string',
                    enum: ['allDocuments', 'openDocuments', 'closedDocuments'],
                    description: nls_1.localize('ProblemMatcherSchema.applyTo', 'Controls if a problem reported on a text document is applied only to open, closed or all documents.')
                },
                pattern: Schemas.PatternType,
                fileLocation: {
                    oneOf: [
                        {
                            type: 'string',
                            enum: ['absolute', 'relative', 'autoDetect']
                        },
                        {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        }
                    ],
                    description: nls_1.localize('ProblemMatcherSchema.fileLocation', 'Defines how file names reported in a problem pattern should be interpreted. A relative fileLocation may be an array, where the second element of the array is the path the relative file location.')
                },
                background: {
                    type: 'object',
                    additionalProperties: false,
                    description: nls_1.localize('ProblemMatcherSchema.background', 'Patterns to track the begin and end of a matcher active on a background task.'),
                    properties: {
                        activeOnStart: {
                            type: 'boolean',
                            description: nls_1.localize('ProblemMatcherSchema.background.activeOnStart', 'If set to true the background monitor is in active mode when the task starts. This is equals of issuing a line that matches the beginsPattern')
                        },
                        beginsPattern: {
                            oneOf: [
                                {
                                    type: 'string'
                                },
                                Schemas.WatchingPattern
                            ],
                            description: nls_1.localize('ProblemMatcherSchema.background.beginsPattern', 'If matched in the output the start of a background task is signaled.')
                        },
                        endsPattern: {
                            oneOf: [
                                {
                                    type: 'string'
                                },
                                Schemas.WatchingPattern
                            ],
                            description: nls_1.localize('ProblemMatcherSchema.background.endsPattern', 'If matched in the output the end of a background task is signaled.')
                        }
                    }
                },
                watching: {
                    type: 'object',
                    additionalProperties: false,
                    deprecationMessage: nls_1.localize('ProblemMatcherSchema.watching.deprecated', 'The watching property is deprecated. Use background instead.'),
                    description: nls_1.localize('ProblemMatcherSchema.watching', 'Patterns to track the begin and end of a watching matcher.'),
                    properties: {
                        activeOnStart: {
                            type: 'boolean',
                            description: nls_1.localize('ProblemMatcherSchema.watching.activeOnStart', 'If set to true the watcher is in active mode when the task starts. This is equals of issuing a line that matches the beginPattern')
                        },
                        beginsPattern: {
                            oneOf: [
                                {
                                    type: 'string'
                                },
                                Schemas.WatchingPattern
                            ],
                            description: nls_1.localize('ProblemMatcherSchema.watching.beginsPattern', 'If matched in the output the start of a watching task is signaled.')
                        },
                        endsPattern: {
                            oneOf: [
                                {
                                    type: 'string'
                                },
                                Schemas.WatchingPattern
                            ],
                            description: nls_1.localize('ProblemMatcherSchema.watching.endsPattern', 'If matched in the output the end of a watching task is signaled.')
                        }
                    }
                }
            }
        };
        Schemas.LegacyProblemMatcher = Objects.deepClone(Schemas.ProblemMatcher);
        Schemas.LegacyProblemMatcher.properties = Objects.deepClone(Schemas.LegacyProblemMatcher.properties) || {};
        Schemas.LegacyProblemMatcher.properties['watchedTaskBeginsRegExp'] = {
            type: 'string',
            deprecationMessage: nls_1.localize('LegacyProblemMatcherSchema.watchedBegin.deprecated', 'This property is deprecated. Use the watching property instead.'),
            description: nls_1.localize('LegacyProblemMatcherSchema.watchedBegin', 'A regular expression signaling that a watched tasks begins executing triggered through file watching.')
        };
        Schemas.LegacyProblemMatcher.properties['watchedTaskEndsRegExp'] = {
            type: 'string',
            deprecationMessage: nls_1.localize('LegacyProblemMatcherSchema.watchedEnd.deprecated', 'This property is deprecated. Use the watching property instead.'),
            description: nls_1.localize('LegacyProblemMatcherSchema.watchedEnd', 'A regular expression signaling that a watched tasks ends executing.')
        };
        Schemas.NamedProblemMatcher = Objects.deepClone(Schemas.ProblemMatcher);
        Schemas.NamedProblemMatcher.properties = Objects.deepClone(Schemas.NamedProblemMatcher.properties) || {};
        Schemas.NamedProblemMatcher.properties.name = {
            type: 'string',
            description: nls_1.localize('NamedProblemMatcherSchema.name', 'The name of the problem matcher used to refer to it.')
        };
        Schemas.NamedProblemMatcher.properties.label = {
            type: 'string',
            description: nls_1.localize('NamedProblemMatcherSchema.label', 'A human readable label of the problem matcher.')
        };
    })(Schemas = exports.Schemas || (exports.Schemas = {}));
    const problemMatchersExtPoint = extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
        extensionPoint: 'problemMatchers',
        deps: [problemPatternExtPoint],
        jsonSchema: {
            description: nls_1.localize('ProblemMatcherExtPoint', 'Contributes problem matchers'),
            type: 'array',
            items: Schemas.NamedProblemMatcher
        }
    });
    class ProblemMatcherRegistryImpl {
        constructor() {
            this._onMatchersChanged = new event_1.Emitter();
            this.onMatcherChanged = this._onMatchersChanged.event;
            this.matchers = Object.create(null);
            this.fillDefaults();
            this.readyPromise = new Promise((resolve, reject) => {
                problemMatchersExtPoint.setHandler((extensions, delta) => {
                    try {
                        delta.removed.forEach(extension => {
                            let problemMatchers = extension.value;
                            for (let matcher of problemMatchers) {
                                if (this.matchers[matcher.name]) {
                                    delete this.matchers[matcher.name];
                                }
                            }
                        });
                        delta.added.forEach(extension => {
                            let problemMatchers = extension.value;
                            let parser = new ProblemMatcherParser(new ExtensionRegistryReporter(extension.collector));
                            for (let matcher of problemMatchers) {
                                let result = parser.parse(matcher);
                                if (result && isNamedProblemMatcher(result)) {
                                    this.add(result);
                                }
                            }
                        });
                        if ((delta.removed.length > 0) || (delta.added.length > 0)) {
                            this._onMatchersChanged.fire();
                        }
                    }
                    catch (error) {
                    }
                    let matcher = this.get('tsc-watch');
                    if (matcher) {
                        matcher.tscWatch = true;
                    }
                    resolve(undefined);
                });
            });
        }
        onReady() {
            exports.ProblemPatternRegistry.onReady();
            return this.readyPromise;
        }
        add(matcher) {
            this.matchers[matcher.name] = matcher;
        }
        get(name) {
            return this.matchers[name];
        }
        keys() {
            return Object.keys(this.matchers);
        }
        fillDefaults() {
            this.add({
                name: 'msCompile',
                label: nls_1.localize('msCompile', 'Microsoft compiler problems'),
                owner: 'msCompile',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('msCompile')
            });
            this.add({
                name: 'lessCompile',
                label: nls_1.localize('lessCompile', 'Less problems'),
                deprecated: true,
                owner: 'lessCompile',
                source: 'less',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('lessCompile'),
                severity: severity_1.default.Error
            });
            this.add({
                name: 'gulp-tsc',
                label: nls_1.localize('gulp-tsc', 'Gulp TSC Problems'),
                owner: 'typescript',
                source: 'ts',
                applyTo: ApplyToKind.closedDocuments,
                fileLocation: FileLocationKind.Relative,
                filePrefix: '${workspaceFolder}',
                pattern: exports.ProblemPatternRegistry.get('gulp-tsc')
            });
            this.add({
                name: 'jshint',
                label: nls_1.localize('jshint', 'JSHint problems'),
                owner: 'jshint',
                source: 'jshint',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('jshint')
            });
            this.add({
                name: 'jshint-stylish',
                label: nls_1.localize('jshint-stylish', 'JSHint stylish problems'),
                owner: 'jshint',
                source: 'jshint',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('jshint-stylish')
            });
            this.add({
                name: 'eslint-compact',
                label: nls_1.localize('eslint-compact', 'ESLint compact problems'),
                owner: 'eslint',
                source: 'eslint',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                filePrefix: '${workspaceFolder}',
                pattern: exports.ProblemPatternRegistry.get('eslint-compact')
            });
            this.add({
                name: 'eslint-stylish',
                label: nls_1.localize('eslint-stylish', 'ESLint stylish problems'),
                owner: 'eslint',
                source: 'eslint',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Absolute,
                pattern: exports.ProblemPatternRegistry.get('eslint-stylish')
            });
            this.add({
                name: 'go',
                label: nls_1.localize('go', 'Go problems'),
                owner: 'go',
                source: 'go',
                applyTo: ApplyToKind.allDocuments,
                fileLocation: FileLocationKind.Relative,
                filePrefix: '${workspaceFolder}',
                pattern: exports.ProblemPatternRegistry.get('go')
            });
        }
    }
    exports.ProblemMatcherRegistry = new ProblemMatcherRegistryImpl();
});
//# __sourceMappingURL=problemMatcher.js.map