var Montage = require("montage").Montage,
    PenToolMath = require("ui/pen-tool-math"),
    FlowKnot = require("ui/flow-spline-handlers").FlowKnot,
    Vector3 = PenToolMath.Vector3,
    FlowSpline = require("ui/flow-spline").FlowSpline,
    OffsetShape = require("ui/offset-shape").OffsetShape,
    CanvasFlowSpline = require("ui/flow-spline").CanvasFlowSpline,
    BezierCurve = PenToolMath.CubicBezierCurve,
    CanvasFlowHelix = require("ui/flow-helix").CanvasFlowHelix;

exports.ArrowTool = Montage.create(Montage, {

    start: {
        value: function (viewport) {
        }
    },

    stop: {
        value: function (viewport) {
        }
    },

    _pointerX: {
        value: null
    },

    _pointerY: {
        value: null
    },

    handleMousedown: {
        value: function (event, viewport, editor) {
            var selected = viewport.findSelectedShape(event.offsetX, event.offsetY);

            viewport.unselect();
            if (selected) {
                selected.isSelected = true;
            }
            this._pointerX = event.pageX;
            this._pointerY = event.pageY;
        }
    },

    handleMousemove: {
        value: function (event, viewport) {
            var dX = event.pageX - this._pointerX,
                dY = event.pageY - this._pointerY;

            if (viewport.selection && viewport.selection[0] && viewport.selection[0]._data.type !== "FlowGrid") {
                viewport.selection[0].translate(
                    Vector3.
                    create().
                    initWithCoordinates([dX, dY, 0]).
                    transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix)).
                    subtract(
                        Vector3.
                        create().
                        initWithCoordinates([0, 0, 0]).
                        transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                    )._data
                );
            } else {
                viewport.translateX += dX;
                viewport.translateY += dY;
            }
            this._pointerX = event.pageX;
            this._pointerY = event.pageY;
        }
    }

});

exports.ConvertTool = Montage.create(Montage, {

    start: {
        value: function (viewport) {
        }
    },

    stop: {
        value: function (viewport) {
        }
    },

    _pointerX: {
        value: null
    },

    _pointerY: {
        value: null
    },

    _startCoordinates: {
        value: null
    },

    _offsetShape: {
        value: null
    },

    handleMousedown: {
        value: function (event, viewport, editor) {
            var path,
                i;

            this.selectedChild = viewport.findSelectedChild(event.offsetX, event.offsetY);

            if (this.selectedChild) {
                path = viewport.findPathToNode(this.selectedChild);
                viewport.unselect();
                for (i = 0; i < path.length; i++) {
                    path[i].isSelected = true;
                }

                this._offsetShape = OffsetShape.create().initWithContextAndCoordinates(viewport, [event.offsetX, event.offsetY, 0]);

                viewport.scene.appendCanvasOffsetShape(this._offsetShape);

                this.selectedChild.save();

            } else {
                viewport.classList.add("grabbing");
                viewport.unselect();
            }
            this._pointerX = event.pageX;
            this._pointerY = event.pageY;
            this._startCoordinates = viewport.getCoordinatesForMouseEvent(event);
        }
    },

    handleMousemove: {
        value: function (event, viewport) {
            var dX = event.pageX - this._pointerX,
                dY = event.pageY - this._pointerY,
                coordinates = viewport.getCoordinatesForMouseEvent(event),
                deltaCoordinates = [
                    coordinates[0] - this._startCoordinates[0],
                    coordinates[1] - this._startCoordinates[1],
                    coordinates[2] - this._startCoordinates[2]
                ];

            if (this.selectedChild) {
                this.selectedChild.restore();
                this.selectedChild.translate(deltaCoordinates);
                this._offsetShape.translate(deltaCoordinates);

            } else {
                viewport.translateX += dX;
                viewport.translateY += dY;
            }
            this._pointerX = event.pageX;
            this._pointerY = event.pageY;
        }
    },

    handleMouseup: {
        value: function (event, viewport) {
            if (!this.selectedChild) {
                viewport.classList.remove("grabbing");
            }

            if (this._offsetShape) {
                viewport.scene.removeCanvasOffsetShape(this._offsetShape);
                this._offsetShape = null;
            }
        }
    },

});

