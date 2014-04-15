var Montage = require("montage").Montage,
    Promise = require("montage/core/promise").Promise;

var DocumentDataSource = Montage.specialize({

    read: {
        value: function() {
            return Promise.resolve();
        }
    },

    registerDataModifier: {
        value: Function.noop
    },

    isModified: {
        value: Function.noop
    }

});

exports.documentDataSourceMock = function (options) {
    var documentDataSource = new DocumentDataSource();

    Object.keys(options || {}).forEach(function (key) {
        documentDataSource[key] = options[key];
    });

    return documentDataSource;
};
