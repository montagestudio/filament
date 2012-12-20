var Montage = require("montage/core/core").Montage;

exports.HistoryItem = Montage.create(Montage, {

    url: {
        value: null
    },

    initWithUrl: {
        value: function (url) {
            this.url = url;
            return this;
        }
    },

    filename: {
        dependencies: ["url"],
        get: function () {
            var name;
            if (this.url) {
                name = this.url.substring(this.url.lastIndexOf("/") + 1);
            }
            return name;
        }
    }
});