exports.PenTool = Montage.create(Montage, {

    start: {
        value: function (viewport) {
            viewport.unselect();
            viewport.scene.isSelected = true;
            this._editingCanvasSpline = null;
        }
    },

    stop: {
        value: function (viewport, editor) {
        }
    },

    _pointerX: {
        value: null
    },

    _pointerY: {
        value: null
    },

    _editingSpline: {
        value: null
    },

    _editingCanvasSpline: {
        value: null
    },

    _previousKnot: {
        value: null
    },

    handleMousedown: {
        value: function (event, viewport, editor) {
            var canvasShape,
                canvasSpline,
                canvasKnot;

            if (this._editingCanvasSpline) {
                if (this._previousKnot) {
                    this._previousKnot.isSelected = false;
                }
                this._editingCanvasSpline.appendControlPoint(Vector3.
                    create().
                    initWithCoordinates([event.offsetX, event.offsetY, 0]).
                    transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                );
                canvasKnot = this._editingCanvasSpline.appendControlPoint(FlowKnot.
                    create().
                    initWithCoordinates([event.offsetX, event.offsetY, 0]).
                    transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                );
                canvasKnot.isSelected = true;
                this._previousKnot = canvasKnot;
                this._editingCanvasSpline.appendControlPoint(Vector3.
                    create().
                    initWithCoordinates([event.offsetX, event.offsetY, 0]).
                    transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                );
            } else {
                this._storeChanges = false;
                this._editingSpline = FlowSpline.create().init();
                this._editingCanvasSpline = canvasSpline = viewport.scene.appendFlowSpline(this._editingSpline);
                editor._splineCounter++;
                canvasSpline.name = "Spline " + editor._splineCounter;
                canvasKnot = canvasSpline.appendControlPoint(FlowKnot.
                    create().
                    initWithCoordinates([event.offsetX, event.offsetY, 0]).
                    transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                );
                canvasSpline.appendControlPoint(Vector3.
                    create().
                    initWithCoordinates([event.offsetX, event.offsetY, 0]).
                    transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                );
                canvasKnot.isSelected = true;
                canvasSpline.isSelected = true;
                this._previousKnot = canvasKnot;
            }
            this._pointerX = event.pageX;
            this._pointerY = event.pageY;
        }
    },

    handleMousemove: {
        value: function (event, viewport) {
            var dX = event.pageX - this._pointerX,
                dY = event.pageY - this._pointerY,
                vector = this._editingSpline._data[this._editingSpline.length - 1]._data[1],
                vector2;

            vector.translate(
                Vector3.
                create().
                initWithCoordinates([dX, dY, 0]).
                transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix)).
                subtract(
                    Vector3.
                    create().
                    initWithCoordinates([0, 0, 0]).
                    transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                )._data
            );
            if (this._editingSpline._data[this._editingSpline.length - 2] &&
                (vector2 = this._editingSpline._data[this._editingSpline.length - 2]._data[2])) {
                vector2._data = [
                    this._editingSpline._data[this._editingSpline.length - 1].getControlPoint(0).x * 2 - vector.x,
                    this._editingSpline._data[this._editingSpline.length - 1].getControlPoint(0).y * 2 - vector.y,
                    this._editingSpline._data[this._editingSpline.length - 1].getControlPoint(0).z * 2 - vector.z
                ];
            }
            this._pointerX = event.pageX;
            this._pointerY = event.pageY;
        }
    }

});

