/**
 * @module ui/person-information-editable.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class PersonInformationEditable
 * @extends Component
 */
exports.PersonInformationEditable = Component.specialize(/** @lends PersonInformationEditable# */ {
    constructor: {
        value: function PersonInformationEditable() {
            this.super();
        }
    },

    cell: {
        value: null
    },

    _person: {
        value: null
    },

    /**
     * Person Object
     * @type {Object}
     * @default null
     */
    person: {
        set: function (person) {
            if (person && typeof person === "object" && person.hasOwnProperty('name')) {
                this.data = this._person = person;
            }
        },
        get: function () {
            return this._person;
        }
    },

    _data: {
        value: null
    },

    data: {
        set: function (person) {
            if (person && typeof person === "object" && person.hasOwnProperty('name')) {
                this._data = {
                    name: person.name,
                    email: person.email,
                    url: person.url
                };
            }
        },
        get: function () {
            return this._data;
        }
    }

});
