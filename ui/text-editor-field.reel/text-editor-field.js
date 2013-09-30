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

    placeholder: {
        value: null
    },

    prepareForActivationEvents: {
        value: function () {
            // Listen to start editing
            this.element.addEventListener("dblclick", this);

            // Listen for editing to finish
            this.templateObjects.inputText.addEventListener("action", this);

            // Listen for blur to stop editing
            this.templateObjects.inputText.element.addEventListener("blur", this);
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

            var previousValue = this.value;

            this.value = this._inputValue;

            var ok = this.dispatchActionEvent();

            if (ok) {
                this.isEditing = false;
            } else {
                this.value = previousValue;
            }
        }
    },

    /**
     * Handle the escape key
     * @private
     */
    handleInputTextKeyPress: {
        enumerable: false,
        value: function (evt) {
            if (evt.identifier === "cancel" && this.isEditing) {
                this._inputValue = null;
                this.value = null;
                this.isEditing = false;
            }
        }
    },

    handleBlur: {
        value: function () {
            this.isEditing = false;
        }
    },

    draw: {
        value: function () {
            if (!this.placeholder) { return; }

            if (this.isEditing) {
                this.templateObjects.inputText.placeholder = this.placeholder;
            } else if (!this.value || this.value && this.value.trim().length === 0) {
                this.templateObjects.text.value = this.placeholder;
            }
        }
    }

});
