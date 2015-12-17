/* global lumieres */
var Component = require("montage/ui/component").Component;

exports.Main = Component.specialize({

    _inputTimer: {
        value: null
    },

    userPreferences: {
        enumerable: true,
        value: {}
    },

    constructor: {
        value: function Main() {
            this.super();
            if (lumieres !== undefined && lumieres.getUserPreferences) {
                var thisRef = this;
                lumieres.getUserPreferences(function(error, result) {
                    if (!error) {
                        thisRef.userPreferences = result;
                    }
                });
            }
        }
    },

    willDraw: {
        value: function() {
            this.httpportTextField.element.addEventListener("input", this);
            this.httpportTextField.element.addEventListener("change", this);
        }
    },

    handleInput: {
        value: function(event) {
            var thisRef = this;

            if (this._inputTimer) {
                clearTimeout(this._inputTimer);
            }

            this._inputTimer = setTimeout(function(){
                thisRef._inputTimer = null;
                thisRef.handleChange(event);
            }, 1000);
        }
    },

    handleChange: {
        value: function(event) {
            if (this._inputTimer) {
                clearTimeout(this._inputTimer);
                this._inputTimer = null;
            }
            // Save the preferences
            lumieres.setUserPreferences(this.userPreferences);
        }
    }

});
