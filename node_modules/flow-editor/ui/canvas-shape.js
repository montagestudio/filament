var Montage = require("montage").Montage,
    Target = require("montage/core/target").Target;

var CanvasShape = exports.CanvasShape = Montage.create(Target, {

    type: {
        get: function () {
            if (this._data && this._data.type) {
                return this._data.type;
            } else {
                return "Shape";
            }
        }
    },

    parent: {
        value: null
    },

    _idCounter: {
        value: 0
    },

    _idHash: {
        value: {}
    },

    getShapeById: {
        value: function (id) {
            return CanvasShape._idHash[id];
        }
    },

    _deleteShapeById: {
        value: function (id) {
            var shape = this.getShapeById(id),
                length,
                i;

            if (shape) {
                if (shape.children) {
                    while (shape.children[0]) {
                        shape._deleteShapeById(shape.children[0].id);
                    }
                }
                if (shape.parent) {
                    length = shape.parent.children.length;
                    i = 0;
                    while ((i < length) && (shape.parent.children[i] !== shape)) {
                        i++;
                    }
                    if (i < length) {
                        shape.parent.children.splice(i, 1);
                    }
                }
                delete CanvasShape._idHash[id];
            }
        }
    },

    deleteShapeById: {
        value: function (id) {
            this._deleteShapeById(id);
            this._data.dispatchEventIfNeeded("sceneChange");
            this._data.dispatchEventIfNeeded("selectionChange");
        }
    },

    deleteChild: {
        value: function (index) {
            this.deleteShapeById(this.children[index].id);
        }
    },

    delete: {
        value: function () {
            this.deleteShapeById(this.id);
        }
    },

    id: {
        get: function () {
            return this._id;
        },
        set: function (value) {
            var temp = this.getShapeById(value),
                previousId = this._id;

            if (value !== previousId) {
                delete CanvasShape._idHash[this._id];
                this._id = value;
                CanvasShape._idHash[this._id] = this;
                if (temp) {
                    temp._id = previousId;
                    CanvasShape._idHash[previousId] = temp;
                }
            }
        }
    },

    constructor: {
        value: function () {
            while (CanvasShape._idHash[CanvasShape._idCounter]) {
                CanvasShape._idCounter++;
            }
            this._id = CanvasShape._idCounter;
            CanvasShape._idHash[this._id] = this;
            CanvasShape._idCounter++;
            this.children = [];
        }
    },

    children: {
        value: null
    },

    appendChild: {
        value: function (canvasShape) {
            this.children.push(canvasShape);
            canvasShape.parent = this;
            if (this._data) {
                this._data.dispatchEventIfNeeded("sceneChange");
            }
        }
    },

    insertChild: {
        value: function (canvasShape, position) {
            this.children.splice(position, 0, canvasShape);
            canvasShape.parent = this;
            if (this._data) {
                this._data.dispatchEventIfNeeded("sceneChange");
            }
        }
    },

    insertChildAtStart: {
        value: function (canvasShape) {
            this.children.splice(0, 0, canvasShape);
            canvasShape.parent = this;
            if (this._data) {
                this._data.dispatchEventIfNeeded("sceneChange");
            }
        }
    },

    hasChild: {
        value: function (shape) {
            var children = this.children,
                length = children.length,
                i;

            for (i = 0; i < length; i++) {
                if (shape.data === children[i].data) {
                    return [i];
                }
            }
            return false;
        }
    },

    bindings: {
        value: null
    },

    zIndex: {
        value: 0
    },

    _data: {
        value: null
    },

    data: {
        get: function () {
            return this._data;
        },
        set: function (value) {
            this._data = value;
        }
    },

    initWithData: {
        value: function (data) {
            this.data = data;
            return this;
        }
    },

    _canvas: {
        value: null
    },

    _context: {
        value: null
    },

    canvas: {
        get: function () {
            return this._canvas;
        },
        set: function (value) {
            var children = this.children,
                length = children.length,
                i;

            this._canvas = value;
            if (value) {
                this._context = value.getContext("2d");
            } else {
                this._context = null;
            }
            for (i = 0; i < length; i++) {
                children[i].canvas = value;
            }
        }
    },

    getSelection: {
        value: function (scene, selection) {
            var s = selection ? selection : [],
                children = this.children,
                length = children.length,
                i;

            for (i = 0; i < length; i++) {
                children[i].getSelection(scene, s);
            }
            if (this.isSelected) {
                s.push(this);
            }
            if (!selection) {
                if (!s[0]) {
                    return [scene];
                }
                return s;
            }
        }
    },

    sortByZIndex: {
        value: function (a, b) {
            if (b.isSelected && !a.isSelected) {
                return 1;
            }
            if (!b.isSelected && a.isSelected) {
                return -1;
            }
            return b.zIndex - a.zIndex;
        }
    },

    sortByReversedZIndex: {
        value: function (a, b) {
            if (b.isSelected && !a.isSelected) {
                return -1;
            }
            if (!b.isSelected && a.isSelected) {
                return 1;
            }
            return a.zIndex - b.zIndex;
        }
    },

    sortedChildrenIndexesBy: {
        value: function (sortingMethod) {
            var result = [],
                children = this.children,
                length = children.length,
                i;

            for (i = 0; i < length; i++) {
                result[i] = {
                    zIndex: children[i].zIndex,
                    isSelected: children[i].isSelected,
                    index: i
                };
            }
            result.sort(sortingMethod);
            return result;
        }
    },

    findSelectedShape: {
        value: function (x, y, transformMatrix) {
            if (this.isVisible) {
                var transform = this.getTransform ? this.getTransform(transformMatrix) : transformMatrix,
                    children = this.children,
                    length = children.length,
                    sortedIndexes,
                    result,
                    i;

                if (this.pointOnShape && this.pointOnShape(x, y, transform)) {
                    return this;
                }
                sortedIndexes = this.sortedChildrenIndexesBy(this.sortByZIndex);
                for (i = 0; i < length; i++) {
                    result = children[sortedIndexes[i].index].findSelectedShape(x, y, transform);
                    if (result) {
                        return result;
                    }
                }
            }
            return null;
        }
    },

    findPathToNode: {
        value: function (node, path) {
            var p = path ? path : [],
                children = this.children,
                length = children.length,
                found = false,
                i;

            if (this.data === node.data) {
                p.push(this);
                found = true;
            } else {
                for (i = 0; i < length; i++) {
                    if (children[i].findPathToNode(node, p)) {
                        p.push(this);
                        found = true;
                    }
                }
            }
            if (!path) {
                return p;
            }
            return found;
        }
    },

    findSelectedLeaf: {
        value: function (x, y, transformMatrix) {
            if (this.isVisible) {
                var transform = this.getTransform ? this.getTransform(transformMatrix) : transformMatrix,
                    children = this.children,
                    length = children.length,
                    sortedIndexes,
                    result,
                    i;

                if (length) {
                    sortedIndexes = this.sortedChildrenIndexesBy(this.sortByZIndex);
                    for (i = 0; i < length; i++) {
                        result = children[sortedIndexes[i].index].findSelectedLeaf(x, y, transform);
                        if (result) {
                            return result;
                        }
                    }
                }
                if (this.pointOnShape && this.pointOnShape(x, y, transform)) {
                    return this;
                }
            }
            return null;
        }
    },

    findCloserShapeType: {
        value: function (type, x, y, transformMatrix) {
            var transform = this.getTransform ? this.getTransform(transformMatrix) : transformMatrix,
                children = this.children,
                length = children.length,
                sortedIndexes,
                result,
                i;

            if (length) {
                sortedIndexes = this.sortedChildrenIndexesBy(this.sortByZIndex);
                for (i = 0; i < length; i++) {
                    result = children[sortedIndexes[i].index].findCloserShapeType(type, x, y, transform);
                    if (result) {
                        return result;
                    }
                }
            }
            if ((this._data) && (this._data.type === type) && this.pointOnShape && this.pointOnShape(x, y, transform)) {
                return this;
            }
            return null;
        }
    },

    draw: {
        value: function (transformMatrix) {
            if (this.isVisible) {
                var transform = this.getTransform ? this.getTransform(transformMatrix) : transformMatrix,
                    children = this.children,
                    length = children.length,
                    sortedIndexes,
                    i;

                if (this.drawSelf) {
                    this.drawSelf(transform);
                }
                sortedIndexes = this.sortedChildrenIndexesBy(this.sortByReversedZIndex);
                for (i = 0; i < length; i++) {
                    children[sortedIndexes[i].index].canvas = this.canvas;
                    children[sortedIndexes[i].index].draw(transform);
                }
            }
        }
    },

    pointOnShape: {
        value: null
    },

    _color: {
        value: "black"
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

    _selectedColor: {
        value: "#07f"
    },

    selectedColor: {
        get: function () {
            return this._selectedColor;
        },
        set: function (value) {
            this._selectedColor = value;
            this.needsDraw = true;
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
                this.needsDraw = true;
            }
        }
    },

    _isVisible: {
        value: true
    },

    isVisible: {
        get: function () {
            return this._isVisible;
        },
        set: function (value) {
            if (this._isVisible !== value) {
                this._isVisible = value;
                if (this._data && this._data.dispatchEventIfNeeded) {
                    this._data.dispatchEventIfNeeded("visibilityChange");
                }
                this.needsDraw = true;
            }
        }
    },

    unselect: {
        value: function () {
            var children = this.children,
                length = children.length,
                i;

            this.isSelected = false;
            for (i = 0; i < length; i++) {
                children[i].unselect();
            }
        }
    },

    translate: {
        value: function (vector) {
            this.data.translate(vector);
        }
    },

    _pointToPointDistance: {
        value: function (x1, y1, x2, y2) {
            var dX = x1 - x2,
                dY = y1 - y2;

            return Math.sqrt(dX * dX + dY * dY);
        }
    },

    _distanceToSegment: {
        value: function (pX, pY, vX, vY, wX, wY) {
            var l = this._pointToPointDistance(vX, vY, wX, wY),
                t;

            if (l === 0) {
                return this._pointToPointDistance(pX, pY, vX, vY);
            }
            t = ((pX - vX) * (wX - vX) + (pY - vY) * (wY - vY)) / (l * l);
            if (t < 0) {
                return this._pointToPointDistance(pX, pY, vX, vY);
            }
            if (t > 1) {
                return this._pointToPointDistance(pX, pY, wX, wY);
            }
            return this._pointToPointDistance(
                pX, pY,
                vX + t * (wX - vX),
                vY + t * (wY - vY)
            );
        }
    },

    getRecursiveAxisAlignedBoundaries: {
        value: function () {
            if (this.isVisible) {
                var children = this.children,
                    length = children.length,
                    axisAlignedBoundaries,
                    iBoundaries,
                    result,
                    i;

                axisAlignedBoundaries = this.axisAlignedBoundaries ? this.axisAlignedBoundaries : this._data.axisAlignedBoundaries;
                if (!axisAlignedBoundaries) {
                    axisAlignedBoundaries = [
                        {min: Infinity, max: -Infinity},
                        {min: Infinity, max: -Infinity},
                        {min: Infinity, max: -Infinity}
                    ];
                }
                if (length) {
                    for (i = 0; i < length; i++) {
                        iBoundaries = children[i].getRecursiveAxisAlignedBoundaries();
                        if (iBoundaries) {
                            if (iBoundaries[0].min < axisAlignedBoundaries[0].min) {
                                axisAlignedBoundaries[0].min = iBoundaries[0].min;
                            }
                            if (iBoundaries[1].min < axisAlignedBoundaries[1].min) {
                                axisAlignedBoundaries[1].min = iBoundaries[1].min;
                            }
                            if (iBoundaries[2].min < axisAlignedBoundaries[2].min) {
                                axisAlignedBoundaries[2].min = iBoundaries[2].min;
                            }
                            if (iBoundaries[0].max > axisAlignedBoundaries[0].max) {
                                axisAlignedBoundaries[0].max = iBoundaries[0].max;
                            }
                            if (iBoundaries[1].max > axisAlignedBoundaries[1].max) {
                                axisAlignedBoundaries[1].max = iBoundaries[1].max;
                            }
                            if (iBoundaries[2].max > axisAlignedBoundaries[2].max) {
                                axisAlignedBoundaries[2].max = iBoundaries[2].max;
                            }
                        }
                    }
                }
                return axisAlignedBoundaries;
            }
            return null;
        }
    }

});
