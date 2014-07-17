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

            var wheelEventName = typeof window.onwheel !== "undefined" ? "wheel" : "mousewheel",
                self = this,
                callBack = function (event) { self._handleWheelChange(event); };

            this._element.addEventListener(wheelEventName, callBack, false);

        }
    },

    prepareForActivationEvents: {
        value: function () {
            this._element.addEventListener("mousedown", this, false);
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
                if (this._selectedTool.handleMousedown) {
                    this._selectedTool.handleMousedown(event, this, this.editor);
                }
                document.addEventListener("mousemove", this, false);
                document.addEventListener("mouseup", this, false);
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
        }
    },

    _handleWheelChange: {
        value: function (event) {
            var x = event.offsetX - this.translateX,
                y = event.offsetY - this.translateY;

            this.translateX -= x * event.wheelDelta / 10000;
            this.translateY -= y * event.wheelDelta / 10000;
            this.scale *= 1 + event.wheelDelta / 10000;
            event.preventDefault();
        }
    }

});
