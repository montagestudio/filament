var WeakMap = require("montage/collections/weak-map");
var Set = require("montage/collections/set");

function equals(a, b) {
    return a && b && a[0] === b[0] && a[1] === b[1];
}

function hash(object) {
    return object[0].uuid + object[1];
}

/**
 * Stores a list of objects that reference the key object, and the property
 * under which they reference it.
 *
 * When `get` is called with an object that hasn't been seen before then a new
 * set is created to store the references.
 *
 * @example
 * var references = new ObjectReferences();
 * var a = {};
 * var b = { x: a };
 * references.add(a, b, "x");
 *
 * references.forEach(a, function (object, property) {
 *     console.log(object, property, "references", a);
 * });
 *
 * delete b.x;
 * references.delete(a, b, "x");
 */
exports.ObjectReferences = ObjectReferences;
function ObjectReferences() {
    this.map = new WeakMap();
}

ObjectReferences.prototype.get = function(referencedObject) {
    var value = this.map.get(referencedObject);

    if (!value) {
        value = Set(void 0, equals, hash);
        this.map.set(referencedObject, value);
    }

    return value;
};

ObjectReferences.prototype.add = function (referencedObject, object, property) {
    var set = this.get(referencedObject);
    return set.add([object, property]);
};

ObjectReferences.prototype.delete = function (referencedObject, object, property) {
    var set = this.get(referencedObject);
    return set.delete([object, property]);
};

ObjectReferences.prototype.forEach = function (referencedObject, callback, thisArg) {
    this.get(referencedObject).forEach(function (objectAndProperty) {
        callback.call(this, objectAndProperty[0], objectAndProperty[1]);
    }, thisArg);
};
