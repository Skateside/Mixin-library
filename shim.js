// These shims patch methods that the SK80 micro-library uses. References to the
// ES5 spec have been included to ensure that the shims are as close to
// standards as possible.
// A lot of these shims are based on the ES5-shim by kriskowal:
// https://github.com/kriskowal/es5-shim/blob/master/es5-shim.js
(function () {

    'use strict';

    var isStringArray = 'a'[0] === 'a',
        objProto = Object.prototype,
        toString = objProto.toString,
        hasDontEnumBug = true,
        dontEnums = [
            'constructor', 'hasOwnProperty', 'isPrototypeOf',
            'propertyIsEnumerable', 'toString', 'toLocaleString', 'valueOf'
        ],
        enumKey;

    for (enumKey in {'toString': null}) {
        hasDontEnumBug = false;
    }

// http://es5.github.com/#x9.9
    function toObject(o) {
        if (o === undefined || o === null) {
            throw new TypeError(o + ' is null or not an object');
        }
        if (!isStringArray && toString.call(o) === '[object String]') {
            o = o.split('');
        }
        return Object(o);
    }

// http://es5.github.com/#sign
    function sign(number) {
        return number < 0 ? -1 : 1;
    }

// Used a few times in the specs, always described like this:
// sign(number) * floor(abs(number))
    function makeInt(n) {
        return sign(n) * Math.floor(Math.abs(n));
    }

// http://es5.github.com/#x9.5
    function toUint32(n) {
        var number = +n,
            ret = 0,
            twoPow32 = Math.pow(2, 32);
        if (!isNaN(number) && isFinite(number)) {
            ret = makeInt(number) % twoPow32;
            if (ret >= twoPow32 / 2) {
                ret -= twoPow32;
            }
        }
        return ret;
    }

// http://es5.github.com/#x9.4
    function toInteger(str) {
        var number = Number(str),
            returnValue = number;

        if (isNaN(number)) {
            returnValue = 0;
        } else if (number !== 0 && isFinite(number)) {
            returnValue = makeInt(number);
        }

        return returnValue;
    }

// http://es5.github.com/#x15.4.4.18
    if (!Array.prototype.hasOwnProperty('forEach')) {
        Array.prototype.forEach = function (func, thisArg) {
            var index  = 0,
                array  = toObject(this),
                length = toUint32(array.length);
            if (toString.call(func) !== '[object Function]') {
                throw new TypeError(func + ' is not a function');
            }
            while (index < length) {
                if (objProto.hasOwnProperty.call(array, index)) {
                    func.call(thisArg, array[index], index, array);
                }
                index += 1;
            }
        };
    }

// http://es5.github.com/#x15.4.4.14
    if (!Array.prototype.hasOwnProperty('indexOf')) {
        Array.prototype.indexOf = function (search, offset) {
            var array = toObject(this),
                len   = toUint32(array.length),
                n     = offset === undefined ? 0 : toInteger(offset),
                index = -1;

            if (len > 0 && len > n) {

                if (n < 0) {
                    n = Math.max(0, len - Math.abs(n));
                }
                while (n < len) {
                    if (objProto.hasOwnProperty.call(array, index) &&
                            array[n] === search) {
                        index = n;
                        break;
                    }
                    n += 1;
                }

            }

            return index;
        };
    }

// http://es5.github.com/#x15.4.3.2
    if (!Array.hasOwnProperty('isArray')) {
        Array.isArray = function (o) {
            return toString.call(o) === '[object Array]';
        };
    }

// http://es5.github.com/#x15.2.3.5
    if (!Object.hasOwnProperty('create')) {
        Object.create = function (proto, properties) {
            var object,
                F = function () {};

            if (proto === null) {
                object = {'__proto__': null};
            } else {
                if (typeof proto !== 'object') {
                    throw new TypeError('typeof prototype[' + (typeof proto) +
                        '] ' + 'must be an object');
                }
                F.prototype = proto;
                object = new F();
                object.__proto__ = proto;
            }

            if (properties !== undefined) {
                throw new Error('The second arguments of Object.create() is ' +
                    'not supported in this browser');
            }

            return object;

        };
    }

// http://es5.github.com/#x15.2.3.2
    if (!Object.hasOwnProperty('getPrototypeOf')) {
        Object.getPrototypeOf = function (object) {
            return object.__proto__ || (
                object.constructor ?
                    object.constructor.prototpe :
                    Object.prototype
            );
        };
    }

// http://es5.github.com/#x15.2.3.14
    if (!Object.hasOwnProperty('keys')) {
        Object.keys = function (object) {
            var keys = [],
                name,
                hasOwn = Object.prototype.hasOwnProperty;
            if ((typeof object !== 'object' && typeof object !== 'function') ||
                    object === null) {
                throw new TypeError('Object.keys called on a non-object');
            }
            for (name in object) {
                if (hasOwn.call(object, name)) {
                    keys.push(name);
                }
            }
            if (hasDontEnumBug) {
                dontEnums.forEach(function (dontEnum) {
                    if (hasOwn.call(object, dontEnum)) {
                        keys.push(dontEnum);
                    }
                });
            }
            return keys;
        };
    }

}());