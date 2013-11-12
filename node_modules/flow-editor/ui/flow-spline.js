var Montage = require("montage").Montage,
    CanvasShape = require("ui/canvas-shape").CanvasShape,
    Vector3 = require("ui/pen-tool-math").Vector3,
    BezierCurve = require("ui/pen-tool-math").CubicBezierCurve,
    BezierSpline = require("ui/pen-tool-math").BezierSpline,
    CanvasVector3 = require("ui/canvas-vector3").CanvasVector3,
    FlowSplineHandlers = require("ui/flow-spline-handlers").FlowSplineHandlers
    CanvasFlowSplineHandlers = require("ui/flow-spline-handlers").CanvasFlowSplineHandlers;

exports.FlowSpline = Montage.create(BezierSpline, {

    type: {
        value: "FlowSpline"
    },

    _headOffset: {
        value: 0
    },

    headOffset: {
        get: function () {
            return this._headOffset;
        },
        set: function (value) {
            this._headOffset = value;
            this.dispatchEventIfNeeded("bezierSplineChange");
        }
    },

    _tailOffset: {
        value: 0
    },

    tailOffset: {
        get: function () {
            return this._tailOffset;
        },
        set: function (value) {
            this._tailOffset = value;
            this.dispatchEventIfNeeded("bezierSplineChange");
        }
    }

});

