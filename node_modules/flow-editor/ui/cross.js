var Montage = require("montage").Montage,
    CanvasShape = require("ui/canvas-shape").CanvasShape,
    Vector3 = require("ui/pen-tool-math").Vector3;

var Cross = exports.Cross = Montage.create(Montage, {

    xColor: {
        value: "red"
    },

    yColor: {
        value: "green"
    },

    zColor: {
        value: "blue"
    },

    type: {
        value: "FlowCross"
    }

});

exports.CanvasCross = Montage.create(CanvasShape, {

    constructor: {
        value: function () {
            CanvasShape.constructor.call(this);
            this.defineBindings({
                "xColor": {
                    "<->": "data.xColor",
                    source: this
                },
                "yColor": {
                    "<->": "data.yColor",
                    source: this
                },
                "zColor": {
                    "<->": "data.zColor",
                    source: this
                }
            });
        }
    },

    _xColor: {
        value: null
    },

    xColor: {
        get: function () {
            return this._xColor;
        },
        set: function (value) {
            this._xColor = value;
            this.needsDraw = true;
        }
    },

    _yColor: {
        value: null
    },

    yColor: {
        get: function () {
            return this._yColor;
        },
        set: function (value) {
            this._yColor = value;
            this.needsDraw = true;
        }
    },

    _zColor: {
        value: null
    },

    zColor: {
        get: function () {
            return this._zColor;
        },
        set: function (value) {
            this._zColor = value;
            this.needsDraw = true;
        }
    },

    drawSelf: {
        value: function (transformMatrix) {
            var vector = Vector3.create(),
                matrix = transformMatrix.clone();

            matrix[12] = matrix[13] = matrix[14] = 0;
            this._context.save();
            this._context.font = "8px Arial";

            vector.initWithCoordinates([1, 0, 0]).transformMatrix3d(matrix).normalize().multiply(20);
            this._context.beginPath();
            this._context.strokeStyle =
            this._context.fillStyle = this.xColor;
            this._context.moveTo(26 + vector.x * 0.2, 26 + vector.y * 0.2);
            this._context.lineTo(26 + vector.x * 0.8, 26 + vector.y * 0.8);
            this._context.stroke();
            this._context.fillText("X", 23 + vector.x, 29 + vector.y);

            vector.initWithCoordinates([0, 1, 0]).transformMatrix3d(matrix).normalize().multiply(20);
            this._context.beginPath();
            this._context.strokeStyle =
            this._context.fillStyle = this.yColor;
            this._context.moveTo(26 + vector.x * 0.2, 26 + vector.y * 0.2);
            this._context.lineTo(26 + vector.x * 0.8, 26 + vector.y * 0.8);
            this._context.stroke();
            this._context.fillText("Y", 23 + vector.x, 29 + vector.y);

            vector.initWithCoordinates([0, 0, 1]).transformMatrix3d(matrix).normalize().multiply(20);
            this._context.beginPath();
            this._context.strokeStyle =
            this._context.fillStyle = this.zColor;
            this._context.moveTo(26 + vector.x * 0.2, 26 + vector.y * 0.2);
            this._context.lineTo(26 + vector.x * 0.8, 26 + vector.y * 0.8);
            this._context.stroke();
            this._context.fillText("Z", 23 + vector.x, 29 + vector.y);
            this._context.restore();
        }
    }

});
