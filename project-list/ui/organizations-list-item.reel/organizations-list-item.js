var Component = require("montage/ui/component").Component;

exports.OrganizationsListItem = Component.specialize({

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
