/**
 * @module ui/package-information-author.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PackageInformationAuthor
 * @extends Component
 */
exports.PackageInformationAuthor = Component.specialize(/** @lends PackageInformationAuthor# */ {
    constructor: {
        value: function PackageInformationAuthor() {
            this.super();
        }
    },

    _author: {
        value: null
    },

    author: {
        set: function (author) {
            if(typeof author === 'object') {
                this._author = author;
            } else {
                this._author = {};
            }
        },
        get: function () {
            return this._author;
        }
    },

    willDraw: {
        value: function () {
            this.element.addEventListener("input", this);
        }
    },

    handleInput: {
        value: function (event) {
            var element = event.target;

            if (element && element.validity.valid) {
                var property = element.getAttribute('data-property').toLowerCase();
                if (property) {

                    this.author[property] = element.value;

                    this.dispatchEventNamed("changed", true, true, {
                        source: element
                    });
                }
            }
        }
    }

});
