var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component;

exports.OrganizationsListItem = Montage.create(Component, {

    organization: {
        value: null
    },

    organizationsController: {
        value: null
    },

    handleOrganizationNameAction: {
        value: function() {
            this.organizationsController.clearSelection();
            this.organizationsController.select(this.organization);
        }
    }
});
