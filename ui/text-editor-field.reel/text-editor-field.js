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

    tabindex: {
        value: null
    },

    shouldBeFocus: {
        value: false
    },

    delegate: {
        value: null
    },

    shouldSaveOnBlur: {
        value: false
    },

    prepareForActivationEvents: {
        value: function () {
            // Listen to start editing
            this.element.addEventListener("dblclick", this);

            // Listen for editing to finish
            this.templateObjects.inputText.addEventListener("action", this);

            // Listen for blur to stop editing
            this.templateObjects.inputText.element.addEventListener("blur", this);

            // Listen for focus to toggle
            this.element.addEventListener("focusin", this, false);

            this.addOwnPropertyChangeListener("value", this);
        }
    },

    handlePropertyChange:{
        value: function (value, key, object) {
            this.needsDraw = true;
        }
    },

    toggle: {
        value: function (evt) {
            if (this.isEditing) {
                return;
            }

            this._inputValue = this.value;
            this.isEditing = true;
            this.shouldBeFocus = true;
        }
    },

    save: {
        value: function () {
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

    clear: {
        value: function () {
            this.value = null;
            this._inputValue = null;
            this.isEditing = false;
            this.needsDraw = true;
        }
    },

    handleDblclick: {
        value: function (evt) {
            this.toggle();
        }
    },

    handleInputTextAction: {
        value: function (evt) {
            evt.stop();
            this.save();
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
                this.clear();
            }
        }
    },

    handleBlur: {
        value: function () {
            if (this.shouldSaveOnBlur && this.isEditing) {
                this.save();
            }
            this.isEditing = false;
            this.shouldBeFocus = false;
        }
    },

    /**
     * handle tab selection
     */
    handleFocusin: {
        value: function (evt) {
            if (evt.relatedTarget && evt.relatedTarget.getAttribute("tabindex")) {
                this.toggle();
            }
        }
    },

    draw: {
        value: function () {
            if (this.placeholder) {
                if (this.isEditing) {
                    this.templateObjects.inputText.element.setAttribute("placeholder", this.placeholder);
                } else if (!this.value || this.value && this.value.trim().length === 0) {
                    this.templateObjects.text.value = this.placeholder;
                }
            }

            if (this.tabindex) {
                if (this.isEditing) {
                    this.templateObjects.inputText.element.setAttribute("tabindex", this.tabindex);
                } else {
                    this.templateObjects.text.element.setAttribute("tabindex", this.tabindex);
                }
            }
        }
    },

    didDraw: {
        value: function () {
            if (this.shouldBeFocus) {
                // this needs to be fixed
                //this.templateObjects.inputText.element.focus();
                var self = this;
                setTimeout(function() {
                    self.templateObjects.inputText.element.select();
                }, 200);
            }
        }
    }

});
