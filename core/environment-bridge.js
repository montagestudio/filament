var Montage = require("montage/core/core").Montage;

exports.EnvironmentBridge = Montage.create(Montage, {

    mainComponent: {
        value: null
    },

    project: {
        value: null
    },

    didEnterEnvironment: {
        value: function (mainComponent) {
            this.mainComponent = mainComponent;
        }
    },

    didExitEnvironment: {
        value: function (mainComponent) {
            if (mainComponent === this.mainComponent) {
                this.mainComponent = null;
            }
        }
    }

});
