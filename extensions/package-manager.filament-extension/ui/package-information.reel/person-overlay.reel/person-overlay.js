/**
 * @module ui/person-overlay.reel
 * @requires montage/ui/component
 */
var Overlay = require("montage/ui/overlay.reel/").Overlay,
    MIN_NAME_LENGTH = 2;

/**
 * @class PersonOverlay
 * @extends Component
 */
exports.PersonOverlay = Overlay.specialize(/** @lends PersonOverlay# */ {

    constructor: {
        value: function PersonOverlay() {
            this.super();
            this._initPerson();
        }
    },

    configuration: {
        set: function (conf) {
            if (conf) {
                this.editingState = !!conf.editingState;
                this.confirmLabel = conf.confirmLabel;
                this.title = conf.title;
            }
        }
    },

    editingState: {
        value: false
    },

    confirmLabel: {
        value: null
    },

    title: {
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
            if (person && typeof person === 'object') {
                this._initPerson(person.name, person.email, person.url);
            }
        },
        get: function () {
            return this._person;
        }
    },

    show: {
        value: function () {
            if (!this.editingState) {
                this.clean();
                this.dispatchOwnPropertyChange("person", this._person);
            }

            Overlay.show.call(this);
        }
    },

    /**
     * Cleans the person overlay content.
     * @function
     */
    clean: {
        value: function () {
            this._initPerson();
        }
    },

    _initPerson: {
        value: function (name, email, url) {
            this._person = {
                name: name || '',
                email: email || '',
                url: url || ''
            };
        }
    },

    _checkValidityFields: {
        value: function () {
            return this.person.name.length > MIN_NAME_LENGTH && this.templateObjects.personEmail.element.validity.valid &&
                this.templateObjects.personUrl.element.validity.valid;
        }
    },

    /**
     * Handle confirmation action, dispatches an event named "CreateMaintainer".
     * Then this event will be handled by "the controller PackageInformationMaintainers",
     * which will be able to add a new maintainer.
     * @function
     */
    handleConfirmAction: {
        value: function () {
            if (this._checkValidityFields()) {
                if (!this.editingState) {
                    this.dispatchEventNamed("createPerson", true, true, {person: this.person});
                } else {
                    this.dispatchEventNamed("alterPerson", true, true, {person: this.person});
                }
            }
        }
    },

    handleCancelAction: {
        value: function (event) {
            event.stop();

            this.hide();
        }
    }

});
