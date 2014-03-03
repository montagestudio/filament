/**
 * @module ui/dependency-actions.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

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

    loadingDependency: {
        value: false
    },

    range: {
        value: null
    },

    _rangeValidity: {
        value: function (valid) {
            this.rangeTextField.element.setCustomValidity(valid ? '' : 'range is not valid');
            return valid;
        }
    },

    handleRangeChange: {
        value: function (range) {
            if (this.editingDocument && typeof range === "string") {
                range = range.trim();

                if (this.currentDependency.version !== range) {
                    this._rangeValidity(this.editingDocument.updateDependencyRange(this.currentDependency, range));
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
            if (type && !this.loadingDependency && this.editingDocument &&
                this.currentDependency && this.currentDependency.type !== type) {

                var self = this;

                this.editingDocument.switchDependencyType(this.currentDependency, type).then(function () {
                    self.currentDependency.type = type;
                }).done();
            }
        }
    },

    handleAcceptUpdateAction: {
        value: function () {
            var update = this.currentDependency.update ? this.currentDependency.update.available : null;

            if (this.currentDependency && !this.loadingDependency &&this.editingDocument && update) {
                this.editingDocument.updateDependency(this.currentDependency.name, update);
            }
        }
    }

});
