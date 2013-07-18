/**
 * @module ui/package-information-basics.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    PackageTools = require('....//../core/package-tools').PackageTools;

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

    willDraw: {
        value: function () {
            this.element.addEventListener("input", this);

            if (!PackageTools.isNameValid(this.name)) {
                this.nameInput.element.setCustomValidity('not valid');
            }

            if (!PackageTools.isNameValid(this.version)) {
                this.versionInput.element.setCustomValidity('not valid');
            }
        }
    },

    handleInput: {
        value: function (event) {
            var element = event.target;

            if (element) {
                var property = element.getAttribute('data-property').toLowerCase();

                if (property) {

                    this.dispatchEventNamed(property+"Changed", true, true, {
                        source: element
                    });
                }
            }
        }
    }
});
