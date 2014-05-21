var Montage = require("montage").Montage,
    Target = require("montage/core/target").Target;

var MapReducible = exports.MapReducible = Target.specialize({

    constructor: {
        value: function MapReducible () {
        }
    },

    init: {
        value: function () {
            this._data = [];
            return this;
        }
    },

    _data: {
        serializable: true,
        value: null
    },

    every: {
        value: function () {
            return this._data.every.apply(this._data, arguments);
        }
    },

    reduce: {
        value: function () {
            return this._data.reduce.apply(this._data, arguments);
        }
    },

    reduceRight: {
        value: function () {
            return this._data.reduceRight.apply(this._data, arguments);
        }
    },

    some: {
        value: function () {
            return this._data.some.apply(this._data, arguments);
        }
    },

    forEach: {
        value: function () {
            return this._data.forEach.apply(this._data, arguments);
        }
    },

    map: {
        value: function () {
            return this._data.map.apply(this._data, arguments);
        }
    },

    filter: {
        value: function () {
            return this._data.filter.apply(this._data, arguments);
        }
    },

    nextTarget: {
        value: null
    },

    _eventsToDispatch: {
        value: {}
    },

    _timeout: {
        value: null
    },

    dispatchEventIfNeeded: {
        value: function (type) {
            if (this.nextTarget && !MapReducible._eventsToDispatch[type]) {
                MapReducible._eventsToDispatch[type] = this;
                if (MapReducible._timeout === null) {
                    MapReducible._timeout = window.setTimeout(function () {
                        var t;

                        for (t in MapReducible._eventsToDispatch) {
                            MapReducible._eventsToDispatch[t].dispatchEventNamed(t, true, true);
                        }
                        MapReducible._timeout = null;
                        MapReducible._eventsToDispatch = {};
                    }, 0);
                }
            }
        }
    }

});

