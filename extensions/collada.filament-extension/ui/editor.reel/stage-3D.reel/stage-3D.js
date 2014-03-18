/**
 * @module ui/Stage-3D.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

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

    templateDidLoad: {
        value: function () {
            this.sceneView.delegate = this;
        }
    }

});
