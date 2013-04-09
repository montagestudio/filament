var Montage = require("montage").Montage,
    Context = require("mousse/deserialization/context").Context;

exports.ReelContext = Montage.create(Context.prototype, {
    create: {
        value: function() {
            return Montage.create(this);
        }
    },

    init: {
        value: function(serialization, reviver, objects) {
            Context.call(this, serialization, reviver, objects);

            return this;
        }
    },

    editingDocument: {
        value: null
    },

    ownerExportId: {
        get: function () {
            return this._reviver.parseObjectLocationId(this.editingDocument.url).moduleId;
        }
    },

    getElementById: {
        value: function(id) {
            return this.editingDocument.htmlDocument.querySelector("[data-montage-id='" + id + "']");
        }
    },

    getObjects: {
        value: function() {
            var results = [],
                serialization = this._serialization,
                object;

            for (var label in serialization) {
                if (serialization.hasOwnProperty(label)) {
                    object = this.getObject(label);
                    results.push(object);
                }
            }

            return results;
        }
    },

    getObject: {
        value: function(label) {
            var serialization = this._serialization,
                reviver = this._reviver,
                objects = this._objects,
                object;

            if (label in objects) {
                return objects[label];
            } else if (label in serialization) {
                object = reviver.reviveRootObject(serialization[label], this, label);
                // If no object has been set by the reviver we safe its
                // return, it could be a value or a promise, we need to
                // make sure the object won't be revived twice.
                if (!(label in objects)) {
                    objects[label] = object;
                }

                return object;
            } else {
                throw new Error("Object with label '" + label + "' was not found.");
            }
        }
    }
});
