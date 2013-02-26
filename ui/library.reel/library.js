var Montage = require("montage/core/core").Montage,
    panel = require("ui/panel.reel"),
    Panel = panel.Panel;

exports.Library = Montage.create(Panel, {

    groups: {
        value: null
    },

    groupsController: {
        value: null
    },

    prepareForActivationEvents: {
        value: function () {
            this._element.addEventListener("dragstart", this, false);
        }
    },

    handleDragstart: {
        value: function (event) {
            if (this.state === panel.FLOATING_STATE) {
                this.state = panel.HIDDEN_STATE;
            }
        }
    }

});
