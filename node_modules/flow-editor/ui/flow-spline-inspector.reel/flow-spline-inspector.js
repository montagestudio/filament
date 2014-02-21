/**
    @module "ui/flow-spline-inspector.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

/**
    Description TODO
    @class module:"ui/flow-spline-inspector.reel".FlowSplineInspector
    @extends module:montage/ui/component.Component
*/
exports.FlowSplineInspector = Montage.create(Component, /** @lends module:"ui/flow-spline-inspector.reel".FlowSplineInspector# */ {

    _spline: {
        value: null
    },

    spline: {
        get: function () {
            return this._spline;
        },
        set: function (value) {
            if (value && (value._data.type === "FlowSpline")) {
                this._spline = value;
            } else {
                this._spline = null;
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
            if (!this.spline) {
                return 0;
            }

            var dX = value - this.spline.boundingBoxCorner.x;

            this._x = value;
            if (this.spline && dX) {
                this.spline.translate([dX, 0, 0]);
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
            if (!this.spline) {
                return 0;
            }

            var dY = value - this.spline.boundingBoxCorner.y;

            this._y = value;
            if (this.spline && dY) {
                this.spline.translate([0, dY, 0]);
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
            if (!this.spline) {
                return 0;
            }

            var dZ = value - this.spline.boundingBoxCorner.z;

            this._z = value;
            if (this.spline && dZ) {
                this.spline.translate([0, 0, dZ]);
            }
        }
    },

    handleReverseAction: {
        value: function () {
            this.editor.sceneWillChange();
            this.spline.reverse();
            this.editor.sceneDidChange();
        }
    },

    handleDeleteAction: {
        value: function () {
            this.editor.sceneWillChange();
            this.scene.removeCanvasFlowSpline(this.spline);
            this.editor.sceneDidChange();
        }
    }

});
