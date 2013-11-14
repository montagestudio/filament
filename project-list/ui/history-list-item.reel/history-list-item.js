var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.HistoryListItem = Montage.create(Component, {

    historyItem: {
        value: null
    },

    handlePress: {
        value: function (evt) {
            this.dispatchEventNamed("openDocument", true, true, {
                url: this.historyItem.url
            });
        }
    }

});
