/**
 * @module ui/package-information-basics.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application,
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
        value: function (firstTime) {
            if (firstTime) {
                this.addPathChangeListener("name", this, "handlePropertyChange");
                this.addPathChangeListener("version", this, "handlePropertyChange");
                this.addPathChangeListener("license", this, "handlePropertyChange");
                this.addPathChangeListener("private", this, "handlePropertyChange");
                this.addPathChangeListener("homepage", this, "handlePropertyChange");
                application.addEventListener("packageDocumentDidSetOwnProperty", this);
            }
        }
    },

    _editingDocument: {
        value: null
    },

    editingDocument: {
        set: function (document) {
            if (document && typeof document === "object") {
                this.name = document.name;
                this.version = document.version;
                this.license = document.license;
                this.homepage = document.homepage;
                this.private = document.private;
                this._editingDocument = document;

                this.needsDraw = true;
            }
        },
        get: function () {
            return this._editingDocument;
        }
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

    handlePropertyChange: {
        value: function (value, key) {
            if (this._editingDocument) {
                this._editingDocument.setProperty(key, value);

                if (key === 'name') {
                    this.needsDraw = true;
                }
            }
        }
    },

    handlePackageDocumentDidSetOwnProperty: {
        value: function (event) {
            var property = event.detail;

            if (property && property.hasOwnProperty("key") && property.hasOwnProperty("value")) {
                if (typeof this[property.key] !== "undefined" && this[property.key] !== property.value) {
                    this[property.key] = property.value;
                }
            }
        }
    },

    draw: {
        value: function () {
            this.nameTextField.element.setCustomValidity(PackageTools.isNameValid(this.name) ? '' :'name not valid');
        }
    }

});
