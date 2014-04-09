/**
 * @module ui/editor.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    SceneEditorTools = require("core/scene-editor-tools");

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
            this.defineBinding("editingProxies", {"<-": "editingDocument.editingProxies"});
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

    _editingProxies: {
        value: null
    },

    editingProxies: {
        set: function (editingProxies) {
            if (Array.isArray(editingProxies)) {
                var filteredProxies = editingProxies.filter(function (proxy) {
                        return SceneEditorTools.isSupportedProxy(proxy.exportId);
                    });

                if ((!this._editingProxies) || (this._editingProxies && filteredProxies.length !== this._editingProxies.length)) {
                    this._editingProxies = filteredProxies;
                }
            }
        },
        get: function () {
            return this._editingProxies;
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
        value: function (event) {
            event.stop();

            this.editingDocument.selectObjectsOnAddition = true;
            this.scene = null;
        }
    }

});