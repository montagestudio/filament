var Montage = require("montage").Montage,
    CanvasShape = require("ui/canvas-shape").CanvasShape,
    Vector3 = require("ui/pen-tool-math").Vector3,
    CanvasVector3 = require("ui/canvas-vector3").CanvasVector3;

exports.FlowKnot = Vector3.specialize({

    constructor: {
        value: function FlowKnot () {
        }
    },

    type: {
        value: "FlowKnot"
    },

    _rotateX: {
        value: 0
    },

    rotateX: {
        get: function () {
            return this._rotateX;
        },
        set: function (value) {
            this._rotateX = value;
            this.dispatchEventIfNeeded("vectorChange", true, true);
        }
    },

    _rotateY: {
        value: 0
    },

    rotateY: {
        get: function () {
            return this._rotateY;
        },
        set: function (value) {
            this._rotateY = value;
            this.dispatchEventIfNeeded("vectorChange", true, true);
        }
    },

    _rotateZ: {
        value: 0
    },

    rotateZ: {
        get: function () {
            return this._rotateZ;
        },
        set: function (value) {
            this._rotateZ = value;
            this.dispatchEventIfNeeded("vectorChange", true, true);
        }
    },

    _opacity: {
        value: 1
    },

    opacity: {
        get: function () {
            return this._opacity;
        },
        set: function (value) {
            this._opacity = value;
            this.dispatchEventIfNeeded("vectorChange", true, true);
        }
    },

    _density: {
        value: 10
    },

    density: {
        get: function () {
            return this._density;
        },
        set: function (value) {
            this._density = value;
            this.dispatchEventIfNeeded("vectorChange", true, true);
        }
    }
});

