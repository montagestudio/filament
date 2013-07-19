/**
 * @module ui/package-information-basics.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PackageInformationBasics
 * @extends Component
 */
exports.PackageInformationBasics = Component.specialize(/** @lends PackageInformationBasics# */ {
    constructor: {
        value: function PackageInformationBasics() {
            this.super();
        }
    },

    editingDocument: {
        value: null
    },

    title: {
        value: null
    },

    name: {
        value: null
    },

    version: {
        value: null
    },

    license: {
        value: null
    },

    privacy: {
        value: null
    },

    didDraw: {
        value: function () {
           this.addOwnPropertyChangeListener("name", this);
           this.addOwnPropertyChangeListener("version", this);
           this.addOwnPropertyChangeListener("license", this);
           this.addOwnPropertyChangeListener("privacy", this);
        }
    },

    handleNameChange: {
        value: function (value) {
            if (this.editingDocument) {
                if (this.editingDocument.setProperty('name', value)) {
                    this.nameElement.element.setCustomValidity('');
                } else {
                    this.nameElement.element.setCustomValidity('not valid');
                }
            }
        }
    },

    handleVersionChange: {
        value: function (value) {
            if (this.editingDocument) {
                this.editingDocument.setProperty('version', value);
            }
        }
    },

    handleLicenseChange: {
        value: function (value) {
            if (this.editingDocument) {
                this.editingDocument.setProperty('license', value);
            }
        }
    },

    handlePrivacyChange: {
        value: function (value) {
            if (this.editingDocument) {
                this.editingDocument.setProperty('privacy', value);
            }
        }
    }
});
