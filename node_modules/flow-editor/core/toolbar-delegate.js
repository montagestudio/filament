var Target = require("montage/core/target").Target,
    ViewPortConfig = require("core/configuration").FlowEditorConfig.viewPort;

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
                var self = this;

                viewPorts.forEach(function (viewPort) {
                    var boundaries = viewPort.scene.getRecursiveAxisAlignedBoundaries(),
                        scaleX = viewPort._width / (boundaries[0].max - boundaries[0].min),
                        scaleY = viewPort._height / (boundaries[1].max - boundaries[1].min),
                        scaleZ = viewPort._height / (boundaries[2].max - boundaries[2].min),
                        scale = Math.min(scaleX, scaleY, scaleZ) * 0.8,
                        center = {
                            x: (boundaries[0].max + boundaries[0].min) / 2,
                            y: (boundaries[1].max + boundaries[1].min) / 2,
                            z: (boundaries[2].max + boundaries[2].min) / 2
                        };

                    viewPort.scale = scale;

                    self._updateviewPortAfterZoom(viewPort, scale, center);
                });
            }
        }
    },

    _updateviewPortAfterZoom: {
        value: function (viewPort, scale, center) {
            switch (viewPort.type) {

                case ViewPortConfig.types.front:
                    viewPort.translateX = (viewPort._width / 2) - (center.x * scale);
                    viewPort.translateY = (viewPort._height / 2) - (center.y * scale);
                    break;

                case ViewPortConfig.types.top:
                    viewPort.translateX = (viewPort._width / 2) - (center.x * scale);
                    viewPort.translateY = (viewPort._height / 2) - (center.z * scale);
                    break;

                case ViewPortConfig.types.profile:
                    viewPort.translateX = (viewPort._width / 2) - (center.z * scale);
                    viewPort.translateY = (viewPort._height / 2) - (center.y * scale);
                    break;
            }
        }
    }

});
