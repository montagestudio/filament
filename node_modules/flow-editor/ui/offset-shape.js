var CanvasShape = require("ui/canvas-shape").CanvasShape,
    FlowEditorConfig = require("core/configuration").FlowEditorConfig,
    Vector3 = require("ui/pen-tool-math").Vector3,
    GridConfig = FlowEditorConfig.grid,
    ViewPortConfig = FlowEditorConfig.viewPort;

exports.OffsetShape = CanvasShape.specialize({

    initWithContextAndCoordinates: {
        value: function (viewPort, coordinates) {
            this.viewPort = viewPort;
            this._contextToDraw = viewPort._context;

            var inverseMatrix = viewPort.inverseTransformMatrix(viewPort.matrix);

            this._data = Vector3.create().initWithCoordinates(coordinates).transformMatrix3d(inverseMatrix);
            this._initialData = Vector3.create().initWithCoordinates(coordinates).transformMatrix3d(inverseMatrix);

            this._data.save();

            this.isHiddenInInspector = true;

            return this;
        }
    },

    type: {
        value: "OffsetLine"
    },

    _contextToDraw: {
        value: null
    },

    translate: {
        value: function (coordinates) {
            this._data.restore();
            this._data.translate(coordinates);

            this.needsDraw = true;
        }
    },

    _drawLine: {
        value: function (startPosition, endPosition, isDashed) {
            var startX = Math.round(startPosition.x),
                startY = Math.round(startPosition.y),
                endX = Math.round(endPosition.x),
                endY = Math.round(endPosition.y),
                dX = endX - startX,
                dY = endY - startY,
                distance = Math.sqrt(dX * dX + dY * dY),
                i;

            this._context.beginPath();
            if (isDashed) {
                dX /= distance;
                dY /= distance;
                for (i = 0; i < distance; i += 4) {
                    this._context.moveTo(startX + dX * i, startY + dY * i);
                    this._context.lineTo(startX + dX * (i + 1.5), startY + dY * (i + 1.5));
                }
            } else {
                this._context.moveTo(startX, startY);
                this._context.lineTo(endX, endY);
            }
            this._context.closePath();
            this._context.stroke();
        }
    },

    drawSelf: {
        value: function (transformMatrix) {
            if (this._contextToDraw === this._context) {
                var startPosition = this._initialData.clone().transformMatrix3d(transformMatrix),
                    endPosition = this._data.clone().transformMatrix3d(transformMatrix),
                    needDashedLine = true;

                this._context.save();

                if (startPosition.x === endPosition.x) {
                    this._context.strokeStyle = GridConfig[this.viewPort.type].colorOrdinate;

                } else if (startPosition.y === endPosition.y) {
                    this._context.strokeStyle = GridConfig[this.viewPort.type].colorAbscissa;
                }

                this._drawLine(startPosition, endPosition, needDashedLine);
                this._context.restore();
            }
        }
    }

});
