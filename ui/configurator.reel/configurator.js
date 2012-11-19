var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    ArrayController = require("montage/ui/controller/array-controller").ArrayController;

// Add custom value components
var propertyInspector = require("palette/ui/inspector/property-inspector.reel");
var fileInspector = propertyInspector.PropertyTypeComponentDescriptor.create().init(
    require("ui/inspector/file.reel").File,
    "div",
    "value"
);
propertyInspector.addPropertyTypeComponentDescriptor("file", fileInspector);


exports.Configurator = Montage.create(Component, {

    selectedObjects: {
        value: null
    },

    recentlySelectedObjects: {
        value: null
    }
});
