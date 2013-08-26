/**
 * @module ui/person-form.reel
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component,
    MIN_NAME_LENGTH = 2;

/**
 * @class PersonForm
 * @extends Component
 */
exports.PersonForm = Component.specialize(/** @lends PersonForm# */ {

    constructor: {
        value: function PersonForm() {
            this.super();
            this._person = {
                name: '',
                email: '',
                url: ''
            };
        }
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
            if (person && typeof person === 'object') {
                this._person.name = (person.name || '');
                this._person.email = (person.email || '');
                this._person.url = (person.url || '');
            }
        },
        get: function () {
            return this._person;
        }
    },

    /**
     * Handle confirmation action, dispatches an event named "CreateMaintainer".
     * Then this event will be handled by "the controller PackageInformationMaintainers",
     * which will be able to add a new maintainer.
     * @function
     */
    handleValidButtonAction: {
        value: function () {
            if (this.person.name.length > MIN_NAME_LENGTH && this.templateObjects.personEmail.element.validity.valid
                && this.templateObjects.personUrl.element.validity.valid) {

                this.dispatchEventNamed("CreateMaintainer", true, true, {
                    maintainer: this.person
                });
            }
        }
    },

    /**
     * Cleans the person overlay content.
     * @function
     */
    clean: {
        value: function () {
            this.templateObjects.personName.value = '';
            this.templateObjects.personEmail.value = '';
            this.templateObjects.personUrl.value = '';
        }
    }

});
