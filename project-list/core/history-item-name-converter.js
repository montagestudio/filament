var Montage = require("montage/core/core").Montage,
    Converter = require("montage/core/converter/converter").Converter;

exports.HistoryItemNameConverter = Montage.create(Converter, {

    allowPartialConversion: {
        value: false
    },

    convert: {value: decodeURI},
    revert: {value: encodeURI}

});
