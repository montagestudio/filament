var Panel = require("ui/panel.reel").Panel;

exports.Configurator = Panel.specialize({

    constructor: {
        value: function Configurator() {
            this.super();
        }
    },

    editingDocument: {
        value: null
    },

    viewController: {
        value: null
    },

    //TODO this is a little weird that the inspector for selectedObjects.I finds its controller from inspectorControllers.I
    inspectorControllers: {
        value: null
    },

    recentlySelectedObjects: {
        value: null
    },

    selectedTab: {
        value: null
    }
});
