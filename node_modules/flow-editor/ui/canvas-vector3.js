var Montage = require("montage").Montage,
    CanvasShape = require("ui/canvas-shape").CanvasShape;

exports.CanvasVector3 = Montage.create(CanvasShape, {

    _isVisible: {
        value: false
    },

    _color: {
        value: null
    },

    color: {
        get: function () {
            return this._color;
        },
        set: function (value) {
            this._color = value;
            this.needsDraw = true;
        }
    },

    drawSelf: {
        value: function (transformMatrix) {
            var vector = this._data.clone().transformMatrix3d(transformMatrix);

            this._context.save();
            this._context.fillStyle = this.color;
            this._context.fillRect(vector.x - 3, vector.y - 3, 7, 7);
            if (!this.isSelected) {
                this._context.fillStyle = "white";
                this._context.fillRect(vector.x - 2, vector.y - 2, 5, 5);
            }
            this._context.restore();
        }
    },

    pointOnShape: {
        value: function (x, y, transformMatrix) {
            var vector = this._data.clone().transformMatrix3d(transformMatrix);

            if ((x >= vector.x - 6) && (x <= vector.x + 6)) {
                if ((y >= vector.y - 6) && (y <= vector.y + 7)) {
                    return true;
                }
            }
            return false;
        }
    }

});