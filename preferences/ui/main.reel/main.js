var Montage = require("montage/core/core").Montage,
    Component = require("montage/ui/component").Component,
    Connection = require("q-connection");

var IS_IN_LUMIERES = (typeof lumieres !== "undefined");

exports.Main = Montage.create(Component, {

    _inputTimer: {
        value: null
    },

    userPreferences: {
        enumerable: true,
        value: {}
    },

    didCreate: {
        value: function() {
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
