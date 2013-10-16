/**
 * @module ui/package-information-author.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PackageInformationAuthor
 * @extends Component
 */
exports.PackageInformationAuthor = Component.specialize(/** @lends PackageInformationAuthor# */ {
    constructor: {
        value: function PackageInformationAuthor() {
            this.super();

            // If the author propriety is not defined, within the package.json file.
            this._author = {
                name: "",
                email: "",
                url: ""
            };
        }
    },

    didDraw: {
        value: function () {
            this.addPathChangeListener("author.name", this, "handleAuthorChange");
            this.addPathChangeListener("author.email", this, "handleAuthorChange");
            this.addPathChangeListener("author.url", this, "handleAuthorChange");
        }
    },

    editingDocument: {
        value: null
    },

    title: {
        value: null
    },

    _author: {
        value: null
    },

    author: {
        set: function (author) {
            if (author && typeof author === 'object') {
                this._author.name = author.name || '';
                this._author.email = author.email || '';
                this._author.url = author.url || '';
            }
        },
        get: function () {
            return this._author;
        }
    },

    handleAuthorChange: {
        value: function () {
            var urlInput = this.templateObjects.authorUrl,
                emailInput = this.templateObjects.authorEmail;

            if (urlInput && emailInput && this.editingDocument &&
                urlInput.element.validity.valid && emailInput.element.validity.valid) {

                this.editingDocument.setProperty('author', this.author);
            }
        }
    }

});
