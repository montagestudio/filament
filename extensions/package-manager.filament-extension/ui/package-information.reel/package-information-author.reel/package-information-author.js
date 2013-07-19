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

    _name: {
        value: ''
    },

    name: {
        set: function (name) {
            this._name = (typeof name === 'string') ? name : '';
            this.dispatchOwnPropertyChange('author', this.author);
        },
        get: function () {
            return this._name;
        }
    },

    _url: {
        value: ''
    },

    url: {
        set: function (url) {
            this._url = (typeof url === 'string') ? url : '';
            this.dispatchOwnPropertyChange('author', this.author);
        },
        get: function () {
            return this._url;
        }
    },

    _email: {
        value: ''
    },

    email: {
        set: function (email) {
            this._email = (typeof email === 'string') ? email : '';
            this.dispatchOwnPropertyChange('author', this.author);
        },
        get: function () {
            return this._email;
        }
    },

    author: {
        set: function (author) {
            if (author && typeof author === 'object') {
                this.name = author.name;
                this.email = author.email;
                this.url = author.url;
            }
        },
        get: function () {
            return {
                name: this.name,
                email: this.email,
                url: this.url
            };
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
