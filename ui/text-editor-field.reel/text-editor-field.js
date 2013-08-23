/**
 * @module ./text-editor-field.reel
 * @requires montage/ui/component
 */
var AbstractControl = require("montage/ui/base/abstract-control").AbstractControl;

/**
 * @class TextEditorField
 * @extends Component
 */
exports.TextEditorField = AbstractControl.specialize(/** @lends TextEditorField# */ {

    constructor: {
        value: function TextEditorField() {
            this.super();
        }
    },

    value: {
        value: null
    },

    _inputValue: {
        value: null
    },

    isEditing: {
        value: false
    },

    prepareForActivationEvents: {
        value: function () {
            //Listen to start editing
            this.element.addEventListener("dblclick", this);

            //Listen for editing to finish
            this.templateObjects.inputText.addEventListener("action", this);

            //Listen for the user canceling (onblur does not bubble, onfocus does)
            this.element.addEventListener("focusout", this);
        }
    },

    handleDblclick: {
        value: function (evt) {
            if (this.isEditing) {
                return;
            }

            this._inputValue = this.value;

            this.isEditing = true;

            var self = this;
            setTimeout(function () {
                self.templateObjects.inputText.element.select();
            }, 100);
        }
    },

    handleInputTextAction: {
        value: function (evt) {
            evt.stop();

            this.value = this._inputValue;
            this.isEditing = false;

            this.dispatchActionEvent();
        }
    },

    _cancelEditing: {
        value: function () {
            if (this.isEditing) {
                this._inputValue = null;
                this.isEditing = false;
            }
        }
    },

    /**
     * Handler the escape key
     * @private
     */
    handleKeyPress: {
        enumerable: false,
        value: function (evt) {
            this._cancelEditing();
        }
    },

    handleFocusout: {
        value: function (evt) {
            this._stopEditing();
        }
    }

});
