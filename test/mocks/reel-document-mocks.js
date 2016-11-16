var Montage = require("montage").Montage,
    ReelDocument = require("core/reel-document").ReelDocument,
    documentDataSourceMock = require("./document-data-source-mocks").documentDataSourceMock,
    Promise = require("montage/core/promise").Promise;

//TODO this could be brought inline with the rest of the "mocking system"
exports.mockReelDocument = function (fileUrl, serialization, bodyMarkup) {

    var mockDocument = document.implementation.createHTMLDocument(),
        dataSource,
        serializationNode = mockDocument.createElement("script");

    serializationNode.setAttribute("type", "text/montage-serialization");
    serializationNode.innerHTML = JSON.stringify(serialization);
    mockDocument.getElementsByTagName("head")[0].appendChild(serializationNode);

    mockDocument.getElementsByTagName("body")[0].innerHTML = bodyMarkup;

    //TODO insert bodyMarkup
    dataSource = documentDataSourceMock({
        read: function(url) {
            var content;

            if (/\.js$/.test(url)) {
                content = "";
            } else {
                content = mockDocument.documentElement.outerHTML;
            }
            return Promise.resolve(content);
        },
        write: function() {
            return Promise.resolve();
        }
    });

    fileUrl = require.location + fileUrl;
    return new ReelDocument().init(fileUrl, dataSource, require).load()
    .then(function (reelDocument) {
        // Mini mock for ui/component-editor/document-editor.reel
        // use _editor to avoid setter
        reelDocument._editor = {
            refresh: function () {}
        };
        return reelDocument;
    });
};

var ReelDocMock = Montage.specialize({

    url: {
        value: "$reelDocumentUrl"
    },

    _packageRequire: {
        value: null
    },

    packageRequire: {
        get: function () {
            if (!this._packageRequire) {
                this._packageRequire = {location: "$package-location$"};
            }
            return this._packageRequire;
        }
    },

    editingProxyMap: {
        value: null
    },

    editingProxies: {
        get: function () {
            var self = this;
            return this.editingProxyMap ?
                Object.keys(this.editingProxyMap).map(function (key) {
                    return self.editingProxyMap[key];
                }) :
                null;
        }
    }

});

exports.reelDocumentMock = function (options) {
    var doc = new ReelDocMock();

    if (options) {
        Object.keys(options).forEach(function (key) {
            doc[key] = options[key];
        });
    }


    return doc;
};
