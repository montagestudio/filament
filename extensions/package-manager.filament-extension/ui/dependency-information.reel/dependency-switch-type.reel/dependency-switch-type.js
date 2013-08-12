/**
 * @module ui/dependency-switch-type.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    DEPENDENCIES_ALLOWED = [
        'regular',
        'optional',
        'bundle',
        'dev'
    ];

/**
 * @class DependencySwitchType
 * @extends Component
 */
exports.DependencySwitchType = Component.specialize(/** @lends DependencySwitchType# */ {

    constructor: {
        value: function DependencySwitchType() {
            this.super();
        }
    },

    didDraw: {
        value: function () {
            this.addOwnPropertyChangeListener("selectedValue", this);
        }
    },

    /**
     * Reference to the packageDocument.
     * @type {Object}
     * @default null
     */
    editingDocument: {
        value: null
    },

    /**
     * Reference to the current selected dependency.
     * @type {Object}
     * @default null
     */
    currentDependency: {
        value: null
    },

    /**
     * Reference to the current value within the radio controller component.
     * @type {String}
     * @default null
     */
    selectedValue: {
        value: null
    },

    /**
     * Performs a switch of dependency type.
     * @function {Object}
     * @default null
     */
    handleSelectedValueChange: {
        value: function (type) {
            if (type && this.currentDependency && this.currentDependency.type !== type && DEPENDENCIES_ALLOWED.indexOf(type) >= 0) {
                if (this.editingDocument) {
                    var self = this;

                    this.editingDocument.replaceDependency(this.currentDependency, type).then(function () {
                        self.currentDependency.type = type;
                    });
                }
            }
        }
    }

});
