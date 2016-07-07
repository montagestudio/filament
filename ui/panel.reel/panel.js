/**
    @module "ui/panel.reel"
    @requires montage
    @requires montage/ui/component
*/
var Component = require("montage/ui/component").Component;

var HIDDEN_STATE = exports.HIDDEN_STATE = 0;
var FLOATING_STATE = exports.FLOATING_STATE = 1;
var LOCKED_STATE = exports.LOCKED_STATE = 2;

var STATES = [HIDDEN_STATE, FLOATING_STATE, LOCKED_STATE];

/**
    Description TODO
    @class module:"ui/panel.reel".Panel
    @extends module:montage/ui/component.Component
*/
exports.Panel = Component.specialize(/** @lends module:"ui/panel.reel".Panel# */ {

    _state: {
        value: false
    },
    state: {
        get: function () {
            return this._state;
        },
        set: function (value) {
            if (value === this._state || STATES.indexOf(value) === -1) {
                return;
            }

            this._state = value;

            if (value === FLOATING_STATE) {
                document.addEventListener("mouseup", this, false);
            } else {
                document.removeEventListener("mouseup", this, false);
            }

            this.needsDraw = true;
        }
    },

    handleMouseup: {
        value: function (event) {
            var target = event.target, isInPanel = false;
            while (target) {
                if (target === this._element) {
                    isInPanel = true;
                    break;
                }
                target = target.parentElement;
            }

            if (!isInPanel) {
                document.removeEventListener("mouseup", this, false);
                this.state = HIDDEN_STATE;
            }
        }
    },


    draw: {
        value: function () {
            var classList = this._element.classList;

            switch (this._state) {
            case HIDDEN_STATE:
                classList.remove("Panel--floating");
                classList.remove("Panel--noAnimation");
                classList.add("Panel--hidden");
                break;
            case FLOATING_STATE:
                classList.add("Panel--floating");
                classList.add("Panel--noAnimation");
                classList.remove("Panel--hidden");
                break;
            case LOCKED_STATE:
                classList.remove("Panel--floating");
                classList.remove("Panel--hidden");
            }
        }
    }

});
