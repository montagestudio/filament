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
            this._author = (typeof author === 'object') ? author : {
                name: '',
                url: '',
                email: ''
            };
        },
        get: function () {
            return this._author;
        }
    },

    didDraw: {
        value: function () {
            this.addPathChangeListener("author.name", this.handleAuthorChange);
            this.addPathChangeListener("author.url", this.handleAuthorChange);
            this.addPathChangeListener("author.email", this.handleAuthorChange);
        }
    },

    handleAuthorChange: {
        value: function (value) {
            if (this.editingDocument && this.urlElement.element.validity.valid && this.emailElement.element.validity.valid) {
                this.editingDocument.setProperty('author', this.author);
            }
        }
    }

});
