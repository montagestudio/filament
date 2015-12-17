var CoreExtension = require("filament-extension/core/extension").Extension,
    Promise = require("montage/core/promise").Promise,
    FlowEditorController = require("flow-editor/core/controller").Controller;

exports.Extension = CoreExtension.specialize({

    constructor: {
        value: function Extension() {
            this.super();
        }
    },

    editorObjectMatchFunction: {
        enumerable: false,
        value : function (object) {
            return object && object.moduleId && (/montage\/ui\/flow\.reel/).test(object.moduleId);
        }
    },

    activate: {
        value: function (application, projectController, viewController) {
            viewController.registerModalEditorTypeForObjectTypeMatcher(FlowEditorController, this.editorObjectMatchFunction);
            return Promise.resolve(this);
        }
    },

    deactivate: {
        value: function (application, projectController, viewController) {
            viewController.unregisterModalEditorTypeForObjectTypeMatcher(this.editorObjectMatchFunction);
            return Promise.resolve(this);
        }
    }

});
