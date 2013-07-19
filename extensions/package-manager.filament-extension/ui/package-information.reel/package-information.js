/**
 * @module ui/package-information.reel
 * @requires montage/ui/component
 */
var Montage = require("montage").Montage,
    PackageTools = require('../../core/package-tools').PackageTools,
    Component = require("montage/ui/component").Component;
/**
 * @class PackageInformation
 * @extends Component
 */
exports.PackageInformation = Montage.create(Component,/** @lends PackageInformation# */ {

    editingDocument: {
        value: null
    },

    handleNameChanged: {
        value: function (event) {
            var element = event.detail.source;

            if (element && PackageTools.isNameValid(element.value)) {
                this.editingDocument.packageName = element.value;
                element.setCustomValidity('');
            } else {
                element.setCustomValidity('not valid');
            }
        }
    },

    handleVersionChanged: {
        value: function (event) {
            var element = event.detail.source;

            if (element && PackageTools.isVersionValid(element.value)) {
                this.editingDocument.packageVersion = element.value;
                element.setCustomValidity('');
            } else {
                element.setCustomValidity('not valid');
            }
        }
    },

    handlePackageDescriptionChanged: {
        value: function (event) {
            var description = event.target.value;

            if (typeof description === 'string') { // can be empty
                this.editingDocument.packageDescription = description;
            }
        }
    },

    handlePackageAuthorChanged: {
        value: function (event) {
            var author = event.target.author;

            if (author) {
                this.editingDocument.packageAuthor = author;
            }
        }

    }

});
