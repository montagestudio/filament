var Montage = require("montage").Montage,
    CanvasShape = require("ui/canvas-shape").CanvasShape;

exports.CanvasSplineAppendMark = Montage.create(CanvasShape, {

    zIndex: {
        value: 9999
    },

    _color: {
        value: "#480"
    },

    color: {
        get: function () {
            return this._color;
        },
        set: function (value) {
            this._color = value;
        }
    },

    _isVisible: {
        value: false
    },

    drawSelf: {
        value: function (transformMatrix) {
            var vector = this._data.clone().transformMatrix3d(transformMatrix);

            this._context.save();
            this._context.fillStyle = this.color;
            this._context.beginPath();
            this._context.arc(vector.x + .5, vector.y + .5, 4.5, 0 , 2 * Math.PI, false);
            this._context.fill();
            this._context.fillStyle = "white";
            this._context.beginPath();
            this._context.arc(vector.x + .5, vector.y + .5, 3, 0 , 2 * Math.PI, false);
            this._context.fill();
            this._context.restore();
        }
    }

});