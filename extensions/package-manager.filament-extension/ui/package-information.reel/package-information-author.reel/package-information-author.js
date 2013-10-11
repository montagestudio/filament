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
                this._author = {
                    name: author.name || '',
                    email: author.email || '',
                    url: author.url || ''
                };
            }
        },
        get: function () {
            return this._author;
        }
    },

    handleAuthorChange: {
        value: function () {
            if (this.editingDocument && this.urlTextField.element.validity.valid && this.emailTextField.element.validity.valid) {
                this.editingDocument.setProperty('author', this.author);
            }
        }
    }

});
