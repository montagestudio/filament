/**
 * @module ui/package-information-maintainers.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,

    OverlayConf = {
        ADD: {
            confirmLabel: "Add",
            title: "New Maintainer",
            editingState: false
        },
        EDIT: {
            confirmLabel: "Edit",
            title: "Edit Maintainer",
            editingState: true
        }
    };

/**
 * @class PackageInformationMaintainers
 * @extends Component
 */
exports.PackageInformationMaintainers = Component.specialize(/** @lends PackageInformationMaintainers# */ {

    /**
     * Reference to the packageDocument.
     * @type {Object}
     * @default null
     */
    editingDocument: {
        value: null
    },

    /**
     * Represents the box title
     * @type {String}
     * @default null
     */
    title: {
        value: null
    },

    personOverlay: {
        value: null
    },

    overlayConf: {
        value: null
    },

    _personWillBeEdited: {
        value: null
    },

    /**
     * Displays the create person overlay form.
     * @function
     */
    handleAddMaintainerAction: {
        value: function() {
            this._personWillBeEdited = null;
            this.overlayConf = OverlayConf.ADD;

            this.personOverlay.show();
        }
    },

    /**
     * Handle create maintainer action.
     * @function
     * @params {Event} event
     */
    handleCreatePerson: {
        value: function (event) {
            if (event && event.detail) {
                var maintainer = event.detail.person;

                if (maintainer && this.editingDocument) {
                    if (this.editingDocument.addMaintainer(maintainer) && this.personOverlay.isShown) {
                        this.personOverlay.hide();
                    } // Todo: Display a error message when it's not possible to add a maintainer (name already used...)
                }
            }
        }
    },

    handleAlterPerson: {
        value: function (event) {
            if (event && event.detail) {
                var maintainer = event.detail.person;

                if (maintainer && this.editingDocument) {
                    if (this.editingDocument.replaceMaintainer(this._personWillBeEdited, maintainer) && this.personOverlay.isShown) {
                        this.personOverlay.hide();
                    }

                    this._personWillBeEdited = null;
                }
            }
        }
    },

    /**
     * Handle delete maintainer action.
     * @function
     * @params {Event} event
     */
    handleDeletePersonAction: {
        value: function (event) {
            if (event && event.detail) {
                event.stop();

                var maintainer = event.detail.get('person');

                if (maintainer && this.editingDocument) {
                    this.editingDocument.removeMaintainer(maintainer);
                }
            }
        }
    },

    handleEditPersonAction: {
        value: function (event) {
            if (event && event.detail) {
                event.stop();

                this._personWillBeEdited = event.detail.get('person');

                this.personOverlay.person = this._personWillBeEdited;
                this.overlayConf = OverlayConf.EDIT;

                this.personOverlay.show();
            }
        }
    }

});
