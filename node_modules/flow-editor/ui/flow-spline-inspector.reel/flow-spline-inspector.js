/**
    @module "ui/flow-spline-inspector.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/flow-spline-inspector.reel".FlowSplineInspector
    @extends module:montage/ui/component.Component
*/
exports.FlowSplineInspector = Component.specialize( /** @lends module:"ui/flow-spline-inspector.reel".FlowSplineInspector# */ {

    _spline: {
        value: null
    },

    spline: {
        get: function () {
            return this._spline;
        },
        set: function (value) {
            this._spline = value && value._data.type === "FlowSpline" ? value : null;
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
            if (this.spline) {
                var dX = value - this.spline.boundingBoxCorner.x;
                this._x = value;

                if (dX) {
                    this.spline.translate([dX, 0, 0]);
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
            if (this.spline) {
                var dY = value - this.spline.boundingBoxCorner.y;
                this._y = value;

                if (dY) {
                    this.spline.translate([0, dY, 0]);
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
            if (this.spline) {
                var dZ = value - this.spline.boundingBoxCorner.z;
                this._z = value;

                if (dZ) {
                    this.spline.translate([0, 0, dZ]);
                }
            }
        }
    },

    handleReverseAction: {
        value: function () {
            this.spline.reverse();
            this.dispatchEventNamed("flowPropertyChangeSet", true, true);
        }
    },

    handleDeleteAction: {
        value: function () {
            this.scene.removeCanvasFlowSpline(this.spline);
            this.dispatchEventNamed("flowPropertyChangeSet", true, true);
        }
    }

});
