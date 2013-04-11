var Montage = require("montage").Montage,
    ReelDocument = require("core/reel-document").ReelDocument,
    Template = require("montage/core/template").Template;

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
