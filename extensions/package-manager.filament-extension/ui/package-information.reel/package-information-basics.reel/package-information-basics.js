/**
 * @module ui/package-information-basics.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    PackageTools = require('../../../core/package-tools').ToolsBox;

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

    enterDocument: {
        value: function () {
            this.addOwnPropertyChangeListener("name", this);
            this.addOwnPropertyChangeListener("version", this);
            this.addOwnPropertyChangeListener("license", this);
            this.addOwnPropertyChangeListener("private", this);
            this.addOwnPropertyChangeListener("homepage", this);
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

    homepage: {
        value: null
    },

    private: {
        value: null
    },

    nameTextField: {
        value: null
    },

    homepageTextField: {
        value: null
    },

    handleNameChange: {
        value: function () {
            if (this.editingDocument) {
                this.editingDocument.setProperty('name', this.name);
                this.needsDraw = true;
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

    handleHomepageChange: {
        value: function (value) {
            if (this.editingDocument && this.homepageTextField.element.validity.valid) {
                this.editingDocument.setProperty('homepage', value);
            }
        }
    },

    handlePrivateChange: {
        value: function (value) {
            if (this.editingDocument) {
                this.editingDocument.setProperty('private', value);
            }
        }
    },

    draw: {
        value: function () {
            this.nameTextField.element.setCustomValidity(PackageTools.isNameValid(this.name) ? '' :'name not valid');
        }
    }

});
