/**
    @module "ui/flow-vector3-inspector.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/flow-vector3-inspector.reel".FlowVector3Inspector
    @extends module:montage/ui/component.Component
*/
exports.FlowVector3Inspector = Montage.create(Component, /** @lends module:"ui/flow-vector3-inspector.reel".FlowVector3Inspector# */ {

    _vector: {
        value: null
    },

    vector: {
        get: function () {
            return this._vector;
        },
        set: function (value) {
            if (value && (value._data.type === "Vector3")) {
                this._vector = value;
            } else {
                this._vector = null;
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
            if (!this.vector) {
                return 0;
            }

            var dX = value - this.vector._data.x;

            this._x = value;
            if (this.vector && dX) {
                this.vector.translate([dX, 0, 0]);
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
            if (!this.vector) {
                return 0;
            }

            var dY = value - this.vector._data.y;

            this._y= value;
            if (this.vector && dY) {
                this.vector.translate([0, dY, 0]);
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
            if (!this.vector) {
                return 0;
            }

            var dZ = value - this.vector._data.z;

            this._z = value;
            if (this.vector && dZ) {
                this.vector.translate([0, 0, dZ]);
            }
        }
    }

});
