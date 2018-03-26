var Converter = require("montage/core/converter/converter").Converter,
    HistoryItem = require("welcome/core/history-item").HistoryItem;

exports.HistoryItemConverter = Converter.specialize({

    allowPartialConversion: {
        value: false
    },

    convert: {
        value: function (url) {
            return new HistoryItem().initWithUrl(url);
        }
    },

    revert: {
        value: function (historyItem) {
            return historyItem.url;
        }
    }
});
