var Montage = require("montage/core/core").Montage,
    Panel = require("ui/panel.reel").Panel,
    RangeController = require("montage/core/range-controller").RangeController;

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


exports.Configurator = Montage.create(Panel, {

    didCreate: {
        value: function () {
            //TODO handle multiple selection better
            this.addPathChangeListener("editingDocument.selectedObjects.0", this);
        }
    },

    editingDocument: {
        value: null
    },

    viewController: {
        value: null
    },

    //TODO this is a little weird that the inspector for selectedObjects.I finds its controller from inspectorControllers.I
    inspectorControllers: {
        value: null
    },

    recentlySelectedObjects: {
        value: null
    },

    handlePathChange: {
        value: function (value, path) {
            if ("editingDocument.selectedObjects.0" === path) {
                console.log("asd");
                var selectedObject = this.getPath("editingDocument.selectedObjects.0"),
                    inspectorController = this.viewController ? this.viewController.modalEditorTypeForObject(selectedObject) : null;

                if (inspectorController) {
                    this.inspectorControllers = [inspectorController];
                } else {
                    this.inspectorControllers = null;
                }
            }
        }
    }

});
