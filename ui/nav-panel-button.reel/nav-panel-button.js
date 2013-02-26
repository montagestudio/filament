/**
    @module "ui/nav-panel-button.reel"
    @requires montage
    @requires montage/ui/component
*/
var Montage = require("montage").Montage,
    Button = require("montage/ui/button.reel").Button,
    panel = require("ui/panel.reel");

/**
    Description TODO
    @class module:"ui/nav-panel-button.reel".NavPanelButton
    @extends module:montage/ui/component.Component
*/
exports.NavPanelButton = Montage.create(Button, /** @lends module:"ui/nav-panel-button.reel".NavPanelButton# */ {

    holdThreshold: {
        value: 500
    },

    _state: {
        value: panel.HIDDEN_STATE
    },
    state: {
        get: function() {
            return this._state;
        },
        set: function(value) {
            if (this._state === value) {
                return;
            }

            this._state = value;
            this.needsDraw = true;
        }
    },

    /**
     * This is a work around for the combination of how the presscomposer,
     * button and panel work.
     *
     * If the panel is floating, it listens for mousup on the document so that
     * the it can close itself when there is an interaction elsewhere. It does
     * this by setting the state to HIDDEN.
     *
     * The press composer also listens to mouseup and then dispatches a press
     * event. However this happens later than the mouseup event that the panel
     * recieves. So, by the time we're handling the action the state of the
     * panel is hidden and so it looks like we should float it. But this means
     * that when you click the button the panel would never hide, because
     * it goes from FLOATING -> (mouseup) -> HIDDEN -> (action) -> FLOATING.
     *
     * To get around this we listen for the mouseup on ourselves. When we
     * recieve this we know that we should ignore the next action that would
     * FLOAT the panel, because the mouseup is handled by the panel.
     *
     * Talk about tight coupling.
     * @type {Object}
     */
    _dontFloatOnNextAction: {
        value: false
    },

    prepareForDraw: {
        value: function () {
            this._element.addEventListener("mouseup", this, false);
        }
    },

    handleMouseup: {
        value: function (event) {
            if (this._state === panel.FLOATING_STATE) {
                this._dontFloatOnNextAction = true;
            }
        }
    },

    handleAction: {
        value: function (event) {
            if (this._state === panel.HIDDEN_STATE && !this._dontFloatOnNextAction) {
                this.state = panel.FLOATING_STATE;
            } else {
                this.state = panel.HIDDEN_STATE;
            }
            this._dontFloatOnNextAction = false;
        }
    },

    handleHold: {
        value: function (event) {
            this.state = panel.LOCKED_STATE;
        }
    },

    draw: {
        value: function () {
            this._element.classList[
                this._state === panel.LOCKED_STATE ||
                this._state === panel.FLOATING_STATE ?
                "add" : "remove"
            ]("selected");
            this._element.classList[this._state === panel.LOCKED_STATE ? "add" : "remove"]("locked");
        }
    }

});
