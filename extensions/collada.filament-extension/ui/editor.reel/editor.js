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
            this.defineBinding("fileName", {"<-": "object.stageObject.path"});
        }
    },

    object: {
        value: null
    },

    editingDocument: {
        value: null
    },

    _fileName: {
        value: null
    },

    fileName: {
        set: function (path) {
            if (path) {
                var pathData = /([^\/]+)\.[^\.]+$|(?:[^\/]+)$/.exec(path);

                if (pathData && Array.isArray(pathData) && pathData.length === 2) {
                    this._fileName = pathData[1];
                }
            }
        },
        get: function () {
            return this._fileName;
        }
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
