var Montage = require("montage").Montage,
    Scene = require("ui/pen-tool-math").Scene,
    FlowSpline = require("ui/flow-spline").FlowSpline,
    CanvasFlowSpline = require("ui/flow-spline").CanvasFlowSpline,
    CanvasShape = require("ui/canvas-shape").CanvasShape;

var Grid = exports.Grid = Montage.create(Scene, {

    gridlineEach: {
        value: 10
    },

    subdivisions: {
        value: 4
    },

    gridlineColor: {
        value: "rgba(0, 0, 0, .07)"
    },

    subdivisionColor: {
        value: "rgba(0, 0, 0, .3)"
    },

    type: {
        value: "FlowGrid"
    },

    _isSelectionEnabled: {
        value: null
    },

    isSelectionEnabled: {
        get: function () {
            return this._isSelectionEnabled;
        },
        set: function (value) {
            this._isSelectionEnabled = value;
            this.dispatchEventNamed("sceneChange", true, true);
        }
    },

    _hasSelectedIndexScrolling: {
        value: null
    },

    hasSelectedIndexScrolling: {
        get: function () {
            return this._hasSelectedIndexScrolling;
        },
        set: function (value) {
            this._hasSelectedIndexScrolling = value;
            this.dispatchEventNamed("sceneChange", true, true);
        }
    },

    _scrollingTransitionDuration: {
        value: null
    },

    scrollingTransitionDuration: {
        get: function () {
            return this._scrollingTransitionDuration;
        },
        set: function (value) {
            this._scrollingTransitionDuration = value;
            this.dispatchEventNamed("sceneChange", true, true);
        }
    },

    _scrollingTransitionTimingFunction: {
        value: null
    },

    scrollingTransitionTimingFunction: {
        get: function () {
            return this._scrollingTransitionTimingFunction;
        },
        set: function (value) {
            this._scrollingTransitionTimingFunction = value;
            this.dispatchEventNamed("sceneChange", true, true);
        }
    },

    _selectedIndexScrollingOffset: {
        value: null
    },

    selectedIndexScrollingOffset: {
        get: function () {
            return this._selectedIndexScrollingOffset;
        },
        set: function (value) {
            this._selectedIndexScrollingOffset = value;
            this.dispatchEventNamed("sceneChange", true, true);
        }
    },

    _scrollVectorX: {
        value: null
    },

    scrollVectorX: {
        get: function () {
            return this._scrollVectorX;
        },
        set: function (value) {
            this._scrollVectorX = value;
            this.dispatchEventNamed("sceneChange", true, true);
        }
    },

    _scrollVectorY: {
        value: null
    },

    scrollVectorY: {
        get: function () {
            return this._scrollVectorY;
        },
        set: function (value) {
            this._scrollVectorY = value;
            this.dispatchEventNamed("sceneChange", true, true);
        }
    }
});

exports.CanvasGrid = Montage.create(CanvasShape, {

    name: {
        value: "Flow"
    },

    constructor: {
        value: function () {
            CanvasShape.constructor.call(this);
            this.defineBindings({
                "gridlineEach": {
                    "<->": "data.gridlineEach",
                    source: this
                },
                "subdivisions": {
                    "<->": "data.subdivisions",
                    source: this
                },
                "gridlineColor": {
                    "<->": "data.gridlineColor",
                    source: this
                },
                "subdivisionColor": {
                    "<->": "data.subdivisionColor",
                    source: this
                }
            });
        }
    },

    appendCamera: {
        value: function (canvasFlowCamera) {
            this._data.pushShape(canvasFlowCamera._data);
            this.appendChild(canvasFlowCamera);
        }
    },

    appendFlowSpline: {
        value: function (flowSpline) {
            var canvasFlowSpline = CanvasFlowSpline.create().initWithData(flowSpline);

            this._data.pushShape(flowSpline);
            this.appendChild(canvasFlowSpline);
            return canvasFlowSpline;
        }
    },

    insertFlowSpline: {
        value: function (flowSpline, position) {
            var canvasFlowSpline = CanvasFlowSpline.create().initWithData(flowSpline);

            this._data.insertShape(flowSpline, position);
            this.insertChild(canvasFlowSpline, position);
            return canvasFlowSpline;
        }
    },

    removeCanvasFlowSpline: {
        value: function (canvasFlowSpline) {
            this._data.removeShape(canvasFlowSpline._data);
            canvasFlowSpline.delete();
        }
    },

    // TODO: remove this and create appendFlowHelix in the same way as appendFlowSpline
    appendCanvasFlowHelix: {
        value: function (canvasFlowHelix) {
            this._data.pushShape(canvasFlowHelix._data);
            this.appendChild(canvasFlowHelix);
        }
    },

    insertCanvasFlowHelix: {
        value: function (canvasFlowHelix, position) {
            this._data.insertShape(canvasFlowHelix._data, position);
            this.insertChild(canvasFlowHelix, position);
        }
    },

    removeCanvasFlowHelix: {
        value: function (canvasFlowHelix) {
            this._data.removeShape(canvasFlowHelix._data);
            canvasFlowHelix.delete();
        }
    },

    _gridlineEach: {
        value: null
    },

    gridlineEach: {
        get: function () {
            return this._gridlineEach;
        },
        set: function (value) {
            this._gridlineEach = value;
            this.needsDraw = true;
        }
    },

    _subdivisions: {
        value: null
    },

    subdivisions: {
        get: function () {
            return this._subdivisions;
        },
        set: function (value) {
            this._subdivisions = value;
            this.needsDraw = true;
        }
    },

    _gridlineColor: {
        value: null
    },

    gridlineColor: {
        get: function () {
            return this._gridlineColor;
        },
        set: function (value) {
            this._gridlineColor = value;
            this.needsDraw = true;
        }
    },

    _subdivisionColor: {
        value: null
    },

    subdivisionColor: {
        get: function () {
            return this._subdivisionColor;
        },
        set: function (value) {
            this._subdivisionColor = value;
            this.needsDraw = true;
        }
    },

    drawSelf: {
        value: function (transformMatrix) {
            var offsetX = transformMatrix[12],
                offsetY = transformMatrix[13],
                x,
                xStart,
                sEnd,
                y,
                yStart,
                yEnd,
                indices = [0, 1, 2, 4, 5, 6, 8, 9, 10],
                width = this.canvas.width,
                height = this.canvas.height,
                step = 100,
                i = 0;

            while (!transformMatrix[indices[i]]) {
                i++;
            }
            scale = transformMatrix[indices[i]];
            this._context.save();
            if (scale >= .02) {
                this._context.fillStyle = this.gridlineColor;
                xStart = -Math.floor(offsetX / (step * scale));
                xEnd = xStart + Math.floor(width / (step * scale));
                for (x = xStart; x <= xEnd; x++) {
                    this._context.fillRect(Math.floor(offsetX + x * step * scale), 0, 1, 9999);
                }
                yStart = -Math.floor(offsetY / (step * scale));
                yEnd = yStart + Math.floor(height / (step * scale));
                for (y = yStart; y <= yEnd; y++) {
                    this._context.fillRect(0, Math.floor(offsetY + y * step * scale), 9999, 1);
                }
            }
            this._context.fillStyle = "rgba(0,0,0,.1)";
            this._context.fillRect(0, Math.floor(offsetY), 9999, 1);
            this._context.fillRect(Math.floor(offsetX), 0, 1,  9999);
            this._context.restore();
        }
    }

});