var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component,
    Viewport = require("ui/viewport").Viewport,
    ViewPortConfig = require("core/configuration").FlowEditorConfig.viewPort,
    Vector3 = require("ui/pen-tool-math").Vector3;

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

    viewPort: {
        value: null
    },

    _type: {
        value: null
    },

    type: {
        set: function (type) {
            var matrixList = ViewPortConfig.matrix;

            if (matrixList.hasOwnProperty(type)) {
                this.matrix = matrixList[type].slice(0);
                this._type = type;

                this.needsDraw = true;
            }
        },
        get: function () {
            return this._type;
        }
    },

    types: {
        get: function () {
            return Object.keys(ViewPortConfig.types);
        }
    },

    unselect: {
        value: function () {
            this.scene.unselect();
        }
    },

    _originNeedsCenter: {
        value: null
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

            if (firstTime) {
                this._context = this._element.getContext("2d");
                this._element.addEventListener("mousedown", this, true);
                this._originNeedsCenter = true;

                window.addEventListener("resize", this, false);
                window.addEventListener("scroll", this, false);
            }
        }
    },

    zoomExtents: {
        value: function () {
            if (this.scene) {
                var boundaries = this.scene.getRecursiveAxisAlignedBoundaries(),
                    scaleX = this._width / (boundaries[0].max - boundaries[0].min),
                    scaleY = this._height / (boundaries[1].max - boundaries[1].min),
                    scaleZ = this._height / (boundaries[2].max - boundaries[2].min),
                    scale = Math.min(scaleX, scaleY, scaleZ) * 0.8,
                    center = {
                        x: (boundaries[0].max + boundaries[0].min) / 2,
                        y: (boundaries[1].max + boundaries[1].min) / 2,
                        z: (boundaries[2].max + boundaries[2].min) / 2
                    };

                if (scale === Infinity || scale === -Infinity) {
                    scale = .2;
                }

                this.scale = scale;

                switch (this.type) {

                    case ViewPortConfig.types.front:
                        this.translateX = (this._width / 2) - (center.x * scale);
                        this.translateY = (this._height / 2) - (center.y * scale);
                        break;

                    case ViewPortConfig.types.top:
                        this.translateX = (this._width / 2) - (center.x * scale);
                        this.translateY = (this._height / 2) - (center.z * scale);
                        break;

                    case ViewPortConfig.types.profile:
                        this.translateX = (this._width / 2) - (center.z * scale);
                        this.translateY = (this._height / 2) - (center.y * scale);
                        break;
                }
            }
        }
    },

    handleResize: {
        value: function (event) {
            this._originNeedsCenter = true;
            this._needsToMeasureViewportPositionInDocument = true;
            this.needsDraw = true;
        }
    },

    handleScroll: {
        value: function (event) {
            this._needsToMeasureViewportPositionInDocument = true;
            this.needsDraw = true;
        }
    },

    getCoordinatesForMouseEvent: {
        value: function (event) {
            var vector = Vector3.create().
                    initWithCoordinates([
                        event.pageX - window.pageXOffset - this._innerContentLeft,
                        event.pageY - window.pageYOffset - this._innerContentTop,
                        0
                    ]).
                    transformMatrix3d(this.inverseTransformMatrix(this.matrix));

            return [
                vector.getCoordinate(0),
                vector.getCoordinate(1),
                vector.getCoordinate(2)
            ];
        }
    },

    _needsToMeasureViewportPositionInDocument: {
        value: true
    },

    willDraw: {
        value: function () {
            this._width = this._element.clientWidth;
            this._height = this._element.clientHeight;

            if (this._originNeedsCenter) {
                this.translateX = this._width / 2;
                this.translateY = this._height / 2;
                this._originNeedsCenter = false;
            }
            if (this._needsToMeasureViewportPositionInDocument) {
                var boundingClientRect = this._element.getBoundingClientRect(),
                    computedStyle = window.getComputedStyle(this._element),
                    borderTop = parseInt(computedStyle.getPropertyValue("border-top-width"), 10);
                    borderLeft = parseInt(computedStyle.getPropertyValue("border-left-width"), 10);
                    paddingTop = parseInt(computedStyle.getPropertyValue("padding-top"), 10),
                    paddingLeft = parseInt(computedStyle.getPropertyValue("padding-left"), 10);

                this._innerContentTop = boundingClientRect.top + borderTop + paddingTop;
                this._innerContentLeft = boundingClientRect.left + borderLeft + paddingLeft;
                this._needsToMeasureViewportPositionInDocument = false;
            }
        }
    },

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
            this.scene.draw(this.matrix, this.type);
        }
    }
});
