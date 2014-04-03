/**
 * @module ui/person-cell.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PersonCell
 * @extends Component
 */
exports.PersonCell = Component.specialize(/** @lends PersonCell# */ {

    /**
     * Person Object
     * @type {Object}
     * @default null
     */
    person: {
        value: null
    }

});
