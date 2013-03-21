var Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise,
    Document;

exports.Document = Document = Montage.create(Montage, {

    /**
     * Return a promise for a document representing the specified URL
     *
     * @param {string} url The url for which to create a representative document
     * @return {Promise} A promise that resolves to an initialized document instance
     */
    load: {
        value: function (url) {
            return Promise.resolve(Document.create().init(url));
        }
    },

    _url: {
        value: null
    },

    /**s
     * The URL this document represents
     */
    url: {
        get: function () {
            return this._url;
        }
    },

    /**
     * Initialize a document instance representing the specified URL
     *
     * @param {string} url The URL this document instance will represent
     */
    init: {
        value: function (url) {
            this._url = url;
            return this;
        }
    }

});
