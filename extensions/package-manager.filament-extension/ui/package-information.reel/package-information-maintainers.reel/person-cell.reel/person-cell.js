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
                this.formEditPerson.person = this.person;
            }
        },
        get: function () {
            return this._editing;
        }
    },

    editedPerson: {
        get: function () {
            return this.formEditPerson.data;
        }
    },

    validModification: {
        value: function () {
            this.person = this.editedPerson;
            this.isEditing = false;
        }
    }

});
