var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Viewport = require("ui/viewport").Viewport;

exports.FlowViewport = Montage.create(Viewport, {

    selection: {
        get: function () {
            if (this.scene) {
                return this.scene.getSelection(this.scene);
            } else {
                return null;
            }
        }
    },

    unselect: {
        value: function () {
            this.scene.unselect();
        }
    },

    findSelectedShape: {
        value: function (x, y) {
            return this.scene.findSelectedShape(x, y, this.matrix);
        }
    },

    findPathToNode: {
        value: function (node) {
            return this.scene.findPathToNode(node);
        }
    },

    findSelectedChild: {
        value: function (x, y) {
            // TODO: rename to findCloserVisibleLeaf
            return this.scene.findSelectedLeaf(x, y, this.matrix);
        }
    },

    findCloserShapeType: {
        value: function (type, x, y) {
            return this.scene.findCloserShapeType(type, x, y, this.matrix);
        }
    },

    enterDocument: {
        value: function (firstTime) {
            Viewport.enterDocument.call(this);
            this._width = this._element.offsetWidth;
            this._height = this._element.offsetHeight;
            if (firstTime) {
                this.translateX = this._width / 2;
                this.translateY = this._height / 2;
                this._context = this._element.getContext("2d");
                this._element.addEventListener("mousedown", this, true);
                window.addEventListener("resize", this, false);
            }
        }
    },

    handleResize: {
        value: function (event) {
            this.needsDraw = true;
        }
    },

    willDraw: {
        value: function () {
            this._width = this._element.clientWidth;
            this._height = this._element.clientHeight;
        }
    },

    /*drawShapeSelectionHandlers: {
        value: function () {
            var self = this;

            if (this.selection && this.selection[0] && this.selection[0].type === "FlowSpline") {
                var shape = this.selection[0].clone().transformMatrix3d(this.matrix);

                shape.forEach(function (bezier) {
                    var i;

                    for (i = 0; i < 2; i++) {
                        self._context.lineWidth = i?1:7;
                        self._context.strokeStyle = i?"red":"rgba(255,255,255,0.15)";
                        if (bezier.getControlPoint(0) && bezier.getControlPoint(1)) {
                            self._context.beginPath();
                            self._context.moveTo(
                                bezier.getControlPoint(0).x,
                                bezier.getControlPoint(0).y
                            );
                            self._context.lineTo(
                                bezier.getControlPoint(1).x,
                                bezier.getControlPoint(1).y
                            );
                            self._context.stroke();
                        }
                        if (bezier.getControlPoint(2) && bezier.getControlPoint(3)) {
                            self._context.beginPath();
                            self._context.moveTo(
                                bezier.getControlPoint(2).x,
                                bezier.getControlPoint(2).y
                            );
                            self._context.lineTo(
                                bezier.getControlPoint(3).x,
                                bezier.getControlPoint(3).y
                            );
                            self._context.stroke();
                        }
                    }
                });
                shape.forEach(function (bezier, index) {
                    if (!index) {
                        if (bezier.getControlPoint(0)) {
                            self._context.fillStyle = "white";
                            self._context.fillRect(
                                bezier.getControlPoint(0).x - 5 | 0,
                                bezier.getControlPoint(0).y - 5 | 0,
                                9,
                                9
                            );
                            self._context.fillStyle = "black";
                            self._context.fillRect(
                                bezier.getControlPoint(0).x - 4 | 0,
                                bezier.getControlPoint(0).y - 4 | 0,
                                7,
                                7
                            );
                        }
                    }
                    if (bezier.getControlPoint(3)) {
                        self._context.fillStyle = "white";
                        self._context.fillRect(
                            bezier.getControlPoint(3).x - 5 | 0,
                            bezier.getControlPoint(3).y - 5 | 0,
                            9,
                            9
                        );
                        self._context.fillStyle = "black";
                        self._context.fillRect(
                            bezier.getControlPoint(3).x - 4 | 0,
                            bezier.getControlPoint(3).y - 4 | 0,
                            7,
                            7
                        );
                    }
                    if (bezier.getControlPoint(1)) {
                        self._context.fillStyle = "white";
                        self._context.fillRect(
                            bezier.getControlPoint(1).x - 5 | 0,
                            bezier.getControlPoint(1).y - 5 | 0,
                            9,
                            9
                        );
                        self._context.fillStyle = "red";
                        self._context.fillRect(
                            bezier.getControlPoint(1).x - 4 | 0,
                            bezier.getControlPoint(1).y - 4 | 0,
                            7,
                            7
                        );
                    }
                    if (bezier.getControlPoint(2)) {
                        self._context.fillStyle = "white";
                        self._context.fillRect(
                            bezier.getControlPoint(2).x - 5 | 0,
                            bezier.getControlPoint(2).y - 5 | 0,
                            9,
                            9
                        );
                        self._context.fillStyle = "red";
                        self._context.fillRect(
                            bezier.getControlPoint(2).x - 4 | 0,
                            bezier.getControlPoint(2).y - 4 | 0,
                            7,
                            7
                        );
                    }
                });
            }
        }
    },*/

    drawShapeSelection: {
        value: function () {
            if (this.selection && this.selection[0]) {
                var shape = this.selection[0].clone().transformMatrix3d(this.matrix),
                    self = this,
                    needsFill = false;

                this._context.globalAlpha = 0.7;
                this._context.strokeStyle = "cyan";
                this._context.fillStyle = this.selection[0].fillColor;
                this._context.lineWidth = 1;
                this._context.beginPath();
                shape.forEach(function (bezier, index) {
                    if (bezier.isComplete) {
                        if (!index) {
                            self._context.moveTo(
                                bezier.getControlPoint(0).x,
                                bezier.getControlPoint(0).y
                            );
                        }
                        self._context.bezierCurveTo(
                            bezier.getControlPoint(1).x,
                            bezier.getControlPoint(1).y,
                            bezier.getControlPoint(2).x,
                            bezier.getControlPoint(2).y,
                            bezier.getControlPoint(3).x,
                            bezier.getControlPoint(3).y
                        );
                        needsFill = true;
                    }
                });
                if (needsFill) {
                    this._context.fill();
                    this._context.stroke();
                }
                this._context.globalAlpha = 1;
            }
        }
    },

    selectedShapeAxisAlignedBoundaries: {
        value: null
    },

    /*drawShapeSelectionBoundingRectangle: {
        value: function () {
            if (this.selection && this.selection[0]) {
                if (this.selection[0].getTransformedAxisAlignedBoundaries) {
                    var boundaries = this.selectedShapeAxisAlignedBoundaries = this.selection[0].getTransformedAxisAlignedBoundaries(this.matrix),
                        i, k = 9 - (Date.now() / 100 | 0) % 10, e = k, self = this;

                    for (i = boundaries[0].min|0; i < boundaries[0].max|0; i++) {
                        this._context.fillStyle = (e%10 < 5) ? "black" : "white";
                        this._context.fillRect(i, boundaries[1].min|0, 1, 1);
                        e++;
                    }
                    for (i = boundaries[1].min|0; i < boundaries[1].max|0; i++) {
                        this._context.fillStyle = (e%10 < 5) ? "black" : "white";
                        this._context.fillRect(boundaries[0].max|0, i, 1, 1);
                        e++;
                    }
                    e = k;
                    for (i = boundaries[1].min|0; i < boundaries[1].max|0; i++) {
                        this._context.fillStyle = (e%10 < 5) ? "black" : "white";
                        this._context.fillRect(boundaries[0].min|0, i, 1, 1);
                        e++;
                    }
                    for (i = boundaries[0].min|0; i < boundaries[0].max|0; i++) {
                        this._context.fillStyle = (e%10 < 5) ? "black" : "white";
                        this._context.fillRect(i, boundaries[1].max|0, 1, 1);
                        e++;
                    }
                    window.setTimeout(function () {
                        self.needsDraw = true;
                    }, 100);
                }
            }
        }
    },*/

    drawShapeSelectionScale: {
        value: function () {
            if (this.selectedShape && this.tool === "arrow") {
                var boundaries = this.selectedShapeAxisAlignedBoundaries;

                this._context.strokeStyle = "black";
                this._context.lineWidth = "black";
                this._context.strokeRect((boundaries[0].min|0) - 3.5, (boundaries[1].min|0) - 3.5, 8, 8);
                this._context.strokeRect((boundaries[0].min|0) - 3.5, (boundaries[1].max|0) - 3.5, 8, 8);
                this._context.strokeRect((boundaries[0].max|0) - 3.5, (boundaries[1].min|0) - 3.5, 8, 8);
                this._context.strokeRect((boundaries[0].max|0) - 3.5, (boundaries[1].max|0) - 3.5, 8, 8);
            }
        }
    },

    draw: {
        value: function () {
            var length = this.scene.length,
                i;

            this._element.width = this._width;
            this._element.height = this._height;
            this.scene.canvas = this._element;
            this.scene.draw(this.matrix);
            /*this.scene._data.sort(function (a, b) {
                return a.zIndex - b.zIndex;
            });
            for (i = 0; i < length; i++) {
                this.scene._data[i].canvas = this._element;
                this.scene._data[i].draw(this.matrix);
                if (this.scene._data[i].children.length) {
                    var j;

                    for (j = 0; j < this.scene._data[i].children.length; j++) {
                        this.scene._data[i].children[j].draw(this.matrix);
                    }
                }
            }*/
            /*if (this.isShowingControlPoints) {
                this.drawShapeSelectionHandlers();
            }
            if (this.isShowingSelection) {
                this.drawShapeSelectionBoundingRectangle();
            }*/
            /*this.canvasCross.draw(this.matrix);
            this.canvasCamera.draw(this.matrix);*/
        }
    }
});
