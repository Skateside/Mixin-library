# The SK80 Mixin Micro-library

## Contents

1. [Intro](#intro)
2. [Setting up the library](#setting-up-the-library)
3. [`SK80.create`](#sk80createparentobject-settings-returns-object)
    1. [Cloning an object](#cloning-an-object)
    2. [Bolting on mixins](#bolting-on-mixins)
    3. [Initialising a new object](#initialising-the-new-object)
    4. [Bolting on mixins and initialising the object](#bolting-on-mixins-and-initialising-the-object)
4. [`SK80.enhance`](#sk80enhanceparentobject-enhancements-settings-returns-object)
    1. [Enhancing an object](#enhancing-an-object)
    2. [Finding the parent](#finding-the-parent)
5. [SK80.mixins](#sk80mixins)
    1. [How mixins look for SK80](#how-mixins-look-for-sk80)
    2. [`SK80.mixins.add`](#sk80mixinsaddname-mixin)
    3. [`SK80.mixins.exec`](#sk80mixinsexecname--args-returns-instance-of-name-mixin)
    4. [`SK80.mixins.list`](#sk80mixinslist-returns-array)
6. [Change log](#change-log)

## <a id="sk80-intro"></a>Intro

This micro-library is designed to help with object-oriented JavaScript and make it easier to work with mixins. Using this technique it's failry straight forward to abstract out another JavaScript library so it may be changed without affecting the application (blog post explaining how to do this is pending).

This micro-library adds 3 properties to an existing object:

*   `SK80.create()` - allows an object to be created from another, also enables the mixins to be added and can be used to trigger an `init` method.
*   `SK80.enhance()` - can add new properties to an existing object.
*   `SK80.mixins` - a object containing methods to manage the mixins.

The library also has another property, `SK80.version`, that is not added to the new object - this property identifies the current version of the library using the following notation:

    majorVersion.minorVersion[.bugFix][a|b]

The bugFix extension is optional, as is the "a" or "b" at the end. A few examples are:

*   0.4b (4th minor version of version 0, beta)
*   1.0.18 (18th bug fix of version 1.0, public release)


## <a id="sk80-setup"></a>Setting up the library

Out-of-the-box the library is bound to the SK80 namespace. It is possible to bind the library to an existing namespace by using the following code:
```js
SK80.call(MYNAMESPACE);
```

It is also possible to bing the library to an entirely new variable:
```js
var myObject = new SK80();
```


## <a id="sk80-create"></a>`SK80.create(parentObject [,settings])` (returns `Object`)

The core method of the micro-library. It's responsible for creating new objects based on previous ones. It can also add mixins and automatically execute an `init` method.

### <a id="sk80-cloning"></a>Cloning an object

Creating a new object from another one is the main function of `SK80.create()`. Without a second argument, this methods works identically to `Object.create()`:

```js
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
```

The link is live so any changes to the old object are reflected in the new one.

```js
foo.newbie = 'new';
bar.newbie; // "new"
```

### <a id="sk80-bolting"></a>Bolting on mixins

To bolt one or more mixins onto the newly created object, pass in an object as the second argument of `SK80.create()` with a `mixins` property. The property should be an array of strings listing all the mixins to be added to the object. The `mixins` property should be an own property, i.e., it should not be a property that the object has inherited.

```js
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
```

Adding a mixin will overwrite any properties with the same name, no checking is currently done to prevent this. An error is thrown if the mixin is not found and be aware that mixins are case-sensitive.

### <a id="sk80-init"></a>Initialising the new object

It is often useful to have a constructor function for an object; this is particularly hand for creating arrays or strings unique to the object and not inherited. The `SK80.create()` method will treat an `init` method as the constructor if the second argument has an `args` property. The `args` property should be an array of the arguments to pass to the `init` method and, like `mixins`, should be an own property.

```js
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
```

It is probably obvious, but if the `args` property is an empty array, the `init` method will be executed without any arguments being passed in.

If the new object does not have an `init` method, it will not be initialised even if the `args` property exists. This does not throw any errors.

### <a id="sk80-boltinit"></a>Bolting on mixins and initialising the object

The second argument of `SK80.create()` may have both the `mixins` and `args` properties, allowing the object to be initialised and have mixin bolted on. The order that the properties appear in the object is not important - mixins will always be bolted on before the object is initialised.

```js
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
```

## <a id="sk80-enhance"></a>`SK80.enhance(parentObject, enhancements [,settings])` (returns `Object`)

Enhancing an object allows new object to be created from existing ones without affecting that existing object. The new object will have all the properties of the old one as well as any new ones that were added at this stage. Any objects will be combined. A new `$proto` property is also added as a reference to the parent object.

### <a id="sk80-enhancing"></a>Enhancing an object

To enhance an object, simply pass it to `SK80.enhance()` with some enhancements:

```js
var foo = SK80.create({
    init: function (elem) {
        this.element = elem;
        this.draw();
    },
    draw: function () {
        this.addClass('SK80ified');
    }
}, {
    mixins: ['Classes']
});

var bar = SK80.enhance(foo, {

    // This new init method works in place of the parent's one.
    init: function (elem) {
        foo.init.call(this, elem);
        this.drawMore();
    },
    
    // No need to bold the mixins on again, they're inherited from the parent.
    drawMore: function () {
        this.addClass('GnarlySK80ified');
    }
});

console.log(typeof bar.draw); // "function" <- parent's properties are inherited.
console.log(typeof foo.drawMore); // "undefined" <- parent is unchanged.
```

Any plain objects that are found are combined rather than replaced. This allows things like class names to be created in the parent, augmented in the child and still accessible.

```js
var foo = SK80.create({
    constants: {
        NAME:     'foo',
        CSS_SK80: 'SK80ified'
    },
    init: function (elem) {
        this.element = elem;
        this.draw();
    },
    draw: function () {
        this.addClass(this.constants.CSS_SK80);
    }
}, {
    mixins: ['Classes']
});

var bar = SK80.enhance(foo, {

    constants: {
        NAME:       'bar',
        CSS_GNARLY: 'GnarlySK80ified'
    },

    // This new init method works in place of the parent's one.
    init: function (elem) {
        foo.init.call(this, elem);
        this.drawMore();
    },
    
    // No need to bold the mixins on again, they're inherited from the parent.
    drawMore: function () {
        this.addClass(this.constants.CSS_GNARLY);
    }
});

foo.constants; // {NAME: 'foo', CSS_SK80: 'SK80ified'}
bar.constants; // {NAME: 'bar', CSS_SK80: 'SK80ified', CSS_GNARLY: 'GnarlySK80ified'}
```

If a third argument it passed to `SK80.enhance()`, it is treated the same as the `settings` argument of `SK80.create()`.

```js
var bar = SK80.enhance(foo, {
    init: function (elem) {
        foo.init.call(this, elem);
        this.drawMore();
    },
    drawMore: function () {
        this.addClass('GnarlySK80ified');
    }
}, {
    args: [document.getElementById('myElementId')]
});

// The "myElementId" element will now have the "SK80ified" and "GnarlySK80ified"
// classes added to it.
```

### <a id="sk80-finding"></a>Finding the parent

As you may have noticed, the `bar` example was tightly coupled to `foo`. Often this is undesirable and a general link to the parent would be more useful. For these times, `SK80.enhance()` adds a static `$proto` property which is a link to the parent.

```js
// A less tightly coupled version of the "bar" example.
var bar = SK80.enhance(foo, {

    // bar.$proto is a link to the parent.
    init: function (elem) {
        bar.$proto.init.call(this, elem);
        this.drawMore();
    },
    drawMore: function () {
        this.addClass('GnarlySK80ified');
    }
});
```

Try to avoid using `this.$proto` as the instance will be continuously updated and may not refer to the object you expect.

## <a id="sk80-mixins"></a>SK80.mixins

Mixins are objects whose properties can be added to another object. They allow a developer to create functionality once and have it added to any number of objects.

### <a id="sk80-look"></a>How mixins look for SK80

Whereas some libraries insist that mixins should be objects, SK80 insists that they should be functions that manipulate `this`. This is based on Angus Croll's [fresh look at JavaScript mixins](http://javascriptweblog.wordpress.com/2011/05/31/a-fresh-look-at-javascript-mixins/). Here is an example of the "Classes" mixin that was used in the previous examples:

```js
var ClassesMixin = function () {
    this.addClass = function (elem, className) {
        if (className === undefined) {
            className = elem;
            elem = this.element;
        }
        elem.classList.add(className);
    };
};
```

The function will be called with the new object as the context, so adding properties to `this` will add them to the new object.

An advantage of this style is the ability to re-use the mixins as stand-alone functionality. As a result, I tend to name all my  mixins with a leading capital, but that is not a requirement. The following piece of code will create an object that allows the developer to add a class to any element:

```js
var classTweaker = new ClassesMixin();
classTweaker.addClass(document.getElementById('myElementId'), 'SK80ified');
```

If you prefer to use anonymous functions rather than variables like this example, mixins may be retrieves using `SK80.mixins.get()`.

When a mixin is added to the object by `SK80.create()`, no arguments are passed to the function. This may be useful to identify whether the mixin has been added using `SK80.create()` or executed as above.

### <a id="sk80-add"></a>`SK80.mixins.add(name, mixin)`

This method allows mixins to be created. The mixins are stored privately but are accessible using `SK80.mixins.get()`. A lot of validation checks are done at this stage, including checking that the mixin will add properties to an object. Be aware that the only way to do that is to execute the mixin function.

Here is an example of adding the "Classes" mixin:

```js
SK80.mixins.add('Classes', ClassesMixin);

// Or, if you prefer to use anonymous functions:
SK80.mixins.add('Classes', function () {
    this.addClass = function (elem, className) {
        if (className === undefined) {
            className = elem;
            elem = this.element;
        }
        elem.classList.add(className);
    };
});
```

The "Classes" mixin may now be bolted onto any object using `SK80.create()` or executed as described in the next section.

### <a id="sk80-exec"></a>`SK80.mixins.exec(name [, args])` (returns instance of `name` mixin)

The mixins are stored privately to protect the data. However, fans of anonymous functions may wish to use the re-use example higher up. The `SK80.mixins.exec()` method allow the mixin to be executed and arguments to be passed to it.

The following piece of code will execute the "Classes" mixin.

```js
var classTweaker = SK80.mixins.exec('Classes');
classTweaker.addClass(document.getElementById('myElementId'), 'SK80ified');
```

To pass arguments to the mixin as it's executed, pass an `Array` to `SK80.mixins.exec` as the second argument.

```js
// A mixin that traverses the DOM.
SK80.mixins.add('Tree', function (baseElement) {
    this.find = function (element, selector) {
        if (selector === undefined) {
            selector = element;
            element = baseElement || this.element;
        }
        return Array.prototype.slice.call(element.querySelectorAll(selector));
    }
});

var tree = SK80.mixins.exec('Tree', [document.body]);
tree.find('div'); // Finds all <div> elements on the page.
```

No arguments are passed to the mixin as it is bolted onto an object using `SK80.create()`, therefore the `baseElement` variable would always be `undefined` when bolted onto an object but have a value when executed as above.

### <a id="sk80-list"></a>`SK80.mixins.list()` (returns `Array`)

As the mixins are stores privately, it may be useful to know which mixins have been registered. `SK80.mixins.list()` will reveal all the registered mixins in the form of an array of strings containing all the names of the mixins.

Here is an example of the list, assuming that the "Classes" and "Tree" mixins have been added as above.

```js
var list = SK80.mixins.list();
list; // ['Classes', 'Tree']
```

Manipulating this list has no effect on the mixins themselves and `SK80.mixins.list()` will always return a fresh list.

## <a id="sk80-changelog"></a>Change log

**0.6.1b** (25 November 2012)
*   Allowed `SK80.mixins.add()` to replace existing mixins.
*   Removed reserved word checking from `SK80.mixins.add()`.
*   Improved `SK80.enhance()` so it will combine plain objects rather than replacing them.
*   Updated coding style to make it more maintainable and customisable, removed unnecessary checks and errors.
*   Updated comments to reflect changes forgotten in previous version.

**0.6b** (14th November 2012)
*   Added `SK80.enhance()`

**0.5b** (4th October 2012)
*   Added `SK80.mixins.exec()`
*   Removed `SK80.mixins.get()` - use `SK80.mixins.exec()` instead.

