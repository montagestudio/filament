var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.OrganizationsListItem = Montage.create(Component, {

    organization: {
        value: null
    },

    repositoriesController: {
        value: null
    },

    handleOrganizationNameAction: {
        value: function() {
            this.repositoriesController.selectOrganization(this.organization);
        }
    }

});
