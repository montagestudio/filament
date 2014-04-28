/**
 * @module ui/package-information-description.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application;

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
                application.addEventListener("packageDocumentDidSetOwnProperty", this);
            }
        }
    },

    handleDescriptionChange: {
        value: function (value) {
            if (this.editingDocument) {
                this.editingDocument.setProperty('description', value);
            }
        }
    },

    handlePackageDocumentDidSetOwnProperty: {
        value: function (event) {
            var property = event.detail;

            if (property && property.hasOwnProperty("key") && property.hasOwnProperty("value")) {
                if (property.key === "description" && this.description !== property.value) {
                    this.description= property.value;
                }
            }
        }
    }

});
