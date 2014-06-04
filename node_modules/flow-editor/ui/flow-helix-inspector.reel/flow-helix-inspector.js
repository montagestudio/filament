/**
    @module "ui/flow-knot-inspector.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component;

exports.FlowHelixInspector = Component.specialize({

    _helix: {
        value: null
    },

    helix: {
        get: function () {
            return this._helix;
        },
        set: function (value) {
            this._helix = value && value._data.type === "FlowHelix" ? value : null;
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
            if (this._helix) {
                var dX = value - this._helix._data.x;
                this._x = value;

                if (dX) {
                    this._helix.translate([dX, 0, 0]);
                }
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
            if (this._helix) {
                var dY = value - this._helix._data.y;
                this._y = value;

                if (dY) {
                    this._helix.translate([0, dY, 0]);
                }
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
            if (this._helix) {
                var dZ = value - this._helix._data.z;
                this._z = value;

                if (dZ) {
                    this._helix.translate([0, 0, dZ]);
                }
            }
        }
    },

    rotateX: {
        value: null
    },

    rotateY: {
        value: null
    },

    rotateZ: {
        value: null
    },

    opacity: {
        value: null
    },

    density: {
        value: null
    },

    pitch: {
        value: null
    },

    handleDeleteAction: {
        value: function () {
            this.scene.removeCanvasFlowHelix(this.helix);
            this.dispatchEventNamed("flowPropertyChangeSet", true, true);
        }
    }

});
