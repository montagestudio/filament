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
    },

    handleToggleEditorKeyPress: {
        value: function (evt) {
            var self = this;

            if (this.selectedObjects.length === 1) {
                var selectedObject = this.selectedObjects[0];
                if (selectedObject._montage_metadata.module.indexOf("ui/flow.reel") !== -1 ) {
                    require.async("flow-editor/core/controller").get("Controller").then(function(Controller) {
                        if (Controller.hasEditor()) {
                            Controller.editorComponent().then(function(Editor) {
                                var editor = Editor.create();
                                editor.object = selectedObject;
                                self.dispatchEventNamed("enterEditor", true, true, {
                                    component: editor
                                })
                            })
                        }
                    })
                }
            }
        }
    }

});
