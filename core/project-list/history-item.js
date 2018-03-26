var Montage = require("montage/core/core").Montage;

exports.HistoryItem = Montage.specialize({

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
                var url = this.url,
                    index = url.indexOf("?");

                if (index !== -1) {
                    url = url.substring(0, index);
                }
                if (url.charAt(url.length - 1) === "/") {
                    url = url.substring(0, url.length - 1);
                }

                name = url.substring(url.lastIndexOf("/") + 1);
            }
            return name;
        }
    }
});
