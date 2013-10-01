/**
 * @module ui/package-information-maintainers.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    Promise = require("montage/core/promise").Promise;

/**
 * @class PackageInformationMaintainers
 * @extends Component
 */
exports.PackageInformationMaintainers = Component.specialize(/** @lends PackageInformationMaintainers# */ {

    constructor: {
        value: function PackageInformationMaintainers() {
            this.super();
        }
    },

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

    /**
     * Displays the create person overlay form.
     * @function
     */
    handleAddMaintainerAction: {
        value: function() {
            this._cleanOverlay();
            this.createPersonOverlay.show();
        }
    },

    /**
     * Handle create maintainer action.
     * @function
     * @params {Event} event
     */
    handleCreateMaintainer: {
        value: function (event) {
            var maintainer = (event.detail && event.detail.maintainer) ? event.detail.maintainer : null;

            if (maintainer && this.editingDocument &&
                this.editingDocument.addMaintainer(maintainer) && this.createPersonOverlay.isShown) {

                this.createPersonOverlay.hide();
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
            var maintainer = event.detail.get('maintainer');

            if (maintainer && this.editingDocument) {
                this.editingDocument.removeMaintainer(maintainer);
            }
        }
    },

    handleEditPersonAction: {
        value: function (event) {
            var source = event.detail.get('source');

            if (source && this.editingDocument) {
                source.isEditing = true;
            }
        }
    },

    handleCancelEditPersonAction: {
        value: function (event) {
            var source = event.detail.get('source');

            if (source && this.editingDocument) {
                source.isEditing = false;
            }
        }
    },

    handleValidEditPersonAction: {
        value: function (event) {
            var source = event.detail.get('source'),
                old = source.person,
                maintainer = source.formPerson.data;

            if (this.editingDocument && source && maintainer) {
                this.editingDocument.replaceMaintainer(old, maintainer);
                source.validModification();
            }
        }
    },

    /**
     * Cleans the create person overlay content.
     * @function
     * @private
     */
    _cleanOverlay: {
        value: function () {
            this.createPersonOverlay.content.clean();
        }
    }

});
