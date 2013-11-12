/**
    @module "ui/flow-knot-inspector.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Vector3 = require("ui/pen-tool-math").Vector3;

/**
    Description TODO
    @class module:"ui/flow-knot-inspector.reel".FlowKnotInspector
    @extends module:montage/ui/component.Component
*/
exports.FlowKnotInspector = Montage.create(Component, /** @lends module:"ui/flow-knot-inspector.reel".FlowKnotInspector# */ {

    _type: {
        value: null
    },

    type: {
        get: function () {
            return this._type;
        },
        set: function (value) {
            if (value) {
                this.editor.sceneWillChange();
                this._type = value;
                this.editor.sceneDidChange();
            }
        }
    },

    _knot: {
        value: null
    },

    knot: {
        get: function () {
            return this._knot;
        },
        set: function (value) {
            if (value && (value._data.type === "FlowKnot")) {
                this._knot = value;
            } else {
                this._knot = null;
            }
        }
    },

    _x: {
        value: null
    },

    x: {
        get: function () {
            return this._x;
        },
        set: function (value) {
            if (!this.knot) return 0;

            var dX = value - this.knot._data.x;

            this._x = value;
            if (this.knot && dX) {
                this.knot.translate([dX, 0, 0]);
            }
            if (this.scene) {
                //this.scene.dispatchEventNamed("sceneUpdated", true, true);
            }
        }
    },

    _y: {
        value: null
    },

    y: {
        get: function () {
            return this._y;
        },
        set: function (value) {
            if (!this.knot) return 0;

            var dY = value - this.knot._data.y;

            this._y = value;
            if (this.knot && dY) {
                this.knot.translate([0, dY, 0]);
            }
            if (this.scene) {
                //this.scene.dispatchEventNamed("sceneUpdated", true, true);
            }
        }
    },

    _z: {
        value: null
    },

    z: {
        get: function () {
            return this._z;
        },
        set: function (value) {
            if (!this.knot) return 0;

            var dZ = value - this.knot._data.z;

            this._z = value;
            if (this.knot && dZ) {
                this.knot.translate([0, 0, dZ]);
            }
            if (this.scene) {
                //this.scene.dispatchEventNamed("sceneUpdated", true, true);
            }
        }
    },

    _rotateX: {
        value: null
    },

    rotateX: {
        get: function () {
            return this._rotateX;
        },
        set: function (value) {
            this._rotateX = value;
            if (this.scene) {
                //this.scene.dispatchEventNamed("sceneUpdated", true, true);
            }
        }
    },

    _rotateY: {
        value: null
    },

    rotateY: {
        get: function () {
            return this._rotateY;
        },
        set: function (value) {
            this._rotateY = value;
            if (this.scene) {
                //this.scene.dispatchEventNamed("sceneUpdated", true, true);
            }
        }
    },

    _rotateZ: {
        value: null
    },

    rotateZ: {
        get: function () {
            return this._rotateZ;
        },
        set: function (value) {
            this._rotateZ = value;
            if (this.scene) {
                //this.scene.dispatchEventNamed("sceneUpdated", true, true);
            }
        }
    },

    _opacity: {
        value: null
    },

    opacity: {
        get: function () {
            return this._opacity;
        },
        set: function (value) {
            this._opacity = value;
            if (this.scene) {
                //this.scene.dispatchEventNamed("sceneUpdated", true, true);
            }
        }
    },

    _density: {
        value: null
    },

    density: {
        get: function () {
            return this._density;
        },
        set: function (value) {
            this._density = value;
            if (this.scene) {
                //this.scene.dispatchEventNamed("sceneUpdated", true, true);
            }
        }
    }

});