var Vector = exports.Vector = MapReducible.specialize({

    constructor: {
        value: function Vector () {
        }
    },

    type: {
        serializable: false,
        value: "Vector"
    },

    initWithCoordinates: {
        value: function (coordinatesArray) {
            return this.setCoordinates(coordinatesArray);
        }
    },

    /**
        Length of the _data array. Using "dimensions" instead of "length"
        to avoid confusion with vector magnitude that is also known as length
    */
    dimensions: {
        get: function () {
            return this._data.length;
        }
    },

    /**
        Copy the provided array into the internal _data array
    */
    setCoordinates: {
        value: function (coordinatesArray) {
            this._data = coordinatesArray.slice(0);
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        Sets coordinate at provided index to the provided value
    */
    setCoordinate: {
        value: function (index, value) {
            this._data[index] = value;
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        Returns coordinate at provided index
    */
    getCoordinate: {
        value: function (index) {
            return this._data[index];
        }
    },

    /**
        Returns first coordinate
    */
    x: {
        serializable: false,
        get: function () {
            return this.getCoordinate(0);
        },
        set: function (value) {
            this.setCoordinate(0, value);
        }
    },

    /**
        Returns second coordinate
    */
    y: {
        serializable: false,
        get: function () {
            return this.getCoordinate(1);
        },
        set: function (value) {
            this.setCoordinate(1, value);
        }
    },

    /**
        Returns third coordinate
    */
    z: {
        serializable: false,
        get: function () {
            return this.getCoordinate(2);
        },
        set: function (value) {
            this.setCoordinate(2, value);
        }
    },

    /**
        Returns vector's euclidean magnitude
    */
    magnitude: {
        serializable: false,
        get: function () {
            var dimensions = this.dimensions,
                squaredMagnitude = 0,
                iCoordinate,
                i;

            for (i = 0; i < dimensions; i++) {
                iCoordinate = this.getCoordinate(i);
                squaredMagnitude += iCoordinate * iCoordinate;
            }
            return Math.sqrt(squaredMagnitude);
        }
    },

    /**
        In-place vector normalization. No division by zero check performed
    */
    normalize: {
        value: function () {
            return this.divide(this.magnitude);
        }
    },

    /**
        In-place addition of provided vector. Dimensions are assumed to be the same,
        no checking is done in this function
    */
    add: {
        value: function (vector) {
            var dimensions = this.dimensions,
                i;

            for (i = 0; i < dimensions; i++) {
                this.setCoordinate(i, this.getCoordinate(i) + vector.getCoordinate(i));
            }
            return this;
        }
    },

    /**
        In-place subtraction of provided vector. Dimensions are assumed to be the same,
        no checking is done in this function
    */
    subtract: {
        value: function (vector) {
            var dimensions = this.dimensions,
                i;

            for (i = 0; i < dimensions; i++) {
                this.setCoordinate(i, this.getCoordinate(i) - vector.getCoordinate(i));
            }
            return this;
        }
    },

    /**
        In-place negation of vector coordinates
    */
    negate: {
        value: function () {
            var dimensions = this.dimensions,
                i;

            for (i = 0; i < dimensions; i++) {
                this.setCoordinate(i, -this.getCoordinate(i));
            }
            return this;
        }
    },

    /**
        In-place vector multiplication by provided scalar
    */
    multiply: {
        value: function (scalar) {
            var dimensions = this.dimensions,
                i;

            for (i = 0; i < dimensions; i++) {
                this.setCoordinate(i, this.getCoordinate(i) * scalar);
            }
            return this;
        }
    },

    /**
        In-place vector division by provided scalar. No division by zero check performed
    */
    divide: {
        value: function (scalar) {
            var dimensions = this.dimensions,
                i;

            for (i = 0; i < dimensions; i++) {
                this.setCoordinate(i, this.getCoordinate(i) / scalar);
            }
            return this;
        }
    },

    /**
        Returns dot product of self vector with provided vector. Dimensions are assumed
        to be the same, no checking is done in this function
    */
    dot: {
        value: function (vector) {
            var dimensions = this.dimensions,
                dot = 0,
                i;

            for (i = 0; i < dimensions; i++) {
                dot += this.getCoordinate(i) * vector.getCoordinate(i);
            }
            return dot;
        }
    },

    /**
        Returns a copy of self vector
    */
    clone: {
        value: function () {
            return  new this.constructor().initWithCoordinates(this._data);
        }
    },

    /**
        In-place translation by provided offsets array. Dimensions of self vector and
        length of provided array are assumed to be the same
    */
    translate: {
        value: function (offsetsArray) {
            var dimensions = this.dimensions,
                i;

            for (i = 0; i < dimensions; i++) {
                this.setCoordinate(i, this.getCoordinate(i) + offsetsArray[i]);
            }
            return this;
        }
    },

    /**
        In-place scaling by provided factors array. Dimensions of self vector and
        length of provided array are assumed to be the same
    */
    scale: {
        value: function (factorsArray) {
            var dimensions = this.dimensions,
                i;

            for (i = 0; i < dimensions; i++) {
                this.setCoordinate(i, this.getCoordinate(i) * factorsArray[i]);
            }
            return this;
        }
    },

    /**
        Out-of-place linear interpolation of self vector and provided vector by provided interpolant.
        Dimensions of self vector and provided vector are assumed to be the same
    */
    outOfPlaceLerp: {
        value: function (vector, interpolant) {
            var result = (new this.constructor()).init(),
                dimensions = this.dimensions,
                iCoordinate,
                i;

            for (i = 0; i < dimensions; i++) {
                iCoordinate = this.getCoordinate(i);
                result.setCoordinate(i, (vector.getCoordinate(i) - iCoordinate) * interpolant + iCoordinate);
            }
            return result;
        }
    },

    /**
        Returns euclidean distance between self and given vector. Both are expected to have
        the same dimensions
    */
    distanceTo: {
        value: function (vector) {
            return (this.clone().subtract(vector).magnitude);
        }
    }
});

var Vector2 = exports.Vector2 = Vector.specialize({

    constructor: {
        value: function Vector2 () {
        }
    },

    type: {
        serializable: false,
        value: "Vector2"
    },

    init: {
        value: function () {
            this._data = [0, 0];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        Coordinates array expected to be of length 2
    */
    initWithCoordinates: {
        value: function (coordinatesArray) {
            this._data = [];
            return this.setCoordinates(coordinatesArray);
        }
    },

    /**
        Using "dimensions" instead of "length" to avoid confusion with
        vector magnitude that is also known as length
    */
    dimensions: {
        serializable: false,
        writable: false,
        value: 2
    },

    /**
        Copy the provided array into the internal _data array
        Provided array expected to be of length 2
    */
    setCoordinates: {
        value: function (coordinatesArray) {
            this._data[0] = coordinatesArray[0];
            this._data[1] = coordinatesArray[1];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        Returns first coordinate
    */
    x: {
        serializable: false,
        get: function () {
            return this._data[0];
        },
        set: function (value) {
            this._data[0] = value;
            this.dispatchEventIfNeeded("vectorChange");
        }
    },

    /**
        Returns second coordinate
    */
    y: {
        serializable: false,
        get: function () {
            return this._data[1];
        },
        set: function (value) {
            this._data[1] = value;
            this.dispatchEventIfNeeded("vectorChange");
        }
    },

    /**
        Returns vector's euclidean magnitude
    */
    magnitude: {
        serializable: false,
        get: function () {
            return Math.sqrt(
                this._data[0] * this._data[0] +
                this._data[1] * this._data[1]
            );
        }
    },

    /**
        In-place addition of provided vector. Vector2 type expected as parameter
    */
    add: {
        value: function (vector2) {
            this._data[0] += vector2._data[0];
            this._data[1] += vector2._data[1];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place subtraction of provided vector. Vector2 type expected as parameter
    */
    subtract: {
        value: function (vector2) {
            this._data[0] -= vector2._data[0];
            this._data[1] -= vector2._data[1];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place negation of vector coordinates
    */
    negate: {
        value: function () {
            this._data[0] = -this._data[0];
            this._data[1] = -this._data[1];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place vector multiplication by provided scalar
    */
    multiply: {
        value: function (scalar) {
            this._data[0] *= scalar;
            this._data[1] *= scalar;
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place vector division by provided scalar. No division by zero check performed
    */
    divide: {
        value: function (scalar) {
            this._data[0] /= scalar;
            this._data[1] /= scalar;
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        Returns dot product of self vector with provided vector.
        Vector2 type expected as parameter
    */
    dot: {
        value: function (vector2) {
            return (
                this._data[0] * vector2._data[0] +
                this._data[1] * vector2._data[1]
            );
        }
    },

    /**
        In-place CCW rotation by a given angle in radians
    */
    rotate: {
        value: function (angle) {
            var cos = Math.cos(angle),
                sin = Math.sin(angle),
                tmp = this._data[0];

            this._data[0] = this._data[0] * cos - this._data[1] * sin;
            this._data[1] = this._data[1] * cos + tmp * sin;
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place matrix transform. It takes a 2 rows by 3 colums matrix linearized as
        an array in the same format as CSS 2d transform matrix (column-major order)
    */
    transformMatrix: {
        value: function (matrix) {
            var tmp = this._data[0];

            this._data[0] =
                this._data[0] * matrix[0] +
                this._data[1] * matrix[2] +
                matrix[4];
            this._data[1] =
                tmp * matrix[1] +
                this._data[1] * matrix[3] +
                matrix[5];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place translation by provided offsets array. Length of provided
        array is assumed to be 2
    */
    translate: {
        value: function (offsetsArray) {
            this._data[0] += offsetsArray[0];
            this._data[1] += offsetsArray[1];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place scaling by provided factors array. Length of provided
        array is assumed to be 2
    */
    scale: {
        value: function (factorsArray) {
            this._data[0] *= factorsArray[0];
            this._data[1] *= factorsArray[1];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place skewing x axis by provided angle (in radians)
    */
    skewX: {
        value: function (angle) {
            this._data[0] += this._data[1] * Math.tan(angle);
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place skewing y axis by provided angle (in radians)
    */
    skewY: {
        value: function (angle) {
            this._data[1] += this._data[0] * Math.tan(angle);
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    }
});

var Vector3 = exports.Vector3 = Vector2.specialize({

    constructor: {
        value: function Vector3 () {
        }
    },

    type: {
        serializable: false,
        value: "Vector3"
    },

    init: {
        value: function () {
            this._data = [0, 0, 0];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        Coordinates array expected to be of length 3
    */
    initWithCoordinates: {
        value: function (coordinatesArray) {
            this._data = [];
            return this.setCoordinates(coordinatesArray);
        }
    },

    /**
        Using "dimensions" instead of "length" to avoid confusion with
        vector magnitude that is also known as length
    */
    dimensions: {
        serializable: false,
        writable: false,
        value: 3
    },

    /**
        Copy the provided array into the internal _data array
        Provided array expected to be of length 3
    */
    setCoordinates: {
        value: function (coordinatesArray) {
            this._data[0] = coordinatesArray[0];
            this._data[1] = coordinatesArray[1];
            this._data[2] = coordinatesArray[2];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        Returns first coordinate
    */
    x: {
        serializable: false,
        get: function () {
            return this._data[0];
        },
        set: function (value) {
            this._data.set(0, value);
            this.dispatchEventIfNeeded("vectorChange");
        }
    },

    /**
        Returns second coordinate
    */
    y: {
        serializable: false,
        get: function () {
            return this._data[1];
        },
        set: function (value) {
            this._data.set(1, value);
            this.dispatchEventIfNeeded("vectorChange");
        }
    },

    /**
        Returns third coordinate
    */
    z: {
        serializable: false,
        get: function () {
            return this._data[2];
        },
        set: function (value) {
            this._data.set(2, value);
            this.dispatchEventIfNeeded("vectorChange");
        }
    },

    /**
        Returns vector's euclidean magnitude
    */
    magnitude: {
        serializable: false,
        get: function () {
            return Math.sqrt(
                this._data[0] * this._data[0] +
                this._data[1] * this._data[1] +
                this._data[2] * this._data[2]
            );
        }
    },

    /**
        In-place addition of provided vector. Vector3 type expected as parameter
    */
    add: {
        value: function (vector3) {
            this._data[0] += vector3._data[0];
            this._data[1] += vector3._data[1];
            this._data[2] += vector3._data[2];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place subtraction of provided vector. Vector3 type expected as parameter
    */
    subtract: {
        value: function (vector3) {
            this._data[0] -= vector3._data[0];
            this._data[1] -= vector3._data[1];
            this._data[2] -= vector3._data[2];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place negation of vector coordinates
    */
    negate: {
        value: function () {
            this._data[0] = -this._data[0];
            this._data[1] = -this._data[1];
            this._data[2] = -this._data[2];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place vector multiplication by provided scalar
    */
    multiply: {
        value: function (scalar) {
            this._data[0] *= scalar;
            this._data[1] *= scalar;
            this._data[2] *= scalar;
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place vector division by provided scalar. No division by zero check performed
    */
    divide: {
        value: function (scalar) {
            this._data[0] /= scalar;
            this._data[1] /= scalar;
            this._data[2] /= scalar;
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place cross product by provided vector. Vector3 type expected as parameter
    */
    cross: {
        value: function (vector3) {
            var tmpX = this._data[0],
                tmpY = this._data[1];

            this._data[0] =
                this._data[1] * vector3._data[2] -
                this._data[2] * vector3._data[1];
            this._data[1] =
                this._data[2] * vector3._data[0] -
                tmpX * vector3._data[2];
            this._data[2] =
                tmpX * vector3._data[1] -
                tmpY * vector3._data[0];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        Returns dot product of self vector with provided vector.
        Vector3 type expected as parameter
    */
    dot: {
        value: function (vector3) {
            return (
                this._data[0] * vector3._data[0] +
                this._data[1] * vector3._data[1] +
                this._data[2] * vector3._data[2]
            );
        }
    },

    /**
        In-place rotation around axis X by a given angle in radians.
        It follows CCW rotation pattern found in CSS 3d transforms
    */
    rotateX: {
        value: function (angle) {
            var cos = Math.cos(angle),
                sin = Math.sin(angle),
                tmp = this._data[1];

            this._data[1] = this._data[1] * cos - this._data[2] * sin;
            this._data[2] = this._data[2] * cos + tmp * sin;
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place rotation around axis Y by a given angle in radians.
        It follows CCW rotation pattern found in CSS 3d transforms
    */
    rotateY: {
        value: function (angle) {
            var cos = Math.cos(angle),
                sin = Math.sin(angle),
                tmp = this._data[0];

            this._data[0] = this._data[0] * cos + this._data[2] * sin;
            this._data[2] = this._data[2] * cos - tmp * sin;
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place rotation around axis Z by a given angle in radians.
        It follows CCW rotation pattern found in CSS 3d transforms
    */
    rotateZ: {
        value: function (angle) {
            var cos = Math.cos(angle),
                sin = Math.sin(angle),
                tmp = this._data[0];

            this._data[0] = this._data[0] * cos - this._data[1] * sin;
            this._data[1] = this._data[1] * cos + tmp * sin;
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place matrix 2d transform. It takes a 2 rows by 3 colums matrix linearized as
        an array in the same format as CSS 2d transform matrix (column-major order).
        It only affects x and y coordinates
    */
    transformMatrix: {
        value: function (matrix) {
            var tmp = this._data[0];

            this._data[0] =
                this._data[0] * matrix[0] +
                this._data[1] * matrix[2] +
                matrix[4];
            this._data[1] =
                tmp * matrix[1] +
                this._data[1] * matrix[3] +
                matrix[5];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place matrix 3d transform. It takes a 4 by 4 matrix linearized
        as an array in column-major order
    */
    transformMatrix3d: {
        value: function (matrix) {
            var tmpX = this._data[0],
                tmpY = this._data[1];

            this._data[0] =
                this._data[0] * matrix[0] +
                this._data[1] * matrix[4] +
                this._data[2] * matrix[8] +
                matrix[12];
            this._data[1] =
                tmpX * matrix[1] +
                this._data[1] * matrix[5] +
                this._data[2] * matrix[9] +
                matrix[13];
            this._data[2] =
                tmpX * matrix[2] +
                tmpY * matrix[6] +
                this._data[2] * matrix[10] +
                matrix[14];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place perspective matrix 3d transform. It takes a 4 by 4 matrix
        linearized as an array in column-major order. The result is equivalent
        to CSS 3d transform matrix3d
    */
    transformPerspectiveMatrix3d: {
        value: function (matrix) {
            var tmpX = this._data[0],
                tmpY = this._data[1],
                w;

            w = this._data[0] * matrix[3] +
                this._data[1] * matrix[7] +
                this._data[2] * matrix[11] +
                matrix[15];
            this._data[0] =
               (this._data[0] * matrix[0] +
                this._data[1] * matrix[4] +
                this._data[2] * matrix[8] +
                matrix[12]) / w;
            this._data[1] =
               (tmpX * matrix[1] +
                this._data[1] * matrix[5] +
                this._data[2] * matrix[9] +
                matrix[13]) / w;
            this._data[2] =
               (tmpX * matrix[2] +
                tmpY * matrix[6] +
                this._data[2] * matrix[10] +
                matrix[14]) / w;
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place translation by provided offsets array. Length of provided
        array is assumed to be 3
    */
    translate: {
        value: function (offsetsArray) {
            this._data.set(0, this._data[0] + offsetsArray[0]);
            this._data.set(1, this._data[1] + offsetsArray[1]);
            this._data.set(2, this._data[2] + offsetsArray[2]);
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place scaling by provided factors array. Length of provided
        array is assumed to be 3
    */
    scale: {
        value: function (factorsArray) {
            this._data[0] *= factorsArray[0];
            this._data[1] *= factorsArray[1];
            this._data[2] *= factorsArray[2];
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place skewing x axis relative to y axis by provided angle (in radians)
    */
    skewX: {
        value: function (angle) {
            this._data[0] += this._data[1] * Math.tan(angle);
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    /**
        In-place skewing y axis relative to x axis by provided angle (in radians)
    */
    skewY: {
        value: function (angle) {
            this._data[1] += this._data[0] * Math.tan(angle);
            this.dispatchEventIfNeeded("vectorChange");
            return this;
        }
    },

    axisAlignedBoundaries: {
        get: function () {
            return [
                {
                    min: this._data[0],
                    max: this._data[0]
                },
                {
                    min: this._data[1],
                    max: this._data[1]
                },
                {
                    min: this._data[2],
                    max: this._data[2]
                }
            ];
        }
    }

    // TODO: skewXZ / YZ / ZX / ZY, translateX / Y / Z, rotate3d (very low priority)
});

var BezierCurve = exports.BezierCurve = MapReducible.specialize({

    constructor: {
        value: function BezierCurve () {
        }
    },

    type: {
        serializable: false,
        value: "BezierCurve"
    },

    /**
        Number of control points not including starting point.
        Linear: order 1, quadratic: order 2, cubic: order 3...
        It will return -1 when no control points are set
    */
    order: {
        get: function () {
            return this._data.length - 1;
        }
    },

    dimensions: {
        get: function () {
            var length = this._data.length,
                i;

            for (i = 0; i < length; i++) {
                if (this._data[i]) {
                    return this._data[i].dimensions;
                }
            }
        }
    },

    /**
        Number of inserted control points. During edition, like while drawing a curve,
        the curve might be not complete and length - 1 might be lower than order
    */
    length: {
        get: function () {
            return this._data.length;
        }
    },

    /**
        Returns false if the number of control points is lower than 2 or if the number of
        control points is lower than the expected for the curve's order
    */
    isComplete: {
        get: function () {
            if (this.length < 2) {
                return false;
            }
            return this.length > this.order;
        }
    },

    /**
        Inserts the provided vector at the end of
        the control points array
    */
    pushControlPoint: {
        value: function (vector) {
            this._data.push(vector);
            vector.nextTarget = this;
            this.dispatchEventIfNeeded("bezierCurveChange");
        }
    },

    /**
        Returns removed vector control point from
        the end of the controls points array
    */
    popControlPoint: {
        value: function () {
            var vector = this._data.pop();

            vector.nextTarget = null;
            this.dispatchEventIfNeeded("bezierCurveChange");
            return vector;
        }
    },

    /**
        Returns vector control point at the given index
    */
    getControlPoint: {
        value: function (index) {
            return this._data[index];
        }
    },

    /**
        Sets the given vector at the given index position in
        the control points array
    */
    setControlPoint: {
        value: function (index, vector) {
            this._data[index] = vector;
            if (vector) {
                vector.nextTarget = this;
            }
            this.dispatchEventIfNeeded("bezierCurveChange");
        }
    },

    /**
        Evaluates Bezier curve at t with De Casteljau's algorithm
        and returns a vector with the resulting coordinates
    */
    value: {
        value: function (t) {
            if (this.isComplete) {
                var order = this.order,
                    i, j, n, m,
                    k = 1 - t,
                    intermediateValues = [],
                    dimensions = this.dimensions,
                    currentPoint, nextPoint = this.getControlPoint(0);

                for (i = 1; i <= order; i++) {
                    currentPoint = nextPoint;
                    nextPoint = this.getControlPoint(i);
                    for (n = 0; n < dimensions; n++) {
                        intermediateValues.push(
                            currentPoint.getCoordinate(n) * k +
                            nextPoint.getCoordinate(n) * t
                        );
                    }
                }
                for (j = order - 1; j > 0; j--) {
                    m = 0;
                    for (i = 0; i < j; i++) {
                        for (n = 0; n < dimensions; n++) {
                            intermediateValues[m] =
                                intermediateValues[m] * k +
                                intermediateValues[m + dimensions] * t;
                            m++;
                        }
                    }
                }
                return new (this.getControlPoint(0).constructor)().initWithCoordinates(
                    intermediateValues.slice(0, dimensions)
                );
            } else {
                return null;
            }
        }
    },

    /**
        In-place splitting of bezier curve at t with De Casteljau's algorithm.
        Leaves interval [0, t] in-place, returns new bezier curve for the
        interval [t, 1]
    */
    split: {
        value: function (t) {
            var order = this.order,
                intermediateValues = [],
                dimensions = this.dimensions,
                currentPoint,
                nextPoint = this.getControlPoint(0),
                rightSide = (new this.constructor()).init(),
                i, j, n = 2;

            if (order) {
                rightSide.setControlPoint(order, this.getControlPoint(order));
                for (i = 1; i <= order; i++) {
                    currentPoint = nextPoint;
                    nextPoint = this.getControlPoint(i);
                    intermediateValues.push(
                        currentPoint.outOfPlaceLerp(nextPoint, t)
                    );
                }
                this.setControlPoint(1, intermediateValues[0]);
                for (j = order - 1; j > 0; j--) {
                    for (i = 0; i < j; i++) {
                        intermediateValues[i] = intermediateValues[i].outOfPlaceLerp(intermediateValues[i + 1], t);
                    }
                    this.setControlPoint(n, intermediateValues[0]);
                    n++;
                }
                rightSide.setControlPoint(0, intermediateValues[0].clone());
                for (i = 1; i < order; i++) {
                    rightSide.setControlPoint(i, intermediateValues[i]);
                }
                this.dispatchEventIfNeeded("bezierCurveChange");
                return rightSide;
            } else {
                this.dispatchEventIfNeeded("bezierCurveChange");
                return null;
            }
        }
    },

    /**
        Reverses control points in place
    */
    reverse: {
        value: function () {
            var order = this.order,
                length = order >> 1,
                i,
                tmp;

            for (i = 0; i <= length; i++) {
                tmp = this.getControlPoint(i);
                this.setControlPoint(i, this.getControlPoint(order - i));
                this.setControlPoint(order - i, tmp);
            }
            this.dispatchEventIfNeeded("bezierCurveChange");
            return this;
        }
    },

    /**
        In-place translation of control points by provided offsets array. Dimensions
        of control points and length of provided array are assumed to be the same
    */
    translate: {
        value: function (offsetsArray) {
            var order = this.order,
                i;

            for (i = 0; i <= order; i++) {
                this.getControlPoint(i).translate(offsetsArray);
            }
            this.dispatchEventIfNeeded("bezierCurveChange");
            return this;
        }
    },

    /**
        In-place scaling of control points by provided factors array. Dimensions
        of control points and length of provided array are assumed to be the same
    */
    scale: {
        value: function (factorsArray) {
            var order = this.order,
                i;

            for (i = 0; i <= order; i++) {
                this.getControlPoint(i).scale(factorsArray);
            }
            this.dispatchEventIfNeeded("bezierCurveChange");
            return this;
        }
    },

    /**
        In-place CCW 2d rotation of control points by a given angle in radians
    */
    rotate: {
        value: function (angle) {
            var order = this.order,
                i;

            for (i = 0; i <= order; i++) {
                this.getControlPoint(i).rotate(angle);
            }
            this.dispatchEventIfNeeded("bezierCurveChange");
            return this;
        }
    },

    /**
        In-place CCW 3d rotation around X axis of control points by a
        given angle in radians
    */
    rotateX: {
        value: function (angle) {
            var order = this.order,
                i;

            for (i = 0; i <= order; i++) {
                this.getControlPoint(i).rotateX(angle);
            }
            this.dispatchEventIfNeeded("bezierCurveChange");
            return this;
        }
    },

    /**
        In-place CCW 3d rotation around Y axis of control points by a
        given angle in radians
    */
    rotateY: {
        value: function (angle) {
            var order = this.order,
                i;

            for (i = 0; i <= order; i++) {
                this.getControlPoint(i).rotateY(angle);
            }
            this.dispatchEventIfNeeded("bezierCurveChange");
            return this;
        }
    },

    /**
        In-place CCW 3d rotation around Z axis of control points by a
        given angle in radians
    */
    rotateZ: {
        value: function (angle) {
            var order = this.order,
                i;

            for (i = 0; i <= order; i++) {
                this.getControlPoint(i).rotateZ(angle);
            }
            this.dispatchEventIfNeeded("bezierCurveChange");
            return this;
        }
    },

    /**
        In-place matrix 2d transform. It takes a 2 rows by 3 colums matrix linearized as
        an array in the same format as CSS 2d transform matrix (column-major order).
        It only affects x and y coordinates of control points
    */
    transformMatrix: {
        value: function (matrix) {
            var order = this.order,
                i;

            for (i = 0; i <= order; i++) {
                this.getControlPoint(i).transformMatrix(matrix);
            }
            this.dispatchEventIfNeeded("bezierCurveChange");
            return this;
        }
    },

    /**
        In-place matrix 3d transform. It takes a 4 by 4 matrix linearized
        as an array in column-major order
    */
    transformMatrix3d: {
        value: function (matrix) {
            var order = this.order,
                i;

            for (i = 0; i <= order; i++) {
                this.getControlPoint(i).transformMatrix3d(matrix);
            }
            this.dispatchEventIfNeeded("bezierCurveChange");
            return this;
        }
    },

    /**
        In-place skewing x axis relative to y axis by provided angle (in radians)
    */
    skewX: {
        value: function (angle) {
            var order = this.order,
                i;

            for (i = 0; i <= order; i++) {
                this.getControlPoint(i).skewX(angle);
            }
            this.dispatchEventIfNeeded("bezierCurveChange");
            return this;
        }
    },

    /**
        In-place skewing y axis relative to x axis by provided angle (in radians)
    */
    skewY: {
        value: function (angle) {
            var order = this.order,
                i;

            for (i = 0; i <= order; i++) {
                this.getControlPoint(i).skewY(angle);
            }
            this.dispatchEventIfNeeded("bezierCurveChange");
            return this;
        }
    },

    /**
        Returns a copy of self bezierCurve with recursive copies of control points
    */
    clone: {
        value: function () {
            var clone = new this.constructor().init(),
                length = this._data.length,
                i;

            for (i = 0; i < length; i++) {
                if (this._data[i]) {
                    clone._data[i] = this._data[i].clone();
                    clone._data[i].nextTarget = clone;
                }
            }
            return clone;
        }
    },

    /**
        Returns axis aligned boundaries of all control points
    */
    softAxisAlignedBoundaries: {
        get: function () {
            var boundaries = [],
                order = this.order,
                dimensions = this.dimensions,
                i, j, iControlPoint, jCoordinate;

            for (i = 0; i < dimensions; i++) {
                boundaries[i] = {
                    min: Infinity,
                    max: -Infinity
                };
            }
            for (i = 0; i <= order; i++) {
                iControlPoint = this.getControlPoint(i);
                for (j = 0; j < dimensions; j++) {
                    jCoordinate = iControlPoint.getCoordinate(j);
                    if (jCoordinate < boundaries[j].min) {
                        boundaries[j].min = jCoordinate;
                    }
                    if (jCoordinate > boundaries[j].max) {
                        boundaries[j].max = jCoordinate;
                    }
                }
            }
            return boundaries;
        }
    },

    /**
        Returns axis aligned boundaries of bezier curve or null if the curve
        doesn't have defined any control points
    */
    hardAxisAlignedBoundaries: {
        get: function () {
            var boundaries = [],
                dimensions = this.dimensions,
                i;

            if (this.isComplete) {
                var curves,
                    iBoundaries,
                    rightSide,
                    j, k;

                for (i = 0; i < dimensions; i++) {
                    boundaries[i] = {
                        min: Infinity,
                        max: -Infinity
                    };
                }
                for (k = 0; k < dimensions; k++) {
                    curves = [this.clone()];
                    for (i = 0; i < curves.length; i++) {
                        iBoundaries = curves[i].softAxisAlignedBoundaries;
                        if (iBoundaries[k].min < boundaries[k].min -0.001) {
                            if (iBoundaries[k].max < boundaries[k].min -0.001) {
                                boundaries[k].min = iBoundaries[k].max;
                            }
                            if (rightSide = curves[i].split(0.5)) {
                                curves.push(rightSide);
                            }
                            i--;
                        }
                    }
                    curves = [this.clone()];
                    for (i = 0; i < curves.length; i++) {
                        iBoundaries = curves[i].softAxisAlignedBoundaries;
                        if (iBoundaries[k].max > boundaries[k].max + 0.001) {
                            if (iBoundaries[k].min > boundaries[k].max + 0.001) {
                                boundaries[k].max = iBoundaries[k].min;
                            }
                            if (rightSide = curves[i].split(0.5)) {
                                curves.push(rightSide);
                            }
                            i--;
                        }
                    }
                }
                return boundaries;
            } else {
                if (this.length === 1) {
                    for (i = 0; i < dimensions; i++) {
                        boundaries[i] = {
                            min: this.getControlPoint(0).getCoordinate(i),
                            max: this.getControlPoint(0).getCoordinate(i)
                        };
                    }
                    return boundaries;
                } else {
                    return null;
                }
            }
        }
    },

    /**
        Returns the closer point and distance in the curve to the given vector.
        The dimensions of the given vector are expected to be equal to the dimensions
        of the control points in the curve
    */
    getCloserPointTo: {
        value: function (vector) {
            var dimensions = this.dimensions,
                iPoint,
                distance,
                minDistance = Infinity,
                bestI = 0,
                i;

            // TODO: Enhance this naif algorithm

            for (i = 0; i < 1; i += 0.001) {
                iPoint = this.value(i);
                if (iPoint !== null) {
                    distance = iPoint.distanceTo(vector);
                    if (distance < minDistance) {
                        minDistance = distance;
                        bestI = i;
                    }
                }
            }
            return {
                distance: minDistance,
                vector: this.value(bestI),
                t: bestI
            };
        }
    }
});

var CubicBezierCurve = exports.CubicBezierCurve = BezierCurve.specialize({

    constructor: {
        value: function CubicBezierCurve () {
        }
    },

    type: {
        serializable: false,
        value: "CubicBezierCurve"
    },

    /**
        Number of control points - 1, 3 for cubic Béziers
    */
    order: {
        serializable: false,
        writable: false,
        value: 3
    },

    /**
        Returns true if all control points are defined
    */
    isComplete: {
        get: function () {
            var i;

            for (i = 0; i < 4; i++) {
                if (!this.getControlPoint(i)) {
                    return false;
                }
            }
            return true;
        }
    },

    /**
        Overrides BezierCurve's hardAxisAlignedBoundaries with speed optimized algorithm for cubic beziers curves
    */
    hardAxisAlignedBoundaries: {
        get: function () {
            var boundaries = [],
                dimensions = this.dimensions,
                p0, p1, p2, p3,
                a, b, c, r0, r1,
                discriminant,
                value,
                values,
                i, j;

            if (this.isComplete) {
                for (i = 0; i < dimensions; i++) {
                    p0 = this.getControlPoint(0).getCoordinate(i);
                    p1 = this.getControlPoint(1).getCoordinate(i);
                    p2 = this.getControlPoint(2).getCoordinate(i);
                    p3 = this.getControlPoint(3).getCoordinate(i);
                    values = [p0, p3];
                    a = 9 * (p1 - p2) + 3 * (p3 - p0);
                    b = 6 * (p0 + p2) - 12 * p1;
                    c = 3 * (p1 - p0);
                    discriminant = b * b - 4 * (a * c);
                    if (discriminant >= 0) {
                        discriminant = Math.sqrt(discriminant);
                        value = (-b + discriminant) / (2 * a);
                        if ((value === Infinity) || (value === -Infinity)) {
                            value = -c / b;
                            if ((value === Infinity) || (value === -Infinity)) {
                                if ((value > 0) && (value < 1)) {
                                    values.push(this.value(value).getCoordinate(i));
                                }
                            }
                        } else {
                            if ((value > 0) && (value < 1)) {
                                values.push(this.value(value).getCoordinate(i));
                            }
                            value = (-b - discriminant) / (2 * a);
                            if ((value > 0) && (value < 1)) {
                                values.push(this.value(value).getCoordinate(i));
                            }
                        }
                    }
                    boundaries[i] = {
                        min: Math.min.apply(Math, values),
                        max: Math.max.apply(Math, values)
                    };
                }
                return boundaries;
            } else {
                if (dimensions && this.getControlPoint(0)) {
                    for (i = 0; i < dimensions; i++) {
                        p0 = this.getControlPoint(0).getCoordinate(i);
                        boundaries[i] = {
                            min: p0,
                            max: p0
                        };
                    }
                    return boundaries;
                }
                return null;
            }
        }
    }
});

var BezierSpline = exports.BezierSpline = MapReducible.specialize({

    constructor: {
        value: function BezierSpline () {
        }
    },

    type: {
        serializable: false,
        value: "BezierSpline"
    },

    /**
        Returns the number of Bézier curves in the spline
    */
    length: {
        get: function () {
            return this._data.length;
        }
    },

    /**
        Returns the first knot of the bezier
    */
    firstKnot: {
        get: function () {
            var curve = this.getBezierCurve(0);

            if (curve) {
                if (curve.getControlPoint(0)) {
                    return curve.getControlPoint(0);
                } else {
                    return curve.getControlPoint(3);
                }
            } else {
                return null;
            }
        }
    },

    /**
        Returns the last knot of the bezier
    */
    lastKnot: {
        get: function () {
            var curve = this.getBezierCurve(this.length - 1);

            if (curve) {
                if (curve.isComplete) {
                    return curve.getControlPoint(curve.order);
                } else {
                    return curve.getControlPoint(0);
                }
            } else {
                return null;
            }
        }
    },

    /**
        Inserts the provided Bézier curve at the end of the spline and if there is
        a previous Bézier curve, it sets the first control point of the inserted
        Bézier curve to be the last control point of the previous Bézier curve (if any)
    */
    pushBezierCurve: {
        value: function (bezierCurve) {
            var index = this._data.push(bezierCurve) - 1;

            bezierCurve.nextTarget = this;
            if (index > 0) {
                this._data[index].setControlPoint(0,
                    this._data[index - 1].getControlPoint(this._data[index - 1].order)
                );
            }
            this.dispatchEventIfNeeded("bezierSplineChange");
        }
    },

    /**
        Inserts the provided cubic Bézier curve at the start of the spline
    */
    insertCubicBezierCurveAtStart: {
        value: function (bezierCurve) {
            this._data.splice(0, 0, bezierCurve);
            bezierCurve.nextTarget = this;
            if (this._data.length > 1) {
                this._data[0].setControlPoint(3,
                    this._data[1].getControlPoint(0)
                );
            }
            this.dispatchEventIfNeeded("bezierSplineChange");
        }
    },

    /**
        Returns the Bézier curve in the spline at the given index
    */
    getBezierCurve: {
        value: function (index) {
            return this._data[index];
        }
    },

    /**
        Returns removed Bézier curve from the end of the spline and
        unlinks previous Bézier curve last control point from the first
        in the returned curve by cloning it
    */
    popBezierCurve: {
        value: function () {
            var bezierCurve = this._data.pop();

            bezierCurve.setControlPoint(0, bezierCurve.getControlPoint(0).clone());
            bezierCurve.nextTarget = null;
            this.dispatchEventIfNeeded("bezierSplineChange");
            return bezierCurve;
        }
    },

    /**
        Removes Bézier curve at given index. If the curve is the first or last curve
        of the Bézier, it removes in-place and returns null, if not, it splits the
        spline in 2, leaving in-place the left side of the spline ([0 .. index - 1] range),
        and returns the right side of the spline ([index + 1 .. spline.length]).
        If the removed curve is the only one at the spline it will leave in-place
        a 0 length spline
    */
    removeBezierCurve: {
        value: function (index) {
            var rightSide = (new BezierSpline()).init(),
                i;

            if (index) {
                for (i = index + 1; i < this.length; i++) {
                    rightSide.pushBezierCurve(this._data[i]);
                    this._data[i].nextTarget = rightSide;
                }
                this._data = this._data.slice(0, index);
                this.dispatchEventIfNeeded("bezierSplineChange");
                if (rightSide.length) {
                    return rightSide;
                } else {
                    return null;
                }
            } else {
                this._data = this._data.slice(1);
                this.dispatchEventIfNeeded("bezierSplineChange");
                return null;
            }
        }
    },

    /**
        Splits curve in the spline at the given index and at the given
        position (t parameter) in-place
    */
    splitCurveAtPosition: {
        value: function (index, t) {
            var rightSideCurve = this.getBezierCurve(index).split(t),
                length = this.length,
                i;

            for (i = length; i > index; i--) {
                this._data[i] = this._data[i - 1];
            }
            this._data[index + 1] = rightSideCurve;
            this._data[index + 1].setControlPoint(0,
                this._data[index].getControlPoint(this._data[index].order)
            );
            if (index + 2 <= length) {
                this._data[index + 2].setControlPoint(0,
                    this._data[index + 1].getControlPoint(this._data[index + 1].order)
                );
            }
            this.dispatchEventIfNeeded("bezierSplineChange");
            return this;
        }
    },

    /**
        In-place translation of the spline by the given offsets array
    */
    translate: {
        value: function (offsetsArray) {
            var length = this._data.length,
                start,
                curveLength,
                i, j;

            for (i = 0; i < length; i++) {
                curveLength = this._data[i].length;
                if (i) {
                    start = 1;
                } else {
                    start = 0;
                }
                for (j = start; j < curveLength; j++) {
                    if (this._data[i].getControlPoint(j)) {
                        this._data[i].getControlPoint(j).translate(offsetsArray);
                    }
                }
            }
            this.dispatchEventIfNeeded("bezierSplineChange");
            return this;
        }
    },

    /**
        In-place scaling of the spline by the given factors array
    */
    scale: {
        value: function (factorsArray) {
            var length = this._data.length,
                start,
                curveLength,
                i, j;

            for (i = 0; i < length; i++) {
                curveLength = this._data[i].length;
                if (i) {
                    start = 1;
                } else {
                    start = 0;
                }
                for (j = start; j < curveLength; j++) {
                    if (this._data[i].getControlPoint(j)) {
                        this._data[i].getControlPoint(j).scale(factorsArray);
                    }
                }
            }
            this.dispatchEventIfNeeded("bezierSplineChange");
            return this;
        }
    },

    reverse: {
        value: function () {
            var reversedSpline = (new this.constructor()).init(),
                length = this._data.length,
                i;

            if (this._data[0] && !this._data[0].isComplete) {
                this._data.splice(0, 1);
                length--;
            }
            if (this._data[length - 1] && !this._data[length - 1].isComplete) {
                length--;
            }
            for (i = length - 1; i >= 0; i--) {
                reversedSpline.pushBezierCurve(this._data[i].reverse());
                reversedSpline._data[length - 1 - i].nextTarget = reversedSpline;
            }
            this._data = reversedSpline._data;
            reversedSpline.nextTarget = this;
            this.dispatchEventIfNeeded("bezierSplineChange");
            return this;
        }
    },

    /**
        In-place 2d rotation of the spline by the given angle. It is assumed
        that the Bézier curves forming the spline are able to rotate
    */
    rotate: {
        value: function (angle) {
            var length = this._data.length,
                start,
                curveLength,
                i, j;

            for (i = 0; i < length; i++) {
                curveLength = this._data[i].length;
                if (i) {
                    start = 1;
                } else {
                    start = 0;
                }
                for (j = start; j < curveLength; j++) {
                    this._data[i].getControlPoint(j).rotate(angle);
                }
            }
            this.dispatchEventIfNeeded("bezierSplineChange");
            return this;
        }
    },

    /**
        Returns array with length equal to the dimensions of the Vectors forming
        the Bézier curves in the spline, with min and max properties for each
        dimension defining the axis aligned boundaries of the spline
    */
    axisAlignedBoundaries: {
        get: function () {
            var dimensions = this._data[0] ? this._data[0].dimensions : 3,
                length = this._data.length,
                boundaries = [],
                iBoundaries,
                i, j;

            for (i = 0; i < dimensions; i++) {
                boundaries[i] = {
                    min: Infinity,
                    max: -Infinity
                };
            }
            for (i = 0; i < length; i++) {
                iBoundaries = this._data[i].hardAxisAlignedBoundaries;
                if (iBoundaries) {
                    for (j = 0; j < dimensions; j++) {
                        if (iBoundaries[j].min < boundaries[j].min) {
                            boundaries[j].min = iBoundaries[j].min;
                        }
                        if (iBoundaries[j].max > boundaries[j].max) {
                            boundaries[j].max = iBoundaries[j].max;
                        }
                    }
                }
            }
            return boundaries;
        }
    },

    /**
        Returns the closer point and distance and curve index in the spline to the given vector.
        The dimensions of the given vector are expected to be equal to the dimensions
        of the control points defining the spline
    */
    getCloserPointTo: {
        value: function (vector) {
            var point,
                minDistance = Infinity,
                best = {vector: null, t: null},
                bestIndex = null;

            this.forEach(function (curve, index) {
                point = curve.getCloserPointTo(vector);
                if (point.distance < minDistance) {
                    minDistance = point.distance;
                    best = point;
                    bestIndex = index;
                }
            });
            return {
                distance: minDistance,
                vector: best.vector,
                index: bestIndex,
                t: best.t
            };
        }
    },

    /**
        Returns a copy of self bezierSpline with recursive copies of bezier curves
    */
    clone: {
        value: function () {
            var clone = new this.constructor().init(),
                length = this._data.length,
                i;

            for (i = 0; i < length; i++) {
                clone.pushBezierCurve(this._data[i].clone());
                clone._data[i].nextTarget = clone;
            }
            return clone;
        }
    },

    /**
        In-place transform matrix 3d of the bezierSpline
    */
    transformMatrix3d: {
        value: function (matrix) {
            var length = this._data.length,
                i,
                j,
                start,
                curveLength;

            for (i = 0; i < length; i++) {
                curveLength = this._data[i].length;
                if (i) {
                    start = 1;
                } else {
                    start = 0;
                }
                for (j = start; j < curveLength; j++) {
                    if (this._data[i].getControlPoint(j)) {
                        this._data[i].getControlPoint(j).transformMatrix3d(matrix);
                    }
                }
            }
            this.dispatchEventIfNeeded("bezierSplineChange");
            return this;
        }
    }
});

var Scene = exports.Scene = MapReducible.specialize({

    constructor: {
        value: function Scene () {
        }
    },

    length: {
        get: function () {
            return this._data.length;
        }
    },

    pushShape: {
        value: function (shape) {
            this._data.push(shape);
            shape.nextTarget = this;
            this.dispatchEventIfNeeded("sceneChange");
        }
    },

    insertShape: {
        value: function (shape, position) {
            this._data.splice(position, 0, shape);
            shape.nextTarget = this;
            this.dispatchEventIfNeeded("sceneChange");
        }
    },

    removeShape: {
        value: function (shape) {
            var i;

            shape.nextTarget = null;
            for (i = 0; i < this._data.length; i++) {
                if (this._data[i] === shape) {
                    this._data.splice(i, 1);
                    i--;
                }
            }
            this.dispatchEventIfNeeded("sceneChange");
        }
    },

    getShape: {
        value: function (index) {
            return this._data[index];
        }
    }
});
