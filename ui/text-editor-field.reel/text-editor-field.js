/**
 * @module ./text-editor-field.reel
 * @requires montage/ui/component
 */
var AbstractControl = require("montage/ui/base/abstract-control").AbstractControl,
    Promise = require("montage/core/promise").Promise,
    UndoManager = require("montage/core/undo-manager").UndoManager;

/**
 * @class TextEditorField
 * @extends Component
 */
exports.TextEditorField = AbstractControl.specialize(/** @lends TextEditorField# */ {

    constructor: {
        value: function TextEditorField() {
            this.super();
            //TODO we can probably share an undo manager across all editing fields...
            this.undoManager = new UndoManager();
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

    undoManager: {
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

            // Listen for focus to toggle
            this.element.addEventListener("focusin", this, false);

            this.addOwnPropertyChangeListener("value", this);

            // Register changes to the input value for undo consideration
            this.addPathChangeListener("templateObjects.inputText.value", this, "handleInputValueChange");

            this.addEventListener("menuValidate", this);
            this.addEventListener("menuAction", this);
        }
    },

    handleMenuValidate: {
        value: function (evt) {
            var menuItem = evt.detail,
                identifier = evt.detail.identifier;

            if ("undo" === identifier) {
                menuItem.enabled = this.canUndo;
                //TODO localize
                menuItem.title = this.canUndo ? "Undo " + this.undoManager.undoLabel : "Undo";
                evt.stop();
            } else if ("redo" === identifier) {
                menuItem.enabled = this.canRedo;
                //TODO localize
                menuItem.title = this.canRedo ? "Redo " + this.undoManager.redoLabel : "Redo";
                evt.stop();
            }
        }
    },

    handleMenuAction: {
        value: function (evt) {
            var identifier = evt.detail.identifier;

            if ("undo" === identifier) {
                if (this.canUndo) {
                    this.undoManager.undo().done();
                }
            } else if ("redo" === identifier) {
                if (this.canRedo) {
                    this.undoManager.redo().done();
                }
            }

            // By default stop all menuActions from further consideration
            // This prevents you from doing anything that might alter
            // the state of the document before committing or discarding
            // the modal editing you're in the middle of performing
            evt.stop();
        }
    },

    canUndo: {
        get: function () {
            return this.getPath("undoManager.undoCount > 0");
        }
    },

    canRedo: {
        get: function () {
            return this.getPath("undoManager.redoCount > 0");
        }
    },

    _previousValue: {
        value: null
    },

    handleInputValueChange: {
        value: function () {
            var value = this.templateObjects.inputText.value;

            if (value === this._previousValue) {
                return;
            }

            //TODO throttle this so we don't have only single character undo
            this.undoManager.register("Typing", Promise.resolve([this._setInputValue, this, this._previousValue]));

            this._previousValue = value;
        }
    },

    _setInputValue: {
        value: function (value) {
            this.templateObjects.inputText.value = value;
        }
    },

    shouldAcceptValue: {
        value: function (field, value) {
            // Ensure we can set the value while we're focused on the field
            return field === this.templateObjects.inputText;
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

            // Keep this around for tracking undoability
            this._previousValue = this.value;

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
            this.undoManager.clearUndo();
            this.undoManager.clearRedo();

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

            this.undoManager.clearUndo();
            this.undoManager.clearRedo();

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
