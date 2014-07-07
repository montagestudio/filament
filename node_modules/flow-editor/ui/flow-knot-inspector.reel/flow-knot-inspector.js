/**
    @module "ui/flow-knot-inspector.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/flow-knot-inspector.reel".FlowKnotInspector
    @extends module:montage/ui/component.Component
*/
exports.FlowKnotInspector = Component.specialize( /** @lends module:"ui/flow-knot-inspector.reel".FlowKnotInspector# */ {

    _type: {
        value: null
    },

    type: {
        get: function () {
            return this._type;
        },
        set: function (value) {
            if (value) {
                this._type = value;
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
            this._knot = value && value._data.type === "FlowKnot" ? value : null;
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
            if (this.knot) {
                var dX = value - this.knot._data.x;
                this._x = value;

                if (dX) {
                    this.knot.translate([dX, 0, 0]);
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
            if (this.knot) {
                var dY = value - this.knot._data.y;
                this._y = value;

                if (dY) {
                    this.knot.translate([0, dY, 0]);
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
            if (this.knot) {
                var dZ = value - this.knot._data.z;
                this._z = value;

                if (dZ) {
                    this.knot.translate([0, 0, dZ]);
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

    handleSelectAction: {
        value: function () {
            this.dispatchEventNamed("flowPropertyChangeSet", true, true);
        }
    },

    handleDeleteAction: {
        value: function () {
            this.scene.removeCanvasFlowKnot(this.knot);
            this.dispatchEventNamed("flowPropertyChangeSet", true, true);
        }
    }

});
