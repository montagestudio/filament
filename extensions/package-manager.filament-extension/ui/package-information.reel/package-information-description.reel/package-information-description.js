/**
 * @module ui/package-information-description.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PackageInformationDescription
 */
exports.PackageInformationDescription = Component.specialize(/** @lends PackageInformationDescription# */ {

    constructor: {
        value: function PackageInformationDescription() {
            this.super();
        }
    },

    editingDocument: {
        value: null
    },

    title: {
        value: null
    },

    description: {
        value: null
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.addOwnPropertyChangeListener("description", this);
            }
        }
    },

    handleDescriptionChange: {
        value: function (value) {
            if (this.editingDocument) {
                this.editingDocument.setProperty('description', value);
            }
        }
    }

});
