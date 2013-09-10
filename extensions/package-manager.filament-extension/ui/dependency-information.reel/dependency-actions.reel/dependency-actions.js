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
            this.rangeTextField.element.setCustomValidity(valid ? '' : 'range is not valid');
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
            if (type && this.editingDocument && DependencyNames[type] && this.currentDependency && this.currentDependency.type !== type) {
                var promise = this.editingDocument.replaceDependency(this.currentDependency, type);

                if (promise) {
                    var self = this;
                    promise.then(function () {
                        self.currentDependency.type = type;
                    }).done();
                }
            }
        }
    },

    handleAcceptUpdateAction: {
        value: function () {
            var update = this.currentDependency.update ? this.currentDependency.update.available : null,
                name = this.currentDependency.name;

            if (this.currentDependency && this.editingDocument && update) {
                var promise = this.editingDocument.updateDependency(name, update, this.currentDependency.type)
                    .then(function (data) {
                        if (data && typeof data === 'object' && data.hasOwnProperty('name')) {
                            return 'The dependency ' + data.name + ' has been updated';
                        }

                        throw new Error('An error has occurred while updating the dependency ' + name);
                    });

                this.dispatchEventNamed("asyncActivity", true, false, {
                    promise: promise,
                    title: "Updating"
                });
            }
        }
    }

});
