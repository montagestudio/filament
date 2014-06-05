/**
 * @module ui/mixed-value.reel
 */
var AbstractTextField = require("montage/ui/base/abstract-text-field").AbstractTextField;
var Component = require("montage/ui/component").Component;
var ReelProxy = require("core/reel-proxy").ReelProxy;

/**
 * @class MixedValue
 * @extends Component
 *
 * This component is an abstract one that is able to edit bindings, json arrays,
 * json objects and object references.
 * The `mode` property decides in which mode the component is operating.
 * The mode can be initially set to "binding" to put it into binding mode,
 * otherwise the component will infer the mode it is in by analysing its value
 * object.
 * Components that extend this one should implement the `_inferMode` function
 * that infers the mode from the value.
 * Supported modes are: "binding", "json-array", "json-object",
 * "object-reference".
 * When the mode changes the component will fire property type changes according
 * to the change.
 */
exports.MixedValue = Component.specialize(/** @lends MixedValue# */ {
    constructor: {
        value: function ObjectValue() {
            this.super();
            this.addPathChangeListener("templateObjects.textField.value", this, "handleTextFieldValueChange");
        }
    },

    hasTemplate: {
        value: true
    },

    objectsMap: {
        value: null
    },

    _value: {
        value: null
    },

    value: {
        set: function(value) {
            if (value !== this._value) {
                this._value = value;
                this._updateTextField();
            }
        },
        get: function() {
            return this._value;
        }
    },

    _textFieldValue: {
        value: null
    },

    /**
     * 'binding', 'object-reference', 'json-object', 'json-array'
     */
    mode: {
        value: null
    },

    templateDidLoad: {
        value: function() {
            this._updateTextField();
        }
    },

    _updateTextField: {
        value: function() {
            if (this.templateObjects) {
                var textFieldValue,
                    value = this._value;

                if (this.mode === "binding") {
                    textFieldValue = value;
                } else {
                    if (value instanceof ReelProxy) {
                        textFieldValue = "@" + value.label;
                    } else {
                        textFieldValue = JSON.stringify(value);
                    }
                }

                this._textFieldValue = textFieldValue;
            }
        }
    },

    handleTextFieldValueChange: {
        value: function(textFieldValue) {
            if (textFieldValue == null || textFieldValue === this._textFieldValue) {
                return;
            }

            var value;

            this._textFieldValue = textFieldValue;
            this._updateMode(textFieldValue);

            if (this.mode === "object-reference") {
                value = this.objectsMap[textFieldValue.slice(1)];
            } else if (this.mode === "json-object") {
                try {
                    value = JSON.parse(textFieldValue);
                } catch(ex) {
                    value = this._value;
                }
            } else if (this.mode === "json-array") {
                try {
                    value = JSON.parse(textFieldValue);
                } catch(ex) {
                }
                if (Array.isArray(value)) {
                    value = this._value;
                }
            }

            if (value !== this._value) {
                this._value = value;
                this.dispatchEventNamed("updatePropertyValue", true, false, {
                    value: this._value
                });
            }
        }
    },

    _inferMode: {
        value: function(value) {
        }
    },

    _updateMode: {
        value: function(value) {
            var inferredMode = this._inferMode(value);

            if (inferredMode !== this.mode) {
                this.mode = inferredMode;
                this.dispatchEventNamed("changePropertyType", true, false, {
                    type: inferredMode === "binding" ? "one-way-binding" : "assignment"
                });
            }
        }
    }
});

exports.TextField = AbstractTextField.specialize(/** @lends TextField */ {
    constructor: {
        value: function ObjectValue() {
            this.super();
        }
    }
});