/**
 * @module ui/dependency-actions.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    DependencyNames = require('../../../core/package-tools').DependencyNames;

/**
 * @class DependencyActions
 * @extends Component
 */
exports.DependencyActions = Component.specialize(/** @lends DependencyActions# */ {
    constructor: {
        value: function DependencyActions() {
            this.super();
            this.addOwnPropertyChangeListener("selectedValue", this);
            this.addOwnPropertyChangeListener("range", this);
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

    range: {
        value: null
    },

    _rangeValidity: {
        value: function (valid) {
            this.rangeTextField.element.setCustomValidity(valid ? '' : 'not valid');
            return valid;
        }
    },

    handleRangeChange: {
        value: function (range) {
            if (this.editingDocument && typeof range === "string" && range.length > 0) {
                range = range.trim();

                if (this.currentDependency.range !== range &&
                    this._rangeValidity(this.editingDocument.updateDependencyRange(this.currentDependency, range))) {

                    this.currentDependency.range = range;
                } else {
                    this._rangeValidity(this.editingDocument.isRangeValid(range));
                }
            }
        }
    },

    /**
     * Performs a switch of dependency type.
     * @function {Object}
     * @default null
     */
    handleSelectedValueChange: {
        value: function (type) {
            if (type && DependencyNames[type] && this.currentDependency && this.currentDependency.type !== type) {
                if (this.editingDocument) {
                    var promise = this.editingDocument.replaceDependency(this.currentDependency, type);

                    if (promise) {
                        var self = this;
                        promise.then(function () {
                            self.currentDependency.type = type;
                        }).done();
                    }
                }
            }
        }
    }

});