exports.AddTool = Montage.create(Montage, {

    start: {
        value: function (viewport) {
            viewport.unselect();
            viewport.scene.isSelected = true;
            this._editingCanvasSpline = null;
            this._editingSpline = null;
        }
    },

    stop: {
        value: function (viewport) {
            viewport.scene.appendMark.isVisible = false;
        }
    },

    handleHover: {
        value: function (event, viewport) {
            if (!this._editingCanvasSpline) {
                var selected = viewport.findCloserShapeType("FlowKnot", event.offsetX, event.offsetY),
                    path,
                    spline,
                    i;

                viewport.scene.appendMark.isVisible = false;
                if (selected) {
                    path = viewport.findPathToNode(selected);
                    for (i = 0; i < path.length; i++) {
                        if (path[i]._data.type === "FlowSpline") {
                            spline = path[i];
                        }
                    }
                    if (spline) {
                        if (selected.isLastKnotOf(spline) || selected.isFirstKnotOf(spline)) {
                            viewport.scene.appendMark.data = selected.data.clone();
                            viewport.scene.appendMark.data.nextTarget = viewport.scene.data;
                            viewport.scene.appendMark.isVisible = true;
                        }
                    }
                }
            }
        }
    },

    _pointerX: {
        value: null
    },

    _pointerY: {
        value: null
    },

    _editingSpline: {
        value: null
    },

    _isDragging: {
        value: false
    },

    _isFirstSelection: {
        value: false
    },

    _insertMode: {
        value: null
    },

    handleMousedown: {
        value: function (event, viewport, editor) {
            if (!this._editingCanvasSpline) {
                var selected = viewport.findCloserShapeType("FlowKnot", event.offsetX, event.offsetY),
                    path,
                    spline,
                    i;

                if (selected) {
                    path = viewport.findPathToNode(selected);
                    for (i = 0; i < path.length; i++) {
                        if (path[i]._data.type === "FlowSpline") {
                            spline = path[i];
                        }
                    }
                    if (spline) {
                        if (selected.isLastKnotOf(spline)) {
                            this._editingCanvasSpline = spline;
                            this._editingSpline = spline._data;
                            spline.isSelected = true;
                            selected.isSelected = true;
                            this._previousKnot = selected;
                            this._isFirstSelection = true;
                            this._insertMode = "appendToEnd";
                            viewport.scene.appendMark.isVisible = false;
                            if (!selected.nextHandler) {
                                this._editingCanvasSpline.appendControlPoint(Vector3.
                                    create().
                                    initWithCoordinates([
                                        selected.data.x * 2 - selected.previousHandler.x,
                                        selected.data.y * 2 - selected.previousHandler.y,
                                        selected.data.z * 2 - selected.previousHandler.z
                                    ])
                                );
                            }
                        } else {
                            if (selected.isFirstKnotOf(spline)) {
                                this._editingCanvasSpline = spline;
                                this._editingSpline = spline._data;
                                spline.isSelected = true;
                                selected.isSelected = true;
                                this._previousKnot = selected;
                                this._isFirstSelection = true;
                                this._insertMode = "insertToStart";
                                viewport.scene.appendMark.isVisible = false;
                                if (!selected.previousHandler) {
                                    this._editingCanvasSpline.insertControlPointAtStart(Vector3.
                                        create().
                                        initWithCoordinates([
                                            selected.data.x * 2 - selected.nextHandler.x,
                                            selected.data.y * 2 - selected.nextHandler.y,
                                            selected.data.z * 2 - selected.nextHandler.z
                                        ])
                                    );
                                }
                            }
                        }
                    }
                }
            } else {
                var canvasShape,
                    canvasSpline,
                    canvasKnot;

                this._isFirstSelection = false;
                if (this._insertMode === "appendToEnd") {
                    if (this._previousKnot) {
                        this._previousKnot.isSelected = false;
                    }
                    this._editingCanvasSpline.appendControlPoint(Vector3.
                        create().
                        initWithCoordinates([event.offsetX, event.offsetY, 0]).
                        transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                    );
                    canvasKnot = this._editingCanvasSpline.appendControlPoint(FlowKnot.
                        create().
                        initWithCoordinates([event.offsetX, event.offsetY, 0]).
                        transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                    );
                    canvasKnot.isSelected = true;
                    this._previousKnot = canvasKnot;
                    this._editingCanvasSpline.appendControlPoint(Vector3.
                        create().
                        initWithCoordinates([event.offsetX, event.offsetY, 0]).
                        transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                    );
                } else {
                    if (this._previousKnot) {
                        this._previousKnot.isSelected = false;
                    }
                    this._editingCanvasSpline.insertControlPointAtStart(Vector3.
                        create().
                        initWithCoordinates([event.offsetX, event.offsetY, 0]).
                        transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                    );
                    canvasKnot = this._editingCanvasSpline.insertControlPointAtStart(FlowKnot.
                        create().
                        initWithCoordinates([event.offsetX, event.offsetY, 0]).
                        transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                    );
                    canvasKnot.isSelected = true;
                    this._previousKnot = canvasKnot;
                    this._editingCanvasSpline.insertControlPointAtStart(Vector3.
                        create().
                        initWithCoordinates([event.offsetX, event.offsetY, 0]).
                        transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                    );
                }
            }
            this._pointerX = event.pageX;
            this._pointerY = event.pageY;
        }
    },

    handleMousemove: {
        value: function (event, viewport) {
            var dX, dY,
                vector,
                vector2;

            if (!this._isFirstSelection && this._editingSpline) {
                dX = event.pageX - this._pointerX;
                dY = event.pageY - this._pointerY;
                if (this._insertMode === "appendToEnd") {
                    vector = this._editingSpline._data[this._editingSpline.length - 1]._data[1];
                    vector.translate(
                        Vector3.
                        create().
                        initWithCoordinates([dX, dY, 0]).
                        transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix)).
                        subtract(
                            Vector3.
                            create().
                            initWithCoordinates([0, 0, 0]).
                            transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                        )._data
                    );
                    if (this._editingSpline._data[this._editingSpline.length - 2] &&
                        (vector2 = this._editingSpline._data[this._editingSpline.length - 2]._data[2])) {
                        vector2._data = [
                            this._editingSpline._data[this._editingSpline.length - 1].getControlPoint(0).x * 2 - vector.x,
                            this._editingSpline._data[this._editingSpline.length - 1].getControlPoint(0).y * 2 - vector.y,
                            this._editingSpline._data[this._editingSpline.length - 1].getControlPoint(0).z * 2 - vector.z
                        ];
                    }
                } else {
                    vector = this._editingSpline._data[0]._data[2];
                    vector.translate(
                        Vector3.
                        create().
                        initWithCoordinates([dX, dY, 0]).
                        transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix)).
                        subtract(
                            Vector3.
                            create().
                            initWithCoordinates([0, 0, 0]).
                            transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                        )._data
                    );
                    if (this._editingSpline._data[1] &&
                        (vector2 = this._editingSpline._data[1]._data[1])) {
                        vector2._data = [
                            this._editingSpline._data[0].getControlPoint(3).x * 2 - vector.x,
                            this._editingSpline._data[0].getControlPoint(3).y * 2 - vector.y,
                            this._editingSpline._data[0].getControlPoint(3).z * 2 - vector.z
                        ];
                    }
                }
                this._pointerX = event.pageX;
                this._pointerY = event.pageY;
            }
        }
    }

});

