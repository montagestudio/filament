var Montage = require("montage").Montage,
    CanvasShape = require("ui/canvas-shape").CanvasShape,
    Vector3 = require("ui/pen-tool-math").Vector3,
    CanvasVector3 = require("ui/canvas-vector3").CanvasVector3,
    MapReducible = require("ui/pen-tool-math").MapReducible;

var Camera = exports.Camera = Montage.create(MapReducible, {

    type: {
        value: "FlowCamera"
    }

});

exports.CanvasCamera = Montage.create(CanvasShape, {

    name: {
        value: "Camera"
    },

    axisAlignedBoundaries: {
        get: function () {
            return [
                {
                    min: this.cameraPosition[0],
                    max: this.cameraPosition[0]
                },
                {
                    min: this.cameraPosition[1],
                    max: this.cameraPosition[1]
                },
                {
                    min: this.cameraPosition[2],
                    max: this.cameraPosition[2]
                }
            ];
        }
    },

    translate: {
        value: function (offsetsArray) {
            this.cameraPosition = [
                this.cameraPosition[0] + offsetsArray[0],
                this.cameraPosition[1] + offsetsArray[1],
                this.cameraPosition[2] + offsetsArray[2]
            ];
            this.cameraTargetPoint = [
                this.cameraTargetPoint[0] + offsetsArray[0],
                this.cameraTargetPoint[1] + offsetsArray[1],
                this.cameraTargetPoint[2] + offsetsArray[2]
            ];
            this.dispatchEventNamed("cameraChange", true, true);
        }
    },

    isSelected: {
        get: function () {
            if (this._data) {
                if (typeof this._data._isSelected !== "undefined") {
                    return this._data._isSelected;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },
        set: function (value) {
            if (this._data && (this._data._isSelected !== value) && this._data.dispatchEventIfNeeded) {
                this._data._isSelected = value;
                this._data.dispatchEventIfNeeded("selectionChange");
                this._cameraPosition.isVisible = value;
                this._cameraTargetPoint.isVisible = value;
                this.needsDraw = true;
            }
        }
    },

    _cameraPosition: {
        value: null
    },

    cameraPosition: {
        get: function () {
            if (this._cameraPosition) {
                return this._cameraPosition._data._data;
            } else {
                return null;
            }
        },
        set: function (value) {
            if (!this._cameraPosition) {
                if (value) {
                    var vector = Vector3.create().init();

                    vector.x = value[0];
                    vector.y = value[1];
                    vector.z = value[2];
                    this._cameraPosition = CanvasVector3.create().initWithData(vector);
                    this.appendChild(this._cameraPosition);
                    vector.nextTarget = this._data;
                    this._cameraPosition.color = this.selectedColor;
                    this._cameraPosition.name = "Position";
                }
            } else {
                this._cameraPosition._data.x = value[0];
                this._cameraPosition._data.y = value[1];
                this._cameraPosition._data.z = value[2];
            }
            if (this._data) {
                this._data.dispatchEventIfNeeded("cameraChange");
            }
        }
    },

    _cameraTargetPoint: {
        value: null
    },

    cameraTargetPoint: {
        get: function () {
            if (this._cameraTargetPoint) {
                return this._cameraTargetPoint._data._data;
            } else {
                return null;
            }
        },
        set: function (value) {
            if (!this._cameraTargetPoint) {
                if (value) {
                    var vector = Vector3.create().init();

                    vector.x = value[0];
                    vector.y = value[1];
                    vector.z = value[2];
                    this._cameraTargetPoint = CanvasVector3.create().initWithData(vector);
                    this.appendChild(this._cameraTargetPoint);
                    vector.nextTarget = this._data;
                    this._cameraTargetPoint.name = "Target";
                    this._cameraTargetPoint.color = this.selectedColor;
                }
            } else {
                this._cameraTargetPoint._data.x = value[0];
                this._cameraTargetPoint._data.y = value[1];
                this._cameraTargetPoint._data.z = value[2];
            }
            if (this._data) {
                this._data.dispatchEventIfNeeded("cameraChange");
            }
        }
    },

    _cameraFov: {
        value: null
    },

    cameraFov: {
        get: function () {
            return this._cameraFov;
        },
        set: function (value) {
            this._cameraFov = value;
            if (this._data) {
                this._data.dispatchEventIfNeeded("cameraChange");
            }
            this.needsDraw = true;
        }
    },

    rotateVector: {
        value: function(vector) {
            var vX = this.cameraTargetPoint[0] - this.cameraPosition[0],
                vY = this.cameraTargetPoint[1] - this.cameraPosition[1],
                vZ = this.cameraTargetPoint[2] - this.cameraPosition[2],
                yAngle = Math.atan2(vX, vZ),
                tmpZ,
                rX, rY, rZ,
                xAngle;

            tmpZ = vX * -Math.sin(-yAngle) + vZ * Math.cos(-yAngle);
            xAngle = Math.atan2(vY, tmpZ);
            rX = vector[0];
            rY = vector[1] * Math.cos(-xAngle) - vector[2] * Math.sin(-xAngle);
            rZ = vector[1] * Math.sin(-xAngle) + vector[2] * Math.cos(-xAngle);
            return [
                rX * Math.cos(yAngle) + rZ * Math.sin(yAngle),
                rY,
                rX * -Math.sin(yAngle) + rZ * Math.cos(yAngle)
            ];
        }
    },

    drawSelf: {
        value: function (transformMatrix) {
            if (this.cameraPosition) {
                var tPos = Vector3.create().initWithCoordinates(this.cameraPosition).transformMatrix3d(transformMatrix),
                    tFocus = Vector3.create().initWithCoordinates(this.cameraTargetPoint).transformMatrix3d(transformMatrix),
                    angle = ((this.cameraFov * 0.5) * Math.PI * 2) / 360,
                    x, y, z,
                    line = [],
                    tmp,
                    scale = 0.2,
                    indices = [0, 1, 2, 4, 5, 6, 8, 9, 10],
                    i = 0;

                this._cameraSegments = [];
                while (!transformMatrix[indices[i]]) {
                    i++;
                }
                scale = transformMatrix[indices[i]];
                x = Math.sin(angle) * 60 / scale;
                y = Math.cos(angle) * 60 / scale;
                z = y;
                for (i = 0; i < 4; i++) {
                    tmp = this.rotateVector([[x, -x, z], [-x, -x, z], [-x, x, z], [x, x, z]][i]);
                    line[i] = [this.cameraPosition[0] + tmp[0], this.cameraPosition[1] + tmp[1], this.cameraPosition[2] + tmp[2]];
                    line[i + 4] = [this.cameraPosition[0] + tmp[0] * 100000, this.cameraPosition[1] + tmp[1] * 100000, this.cameraPosition[2] + tmp[2] * 100000];
                }
                this._context.save();
                this._context.strokeStyle = this.isSelected ? this.selectedColor : this.color;
                this._context.fillStyle = this.isSelected ? this.selectedColor : this.color;
                this._context.beginPath();
                this._context.lineWidth = 0.5;
                for (i = 0; i < 4; i++) {
                    line[i] = Vector3.create().initWithCoordinates(line[i]).transformMatrix3d(transformMatrix);
                    this._context.moveTo(tPos.x + 0.5, tPos.y + 0.5);
                    this._context.lineTo(line[i].x + 0.5, line[i].y + 0.5);
                    this._cameraSegments.push([tPos.x, tPos.y, line[i].x, line[i].y]);
                }
                this._context.stroke();
                this._context.globalAlpha = 0.4;
                for (i = 4; i < 8; i++) {
                    line[i] = Vector3.create().initWithCoordinates(line[i]).transformMatrix3d(transformMatrix);
                    this._context.moveTo(tPos.x + 0.5, tPos.y + 0.5);
                    this._context.lineTo(line[i].x + 0.5, line[i].y + 0.5);
                }
                this._context.stroke();
                this._context.globalAlpha = 1;
                this._context.beginPath();
                this._context.lineWidth = 1;
                if (this.isSelected) {
                    this._context.moveTo(tPos.x + 0.5, tPos.y + 0.5);
                    this._context.lineTo(tFocus.x + 0.5, tFocus.y + 0.5);
                    this._cameraSegments.push([tPos.x, tPos.y, tFocus.x, tFocus.y]);
                }
                for (i = 0; i < 4; i++) {
                    this._context.moveTo(tPos.x + 0.5, tPos.y + 0.5);
                    this._context.lineTo(line[i].x + 0.5, line[i].y + 0.5);
                    this._context.lineTo(line[(i + 1) % 4].x + 0.5, line[(i + 1) % 4].y + 0.5);
                    this._cameraSegments.push([line[i].x, line[i].y, line[(i + 1) % 4].x, line[(i + 1) % 4].y]);
                }
                this._context.stroke();
                this._context.restore();
            }
        }
    },

    pointOnShape: {
        value: function (pointerX, pointerY, transformMatrix) {
            if (this.cameraPosition) {
                var tPos = Vector3.create().initWithCoordinates(this.cameraPosition).transformMatrix3d(transformMatrix),
                    tFocus = Vector3.create().initWithCoordinates(this.cameraTargetPoint).transformMatrix3d(transformMatrix),
                    angle = ((this.cameraFov * 0.5) * Math.PI * 2) / 360,
                    x, y, z,
                    line = [],
                    tmp,
                    scale = 0.2,
                    indices = [0, 1, 2, 4, 5, 6, 8, 9, 10],
                    i = 0;

                this._cameraSegments = [];
                while (!transformMatrix[indices[i]]) {
                    i++;
                }
                scale = transformMatrix[indices[i]];
                x = Math.sin(angle) * 60 / scale;
                y = Math.cos(angle) * 60 / scale;
                z = y;
                for (i = 0; i < 4; i++) {
                    tmp = this.rotateVector([[x, -x, z], [-x, -x, z], [-x, x, z], [x, x, z]][i]);
                    line[i] = [this.cameraPosition[0] + tmp[0], this.cameraPosition[1] + tmp[1], this.cameraPosition[2] + tmp[2]];
                }
                for (i = 0; i < 4; i++) {
                    line[i] = Vector3.create().initWithCoordinates(line[i]).transformMatrix3d(transformMatrix);
                    this._cameraSegments.push([tPos.x, tPos.y, line[i].x, line[i].y]);
                }
                if (this.isSelected) {
                    this._cameraSegments.push([tPos.x, tPos.y, tFocus.x, tFocus.y]);
                }
                for (i = 0; i < 4; i++) {
                    this._cameraSegments.push([line[i].x, line[i].y, line[(i + 1) % 4].x, line[(i + 1) % 4].y]);
                }
                for (i = 0; i < this._cameraSegments.length; i++) {
                    if (this._distanceToSegment(
                            pointerX, pointerY,
                            this._cameraSegments[i][0],
                            this._cameraSegments[i][1],
                            this._cameraSegments[i][2],
                            this._cameraSegments[i][3]
                        ) < 6) {
                        return true;
                    }
                }
                return false;
            } else {
                return false;
            }
        }
    }

});
