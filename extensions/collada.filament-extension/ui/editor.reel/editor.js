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

            this.defineBinding("sceneLabel", {"<-": "object.label"});
        }
    },

    object: {
        value: null
    },

    editingDocument: {
        value: null
    },

    fileName: {
        value: null
    },

    sceneLabel: {
        value: null
    },

    _scene: {
        value: null
    },

    scene: {
        set: function (scene) {
            if (scene) {
                if (!this._scene) {
                    var pathData = /([^\/]+)\.[^\.]+$|(?:[^\/]+)$/.exec(scene.path);

                    if (pathData && Array.isArray(pathData) && pathData.length === 2) {
                        this.fileName = pathData[1];
                    }

                    this._scene = scene;
                }
            } else {
                this._scene = null;
            }
        },
        get: function () {
            return this._scene;
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
            this.scene = null;
        }
    }

});