exports.HelixTool = Montage.create(Montage, {

    start: {
        value: function (viewport) {
            viewport.unselect();
            viewport.scene.isSelected = true;
        }
    },

    stop: {
        value: function (viewport) {
        }
    },

    _pointerX: {
        value: null
    },

    _pointerY: {
        value: null
    },

    handleMousedown: {
        value: function (event, viewport, editor) {
            var canvasHelix = CanvasFlowHelix.create(),
                axisOriginPosition =
                    Vector3.
                    create().
                    initWithCoordinates([event.offsetX, event.offsetY, 0]).
                    transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix)).
                    _data;

            editor._helixCounter++;
            canvasHelix.name = "Helix " + editor._helixCounter;
            viewport.unselect();
            canvasHelix._x = axisOriginPosition[0];
            canvasHelix._y = axisOriginPosition[1];
            canvasHelix._z = axisOriginPosition[2];
            canvasHelix.update();
            viewport.scene.appendCanvasFlowHelix(canvasHelix);
            canvasHelix.isSelected = true;
            this.helix = canvasHelix;
            this._pointerX = event.pageX;
            this._pointerY = event.pageY;
        }
    },

    handleMousemove: {
        value: function (event, viewport) {
            var dX = event.pageX - this._pointerX,
                dY = event.pageY - this._pointerY;

            this.helix.translate(
                Vector3.
                create().
                initWithCoordinates([dX, dY, 0]).
                transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix)).
                subtract(
                    Vector3.
                    create().
                    initWithCoordinates([0, 0, 0]).
                    transformMatrix3d(viewport.inverseTransformMatrix(viewport.matrix))
                )._data
            );
            this._pointerX = event.pageX;
            this._pointerY = event.pageY;
        }
    }

});

