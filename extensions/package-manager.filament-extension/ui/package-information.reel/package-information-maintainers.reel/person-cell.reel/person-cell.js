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

    constructor: {
        value: function PersonCell() {
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

    _editing: {
        value: false
    },

    isEditing: {
        set: function (editing) {
            this._editing = !!editing;

            if (!this._editing) {
                this.formPerson.person = this.person;
            }
        },
        get: function () {
            return this._editing;
        }
    },

    validModification: {
        value: function () {
            this.person = this.formPerson.data;
            this.isEditing = false;
        }
    }

});
