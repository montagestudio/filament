var Montage = require("montage").Montage,
    CanvasShape = require("ui/canvas-shape").CanvasShape,
    Vector3 = require("ui/pen-tool-math").Vector3,
    FlowKnot = require("ui/flow-spline-handlers").FlowKnot,
    BezierSpline = require("ui/pen-tool-math").CubicBezierSpline,
    CanvasVector3 = require("ui/canvas-vector3").CanvasVector3,
    FlowSpline = require("ui/flow-spline").FlowSpline,
    CanvasFlowSpline = require("ui/flow-spline").CanvasFlowSpline,
    BezierCurve = require("ui/pen-tool-math").CubicBezierCurve;

var FlowHelix = exports.FlowHelix = Montage.create(FlowSpline, {
    type: {
        value: "FlowHelix"
    }
});

exports.CanvasFlowHelix = Montage.create(CanvasFlowSpline, {

    _segments: {
        value: 32
    },

    segments: {
        get: function () {
            return this._segments;
        },
        set: function (value) {
            this._segments = value;
            this.update();
        }
    },

    _pitch: {
        value: 30
    },

    pitch: {
        get: function () {
            return this._pitch;
        },
        set: function (value) {
            this._pitch = value;
            this.update();
        }
    },

    _radius: {
        value: 550
    },

    radius: {
        get: function () {
            return this._radius;
        },
        set: function (value) {
            this._radius = value;
            this.update();
        }
    },

    _density: {
        value: 1
    },

    density: {
        get: function () {
            return this._density;
        },
        set: function (value) {
            this._density = value;
            this.update();
        }
    },

    pointInCircleAt: { // returns a point in a unit radius circle with center at origin for a given angle
        value: function (angle) {
            return [Math.cos(angle), Math.sin(angle)];
        }
    },

    tangentInCircleAt: { // returns normalized tangent vector for a point in a circle at a given angle
        value: function (angle) {
            return [-Math.sin(angle), Math.cos(angle)];
        }
    },

    scaleVector: {
        value: function (vector, scale) {
            return [
                vector[0] * scale,
                vector[1] * scale
            ];
        }
    },

    _x: {
        value: 0
    },

    _y: {
        value: 0
    },

    _z: {
        value: 0
    },

    translate: {
        value: function (vector) {
            this._x += vector[0];
            this._y += vector[1];
            this._z += vector[2];
            this.data.translate(vector);
        }
    },

    save: {
        value: function () {
            this._savedX = this._x;
            this._savedY = this._y;
            this._savedZ = this._z;
            this.data.save();
        }
    },

    restore: {
        value: function () {
            if (typeof this._savedX !== "undefined") {
                this._x = this._savedX;
                this._y = this._savedY;
                this._z = this._savedZ;
                this.data.restore();
                this.update();
            }
        }
    },

    update: {
        value: function () {
            var i, bezier,
                knot,
                radius = this._radius,
                bezierHandlerLength = 0.130976446,
                angle, point, tangent,
                angle2, point2, tangent2,
                shape;

            if (this._shape) {
                shape = this._shape;
                while (shape.length) {
                    shape.popBezierCurve();
                }
            } else {
                this._shape = shape = FlowHelix.create().init();
                this.initWithData(shape);
            }
            for (i = 0; i < this._segments; i++) {
                angle = Math.PI - i * Math.PI / 8;
                point = this.scaleVector(this.pointInCircleAt(angle), radius);
                tangent = this.scaleVector(this.tangentInCircleAt(angle), radius * bezierHandlerLength);
                angle2 = Math.PI - (i + 1) * Math.PI / 8;
                point2 = this.scaleVector(this.pointInCircleAt(angle2), radius);
                tangent2 = this.scaleVector(this.tangentInCircleAt(angle2), radius * bezierHandlerLength);
                bezier = BezierCurve.create().init();
                bezier.pushControlPoint(knot = FlowKnot.create().initWithCoordinates([-point[0] + this._x, i * this._pitch + this._y, -point[1] + this._z]));
                knot.density = this._density;
                knot.rotateY = -angle - Math.PI / 2;
                bezier.pushControlPoint(Vector3.create().initWithCoordinates([-point[0] + tangent[0] + this._x, (i + 1 / 3) * this._pitch + this._y, -point[1] + tangent[1] + this._z]));
                bezier.pushControlPoint(Vector3.create().initWithCoordinates([-point2[0] - tangent2[0] + this._x, (i + 2 / 3) * this._pitch + this._y, -point2[1] - tangent2[1] + this._z]));
                bezier.pushControlPoint(knot = FlowKnot.create().initWithCoordinates([-point2[0] + this._x, (i + 1) * this._pitch + this._y, -point2[1] + this._z]));
                knot.density = this._density;
                knot.rotateY = -angle2 - Math.PI / 2;
                shape.pushBezierCurve(bezier);
            }
            this._data.dispatchEventIfNeeded("bezierSplineChange");
        }
    },

    data: {
        get: function () {
            return this._data;
        },
        set: function (value) {
            this._data = value;
        }
    }

});
