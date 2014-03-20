/**
 * @module ui/Stage-3D.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Application = require("montage/core/application").application,

    /*jshint -W079 */
    Node = require("mjs-volume/runtime/node").Node,
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
                if (Array.isArray(this.editingProxies)) {
                    this.addOwnPropertyChangeListener("editingProxies", this);
                    this._injectEditingProxyToScene();
                }
            }
        }
    },

    handleEditingProxiesChange: {
        value: function (proxies) {
            if (proxies) {
                this._injectEditingProxyToScene();
            }
        }
    },

    // todo check if a proxy has been removed, will work for the demo
    // because for removing a reelProxy we need to exit the scene editor.
    // fixme change its name
    _injectEditingProxyToScene: {
        value: function () {
            if (Array.isArray(this.editingProxies)) {
                var self = this;

                this.editingProxies.forEach(function (proxy) {
                    if (/mjs-volume\/runtime\/material/.test(proxy.exportId)) {
                        self._createMaterialWithReelProxy(proxy);
                    } else if (/mjs-volume\/runtime\/node/.test(proxy.exportId)) {
                        self._createNodeWithReelProxy(proxy);
                    }
                });
            }
        }
    },

    _createMaterialWithReelProxy: {
        value: function (reelProxy) {
            if (this._scene) {
                var id = reelProxy.properties.get('id'),
                    element = this._scene.glTFElement.ids[id];

                if (!(element instanceof Material)) {
                    var material = new Material();

                    material.id = id;
                    material.scene = this.scene;
                    material.image = reelProxy.properties.get('image');
                    material.opacity = reelProxy.properties.get('opacity');

                    //fixme should use the blueprintproperties,

                    this._scene.glTFElement.ids[id] = material;
                }
            }
        }
    },

    _createNodeWithReelProxy: {
        value: function (reelProxy) {
            if (this._scene) {
                var id = reelProxy.properties.get('id'),
                    element = this._scene.glTFElement.ids[id];

                if (!(element instanceof Node)) {
                    var node = new Node();

                    node.id = id;
                    node.scene = this.scene;
                    node.hidden = reelProxy.properties.get('hidden');

                    this._scene.glTFElement.ids[id] = node;
                }
            }
        }
    },

    _updateComponent3D: {
        value: function (id, property, value) {
            if (this._scene && typeof id === "string" && typeof property === "string") {
                var component3D = this._scene.glTFElement.ids[id];

                if (component3D) {
                    component3D[property] = value;
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
