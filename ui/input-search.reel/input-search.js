/**
 * @module ui/input-search.reel
 * @requires matte/ui/input-text
 */
var InputText = require("matte/ui/input-text.reel").InputText,
    KeyComposer = require("montage/composer/key-composer").KeyComposer;

/**
 * @class InputSearch
 * @extends matte/ui/input-text
 */
exports.InputSearch = InputText.specialize(/** @lends InputSearch# */ {

    _templateModuleId: {
        value: "matte/ui/input-text.reel/input-text.html"
    },

    constructor: {
        value: function InputSearch() {
            this.super();
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
