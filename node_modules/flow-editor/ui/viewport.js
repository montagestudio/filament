var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.Viewport = Montage.create(Component, {

    _scene: {
        value: null
    },

    scene: {
        get: function () {
            return this._scene;
        },
        set: function (value) {
            var self = this,
                updated = function (event) {self.handleSceneUpdated(event);};

            this._scene = value;
            if (this._scene) {
                this._scene._data.addEventListener("vectorChange", updated, false);
                this._scene._data.addEventListener("bezierCurveChange", updated, false);
                this._scene._data.addEventListener("bezierSplineChange", updated, false);
                this._scene._data.addEventListener("cameraChange", updated, false);
                this._scene._data.addEventListener("sceneChange", updated, false);
                this._scene._data.addEventListener("selectionChange", updated, false);
                this._scene._data.addEventListener("visibilityChange", updated, false);
            }
            this.needsDraw = true;
        }
    },

    matrix: {
        value: [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]
    },

    handleSceneUpdated: {
        value: function () {
            this.needsDraw = true;
        }
    },

    _selectedTool: {
        value: null
    },

    selectedTool: {
        get: function () {
            return this._selectedTool;
        },
        set: function (value) {
            if (this._selectedTool && this._selectedTool.stop) {
                this._selectedTool.stop(this, this.editor);
            }
            this._selectedTool = value;
            if (this._selectedTool && this._selectedTool.start) {
                this._selectedTool.start(this, this.editor);
            }
        }
    },

    getObjectTransformMatrix: {
        value: function (object) {
            return [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            ];
        }
    },

    inverseTransformMatrix: {
        value: function (matrix) {
            var inverse = [],
                determinant;

            determinant =
                matrix[0] * (matrix[5] * matrix[10] - matrix[9] * matrix[6]) -
                matrix[4] * (matrix[10] * matrix[1] - matrix[9] * matrix[2]) +
                matrix[8] * (matrix[1] * matrix[6] - matrix[5] * matrix[2]);

            inverse[0] = (matrix[5] * matrix[10] - matrix[9] * matrix[6]) / determinant;
            inverse[1] = (matrix[9] * matrix[2] - matrix[1] * matrix[10]) / determinant;
            inverse[2] = (matrix[1] * matrix[6] - matrix[5] * matrix[2]) / determinant;
            inverse[4] = (matrix[8] * matrix[6] - matrix[4] * matrix[10]) / determinant;
            inverse[5] = (matrix[0] * matrix[10] - matrix[8] * matrix[2]) / determinant;
            inverse[6] = (matrix[2] * matrix[4] - matrix[0] * matrix[6]) / determinant;
            inverse[8] = (matrix[4] * matrix[9] - matrix[8] * matrix[5]) / determinant;
            inverse[9] = (matrix[8] * matrix[1] - matrix[0] * matrix[9]) / determinant;
            inverse[10] = (matrix[0] * matrix[5] - matrix[4] * matrix[1]) / determinant;
            inverse[12] =
                -matrix[12] * inverse[0] -
                matrix[13] * inverse[4] -
                matrix[14] * inverse[8];
            inverse[13] =
                -matrix[12] * inverse[1] -
                matrix[13] * inverse[5] -
                matrix[14] * inverse[9];
            inverse[14] =
                -matrix[12] * inverse[2] -
                matrix[13] * inverse[6] -
                matrix[14] * inverse[10];

            return inverse;
        }
    },

    translateX: {
        get: function () {
            return this.matrix[12];
        },
        set: function (value) {
            this.matrix[12] = value;
            this.needsDraw = true;
        }
    },

    translateY: {
        get: function () {
            return this.matrix[13];
        },
        set: function (value) {
            this.matrix[13] = value;
            this.needsDraw = true;
        }
    },

    scale: {
        get: function () {
            var indices = [0, 1, 2, 4, 5, 6, 8, 9, 10],
                i = 0;

            while (!this.matrix[indices[i]]) {
                i++;
            }
            return this.matrix[indices[i]];
        },
        set: function (value) {
            var indices = [0, 1, 2, 4, 5, 6, 8, 9, 10],
                i;

            for (i = 0; i < indices.length; i++) {
                if (this.matrix[indices[i]]) {
                    this.matrix[indices[i]] = value;
                }
            }
            this.needsDraw = true;
        }
    },

    enterDocument: {
        value: function () {
            this._element.addEventListener("mousemove", this, true);
        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._element.addEventListener("mousedown", this, false);
            this._element.addEventListener("mousewheel", this, false);
        }
    },

    _selection: {
        value: null
    },

    selection: {
        get: function () {
            return this._selection;
        },
        set: function (value) {
            this._selection = value;
            this.needsDraw = true;
        }
    },

    captureMousemove: {
        value: function (event) {
            if (this._selectedTool && this._selectedTool.handleHover) {
                this._selectedTool.handleHover(event, this);
            }
        }
    },

    handleMousedown: {
        value: function (event) {
            if (this._selectedTool) {
                //this.editor.sceneWillChange();
                if (this._selectedTool.handleMousedown) {
                    this._selectedTool.handleMousedown(event, this, this.editor);
                }
                document.addEventListener("mousemove", this, false);
                document.addEventListener("mouseup", this, false);
                event.preventDefault();
            }
        }
    },

    handleMousemove: {
        value: function (event) {
            if (this._selectedTool) {
                if (this._selectedTool.handleMousemove) {
                    this._selectedTool.handleMousemove(event, this, this.editor);
                }
            }
        }
    },

    handleMouseup: {
        value: function (event) {
            if (this._selectedTool) {
                if (this._selectedTool.handleMouseup) {
                    this._selectedTool.handleMouseup(event, this, this.editor);
                }
            }
            document.removeEventListener("mousemove", this, false);
            document.removeEventListener("mouseup", this, false);
            //this.editor.sceneDidChange();
        }
    },

    handleMousewheel: {
        value: function (event) {
            var x = event.offsetX - this.translateX,
                y = event.offsetY - this.translateY;

            this.translateX -= x * event.wheelDelta / 10000;
            this.translateY -= y * event.wheelDelta / 10000;
            this.scale *= 1 + event.wheelDelta / 10000;
            event.preventDefault();
        }
    },

    /*_isShowingSelection: {
        value: false
    },

    isShowingSelection: {
        get: function () {
            return this._isShowingSelection;
        },
        set: function (value) {
            this._isShowingSelection = value;
            this.needsDraw = true;
        }
    },

    _isShowingControlPoints: {
        value: false
    },

    isShowingControlPoints: {
        get: function () {
            return this._isShowingControlPoints;
        },
        set: function (value) {
            this._isShowingControlPoints = value;
            this.needsDraw = true;
        }
    }*/

    //////////////////////////////////


/*    scene: {
        value: null
    },

    _drawingShape: {
        value: null
    },

    _tool: {
        value: "arrow"
    },

    tool: {
        get: function () {
            return this._tool;
        },
        set: function (value) {
            this._tool = value;
            this._drawingShape = null;
            this.needsDraw = true;
        }
    },

    _context: {
        value: null
    },

    _width: {
        value: null
    },

    _height: {
        value: null
    },

    selectedShape: {
        value: null
    },

    findSelectedShape: {
        value: function (x, y) {
            var length = this.scene._data.length,
                imageData,
                shape,
                i;

            this._element.width = this._width;
            this._element.height = this._height;
            for (i = length - 1; i >= 0; i--) {
                shape = this.scene._data[i];
                this._context.beginPath();
                this.drawShape(shape);
                this._context.fill();
                this._context.lineWidth = 16;
                this._context.stroke();
                imageData = this._context.getImageData(x, y, 1, 1);
                if (imageData.data[3] > 0) {
                    this.draw();
                    return shape;
                }
            }
            this.draw();
            return null;
        }
    },

    _isDragging: {
        value: false
    },

    _pointerX: {
        value: false
    },

    _pointerY: {
        value: false
    },

    isDraggingScale: {
        value: false
    },

    scale: {
        value: false
    },

    angle: {
        value: false
    },

    cX: {
        value: false
    },

    cY: {
        value: false
    },

    captureMousedown: {
        value: function (event) {
            this.needsDraw = true;
            this.isDraggingScale = false;
            if ((this.tool === "arrow") && this.selectedShape) {
                var boundaries = this.selectedShapeAxisAlignedBoundaries;

                this.scale = null;
                if ((event.layerX >= boundaries[0].min - 4) && (event.layerX <= boundaries[0].min + 4)) {
                    if ((event.layerY >= boundaries[1].min - 4) && (event.layerY <= boundaries[1].min + 4)) {
                        this.isDraggingScale = true;
                        this.scale = "tl";
                    }
                    if ((event.layerY >= boundaries[1].max - 4) && (event.layerY <= boundaries[1].max + 4)) {
                        this.isDraggingScale = true;
                        this.scale = "bl";
                    }
                }
                if ((event.layerX >= boundaries[0].max - 4) && (event.layerX <= boundaries[0].max + 4)) {
                    if ((event.layerY >= boundaries[1].min - 4) && (event.layerY <= boundaries[1].min + 4)) {
                        this.isDraggingScale = true;
                        this.scale = "tr";
                    }
                    if ((event.layerY >= boundaries[1].max - 4) && (event.layerY <= boundaries[1].max + 4)) {
                        this.isDraggingScale = true;
                        this.scale = "br";
                    }
                }
                if (!this.scale) {
                    this.cX = (boundaries[0].max + boundaries[0].min) / 2,
                    this.cY = (boundaries[1].max + boundaries[1].min) / 2;

                    if ((event.layerX >= boundaries[0].min - 20) && (event.layerX <= boundaries[0].min + 20)) {
                        if ((event.layerY >= boundaries[1].min - 20) && (event.layerY <= boundaries[1].min + 20)) {
                            this.isDraggingScale = true;
                            this.scale = "r";
                            this.angle = Math.atan2(event.layerY - this.cY, event.layerX - this.cX);
                        }
                        if ((event.layerY >= boundaries[1].max - 20) && (event.layerY <= boundaries[1].max + 20)) {
                            this.isDraggingScale = true;
                            this.scale = "r";
                            this.angle = Math.atan2(event.layerY - this.cY, event.layerX - this.cX);
                        }
                    }
                    if ((event.layerX >= boundaries[0].max - 20) && (event.layerX <= boundaries[0].max + 20)) {
                        if ((event.layerY >= boundaries[1].min - 20) && (event.layerY <= boundaries[1].min + 20)) {
                            this.isDraggingScale = true;
                            this.scale = "r";
                            this.angle = Math.atan2(event.layerY - this.cY, event.layerX - this.cX);
                        }
                        if ((event.layerY >= boundaries[1].max - 20) && (event.layerY <= boundaries[1].max + 20)) {
                            this.isDraggingScale = true;
                            this.scale = "r";
                            this.angle = Math.atan2(event.layerY - this.cY, event.layerX - this.cX);
                        }
                    }
                }
            }
            if ((this.tool === "convert") && this.selectedShape) {
                var self = this;
                this.selectedShape.forEach(function (bezier, index) {
                    var i;

                    for (i = 0; i < 4; i++) {
                        if (bezier.getControlPoint(i) &&
                            (event.layerX >= bezier.getControlPoint(i).x - 5) &&
                            (event.layerX <= bezier.getControlPoint(i).x + 5) &&
                            (event.layerY >= bezier.getControlPoint(i).y - 5) &&
                            (event.layerY <= bezier.getControlPoint(i).y + 5)) {
                            self.isDraggingScale = true;
                            self.scale = "handler";
                            self.handler = bezier.getControlPoint(i);
                        }
                    }
                });
            }
            if ((this.tool === "remove") && this.selectedShape) {
                var self = this,
                    removeIndex = null,
                    i;

                this.selectedShape.forEach(function (bezier, index) {
                    var i;

                    for (i = 0; i < 1; i++) {
                        if (bezier.getControlPoint(i) &&
                            (event.layerX >= bezier.getControlPoint(i).x - 5) &&
                            (event.layerX <= bezier.getControlPoint(i).x + 5) &&
                            (event.layerY >= bezier.getControlPoint(i).y - 5) &&
                            (event.layerY <= bezier.getControlPoint(i).y + 5)) {
                            removeIndex = index;
                        }
                    }
                });
                if (removeIndex !== null) {
                    var tmp = [],
                        length = this.selectedShape.length;

                    for (i = removeIndex + 1; i < length; i++) {
                        tmp.push(this.selectedShape.getBezierCurve(i));
                    }
                    this.selectedShape.getBezierCurve(removeIndex - 1).setControlPoint(2, this.selectedShape.getBezierCurve(removeIndex).getControlPoint(2));
                    this.selectedShape.getBezierCurve(removeIndex - 1).setControlPoint(3, tmp[0].getControlPoint(0));
                    for (i = removeIndex; i < length; i++) {
                        this.selectedShape.popBezierCurve();
                    }
                    for (i = removeIndex + 1; i < length; i++) {
                        this.selectedShape.pushBezierCurve(tmp[i - removeIndex - 1]);
                    }
                }
            } else if (!this.isDraggingScale) {
                this.selectedShape = this.findSelectedShape(event.layerX, event.layerY);
            }
            if (this.tool === "add") {
                var closerPoint,
                    i,
                    best,
                    minDistance = Infinity;

                this._draggingHandlers = null;
                for (i = 0; i < this.scene.length; i++) {
                    closerPoint = this.scene._data[i].getCloserPointTo(
                        Vector3.create().initWithCoordinates([
                            event.layerX,
                            event.layerY,
                            0
                        ])
                    );
                    if (closerPoint.distance < 5 && closerPoint.distance < minDistance) {
                        minDistance = closerPoint.distance;
                        this.scene._data[i].splitCurveAtPosition(
                            closerPoint.index,
                            closerPoint.t
                        );
                        this.selectedShape = this.scene._data[i];
                        this._draggingHandlers = {
                            previousHandler: this.selectedShape.getBezierCurve(closerPoint.index).getControlPoint(this.selectedShape.getBezierCurve(closerPoint.index).order - 1),
                            knot: this.selectedShape.getBezierCurve(closerPoint.index + 1).getControlPoint(0),
                            nextHandler: this.selectedShape.getBezierCurve(closerPoint.index + 1).getControlPoint(1),
                        }
                    }
                }
                this.needsDraw = true;
            }
            if (this.tool === "pen") {
                var shapeIndex,
                    bezierCurve,
                    controlPoint,
                    previousHandler;

                controlPoint = Vector3.create().initWithCoordinates([event.layerX, event.layerY,0]);
                if (!this._drawingShape) {
                    shapeIndex = this.scene._data.push(
                        Shape.create().init()
                    ) - 1;
                    this.selectedShape = this.scene._data[shapeIndex];
                    this.selectedShape.fillColor = "hsl(" + [Math.random() * 360, (Math.random() * 60 + 40) + "%", (Math.random() * 25 + 75) + "%"] + ")";
                } else {
                    this.selectedShape = this._drawingShape;
                    this.selectedShape.getBezierCurve(this.selectedShape.length - 1).pushControlPoint(controlPoint.clone());
                    this.selectedShape.getBezierCurve(this.selectedShape.length - 1).pushControlPoint(controlPoint.clone());
                }
                bezierCurve = BezierCurve.create().init();
                bezierCurve.pushControlPoint(controlPoint.clone());
                bezierCurve.pushControlPoint(controlPoint.clone());
                this.selectedShape.pushBezierCurve(bezierCurve);
                this._draggingHandlers = {
                    previousHandler: this._drawingShape ? this.selectedShape.getBezierCurve(this.selectedShape.length - 2).getControlPoint(2) : null,
                    knot: this.selectedShape.getBezierCurve(this.selectedShape.length - 1).getControlPoint(0),
                    nextHandler: this.selectedShape.getBezierCurve(this.selectedShape.length - 1).getControlPoint(1),
                }
                this._drawingShape = this.selectedShape;
            }
            if (this.selectedShape) {
                this._isDragging = true;
            }
            this._pointerX = event.pageX;
            this._pointerY = event.pageY;
            document.addEventListener("mousemove", this, true);
            document.addEventListener("mouseup", this, true);
            event.preventDefault();
        }
    },

    captureMousemove: {
        value: function (event) {
            var dX = event.pageX - this._pointerX,
                dY = event.pageY - this._pointerY;

            if (this._isDragging) {
                if (this.isDraggingScale) {
                    if (this.tool !== "convert") {
                        var boundaries = this.selectedShapeAxisAlignedBoundaries,
                            x, y,
                            width = boundaries[0].max - boundaries[0].min,
                            height = boundaries[1].max - boundaries[1].min;

                        if (this.scale === "tl") {
                            x = boundaries[0].min + dX, y = boundaries[1].min + dY,
                            this.selectedShape.translate([dX - x, dY - y]);
                            this.selectedShape.scale([(boundaries[0].max - x) / width, (boundaries[1].max - y) / height]);
                            this.selectedShape.translate([x, y]);
                        }
                        if (this.scale === "bl") {
                            x = boundaries[0].min + dX, y = boundaries[1].min,
                            this.selectedShape.translate([dX - x, -y]);
                            this.selectedShape.scale([(boundaries[0].max - x) / width, (boundaries[1].max - y + dY) / height]);
                            this.selectedShape.translate([x, y]);
                        }
                        if (this.scale === "tr") {
                            x = boundaries[0].min, y = boundaries[1].min + dY,
                            this.selectedShape.translate([-x, dY - y]);
                            this.selectedShape.scale([(boundaries[0].max - x + dX) / width, (boundaries[1].max - y) / height]);
                            this.selectedShape.translate([x, y]);
                        }
                        if (this.scale === "br") {
                            x = boundaries[0].min, y = boundaries[1].min,
                            this.selectedShape.translate([-x, -y]);
                            this.selectedShape.scale([(boundaries[0].max - x + dX) / width, (boundaries[1].max - y + dY) / height]);
                            this.selectedShape.translate([x, y]);
                        }
                        if (this.scale === "r") {
                            var angle = Math.atan2(event.layerY - this.cY, event.layerX - this.cX);

                            this.selectedShape.translate([-this.cX, -this.cY]);
                            this.selectedShape.rotate(angle - this.angle);
                            this.selectedShape.translate([this.cX, this.cY]);
                            this.angle = angle;
                        }
                    }
                    if (this.scale === "handler") {
                        this.handler.translate([dX, dY]);
                    }
                } else {
                    if (this.tool === "add" && this._draggingHandlers) {
                        this._draggingHandlers.nextHandler.setCoordinates([event.layerX, event.layerY]);
                        this._draggingHandlers.previousHandler.setCoordinates([
                            2 * this._draggingHandlers.knot.x - event.layerX,
                            2 * this._draggingHandlers.knot.y - event.layerY,
                        ]);
                    } else {
                        if (this.tool === "pen") {
                            this._draggingHandlers.nextHandler.setCoordinates([event.layerX, event.layerY]);
                            if (this._draggingHandlers.previousHandler) {
                                this._draggingHandlers.previousHandler.setCoordinates([
                                    2 * this._draggingHandlers.knot.x - event.layerX,
                                    2 * this._draggingHandlers.knot.y - event.layerY,
                                ]);
                            }
                        } else {
                            this.selectedShape.translate(
                                Vector3.
                                create().
                                initWithCoordinates([dX, dY, 0]).
                                transformMatrix3d(this.inverseTransformMatrix(this.matrix)).
                                subtract(
                                    Vector3.
                                    create().
                                    initWithCoordinates([0, 0, 0]).
                                    transformMatrix3d(this.inverseTransformMatrix(this.matrix))
                                )._data
                            );
                        }
                    }
                }
                this.needsDraw = true;
            }
            this._pointerX = event.pageX;
            this._pointerY = event.pageY;
        }
    },

    captureMouseup: {
        value: function (event) {
            this._isDragging = false;
            document.removeEventListener("mousemove", this, true);
            document.removeEventListener("mouseup", this, true);
        }
    }*/

});
