var Montage = require("montage").Montage,
    Context = require("mousse/deserialization/context").Context;

exports.ReelContext = Montage.create(Context.prototype, {
    create: {
        value: function() {
            return Montage.create(this);
        }
    },

    init: {
        value: function(serialization, reviver) {
            Context.call(this, serialization, reviver);

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

                    //TODO ignoring rejected promises is suspicious...
                    if (object.then) {
                        throw new Error("Cannot resolve external reference for label '" + label + "'");
                    } else {
                        results.push(object);
                    }
                }
            }

            return results;
        }
    }
});
