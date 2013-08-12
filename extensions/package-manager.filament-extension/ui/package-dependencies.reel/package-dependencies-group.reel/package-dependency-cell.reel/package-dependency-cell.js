/**
 * @module ui/package-dependency-cell.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    DEPENDENCY_TYPE_REGULAR = 'regular',
    DETAILS_ERROR_LABEL = 'errors',
    CAN_INSTALL_LABEL = 'Install',
    DEFAULT_LABEL = '-';

/**
 * @class PackageDependencyCell
 * @extends Component
 */
exports.PackageDependencyCell = Component.specialize(/** @lends PackageDependencyCell# */ {

    constructor: {
        value: function PackageDependencyCell() {
            this.super();
        }
    },

    _dependency: {
        value: null
    },

    /**
     * Cell's dependency
     * @type {Object}
     * @default null
     */
    dependency: {
        set: function (module) {
            if (module && typeof module === "object") {
                this._dependency = module;
                this.hasError = (this._dependency && Array.isArray(this._dependency.problems) && this._dependency.problems.length > 0);

                if (this._dependency.type !== DEPENDENCY_TYPE_REGULAR && this._dependency.missing) {
                    this.canInstall = true;
                } else {
                    this.buttonLabel = DEFAULT_LABEL;
                }
            }
        },
        get: function () {
            return this._dependency;
        }
    },

    /**
     * Dependency version or errors label.
     * @type {String}
     * @default null
     */
    details: {
        value: null
    },

    _buttonLabel: {
        value: null
    },

    /**
     * Button action label.
     * @type {String}
     * @default null
     */
    buttonLabel: {
        set: function (label) {
            this._buttonLabel = (typeof label === 'string') ? label : DEFAULT_LABEL;
        },
        get: function () {
            return this._buttonLabel;
        }
    },

    _hasError: {
        value: false
    },

    /**
     * Returns true if the dependency shows some errors
     * @type {boolean}
     * @return {boolean}
     */
    hasError: {
        set: function (bool) {
            this._hasError = (typeof bool === 'boolean') ? bool : false;
            this.details = (this.hasError) ? DETAILS_ERROR_LABEL : this.dependency.versionInstalled;
        },
        get: function () {
            return this._hasError;
        }
    },

    _performingAction: {
        value: false
    },

    /**
     * Displays a spinner if the dependency is either installing or removing.
     * @type {boolean}
     * @return {boolean}
     */
    performingAction: {
        set: function (performing) {
            this._performingAction = (typeof performing === 'boolean') ? performing : false ;
        },
        get: function () {
            return this._performingAction;
        }
    },

    _canInstall: {
        value: false
    },

    /**
     * Specifies if the dependency can be install directly from the list,
     * Indeed, only the regular type is mandatory.
     * @type {boolean}
     * @return {boolean}
     */
    canInstall: {
        set: function (bool) {
            this._canInstall = (typeof bool === 'boolean') ? bool : false;
            this.buttonLabel = (this._canInstall) ? CAN_INSTALL_LABEL : DEFAULT_LABEL;
        },
        get: function () {
            return this._canInstall;
        }
    }

});
