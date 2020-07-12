/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/nls"], function (require, exports, types_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getInvalidTypeError = exports.createValidator = void 0;
    function canBeType(propTypes, ...types) {
        return types.some(t => propTypes.includes(t));
    }
    function createValidator(prop) {
        const type = Array.isArray(prop.type) ? prop.type : [prop.type];
        const isNullable = canBeType(type, 'null');
        const isNumeric = (canBeType(type, 'number') || canBeType(type, 'integer')) && (type.length === 1 || type.length === 2 && isNullable);
        const numericValidations = getNumericValidators(prop);
        const stringValidations = getStringValidators(prop);
        const stringArrayValidator = getArrayOfStringValidator(prop);
        return value => {
            if (prop.type === 'string' && stringValidations.length === 0) {
                return null;
            }
            if (isNullable && value === '') {
                return '';
            }
            const errors = [];
            if (stringArrayValidator) {
                const err = stringArrayValidator(value);
                if (err) {
                    errors.push(err);
                }
            }
            if (isNumeric) {
                if (value === '' || isNaN(+value)) {
                    errors.push(nls.localize('validations.expectedNumeric', "Value must be a number."));
                }
                else {
                    errors.push(...numericValidations.filter(validator => !validator.isValid(+value)).map(validator => validator.message));
                }
            }
            if (prop.type === 'string') {
                errors.push(...stringValidations.filter(validator => !validator.isValid('' + value)).map(validator => validator.message));
            }
            if (errors.length) {
                return prop.errorMessage ? [prop.errorMessage, ...errors].join(' ') : errors.join(' ');
            }
            return '';
        };
    }
    exports.createValidator = createValidator;
    /**
     * Returns an error string if the value is invalid and can't be displayed in the settings UI for the given type.
     */
    function getInvalidTypeError(value, type) {
        if (typeof type === 'undefined') {
            return;
        }
        const typeArr = Array.isArray(type) ? type : [type];
        if (!typeArr.some(_type => valueValidatesAsType(value, _type))) {
            return nls.localize('invalidTypeError', "Setting has an invalid type, expected {0}. Fix in JSON.", JSON.stringify(type));
        }
        return;
    }
    exports.getInvalidTypeError = getInvalidTypeError;
    function valueValidatesAsType(value, type) {
        const valueType = typeof value;
        if (type === 'boolean') {
            return valueType === 'boolean';
        }
        else if (type === 'object') {
            return value && !Array.isArray(value) && valueType === 'object';
        }
        else if (type === 'null') {
            return value === null;
        }
        else if (type === 'array') {
            return Array.isArray(value);
        }
        else if (type === 'string') {
            return valueType === 'string';
        }
        else if (type === 'number' || type === 'integer') {
            return valueType === 'number';
        }
        return true;
    }
    function getStringValidators(prop) {
        let patternRegex;
        if (typeof prop.pattern === 'string') {
            patternRegex = new RegExp(prop.pattern);
        }
        return [
            {
                enabled: prop.maxLength !== undefined,
                isValid: ((value) => value.length <= prop.maxLength),
                message: nls.localize('validations.maxLength', "Value must be {0} or fewer characters long.", prop.maxLength)
            },
            {
                enabled: prop.minLength !== undefined,
                isValid: ((value) => value.length >= prop.minLength),
                message: nls.localize('validations.minLength', "Value must be {0} or more characters long.", prop.minLength)
            },
            {
                enabled: patternRegex !== undefined,
                isValid: ((value) => patternRegex.test(value)),
                message: prop.patternErrorMessage || nls.localize('validations.regex', "Value must match regex `{0}`.", prop.pattern)
            },
        ].filter(validation => validation.enabled);
    }
    function getNumericValidators(prop) {
        const type = Array.isArray(prop.type) ? prop.type : [prop.type];
        const isNullable = canBeType(type, 'null');
        const isIntegral = (canBeType(type, 'integer')) && (type.length === 1 || type.length === 2 && isNullable);
        const isNumeric = canBeType(type, 'number', 'integer') && (type.length === 1 || type.length === 2 && isNullable);
        if (!isNumeric) {
            return [];
        }
        let exclusiveMax;
        let exclusiveMin;
        if (typeof prop.exclusiveMaximum === 'boolean') {
            exclusiveMax = prop.exclusiveMaximum ? prop.maximum : undefined;
        }
        else {
            exclusiveMax = prop.exclusiveMaximum;
        }
        if (typeof prop.exclusiveMinimum === 'boolean') {
            exclusiveMin = prop.exclusiveMinimum ? prop.minimum : undefined;
        }
        else {
            exclusiveMin = prop.exclusiveMinimum;
        }
        return [
            {
                enabled: exclusiveMax !== undefined && (prop.maximum === undefined || exclusiveMax <= prop.maximum),
                isValid: ((value) => value < exclusiveMax),
                message: nls.localize('validations.exclusiveMax', "Value must be strictly less than {0}.", exclusiveMax)
            },
            {
                enabled: exclusiveMin !== undefined && (prop.minimum === undefined || exclusiveMin >= prop.minimum),
                isValid: ((value) => value > exclusiveMin),
                message: nls.localize('validations.exclusiveMin', "Value must be strictly greater than {0}.", exclusiveMin)
            },
            {
                enabled: prop.maximum !== undefined && (exclusiveMax === undefined || exclusiveMax > prop.maximum),
                isValid: ((value) => value <= prop.maximum),
                message: nls.localize('validations.max', "Value must be less than or equal to {0}.", prop.maximum)
            },
            {
                enabled: prop.minimum !== undefined && (exclusiveMin === undefined || exclusiveMin < prop.minimum),
                isValid: ((value) => value >= prop.minimum),
                message: nls.localize('validations.min', "Value must be greater than or equal to {0}.", prop.minimum)
            },
            {
                enabled: prop.multipleOf !== undefined,
                isValid: ((value) => value % prop.multipleOf === 0),
                message: nls.localize('validations.multipleOf', "Value must be a multiple of {0}.", prop.multipleOf)
            },
            {
                enabled: isIntegral,
                isValid: ((value) => value % 1 === 0),
                message: nls.localize('validations.expectedInteger', "Value must be an integer.")
            },
        ].filter(validation => validation.enabled);
    }
    function getArrayOfStringValidator(prop) {
        if (prop.type === 'array' && prop.items && !types_1.isArray(prop.items) && prop.items.type === 'string') {
            const propItems = prop.items;
            if (propItems && !types_1.isArray(propItems) && propItems.type === 'string') {
                const withQuotes = (s) => `'` + s + `'`;
                return value => {
                    if (!value) {
                        return null;
                    }
                    let message = '';
                    const stringArrayValue = value;
                    if (prop.uniqueItems) {
                        if (new Set(stringArrayValue).size < stringArrayValue.length) {
                            message += nls.localize('validations.stringArrayUniqueItems', 'Array has duplicate items');
                            message += '\n';
                        }
                    }
                    if (prop.minItems && stringArrayValue.length < prop.minItems) {
                        message += nls.localize('validations.stringArrayMinItem', 'Array must have at least {0} items', prop.minItems);
                        message += '\n';
                    }
                    if (prop.maxItems && stringArrayValue.length > prop.maxItems) {
                        message += nls.localize('validations.stringArrayMaxItem', 'Array must have at most {0} items', prop.maxItems);
                        message += '\n';
                    }
                    if (typeof propItems.pattern === 'string') {
                        const patternRegex = new RegExp(propItems.pattern);
                        stringArrayValue.forEach(v => {
                            if (!patternRegex.test(v)) {
                                message +=
                                    propItems.patternErrorMessage ||
                                        nls.localize('validations.stringArrayItemPattern', 'Value {0} must match regex {1}.', withQuotes(v), withQuotes(propItems.pattern));
                            }
                        });
                    }
                    const propItemsEnum = propItems.enum;
                    if (propItemsEnum) {
                        stringArrayValue.forEach(v => {
                            if (propItemsEnum.indexOf(v) === -1) {
                                message += nls.localize('validations.stringArrayItemEnum', 'Value {0} is not one of {1}', withQuotes(v), '[' + propItemsEnum.map(withQuotes).join(', ') + ']');
                                message += '\n';
                            }
                        });
                    }
                    return message;
                };
            }
        }
        return null;
    }
});
//# __sourceMappingURL=preferencesValidation.js.map