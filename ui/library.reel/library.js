var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    ArrayController = require("montage/ui/controller/array-controller").ArrayController;

exports.Library = Montage.create(Component, {

    prototypes: {
        value: null
    },

    prototypeController: {
        value: null
    },

    didCreate: {
        value: function () {
            this.prototypeController = ArrayController.create();
            Object.defineBinding(this.prototypeController, "content", {
                boundObject: this,
                boundObjectPropertyPath: "prototypes",
                oneway: true
            });
        }
    }


});
