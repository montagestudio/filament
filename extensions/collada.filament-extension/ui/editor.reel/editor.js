/**
 * @module ui/editor.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Editor
 * @extends Component
 */
exports.Editor = Component.specialize(/** @lends Editor# */ {
    constructor: {
        value: function Editor() {
            this.super();
        }
    },

    enterDocument: {
        value: function (firstime) {
            if (firstime) {
                this.editingDocument.selectObjectsOnAddition = false;

                this.addEventListener("exitSceneEditor", this);
            }
        }
    },

    handleExitSceneEditor: {
        value: function () {
            this.editingDocument.selectObjectsOnAddition = true;
            this.templateObjects.sceneGraph._scene = null;
        }
    },

    object: {
        value: null
    },

    editingDocument: {
        value: null
    }

});