exports.CanvasFlowSpline = Montage.create(CanvasShape, {

    appendControlPoint: {
        value: function (controlPoint) {
            var bezierCurve,
                knot;

            if (this._data.length) {
                bezierCurve = this._data.getBezierCurve(this._data.length - 1);
                if (bezierCurve.length === 4) {
                    bezierCurve = BezierCurve.create().init();
                    this._data.pushBezierCurve(bezierCurve);
                }
            } else {
                bezierCurve = BezierCurve.create().init();
                this._data.pushBezierCurve(bezierCurve);
            }
            bezierCurve.pushControlPoint(controlPoint);
            switch (bezierCurve.length) {
                case 1:
                    knot = CanvasFlowSplineHandlers.create();
                    knot.initWithData(controlPoint);
                    knot.isVisible = this.isSelected;
                    this.appendChild(knot);
                    break;
                case 2:
                    knot = this.children[this.children.length - 1];
                    knot.nextHandler = controlPoint;
                    break;
                case 3:
                    knot = CanvasFlowSplineHandlers.create();
                    knot.initWithData(controlPoint);
                    knot.isVisible = this.isSelected;
                    knot.previousHandler = controlPoint;
                    this.appendChild(knot);
                    break;
                case 4:
                    knot = this.children[this.children.length - 1];
                    knot.data = controlPoint;
                    break;
            }
            return knot;
        }
    },

    insertControlPointAtStart: {
        value: function (controlPoint) {
            if (this._data.length) {
                var bezierCurve = this._data.getBezierCurve(0),
                    knot,
                    i = 2;

                if (bezierCurve.isComplete) {
                    bezierCurve = BezierCurve.create().init();
                    this._data.insertCubicBezierCurveAtStart(bezierCurve);
                } else {
                    while ((i >= 0) && bezierCurve.getControlPoint(i)) {
                        i--;
                    }
                }
                bezierCurve.setControlPoint(i, controlPoint);
                switch (i) {
                    case 2:
                        knot = this.children[0];
                        knot.previousHandler = controlPoint;
                        break;
                    case 1:
                        knot = CanvasFlowSplineHandlers.create();
                        knot.initWithData(controlPoint);
                        knot.isVisible = this.isSelected;
                        knot.nextHandler = controlPoint;
                        this.insertChildAtStart(knot);
                        break;
                    case 0:
                        knot = this.children[0];
                        knot.data = controlPoint;
                        break;
                }
                return knot;
            }
            return null;
        }
    },

    isSelected: {
        get: function () {
            return this._data._isSelected;
        },
        set: function (value) {
            var length, i;

            if (this._data.dispatchEventNamed) {
                this._data._isSelected = value;
                length = this.children.length;
                for (i = 0; i < length; i++) {
                    this.children[i].isVisible = value;
                }
                this._data.dispatchEventIfNeeded("selectionChange");
                this.needsDraw = true;
            }
        }
    },

    firstKnot: {
        get: function () {
            return this._data.firstKnot;
        }
    },

    lastKnot: {
        get: function () {
            return this._data.lastKnot;
        }
    },

    _boundingBoxCorner: {
        value: null
    },

    boundingBoxCorner: {
        get: function () {
            if (!this._boundingBoxCorner) {
                this.handleUpdate();
            }
            return this._boundingBoxCorner;
        },
        set: function (value) {
            this._boundingBoxCorner = value;
        }
    },

    data: {
        get: function () {
            return this._data;
        },
        set: function (value) {
            var self = this,
                update = function () {
                    self.handleUpdate();
                };

            this._data = value;
            this._data.addEventListener("vectorChange", update, false);
            this._data.addEventListener("bezierCurveChange", update, false);
        }
    },

    handleUpdate: {
        value: function () {
            var axisAlignedBoundaries = this._data.axisAlignedBoundaries;

            this.boundingBoxCorner = {
                x: axisAlignedBoundaries[0].min,
                y: axisAlignedBoundaries[1].min,
                z: axisAlignedBoundaries[2].min
            };
        }
    },

    reverse: {
        value: function () {
            var curve,
                controlPoint,
                i, j;

            this.children = [];
            this._data.reverse();
            for (i = 0; i < this._data.length; i++) {
                curve = this._data.getBezierCurve(i);
                for (j = i ? 1 : 0; j < curve.length; j++) {
                    controlPoint = curve.getControlPoint(j);
                    switch (j) {
                        case 0:
                            knot = CanvasFlowSplineHandlers.create();
                            knot.initWithData(controlPoint);
                            knot.isVisible = this.isSelected;
                            this.appendChild(knot);
                            break;
                        case 1:
                            knot = this.children[this.children.length - 1];
                            knot.nextHandler = controlPoint;
                            break;
                        case 2:
                            knot = CanvasFlowSplineHandlers.create();
                            knot.initWithData(controlPoint);
                            knot.isVisible = this.isSelected;
                            knot.previousHandler = controlPoint;
                            this.appendChild(knot);
                            break;
                        case 3:
                            knot = this.children[this.children.length - 1];
                            knot.data = controlPoint;
                            break;
                    }
                }
            }
        }
    },

    drawSelf: {
        value: function (transformMatrix) {
            var s = this._data.clone().transformMatrix3d(transformMatrix),
                first = true,
                self = this,
                needsStroke = false;

            this._context.save();
            this._context.strokeStyle = this._color;
            this._context.lineWidth = 3;
            this._context.beginPath();
            s.forEach(function (bezier, index) {
                if (bezier.isComplete) {
                    if (first) {
                        self._context.moveTo(
                            bezier.getControlPoint(0).x,
                            bezier.getControlPoint(0).y
                        );
                        first = false;
                    }
                    self._context.bezierCurveTo(
                        bezier.getControlPoint(1).x,
                        bezier.getControlPoint(1).y,
                        bezier.getControlPoint(2).x,
                        bezier.getControlPoint(2).y,
                        bezier.getControlPoint(3).x,
                        bezier.getControlPoint(3).y
                    );
                    needsStroke = true;
                }
            });
            if (needsStroke) {
                this._context.stroke();
            }
            this._context.restore();
            if (this.isSelected) {
                this.drawSelected(transformMatrix);
            }
        }
    },

    drawSelected: {
        value: function (transformMatrix) {
            var s = this._data.clone().transformMatrix3d(transformMatrix),
                self = this,
                first = true,
                needsStroke = false;

            this._context.save();
            this._context.strokeStyle = this._selectedColor;
            this._context.lineWidth = 1.5;
            this._context.beginPath();
            s.forEach(function (bezier, index) {
                if (bezier.isComplete) {
                    if (first) {
                        self._context.moveTo(
                            bezier.getControlPoint(0).x,
                            bezier.getControlPoint(0).y
                        );
                        first = false;
                    }
                    self._context.bezierCurveTo(
                        bezier.getControlPoint(1).x,
                        bezier.getControlPoint(1).y,
                        bezier.getControlPoint(2).x,
                        bezier.getControlPoint(2).y,
                        bezier.getControlPoint(3).x,
                        bezier.getControlPoint(3).y
                    );
                    needsStroke = true;
                }
            });
            if (needsStroke) {
                this._context.stroke();
            }
            this._context.restore();
        }
    },

    pointOnShape: {
        value: function (x, y, transformMatrix) {
            var s = this._data.clone().transformMatrix3d(transformMatrix).scale([1, 1, 0]);
            return (s.getCloserPointTo(Vector3.create().initWithCoordinates([x, y, 0])).distance < 10);
        }
    }

});