var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    ArrayController = require("montage/ui/controller/array-controller").ArrayController;

exports.Configurator = Montage.create(Component, {

    inspectedObjectController: {
        value: null
    },

    didCreate: {
        value: function () {
            this.inspectedObjectController = ArrayController.create();
            this.inspectedObjectController.content = [];

            //TODO add filter to only show N most recently selected
            //TODO introduce a wrapper for the selected objects to hold collapsed state and sortIndex
        }
    },

    prepareForDraw: {
        value: function () {
            this.addPropertyChangeListener("ownerComponent.selectedObject", this, false);
        }
    },

    handleChange: {
        value: function (notification) {
            if ("selectedObject" === notification.propertyPath) {
                var selectedObject = notification.plus;
                this.inspectObject(selectedObject);
            }
        }
    },

    inspectObject: {
        value: function (object) {

            if (object && object !== this.inspectedObjectController.organizedObjects[0]) {
                console.log("Configurator inspectObject", object, this.inspectedObjectController.arrangedObjects);

                //TODO if not in content, add it
                this.inspectedObjectController.addObjects(object);
                // TODO otherwise, alter sorting so it appears first
            }
        }
    }

});
