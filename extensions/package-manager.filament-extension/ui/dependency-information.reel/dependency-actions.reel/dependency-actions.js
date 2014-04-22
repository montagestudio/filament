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

    handleRangeChange: {
        value: function (range) {
            if (this.editingDocument && this.currentDependency && typeof range === "string") {
                if (this.currentDependency.version !== range) {
                    this.editingDocument.updateDependencyRange(this.currentDependency, range);
                }

                this.needsDraw = true;
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

                this.editingDocument.switchDependencyType(this.currentDependency, type).done();
            }
        }
    },

    handleAcceptUpdateAction: {
        value: function () {
            if (this.currentDependency && !this.loadingDependency && this.editingDocument) {
                var update = this.currentDependency.update ? this.currentDependency.update.available : null;

                if (update) {
                    this.editingDocument.updateDependency(this.currentDependency.name, update);
                }
            }
        }
    },

    draw: {
        value: function () {
            if (this.currentDependency) {
                if (this.range) {
                    var validity = this.editingDocument.isRangeValid(this.range);
                    this.rangeTextField.element.setCustomValidity(validity ? '' : 'range is not valid');
                }

                if (Array.isArray(this.currentDependency.information.versions) && this.currentDependency.information.versions.length > 0) {
                    this.templateObjects.versionsAvailable.contentController.select(this.currentDependency.versionInstalled);
                }
            }
        }
    }

});
