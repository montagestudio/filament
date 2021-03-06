/**
 * @module ui/Stage-3D.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Application = require("montage/core/application").application,
    SceneEditorTools = require("core/scene-editor-tools"),

    /*jshint -W079 */
    Node = require("mjs-volume/runtime/node").Node,
    /*jshint +W079*/

    Material = require("mjs-volume/runtime/material").Material;

/**
 * @class Stage3D
 * @extends Component
 */
exports.Stage3D = Component.specialize(/** @lends Stage3D# */ {

    constructor: {
        value: function Stage3D() {
            this.super();
        }
    },

    _scene: {
        value: null
    },

    scene: {
        get: function () {
            return this._scene;
        },
        set: function (value) {
            this._scene = value;

            if (this._scene != null) {
                this._scene.shouldBeHitTested = true;
            }
        }
    },

    sceneDidDraw: {
        value: function () {
            if (this.sceneView.selectedNode) {
                if (this.sceneView.selectedNode.glTFElement) {
                    this.sceneView._displayBBOX(this.sceneView.selectedNode.glTFElement);
                }
            }
        }
    },

    sceneView: {
        get: function () {
            return this.templateObjects.sceneView;
        }
    },

    editingProxies: {
        value: null
    },

    editingDocument: {
        value: null
    },

    templateDidLoad: {
        value: function () {
            this.sceneView.delegate = this;
        }
    },

    enterDocument: {
        value: function (firstime) {
            if (firstime) {
                this.addPathChangeListener("scene.status", this, "handleStatusChange");
                Application.addEventListener("didSetOwnedObjectProperty", this);
            }
        }
    },

    exitDocument: {
        value: function (firstime) {
            if (firstime) {
                this.removePathChangeListener("scene.status", this);
                Application.removeEventListener("didSetOwnedObjectProperty", this);
                this.removeOwnPropertyChangeListener("editingProxies", this);
            }
        }
    },

    handleStatusChange: {
        value: function(status) {
            if (status === "loaded" && this._scene) {
                this.addOwnPropertyChangeListener("editingProxies", this);
                this._applyEditingProxyToScene();
            }
        }
    },

    handleEditingProxiesChange: {
        value: function (proxies) {
            if (proxies) {
                this._applyEditingProxyToScene();
            }
        }
    },

    // todo check if a proxy has been removed, will work for the demo
    // because for removing a reelProxy we need to exit the scene editor.
    _applyEditingProxyToScene: {
        value: function () {
            if (Array.isArray(this.editingProxies)) {
                var self = this;

                this.editingProxies.forEach(function (proxy) {
                    if (SceneEditorTools.isMaterialProxy(proxy.exportId)) {
                        self._setupMaterialWithReelProxy(proxy);
                    } else if (SceneEditorTools.isNodeProxy(proxy.exportId)) {
                        self._setupNodeWithReelProxy(proxy);
                    }
                });
            }
        }
    },

    _elementForReelProxy: {
        value: function(reelProxy) {
            var element = null;

            if (this._scene) {
                var id = reelProxy.properties.get('id');

                if (id) {
                    element = this._scene.glTFElement.ids[id];
                }
            }

            return element;
        }
    },

    _setupMaterialWithReelProxy: {
        value: function (reelProxy) {
            var element = this._elementForReelProxy(reelProxy);

            if (element) {
                element.component3D = this._fullfilComponent3D(new Material(), reelProxy.properties);
            }
        }
    },

    _setupNodeWithReelProxy: {
        value: function (reelProxy) {
            var element = this._elementForReelProxy(reelProxy);

            if (element) {
                element.component3D = this._fullfilComponent3D(new Node(), reelProxy.properties);
            }
        }
    },

    _fullfilComponent3D: {
        value: function (component, properties) {
            if (component && properties) {
                var self = this,
                    propertyKeys = properties.keys(),
                    propertyKey;

                while (propertyKey = propertyKeys.next().value) {
                    if (propertyKey === 'scene') {
                        component.scene = self.scene;
                    } else {
                        component[propertyKey] = properties.get(propertyKey);
                    }
                }
            }

            return component;
        }
    },

    _updateComponent3D: {
        value: function (id, property, value) {
            if (this._scene && typeof id === "string" && typeof property === "string") {
                var glTFElement = this._scene.glTFElement.ids[id];

                if (glTFElement && glTFElement.component3D) {
                    glTFElement.component3D[property] = value;
                }
            }
        }
    },

    handleDidSetOwnedObjectProperty: {
        value: function (event) {
            var detail = event.detail;

            if (detail.proxy) {
                var id = detail.proxy.properties.get('id');

                if (id) {
                    this._updateComponent3D(id, detail.property, detail.value);
                }
            }
        }
    }

});
