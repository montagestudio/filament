var Montage = require("montage/core/core").Montage,
    Panel = require("ui/panel.reel").Panel,
    RangeController = require("montage/core/range-controller").RangeController;

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
