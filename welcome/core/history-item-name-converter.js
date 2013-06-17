var Montage = require("montage/core/core").Montage,
    Converter = require("montage/core/converter/converter").Converter;

exports.HistoryItemNameConverter = Montage.create(Converter, {

    allowPartialConversion: {
        value: false
    },

    convert: {
        value: function (name) {
            //alternatively, decod the url
            return decodeURI(name);
        }
    },

    revert: {
        value: function (name) {
            return encodeURI(name);
        }
    }
});