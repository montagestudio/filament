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
            this.defineBinding("editingProxies", {"<-": "editingDocument.editingProxies"});
            this.defineBinding("fileName", {"<-": "object.properties.get('path')"});

            this.addPathChangeListener("object.properties.get('path')", this, "handleScenePathChange");

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

    _sceneUrl: {
        value: null
    },

    sceneUrl: {
        get: function () {
            return this._sceneUrl;
        }
    },

    handleScenePathChange: {
        value: function (path) {
            this.dispatchBeforeOwnPropertyChange("sceneUrl", this.sceneUrl);

            if (this.object && this.object.properties) {
                var scenePath = this.object.properties.get("path"),
                    document = this.object.editingDocument;

                if (scenePath && document) {
                    var sceneUrl = null;

                    if(/^https?:/i.test(scenePath)) { // is Url
                        sceneUrl = scenePath;
                    } else {
                        var assetManager = document.editor.projectController.assetsManager;

                        // relative and absolute paths
                        sceneUrl = assetManager.getAssetUrlWithPathAndDocument(scenePath, document);
                    }

                    if (sceneUrl) {
                        this._sceneUrl = sceneUrl;
                    }

                    //TODO Inform user when the sceneUrl is not valid.
                }

            } else {
                this._sceneUrl = null;
            }
            this.dispatchOwnPropertyChange("sceneUrl", this.sceneUrl);
        }
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
