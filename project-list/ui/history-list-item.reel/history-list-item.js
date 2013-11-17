var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.HistoryListItem = Montage.create(Component, {

    repository: {
        value: null
    },

    repositoriesController: {
        value: null
    },

    handlePress: {
        value: function () {
            this.repositoriesController.open(this.repository);
        }
    }

});