exports.ZoomInTool = Montage.create(Montage, {

    start: {
        value: function (viewport) {
            viewport.classList.add("FlowViewPort-Zoom-In");
        }
    },

    stop: {
        value: function (viewport) {
            viewport.classList.remove("FlowViewPort-Zoom-In");
        }
    },

    _pointerX: {
        value: null
    },

    _pointerY: {
        value: null
    },

    handleMousedown: {
        value: function (event, viewPort, editor) {
            var x = event.offsetX - viewPort.translateX,
                y = event.offsetY - viewPort.translateY;

            viewPort.translateX -= x * 0.1;
            viewPort.translateY -= y * 0.1;

            viewPort.scale *= 1.1;
        }
    }
});

exports.ZoomOutTool = Montage.create(Montage, {

    start: {
        value: function (viewport) {
            viewport.classList.add("FlowViewPort-Zoom-Out");
        }
    },

    stop: {
        value: function (viewport) {
            viewport.classList.remove("FlowViewPort-Zoom-Out");
        }
    },

    _pointerX: {
        value: null
    },

    _pointerY: {
        value: null
    },

    handleMousedown: {
        value: function (event, viewPort, editor) {
            var x = event.offsetX - viewPort.translateX,
                y = event.offsetY - viewPort.translateY;

            viewPort.translateX -= x * -0.1;
            viewPort.translateY -= y * -0.1;

            viewPort.scale /= 1.1;
        }
    }

});

exports.RemoveTool = Montage.create(Montage, {

    start: {
        value: function (viewport) {
            viewport.unselect();
        }
    },

    stop: {
        value: function (viewport) {
        }
    },

    _pointerX: {
        value: null
    },

    _pointerY: {
        value: null
    },

    _shapeHighlighted: {
        value: null
    },

    handleHover: {
        value: function (event, viewport) {
            this._shapeHighlighted = viewport.findCloserShapeType("FlowSpline", event.offsetX, event.offsetY);

            viewport.unselect();

            if (this._shapeHighlighted) {
                this._shapeHighlighted.isSelected = true;
            }
        }
    },

    handleMousedown: {
        value: function (event, viewport, editor) {
            var selectedChild = viewport.findSelectedChild(event.offsetX, event.offsetY);

            if (selectedChild) {
                if (selectedChild.data.type === "FlowKnot") {
                    viewport.scene.removeCanvasFlowKnot(selectedChild);
                    viewport.dispatchEventNamed("flowPropertyChangeSet", true, true);
                }
            }
        }
    }

});
