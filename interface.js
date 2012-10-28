// An example of an object that is designed to work with SK80.create(). This
// object allows for the creation and checking of interfaces. When checking the
// interfaces match, it will throw errors if object does not match the interface
// and return true if it does.
//
// Here is an example of an interface. Here we define an interface called "foo"
// which should have a "resize" method and an "element" property that should be
// an HTMLElement.
//
//      var fooInterface = SK80.create(SK80.inter, {
//          args: ['foo', {
//              resize: 'function',
//              element: 'htmlelement'
//          }]
//      });
//
// Here is an example of checking an object to see if it matches the
// fooInterface.
//
//      if (fooInterface.matches(foo)) {
//          execute(foo);
//      }
//
// Since the matches method will throw errors if the object does not match the
// interface, the if statement is not needed; personally, I think it reads
// better with the if statement.
SK80.inter = (function () {

    'use strict';

    var toString = Object.prototype.toString;

// Checks to ensure that a given object is a String.
//
//      Takes:
//          object (Mixed)      The object to check.
//      Returns:
//          (Boolean)           true if a String, false otherwise.
    function isString(o) {
        return toString.call(o) === '[object String]';
    }

// Works out the type of a given object, based on the object's [[Class]]. The
// function fixes a few browser quirks with undefined and null, it also reduces
// the [[Class]] of all DOM nodes to "htmlelement". Returned strings are always
// lowercase.
//
//      Takes:
//          object (Object)     The object to analyse.
//      Returns:
//          (String)            The [[Class]] of the object, always lower case
//                              and DOM nodes are always "htmlelement".
    function getClass(object) {

        var string;

        if (object === undefined) {
            string = 'undefined';
        } else if (object === null) {
            string = 'null';
        } else if (getClass(object.nodeName) === 'string'
                && getClass(object.nodeType) === 'number') {
            string = 'htmlelement';
        } else {
            string = toString.call(object);
            string = string.substr(8);
            string = string.substr(0, string.length - 1).toLowerCase();
        }

        return string;

    }


// Checks that a property exists somewhere in the prototype chain of a given
// object and that the value is undefined. This function exists because
// hasOwnProperty only works on the own properties, not the inherited ones and
// to simply check that o[prop] === undefined will return true if prop doesn't
// exist. We need to know that it does and has the value undefined.
//
//      Takes:
//          object (Object)     The object to check for the property.
//          prop (String)       The property name to check.
//      Returns:
//          (Boolean)           true if the property exists, false otherwise.
    function checkUndefined(object, prop) {

        var proto = object,
            prev = object,
            hasProp = false;

        do {
// Walk up the prototype chain. To prevent an infinite loop from occuring if
// object is an HTMLElement, break the loop if proto and prev are the same.
            proto = Object.getPrototypeOf(prev);
            if (proto === prev || proto === null) {
                break;
            }
            if (proto.hasOwnProperty(prop) && proto[prop] === undefined) {
                hasProp = true;
                break;
            }
            prev = proto;
        } while (proto);

        return hasProp;

    }

// Allows us to define interfaces. The given object must contain the stored
// methods; Errors are thrown if it does not match.
    return {

// Creates the interface by defining a name and the methods it requires.
//
//      Takes:
//          name (String)           The name of the interface.
//          properties (Object)     The properties of the interface and their
//                                  types in key/value pairs.
        init: function (name, properties) {

            var prop;

            if (!isString(name)) {
                throw {
                    name: 'TypeError',
                    message: 'SK80.inter name arguments must be a String'
                };
            }
            this.name = name;

            for (prop in properties) {
                if (properties.hasOwnProperty(prop)) {
                    if (!isString(prop)) {
                        throw {
                            name: 'TypeError',
                            message: 'SK80.inter properties argument can ' +
                                'only contain Strings, ' + (typeof prop) +
                                ' given'
                        };
                    }
                    properties[prop] = properties[prop].toLowerCase();
                }
            }
            this.properties = properties;

        },

// Checks to ensure that a given object implements this interface. This function
// throws Errors if a mis-match is detected. Since "implements" is a reserved
// word in JavaScript, we use "matches" instead.
//
//      Takes:
//          object (Object)     The object that should implement this interface.
//      Returns:
//          (Boolean)           true if the object implements this interface.
        matches: function (object) {

            var prop,
                gotten,
                current;

            if (!this.name || !this.properties) {
                throw {
                    name: 'InitError',
                    message: 'SK80.inter.matches called on a non-initialised ' +
                        'interface'
                };
            }

            for (prop in this.properties) {
                if (this.properties.hasOwnProperty(prop)) {
                    gotten = getClass(object[prop]);
                    current = this.properties[prop];
                    if (current === 'undefined' &&
                            !checkUndefined(object, prop)) {
                        gotten = 'missing';
                    }
                    if (gotten !== current) {
                        throw {
                            name: 'ValidationError',
                            message: 'Object does not match the "' +
                                this.name + '" interface: "' + prop + '" ' +
                                'property is ' + gotten + ', should be ' +
                                current
                        };
                    }
                }
            }

            return true;

        }
    };

}());