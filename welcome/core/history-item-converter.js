var Montage = require("montage/core/core").Montage,
    Converter = require("montage/core/converter/converter").Converter,
    HistoryItem = require("welcome/core/history-item").HistoryItem;

exports.HistoryItemConverter = Montage.create(Converter, {

    allowPartialConversion: {
        value: false
    },

    convert: {
        value: function (url) {
            return HistoryItem.create().initWithUrl(url);
        }
    },

    revert: {
        value: function (historyItem) {
            return historyItem.url;
        }
    }
});