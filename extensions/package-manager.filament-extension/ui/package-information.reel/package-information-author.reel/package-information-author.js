/**
 * @module ui/package-information-author.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    application = require("montage/core/application").application;

/**
 * @class PackageInformationAuthor
 * @extends Component
 */
exports.PackageInformationAuthor = Component.specialize(/** @lends PackageInformationAuthor# */ {

    constructor: {
        value: function PackageInformationAuthor() {
            this.super();
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (firstTime) {
                this.addOwnPropertyChangeListener("author", this);
                application.addEventListener("packageDocumentDidSetAuthorProperty", this);

                this.addPathChangeListener("name", this, "handlePropertyChange");
                this.addPathChangeListener("url", this, "handlePropertyChange");
                this.addPathChangeListener("email", this, "handlePropertyChange");
            }
        }
    },

    _editingDocument: {
        value: null
    },

    editingDocument: {
        set: function (document) {
            if (document && typeof document === "object") {
                if (document.author) {
                    this.name = document.author.name;
                    this.url = document.author.url;
                    this.email = document.author.email;
                }

                this._editingDocument = document;
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

    url: {
        value: null
    },

    email: {
        value: null
    },

    handlePropertyChange: {
        value: function (value, key) {
            if (this.templateObjects && this.editingDocument) {
                var urlInput = this.templateObjects.authorUrl,
                    emailInput = this.templateObjects.authorEmail;

                if (urlInput && emailInput && urlInput.element.validity.valid && emailInput.element.validity.valid) {
                    this.editingDocument.setAuthorProperty(key, value);
                }
            }
        }
    },

    handlePackageDocumentDidSetAuthorProperty: {
        value: function (event) {
            var property = event.detail;

            if (property && property.hasOwnProperty("key") && property.hasOwnProperty("value")) {
                if (this[property.key] !== property.value) {
                    this[property.key] = property.value;
                }
            }
        }
    }

});
