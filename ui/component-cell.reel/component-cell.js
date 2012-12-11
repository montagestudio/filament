var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.ComponentCell = Montage.create(Component, {

    componentInfo: {
        value: null
    },

    handleOpenComponentButtonAction: {
        value: function (evt) {
            this.dispatchEventNamed("openComponent", true, true, {
                componentUrl: this.componentInfo.reelUrl
            });
        }
    }

});
