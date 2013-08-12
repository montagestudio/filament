/**
 * @module ui/package-information-basics.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    PackageTools = require('../../../core/package-tools').PackageTools;

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
            this._nameValidity(PackageTools.isNameValid(this.name)); // If the name has been modified manually within the package.json file
        }
    },

    _nameValidity: {
        value: function (valid) {
            if (valid) {
                this.nameTextField.element.setCustomValidity('');
            } else {
                this.nameTextField.element.setCustomValidity('not valid');
            }
        }
    },

    handleNameChange: {
        value: function () {
            if (this.editingDocument) {
                this._nameValidity(this.editingDocument.setProperty('name', this.name));
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
