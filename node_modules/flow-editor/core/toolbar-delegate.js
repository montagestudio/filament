var Target = require("montage/core/target").Target;

exports.ToolBarDelegate = Target.specialize({

    source: {
        value: null
    },

    handleCloseAction: {
        value: function (event) {
            event.stop();
            this.dispatchEventNamed("exitModalEditor", true, true);
        }
    },

    handleInspectorAction: {
        value: function () {
            this.source.isInspectorVisible = !this.source.isInspectorVisible;
        }
    },

    handleTreeAction: {
        value: function () {
            this.source.isTreeVisible = !this.source.isTreeVisible;
        }
    },

    handleZoomExtentsAction: {
        value: function (event, viewPorts) {
            if (Array.isArray(viewPorts)) {
                viewPorts.forEach(function (viewPort) {
                    viewPort.zoomExtents();
                });
            }
        }
    }
});
