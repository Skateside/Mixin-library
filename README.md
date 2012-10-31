The SK80 Mixin Micro-library
============================

This micro-library is designed to help with object-oriented JavaScript and make it easier to work with mixins. Using this technique it's failry straight forward to abstract out another JavaScript library so it may be changed without affecting the application (blog post explaining how to do this is pending).

This micro-library adds 2 properties to an existing object:

*   `SK80.create()` - allows an object to be created from another, also enables the mixins to be added and can be used to trigger an `init` method.
*   `SK80.mixins` - a object containing methods to manage the mixins.

The library also has another property, `SK80.version`, that is not added to the new object - this property identifies the current version of the library using the following notation:

    majorVersion.minorVersion[.bugFix][a|b]

The bugFix extension is optional, as is the "a" or "b" at the end. A few examples are:

*   0.4b (4th minor version of version 0, beta)
*   1.0.18 (18th bug fix of version 1.0, public release)


Setting up the library
----------------------

Out-of-the-box, the library is not initialised. To activate it, the library must be added to another object. There are 3 ways to do this:

*   To add the properties to an existing namespace:
    `SK80.call(MYNAMESPACE);`
*   To add the properties to the existing SK80 namespace:
    `SK80.call(SK80);`
*   To add the properties to an entirely new variable:
    `var myObject = new SK80();`

The rest of the examples here assume that the library has been added to its own namespace.

`SK80.create(parentObject [,settings])` (returns `Object`)
----------------------------------------------------------

The core method of the micro-library. It's responsible for creating new objects based on previous ones. It can also add mixins and automatically execute an `init` method.

### Cloning an object

Creating a new object from another one is the main function of `SK80.create()`. Without a second argument, this methods works identically to `Object.create()`:

    var foo = {
        prop: 1,
        meth: function () {
            console.log(this.prop);
        }
    };
    
    var bar = SK80.create(foo);
    
    bar.meth(); // logs 1
    bar.prop = 'hi';
    bar.meth(); // logs "hi"
    foo.meth(); // logs 1

The link is live so any changes to the old object are reflected in the new one.

    foo.newbie = 'new';
    bar.newbie; // "new"

### Bolting on mixins

To bolt one or more mixins onto the newly created object, pass in an object as the second argument of `SK80.create()` with a `mixins` property. The property should be an array of strings listing all the mixins to be added to the object. The `mixins` property should be an own property, i.e., it should not be a property that the object has inherited.

    // Assume there is a "Classes" mixin that contains the property "addClass"
    
    var foo = SK80.create({
        init: function (elem) {
            this.element = elem;
        }
    }, {
        mixins: ['Classes']
    });
    
    foo.init(document.getElementById('myElementId'));
    foo.addClass('SK80ified'); // Adds a class to the "myElementId" element.

Adding a mixin will overwrite any properties with the same name, no checking is currently done to prevent this. An error is thrown if the mixin is not found and be aware that mixins are case-sensitive.

### Initialising the new object

It is often useful to have a constructor function for an object; this is particularly hand for creating arrays or strings unique to the object and not inherited. The `SK80.create()` method will treat an `init` method as the constructor if the second argument has an `args` property. The `args` property should be an array of the arguments to pass to the `init` method and, like `mixins`, should be an own property.

    var foo = SK80.create({
        init: function (str, arr) {
            this.str = str;
            this.arr = arr;
        }
    }, {
        args: ['foo', ['bar', 'baz']]
    });
    
    foo.str; // "foo"
    foo.arr; // ["bar", "baz"]

It is probably obvious, but if the `args` property is an empty array, the `init` method will be executed without any arguments being passed in.

If the new object does not have an `init` method, it will not be initialised even if the `args` property exists. This does not throw any errors.

### Bolting on mixins and initialising the object

The second argument of `SK80.create()` may have both the `mixins` and `args` properties, allowing the object to be initialised and have mixin bolted on. The order that the properties appear in the object is not important - mixins will always be bolted on before the object is initialised.

    var foo = SK80.create({
        init: function (elem) {
            this.element = elem;
            this.addClass('SK80ified'); // This method will exist when the object is
                                        // initialised.
        }
    }, {
        mixins: ['Classes'],
        args: [document.getElementById('myElementId')]
    });
    
    // The "myElementId" element will now have the "SK80ified" class added to it.

SK80.mixins
-----------

Mixins are objects whose properties can be added to another object. They allow a developer to create functionality once and have it added to any number of objects.

### How mixins look for SK80

Whereas some libraries insist that mixins should be objects, SK80 insists that they should be functions that manipulate `this`. This is based on Angus Croll's [fresh look at JavaScript mixins](http://javascriptweblog.wordpress.com/2011/05/31/a-fresh-look-at-javascript-mixins/). Here is an example of the "Classes" mixin that was used in the previous examples:

    var ClassesMixin = function () {
        this.addClass = function (elem, className) {
            if (className === undefined) {
                className = elem;
                elem = this.element;
            }
            elem.classList.add(className);
        };
    };

The function will be called with the new object as the context, so adding properties to `this` will add them to the new object.

An advantage of this style is the ability to re-use the mixins as stand-alone functionality. As a result, I tend to name all my  mixins with a leading capital, but that is not a requirement. The following piece of code will create an object that allows the developer to add a class to any element:

    var classTweaker = new ClassesMixin();
    classTweaker.addClass(document.getElementById('myElementId'), 'SK80ified');

If you prefer to use anonymous functions rather than variables like this example, mixins may be retrieves using `SK80.mixins.get()`.

When a mixin is added to the object by `SK80.create()`, no arguments are passed to the function. This may be useful to identify whether the mixin has been added using `SK80.create()` or executed as above.

### `SK80.mixins.add(name, mixin)`

This method allows mixins to be created. The mixins are stored privately but are accessible using `SK80.mixins.get()`. A lot of validation checks are done at this stage, including checking that the mixin doesn't already exist and that executing it will add properties to an object. Be aware that the only way to do that is to execute the mixin function.

Here is an example of adding the "Classes" mixin:

    SK80.mixins.add('Classes', ClassesMixin);
    
    // Or, if you prefer to use anonymous functions:
    // (Be aware that if the previous line is left in, an error will be thrown
    // because the "Classes" mixin has already been defined)
    SK80.mixins.add('Classes', function () {
        this.addClass = function (elem, className) {
            if (className === undefined) {
                className = elem;
                elem = this.element;
            }
            elem.classList.add(className);
        };
    });

### `SK80.mixins.get(name)` (returns `Function` or `undefined`)

The mixins are stored privately to protect the data. However, fans of anonymous functions may wish to use the re-use example higher up. The `SK80.mixins.get()` method allow the mixin to be retrieved and executed.

The following piece of code will retieve the "Classes" mixin.

    var ClassMixin = SK80.mixins.get('Classes'),
        classTweaker = new ClassMixin();
    classTweaker.addClass(document.getElementById('myElementId'), 'SK80ified');

Be aware that if the mixin is not found, `SK80.mixins.get()` will return `undefined`. This may cause errors if the retreived function is automatically executed without any previous checking.

### `SK80.mixins.list()` (returns `Array`)

As the mixins are stores privately, it may be useful to know which mixins have been registered. `SK80.mixins.list()` will reveal all the registered mixins in the form of an array of strings containing all the names of the mixins.

Here is an example of the list, assuming that the "Classes" mixin has been added as above.

    var list = SK80.mixins.list();
    list; // ['Classes']

Manipulating this list has no effect on the mixins themselves and `SK80.mixins.list()` will always return a fresh list.
