var Montage = require("montage").Montage,
    ReelDocument = require("core/reel-document").ReelDocument,
    Template = require("montage/core/template").Template;

//TODO this could be brought inline with the rest of the "mocking system"
exports.mockReelDocument = function (fileUrl, serialization, bodyMarkup) {

    var mockDocument = document.implementation.createHTMLDocument(),
        serializationNode = mockDocument.createElement("script");

    serializationNode.setAttribute("type", "text/montage-serialization");
    serializationNode.innerHTML = JSON.stringify(serialization);
    mockDocument.getElementsByTagName("head")[0].appendChild(serializationNode);

    mockDocument.getElementsByTagName("body")[0].innerHTML = bodyMarkup;

    //TODO insert bodyMarkup

    return Template.create().initWithDocument(mockDocument, require).then(function (template) {
        return ReelDocument.create().init(fileUrl, template, require);
    });
};

var ReelDocMock = Montage.create(Montage, {

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
    }

});

exports.reelDocumentMock = function (options) {
    var doc = ReelDocMock.create();

    if (options) {
        Object.keys(options).forEach(function (key) {
            doc[key] = options[key];
        });
    }


    return doc;
};
