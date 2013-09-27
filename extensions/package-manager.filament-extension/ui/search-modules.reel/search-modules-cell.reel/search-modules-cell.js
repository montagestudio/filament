/**
 * @module ui/search-modules-cell.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    LABELS_STATE = {
        0: "Install",
        1: "Installing...",
        2: "Installed",
        3: "Error"
    };

var STATES = exports.STATES = {
        DEFAULT: 0,
        INSTALLING: 1,
        INSTALLED: 2,
        ERROR: 3
    };

/**
 * @class SearchModulesCell
 * @extends Component
 */
exports.SearchModulesCell = Component.specialize(/** @lends SearchModulesCell# */ {

    constructor: {
        value: function SearchModulesCell() {
            this.super();
            this.label = STATES.DEFAULT;
            this.addOwnPropertyChangeListener("state", this);
        }
    },

    state: {
        value: null
    },

    _draggable: {
        value: false
    },

    draggable: {
        set: function (draggable) {
            this._draggable = !!draggable;
            this.needsDraw = true;
        }
    },

    draw: {
        value: function () {
            this.element.setAttribute("draggable", this._draggable);
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
            this._module = module;
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
        set: function (state) {
            this._label = LABELS_STATE[state];
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
            this._enabled = !!enable;
        },
        get: function () {
            return this._enabled;
        }
    },

    handleStateChange: {
        value: function (state) {
            if (state === STATES.INSTALLING || state === STATES.INSTALLED || state === STATES.ERROR) {
                this.enabled = false;
                this.label = state;
            } else {
                this.enabled = true;
                this.label = STATES.DEFAULT;
            }
        }
    }

});
