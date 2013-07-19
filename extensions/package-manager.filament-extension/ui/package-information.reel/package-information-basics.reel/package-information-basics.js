/**
 * @module ui/package-information-basics.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PackageInformationBasics
 * @extends Component
 */
exports.PackageInformationBasics = Component.specialize(/** @lends PackageInformationBasics# */ {
    constructor: {
        value: function PackageInformationBasics() {
            this.super();
        }
    },

    editingDocument: {
        value: null
    },

    title: {
        value: null
    },

    name: {
        value: null
    },

    version: {
        value: null
    },

    license: {
        value: null
    },

    privacy: {
        value: null
    },

    didDraw: {
       value: function () {
           this.addOwnPropertyChangeListener("privacy", this);
       }
    },

    handlePrivacyChange: {
        value: function (value) {

            if (this.editingDocument) {
                this.editingDocument.setPrivacy(value);
            }
        }
    }
});
