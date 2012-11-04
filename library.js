// The SK80 mixin micro-library. Adds 2 properties to an object.
//
//      Properties:
//          this.create (Function)      Creates an object based on another. Can
//                                      also fire the object's "init" method and
//                                      add mixins.
//          this.mixins (Object)        An object to contain the mixins methods.
//              this.mixins.add()           Adds a mixin.
//              this.mixins.get()           Retrieves a mixin.
//              this.mixins.list()          Lists all the current mixins.
//
// It can be used in any of three ways.
//
//      To add these properties to your own namespace:
//          SK80.call(MYNAMESPACE);
//      To contain these properties within the SK80 namespace:
//          SK80.call(SK80);
//      To create a new object with these properties:
//          var myObject = new SK80();    
//
// The SK80.namespace has another property "version" which contains information
// about the current version of this micro-library. This property is not added
// to another namespace.
var SK80 = (function () {

    'use strict';

    var sk80,
        version = '0.5b',
        toString = Object.prototype.toString,
        reserved = ['arguments', 'break', 'case', 'catch', 'class', 'const',
            'continue', 'debugger', 'default', 'do', 'else', 'enum', 'extends',
            'false', 'finally', 'for', 'function', 'if', 'implements', 'import',
            'in', 'instanceof', 'interface', 'let', 'new', 'null', 'package',
            'private', 'protected', 'public', 'return', 'super', 'static',
            'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
            'while', 'with', 'yield'],
        instances = [],
        mixins = [];

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

            if (settings !== undefined) {

                if (settings.hasOwnProperty('mixins')) {
                    if (!Array.isArray(settings.mixins)) {
                        throw new TypeError('SK80.create mixins must be an ' +
                            'Array');
                    }
                    settings.mixins.forEach(function (mixin) {
                        if (!isString(mixin)) {
                            throw new TypeError('SK80.create settings.mixins ' +
                                'must be an Array of Strings');
                        }
                        if (!store.hasOwnProperty(mixin)) {
                            throw new ReferenceError('SK80.create "' + mixin +
                                '" mixin cannot be found');
                        }
                        if (!isFunction(store[mixin])) {
                            throw new TypeError('SK80.create "' + mixin +
                                '" mixin is not a Function');
                        }
                        store[mixin].call(created);
                    });
                }

                if (settings.hasOwnProperty('args')
                        && isFunction(created.init)) {
                    if (!Array.isArray(settings.args)) {
                        throw new TypeError('SK80.create settings.args must ' +
                            'be an Array');
                    }
                    created.init.apply(created, settings.args);
                }
            }

            return created;

        };

// The mixins are part of the core functionality of this micro library. This
// Object contains two methods, one for adding a mixin and the other for
// retreiving a mixin. The mixins themselves are not publically accessible to
// preserve the data.
        that.mixins = {

// Adds a mixin for this instance. This function checks to ensure that the mixin
// name is a String, the mixin is a Function, a mixin with the same name doesn't
// already exist, the name isn't a reserves word in JavaScript and that the
// mixin will add properties to an Object when called. If any of these checks
// fail, an error is thrown.
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
                    throw new TypeError('SK80.mixins.add name argument must ' +
                        'be a String');
                }

                if (!isFunction(mixin)) {
                    throw new TypeError('SK80.mixins.add mixin argument must ' +
                        'be a Function');
                }

                if (mixins.hasOwnProperty(name)) {
                    throw new Error('SK80.mixins.add "' + name + '" mixin ' +
                        'has already been defined');
                }

                if (reserved.indexOf(name) > -1) {
                    throw new SyntaxError('SK80.mixins.add "' + name + '" is ' +
                        'a reserved word in JavaScript');
                }

                mixin.call(test);
                if (Object.keys(test).length === 0) {
                    throw new Error('SK80.mixins.add "' + name + '" mixin ' +
                        'does not add any new properties to an object');
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
            
                var mixins = getMixins(that);

                if (!isString(name)) {
                    throw new TypeError('SK80.mixins.exec name argument must ' +
                        'be a String');
                }
                if (!mixins.hasOwnProperty(name)) {
                    throw new TypeError('SK80.mixins.exec "' + name + '" ' +
                        'mixin does not exist');
                }
                if (!isFunction(mixins[name])) {
                    throw new TypeError('SK80.mixins.exec "' + name + '" ' +
                        'mixin must be a Function');
                }
                if (args !== undefined && !Array.isArray(args)) {
                    throw new TypeError('SK80.mixins.exec if provided, args ' +
                        'argument must be an Array');
                }

                return new Function.prototype.bind.apply(mixins[name], args);
                
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