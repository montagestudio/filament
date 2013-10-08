/**
 * @module ui/person-information.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PersonInformation
 * @extends Component
 */
exports.PersonInformation = Component.specialize(/** @lends PersonInformation# */ {
    constructor: {
        value: function PersonInformation() {
            this.super();
        }
    },

    /**
     * Person Object
     * @type {Object}
     * @default null
     */
    person: {
        value: null
    },

    cell: {
        value: null
    }

});
