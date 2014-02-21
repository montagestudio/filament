/**
    @module "ui/flow-knot-inspector.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Vector3 = require("ui/pen-tool-math").Vector3,
    FlowSpline = require("ui/flow-spline").FlowSpline,
    CanvasFlowSpline = require("ui/flow-spline").CanvasFlowSpline;

exports.FlowHelixInspector = Montage.create(Component, {

    _helix: {
        value: null
    },

    helix: {
        get: function () {
            return this._helix;
        },
        set: function (value) {
            if (value && (value._data.type === "FlowHelix")) {
                this._helix = value;
            } else {
                this._helix = null;
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
            if (!this._helix) {
                return 0;
            }

            var dX = value - this._helix._data.x;

            this._x = value;
            if (this._helix && dX) {
                this._helix.translate([dX, 0, 0]);
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
            if (!this._helix) {
                return 0;
            }

            var dY = value - this._helix._data.y;

            this._y = value;
            if (this._helix && dY) {
                this._helix.translate([0, dY, 0]);
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
            if (!this._helix) {
                return 0;
            }

            var dZ = value - this._helix._data.z;

            this._z = value;
            if (this._helix && dZ) {
                this._helix.translate([0, 0, dZ]);
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
        }
    },

    _pitch: {
        value: null
    },

    pitch: {
        get: function () {
            return this._pitch;
        },
        set: function (value) {
            this._pitch = value;
        }
    },

    handleDeleteAction: {
        value: function () {
            this.editor.sceneWillChange();
            this.scene.removeCanvasFlowHelix(this.helix);
            this.editor.sceneDidChange();
        }
    }

});
