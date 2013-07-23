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
            this._author = {
                name: '',
                email: '',
                url: ''
            };
        }
    },

    editingDocument: {
        value: null
    },

    title: {
        value: null
    },

    name: {
        set: function (name) {
            this._author.name = (typeof name === 'string') ? name : '';
            this.dispatchOwnPropertyChange('author', this.author);
        },
        get: function () {
            return this._author.name;
        }
    },

    url: {
        set: function (url) {
            this._author.url = (typeof url === 'string') ? url : '';
            this.dispatchOwnPropertyChange('author', this.author);
        },
        get: function () {
            return this._author.url;
        }
    },

    email: {
        set: function (email) {
            this._author.email = (typeof email === 'string') ? email : '';
            this.dispatchOwnPropertyChange('author', this.author);
        },
        get: function () {
            return this._author.email;
        }
    },

    _author: {
        value: null
    },

    author: {
        set: function (author) {
            if (author && typeof author === 'object') {
                this._author.name = author.name;
                this._author.email = author.email;
                this._author.url = author.url;
            }
        },
        get: function () {
            return this._author;
        }
    },

    didDraw: {
        value: function () {
            this.addOwnPropertyChangeListener("author", this);
        }
    },

    handleAuthorChange: {
        value: function (value) {
            if (value && this.editingDocument && this.urlTextField.element.validity.valid && this.emailTextField.element.validity.valid) {
                this.editingDocument.setProperty('author', value);
            }
        }
    }

});
