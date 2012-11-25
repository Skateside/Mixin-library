// The SK80 mixin micro-library. Adds 3 properties to an object.
//
//      Properties:
//          this.create (Function)      Creates an object based on another. Can
//                                      also fire the object's "init" method and
//                                      add mixins.
//          this.enhance (Function)     Adds properties of one object to
//                                      another.
//          this.mixins (Object)        An object to contain the mixins methods.
//              this.mixins.add()           Adds a mixin.
//              this.mixins.get()           Retrieves a mixin.
//              this.mixins.list()          Lists all the current mixins.
//
// It can be used in any of three ways.
//
//      The properties are already attached to the SK80 namespace.
//      To add these properties to your own namespace:
//          SK80.call(MYNAMESPACE);
//      To create a new object with these properties:
//          var myObject = new SK80();    
//
// The SK80.namespace has another property "version" which contains information
// about the current version of this micro-library. This property is not added
// to another namespace.
var SK80 = (function () {

    'use strict';

    var constants = {

            ERR_NOTARRAY:          'SK80.%s %s argument must be an Array',
            ERR_NOTFUNC:           'SK80.%s %s argument must be an Function',
            ERR_NOTSTRING:         'SK80.%s %s argument must be a String',
            ERR_MIXINNOTFOUND:     'SK80.%s "%s" mixin cannot be found'
            ERR_CREATENOTARROFSTR: 'SK80.create settings.mixins must be an ' +
                'Array of Strings',
            ERR_CREATENOTFUNC:     'SK80.create "%s" mixin is not a Function',
            ERR_ADDNOPROPS:        'SK80.mixins.add "%s" mixin does not add ' +
                'any new properties to an object',
            ERR_EXECARGSNOTARR:    'SK80.mixins.exec if provided, args ' +
                'argument must be an Array',

            PROP_PROTO: '$proto'

        },

        sk80,
        version  = '0.6.1b',

        toString = Object.prototype.toString,
        hasOwn   = Object.prototype.hasOwnProperty,

        instances = [],
        mixins    = [],

        undef; // = undefined

// Checks to ensure that a given object is a String.
//
//      Takes:
//          object (Mixed)      The object to check.
//      Returns:
//          (Boolean)           true if a String, false otherwise.
    function isString(object) {
        return toString.call(object) === '[object String]';
    }

// Checks to ensure that a given object is a Function.
//
//      Takes:
//          object (Mixed)      The object to check.
//      Returns:
//          (Boolean)           true if a Function, false otherwise.
    function isFunction(object) {
        return toString.call(object) === '[object Function]';
    }

// Works out whether a given object is the global window object.
// Based on jQuery.isWindow http://code.jquery.com/jquery-1.8.3.js
//
//      Takes:
//          object (Mixed)      The object to test.
//      Returns:
//          (Boolean)           true if the object is window, false otherwise.
    function isWindow(object) {
        return object !== null && object !== undef && object === object.window;
    }

// Checks an object to see if it's a plain object, rather than something like a
// DOM node or window.
// Based on jQuery.isPlainObject http://code.jquery.com/jquery-1.8.3.js
//
//      Takes:
//          object (Mixed)      The object to test.
//      Returns:
//          (Boolean)           true if the object is a plain object, false
//                              otherwise.
    function isPlainObject(object) {

        var isPlain = false,
            key;

        if (object && typeof object === 'object' && !Array.isArray(object) &&
                !object.nodeType && !isWindow(object)) {
            for (key in object) {
            }
            isPlain = key === undef || hasOwn.call(object, key);
        }

        return isPlain;

    }

// Inserts new strings into a given string replacing "%s" placeholders.
//
//      Takes:
//          str (String)        The original string.
//          ...args (String)    An string to insert into the original string.
//      Returns:
//          (String)            The formatted string.
    function sprintf(str) {

        var args = Array.prototype.slice.call(arguments, 1),
            i = 0,
            il = args.length;
        
        while (i < il) {
            str = str.replace('%s', args[i]);
            i += 1;
        }
        
        return str;

    }

// Enhances source by going through the properties of extra and adding them to
// source. If the property of source and extra are both plain objects, those
// objects are also enhanced. It ignores the $proto property since that is
// replaced in sk80.enhance
//
//      Takes:
//          source (Object)     The source object that should be enhanced.
//          extras (Object)     Object with properties that should be added to
//                              source.
//      Returns:
//          (Object)            The enhanced source.
    function enhance(source, extras) {

        var prop;

        for (prop in extras) {
            if (extras.hasOwnProperty(prop)) {
                if (prop !== constants.PROP_PROTO &&
                        isPlainObject(source[prop]) &&
                        isPlainObject(extras[prop])) {
                    source[prop] = enhance(source[prop], extras[prop]);
                } else {
                    source[prop] = extras[prop];
                }
            }
        }

        return source;

    }

// Retrieves the correct mixins Object from the mixins Array for the given
// instance. If the instance has not yet been stored, this function creates the
// entry in the instances and mixins arrays. This allows any number of objects
// to have the SK80 properties added to them.
//
//      Takes:
//          instance (Object)       The Object that the SK80 micro library has
//                                  been bound to.
//      Returns:
//          (Object)                The mixins for the given instance.
    function getMixins(instance) {
        var index = instances.indexOf(instance);
        if (index < 0) {
            index = instances.push(instance) - 1;
            mixins[index] = {};
        }
        return mixins[index];
    }

    sk80 = function () {

        var that = this;

// Creates objects based on the arguments that are given. The object argument is
// the Object from which the new object should be created, the optional settings
// arguments helps define the newly created object.
//
//      Takes:
//          object (Object)         The object from which to create the new
//                                  object.
//          [settings] (Object)     Settings for the newly created object. Has
//                                  two possible keys:
//              mixins (Array)      An Array of Strings, the names of the mixins
//                                  to add to the newly created object.
//              args (Array)        Any arguments to pass to the newly created
//                                  objects "init" method. If the object has no
//                                  "init" method, no action is taken.
//      Returns:
//          (Object)            The newly created object.    
        that.create = function (object, settings) {

            var store = getMixins(that),
                created = Object.create(object);

            if (settings !== undef) {

                if (hasOwn.call(settings, 'mixins')) {
                    if (!Array.isArray(settings.mixins)) {
                        throw new TypeError(
                            sprintf(constants.ERR_NOTARRAY, 'create', 'mixins')
                        );
                    }
                    settings.mixins.forEach(function (mixin) {
                        if (!isString(mixin)) {
                            throw new TypeError(
                                constants.ERR_CREATENOTARROFSTR
                            );
                        }
                        if (!hasOwn.call(store, mixin)) {
                            throw new ReferenceError(
                                sprintf(constants.ERR_MIXINNOTFOUND, 'create',
                                        mixin)
                            );
                        }
                        store[mixin].call(created);
                    });
                }

                if (hasOwn.call(settings, 'args') && isFunction(created.init)) {
                    if (!Array.isArray(settings.args)) {
                        throw new TypeError(
                            sprintf(constants.ERR_NOTARRAY, 'create',
                                    'settings.args')
                        );
                    }
                    created.init.apply(created, settings.args);
                }
            }

            return created;

        };

// Enhances one object with another by copying across properties. The original
// object is untouched and serves as a template rather than the base. If any
// settings are passed in, they are passed to this.create along with the new
// object.
//
//      Takes:
//          object (Object)         The object to enhance.
//          enhancements (Object)   New properties to add to the new object.
//          [settings] (Object)     Extra parameters used to set up the new
//                                  object. Passed directly to this.create.
//      Returns:
//          (Object)                The newly enhanced object.
        that.enhance = function (object, enhancements, settings) {

            var created = Object.create(object);

            enhance(created, enhancements);
            created[constants.PROP_PROTO] = object;

            return settings === undef ? 
                    created :
                    that.create(created, settings);

        };

// The mixins are part of the core functionality of this micro library. This
// Object contains two methods, one for adding a mixin and the other for
// retreiving a mixin. The mixins themselves are not publically accessible to
// preserve the data.
        that.mixins = {

// Adds a mixin for this instance. This function checks to ensure that the mixin
// name is a String, the mixin is a Function and that the mixin will add
// properties to an Object when called. If any of these checks fail, an error is
// thrown.
//
//      Takes:
//          name (String)       The name of the mixin. It should be a valid
//                              Object key.
//          mixin (Function)    The mixin function. The "this" keyword will
//                              point to the Object that this mixin is added to.
            add: function (name, mixin) {

                var test = {},
                    mixins = getMixins(that);

                if (!isString(name)) {
                    throw new TypeError(
                        sprintf(constants.ERR_NOTSTRING, 'mixins.add', 'name')
                    );
                }

                if (!isFunction(mixin)) {
                    throw new TypeError(
                        sprintf(constants.ERR_NOTFUNC, 'mixins.add', 'mixin')
                    );
                }

                mixin.call(test);
                if (Object.keys(test).length === 0) {
                    throw new Error(sprintf(constants.ERR_ADDNOPROPS, name));
                }

                mixins[name] = mixin;
            },

// Executes a given mixin and returns the execution. If args is supplied, it is
// passed to the mixin as the arguments. Based on this Stack Overflow answer:
// http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
//
//      Takes:
//          name (String)       The name of the mixin.
//          [args] (Array)      Any arguments to pass to the mixin.
//      Returns:
//          (instance)          An instance of the mixin with any given
//                              arguments.
            exec: function (name, args) {

                var mixins = getMixins(that),
                    F;

                if (!isString(name)) {
                    throw new TypeError(
                        sprintf(constants.ERR_NOTSTRING, 'mixins.exec', 'name')
                    );
                }
                if (!hasOwn.call(mixins, name)) {
                    throw new TypeError(
                        sprintf(constants.ERR_MIXINNOTFOUND, 'mixins.exec',
                                name)
                    );
                }
                if (args !== undef && !Array.isArray(args)) {
                    throw new TypeError(constants.ERR_EXECARGSNOTARR);
                }

                F = function () {
                    return mixins[name].apply(this, args || []);
                }
                F.prototype = mixins[name].prototype;
                return new F();

            },

// Lists all the mixins associated with this instance. This could be handy for
// debugging but is probably not much use in any other situation.
//
//      Returns:
//          (Array)     All the mixins that have been associated with this
//                      instance, an Array of Strings.
            list: function () {
                return Object.keys(getMixins(that));
            }

        };

    };

    sk80.version = version;
    sk80.call(sk80);

    return sk80;

}());