exports.CanvasFlowSplineHandlers = Montage.create(CanvasShape, {

    _isVisible: {
        value: false
    },

    isSelected: {
        get: function () {
            if (this._data) {
                return this._data._isSelected;
            } else {
                return false;
            }
        },
        set: function (value) {
            var length, i;

            if (this._data && this._data.dispatchEventIfNeeded) {
                this._data._isSelected = value;
                length = this.children.length;
                for (i = 0; i < length; i++) {
                    this.children[i].isVisible = value;
                }
                this._data.dispatchEventIfNeeded("selectionChange");
            }
        }
    },

    knot: {
        get: function () {
            return this._data;
        }
    },

    isFirstKnotOf: {
        value: function (spline) {
            var firstKnot = spline.firstKnot;

            if (firstKnot) {
                return this._data === firstKnot;
            } else {
                return false;
            }
        }
    },

    isLastKnotOf: {
        value: function (spline) {
            var lastKnot = spline.lastKnot;

            if (lastKnot) {
                return this._data === lastKnot;
            } else {
                return false;
            }
        }
    },

    _almostEqual: {
        value: function (floatA, floatB) {
            var max, min,
                relativeDifference;

            if (Math.abs(floatA) > Math.abs(floatB)) {
                max = floatA;
                min = floatB;
            } else {
                max = floatB;
                min = floatA;
            }
            relativeDifference = max / min;
            if (isNaN(relativeDifference)) {
                return true;
            }
            if (relativeDifference < 0) {
                return false;
            } else {
                relativeDifference -= 1;
                return (relativeDifference < 0.00001);
            }
        }
    },

    /*
        Types: corner, smooth, symmetric
    */

    _type: {
        value: null
    },

    type: {
        get: function () {
            if (!this._type) {
                if (this._previousHandler && this._nextHandler) {
                    var expectedX = this.data.x * 2 - this._previousHandler.x,
                        expectedY = this.data.y * 2 - this._previousHandler.y,
                        expectedZ = this.data.z * 2 - this._previousHandler.z;

                    if (this._almostEqual(this._nextHandler.x, expectedX) &&
                        this._almostEqual(this._nextHandler.y, expectedY) &&
                        this._almostEqual(this._nextHandler.z, expectedZ)) {
                        this._type = "symmetric";
                    } else {
                        this._type = "corner";
                    }
                } else {
                    this._type = "symmetric";
                }
            }
            return this._type;
        },
        set: function (value) {
            this._type = value;
            switch (value) {
                case "symmetric":
                    if (this._previousHandler && this._nextHandler) {
                        this._nextHandler._data = [
                            this.data.x * 2 - this._previousHandler.x,
                            this.data.y * 2 - this._previousHandler.y,
                            this.data.z * 2 - this._previousHandler.z
                        ];
                    }
                    break;
                case "smooth":
                    break;
            }
            this._data.dispatchEventIfNeeded("vectorChange", true, true);
        }
    },

    _previousHandler: {
        value: null
    },

    _nextHandler: {
        value: null
    },

    previousHandler: {
        get: function () {
            return this._previousHandler;
        },
        set: function (value) {
            var self = this,
                vector;

            this._previousHandler = value;
            vector = CanvasVector3.create().initWithData(value);
            this.appendChild(vector);
            vector.canvas = self.canvas;
            vector.color = self._selectedColor;
            vector.isVisible = this.isSelected;
            vector.translate = function (vector) {
                self.translatePreviousHandler(vector);
            };
            vector.save = function () {
                vector.data.save();
                if (self._nextHandler) {
                    self._nextHandler.save();
                }
            };
            vector.restore = function () {
                vector.data.restore();
                if (self._nextHandler) {
                    self._nextHandler.restore();
                }
            };
        }
    },

    nextHandler: {
        get: function () {
            return this._nextHandler;
        },
        set: function (value) {
            var self = this,
                vector;

            this._nextHandler = value;
            vector = CanvasVector3.create().initWithData(value);
            this.appendChild(vector);
            vector.canvas = self.canvas;
            vector.color = self._selectedColor;
            vector.isVisible = this.isSelected;
            vector.translate = function (vector) {
                self.translateNextHandler(vector);
            };
            vector.save = function () {
                vector.data.save();
                if (self._previousHandler) {
                    self._previousHandler.save();
                }
            };
            vector.restore = function () {
                vector.data.restore();
                if (self._previousHandler) {
                    self._previousHandler.restore();
                }
            };
        }
    },

    translate: {
        value: function (vector) {
            this.data.translate(vector);
            if (this.nextHandler) {
                this.nextHandler.translate(vector);
            }
            if (this.previousHandler) {
                this.previousHandler.translate(vector);
            }
        }
    },

    save: {
        value: function () {
            this.data.save();
            if (this.nextHandler) {
                this.nextHandler.save();
            }
            if (this.previousHandler) {
                this.previousHandler.save();
            }
        }
    },

    restore: {
        value: function () {
            this.data.restore();
            if (this.nextHandler) {
                this.nextHandler.restore();
            }
            if (this.previousHandler) {
                this.previousHandler.restore();
            }
        }
    },

    translatePreviousHandler: {
        value: function (vector) {
            this._previousHandler.translate(vector);
            if ((this.type === "symmetric") && this._nextHandler) {
                this._nextHandler._data = [
                    this.data.x * 2 - this._previousHandler.x,
                    this.data.y * 2 - this._previousHandler.y,
                    this.data.z * 2 - this._previousHandler.z
                ];
            }
        }
    },

    translateNextHandler: {
        value: function (vector) {
            this._nextHandler.translate(vector);
            if ((this.type === "symmetric") && this._previousHandler) {
                this._previousHandler._data = [
                    this.data.x * 2 - this._nextHandler.x,
                    this.data.y * 2 - this._nextHandler.y,
                    this.data.z * 2 - this._nextHandler.z
                ];
            }
        }
    },

    drawSelf: {
        value: function (transformMatrix) {
            var s;

            this._context.save();
            if (this.isSelected) {
                this._context.strokeStyle = this._selectedColor;
                this._context.lineWidth = 1.5;
                this._context.beginPath();
                if (this.data && this.previousHandler) {
                    s = this._data.clone().transformMatrix3d(transformMatrix);
                    this._context.moveTo(s.x, s.y);
                    s = this._previousHandler.clone().transformMatrix3d(transformMatrix);
                    this._context.lineTo(s.x, s.y);
                    this._context.stroke();
                }
                if (this.data && this.nextHandler) {
                    s = this._data.clone().transformMatrix3d(transformMatrix);
                    this._context.moveTo(s.x, s.y);
                    s = this._nextHandler.clone().transformMatrix3d(transformMatrix);
                    this._context.lineTo(s.x, s.y);
                    this._context.stroke();
                }
            }
            if (this._data) {
                s = this._data.clone().transformMatrix3d(transformMatrix);
                this._context.fillStyle = this.color;
                switch (this.type) {
                    case "corner":
                        this._context.fillRect(s.x - 3, s.y - 3, 7, 7);
                        if (!this.isSelected) {
                            this._context.fillStyle = "white";
                            this._context.fillRect(s.x - 2, s.y - 2, 5, 5);
                        }
                        break;
                    case "symmetric":
                        this._context.beginPath();
                        this._context.arc(s.x + 0.5, s.y + 0.5, 4, 0 , 2 * Math.PI, false);
                        this._context.fill();
                        if (!this.isSelected) {
                            this._context.beginPath();
                            this._context.fillStyle = "white";
                            this._context.arc(s.x + 0.5, s.y + 0.5, 3, 0 , 2 * Math.PI, false);
                            this._context.fill();
                        }
                        break;
                }
            }
            this._context.restore();
        }
    },

    pointOnShape: {
        value: function (x, y, transformMatrix) {
            if (!this.data) {
                return false;
            }
            var vector = this.data.clone().transformMatrix3d(transformMatrix);

            if ((x >= vector.x - 6) && (x <= vector.x + 6)) {
                if ((y >= vector.y - 6) && (y <= vector.y + 7)) {
                    return true;
                }
            }
            return false;
        }
    }

});
