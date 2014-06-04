/**
 * @module ui/input-search.reel
 * @requires native/ui/input-text
 */
var AbstractTextField = require("montage/ui/base/abstract-text-field").AbstractTextField,
    KeyComposer = require("montage/composer/key-composer").KeyComposer;

/**
 * @class InputSearch
 * @extends module:"native/ui/input-text.reel".InputText
 */
exports.InputSearch = AbstractTextField.specialize(/** @lends InputSearch# */ {

    hasTemplate: {value: true},

    constructor: {
        value: function InputSearch() {
            this.super();
            this.classList.add("InputSearch");
        }
    },

    enterDocument: {
        value: function (first) {
            this.super(first);

            if (first) {
                this._keyComposerCancel = new KeyComposer();
                this._keyComposerCancel.component = this;
                this._keyComposerCancel.keys = "escape";
                this._keyComposerCancel.identifier = "inputEscape";
                this.addComposer(this._keyComposerCancel);
            }
        }
    },

    prepareForActivationEvents: {
        value: function() {
            this.super();
            this._keyComposerCancel.addEventListener("keyPress", this, false);
        }
    },

    // TODO this is a temporary solution
    handleKeyPress: {
        value: function (evt) {
            var identifier = evt.identifier;

            switch (identifier) {
            case "inputEscape":
                this.handleInputEscapeKeyPress(evt);
                break;
            }
        }
    },

    handleInputEscapeKeyPress: {
        value: function (evt) {
            this.value = "";
        }
    }
});
