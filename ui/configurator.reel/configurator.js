var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    ArrayController = require("montage/ui/controller/array-controller").ArrayController;

// Add custom value components
var propertyInspector = require("palette/ui/inspector/property-inspector.reel");

// Lumieres file open dialog
var fileInspector = propertyInspector.PropertyTypeComponentDescriptor.create().init(
    require("ui/inspector/file.reel").File,
    "div",
    "value"
);
propertyInspector.addPropertyTypeComponentDescriptor("file", fileInspector);

var jsonInspector = propertyInspector.PropertyTypeComponentDescriptor.create().init(
    require("ui/inspector/array.reel").Array,
    "div",
    "array"
);
propertyInspector.addPropertyTypeComponentDescriptor("array", jsonInspector);


exports.Configurator = Montage.create(Component, {

    didCreate: {
        value: function () {
            //TODO handle multiple selection better
            this.addPropertyChangeListener("selectedObjects.0", this, false);
        }
    },

    selectedObjects: {
        value: null
    },

    //TODO this is a little weird that the inspector for selectedObjects.I finds its controller from inspectorControllers.I
    inspectorControllers: {
        value: null
    },

    recentlySelectedObjects: {
        value: null
    },

    handleChange: {
        value: function (notification) {
            if ("selectedObjects.0" === notification.currentPropertyPath) {
                var selectedObject = this.getProperty("selectedObjects.0"),
                    self = this;

                if (selectedObject && selectedObject.prototype.indexOf("ui/flow.reel") !== -1) {
                    require.async("flow-editor/core/controller").get("Controller").then(function (Controller) {
                        self.inspectorControllers = [Controller];
                    });
                } else {
                    this.inspectorControllers = null;
                }
            }
        }
    }

});
