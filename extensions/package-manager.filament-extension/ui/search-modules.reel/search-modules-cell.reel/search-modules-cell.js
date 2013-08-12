/**
 * @module ui/search-modules-cell.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    DEFAULT_LABEL = "Install",
    ERROR_LABEL = "Error",
    INSTALLED_LABEL = "Installed",
    INSTALLING_LABEL = "Installing...";

/**
 * @class SearchModulesCell
 * @extends Component
 */
exports.SearchModulesCell = Component.specialize(/** @lends SearchModulesCell# */ {

    constructor: {
        value: function SearchModulesCell() {
            this.super();
        }
    },

    _module: {
        value: null
    },

    /**
     * Represents the cell module.
     * @type {Object}
     */
    module: {
        set: function (module) {
            if (module && typeof module === 'object' && module.hasOwnProperty('name') && module.hasOwnProperty('installed')) {
                this._module = module;
            }
        },
        get: function () {
            return this._module;
        }
    },

    _label: {
        value: null
    },

    /**
     * Bound to the button label.
     * Will change in terms of the cell' state. (Installing, installed, error)
     * @type {String}
     */
    label: {
        set: function (label) {
            this._label =  (typeof label === "string" && label.length > 0) ? label : DEFAULT_LABEL;
        },
        get: function () {
            return this._label;
        }
    },

    _enabled: {
        value: true
    },

    /**
     * Bound to the button.
     * Will change in terms of the cell' state. (Installing, installed, error)
     * @type {Boolean}
     */
    enabled: {
        set: function (enable) {
            this._enabled =  (typeof enable === "boolean") ? enable : true;
        },
        get: function () {
            return this._enabled;
        }
    },

    _installed: {
        value: false
    },

    /**
     * Bound to the module.installed property.
     * Specifies if the module is installed or not.
     * @type {Boolean}
     */
    installed: {
        set: function (installed) {
            this._installed = (typeof installed === 'boolean') ? installed : false;
            this.label = (this._installed) ? INSTALLED_LABEL : DEFAULT_LABEL;
            this.enabled = !this._installed;
        },
        get: function () {
            return this._installed;
        }
    },

    /**
     * Specifies if the module is installing or not.
     * @function {Boolean}
     */
    installing: {
        value: function (installing) {
            installing = (typeof installing === 'boolean') ? installing : false;
            this.label = (installing) ? INSTALLING_LABEL : DEFAULT_LABEL;
            this.enabled = !installing;
        }
    },

    /**
     * Specifies if an error has occurred during the installation.
     * @function {Boolean}
     */
    error: {
        value: function (error) {
            error = (typeof error === 'boolean') ? error : false;
            this.label = (error) ? ERROR_LABEL : DEFAULT_LABEL;
            this.enabled = !error;
        }
    }

});
