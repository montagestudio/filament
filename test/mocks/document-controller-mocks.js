var Montage = require("montage/core/core").Montage;

var DocumentController = Montage.specialize({

    openUrl: {
        value: function (url, documentType) {
            return Promise.resolve();
        }
    }
});

exports.documentControllerMock = function (options) {
    var documentController = new DocumentController;

    Object.keys(options || {}).forEach(function (key) {
        documentController[key] = options[key];
    });

    return documentController;
};
