/**
 * @module ui/textarea-editor.reel
 * @requires montage/ui/component
 */
var Component = require("ui/text-editor-field.reel").TextEditorField;

/**
 * @class TextareaEditor
 * @extends Component
 */
exports.TextareaEditor = Component.specialize(/** @lends TextareaEditor# */ {
    constructor: {
        value: function TextareaEditor() {
            this.super();
        }
    },

    prepareForActivationEvents: {
        value: function () {
            // Listen to start editing
            this.element.addEventListener("dblclick", this);

            // Listen for editing to finish
            this.templateObjects.textarea.addEventListener("action", this);

            // Listen for blur to stop editing
            this.templateObjects.textarea.element.addEventListener("blur", this);

            // Listen for focus to toggle
            this.element.addEventListener("focusin", this, false);

            this.addOwnPropertyChangeListener("value", this);
            this.templateObjects.textarea.element.addEventListener("keydown", this, false);
        }
    },

    slotDidSwitchContent: {
        value: function (slot, newContent, newComponent, oldContent, oldComponent) {
            if (this.isEditing) {
                this.templateObjects.textarea.element.focus();
            }
        }
    },

    handleKeydown: {
        value: function (evt) {
            var escape = 27,
                enter = 13;
            if (evt.keyCode === escape){
                evt.stop();
                this.cancel();
            } else if (evt.keyCode === enter && !evt.shiftKey) {
                evt.stop();
                this.save();
            }
        }
    },

    draw: {
        value: function () {
            if (this.tabindex) {
                if (this.isEditing) {
                    this.templateObjects.textarea.element.setAttribute("tabindex", this.tabindex);
                } else {
                    this.templateObjects.text.element.setAttribute("tabindex", this.tabindex);
                }
            }
        }
    }
});
