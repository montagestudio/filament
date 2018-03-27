var Component = require("montage/ui/component").Component;

exports.HistoryListItem = Component.specialize({

    repository: {
        value: null
    },

    handleDocumentNameAction: {
        value: function () {
            var path = ["", this.repository.owner.login, this.repository.name].join("/");
            this.application.delegate.changeLocation(path);
        }
    }
});
