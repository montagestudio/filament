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
        value: function () {
            var boundaries = this.source.viewport.scene.getRecursiveAxisAlignedBoundaries(),
                scaleX = this.source.viewport._width / (boundaries[0].max - boundaries[0].min),
                scaleY = this.source.viewport._height / (boundaries[1].max - boundaries[1].min),
                scaleZ = this.source.viewport._height / (boundaries[2].max - boundaries[2].min),
                scale = Math.min(scaleX, scaleY, scaleZ) * 0.8,
                center = {
                    x: (boundaries[0].max + boundaries[0].min) / 2,
                    y: (boundaries[1].max + boundaries[1].min) / 2,
                    z: (boundaries[2].max + boundaries[2].min) / 2
                };

            this.source.viewport.scale = scale;
            this.source.viewport2.scale = scale;

            this._updateViewPortAfterZoom(this.source.viewport, scale, center);
            this._updateViewPortAfterZoom(this.source.viewport2, scale, center);
        }
    },

    _updateViewPortAfterZoom: {
        value: function (viewport, scale, center) {
            switch (viewport.type) {

                case ViewPortConfig.types.front:
                    viewport.translateX = (viewport._width / 2) - (center.x * scale);
                    viewport.translateY = (viewport._height / 2) - (center.y * scale);
                    break;

                case ViewPortConfig.types.top:
                    viewport.translateX = (viewport._width / 2) - (center.x * scale);
                    viewport.translateY = (viewport._height / 2) - (center.z * scale);
                    break;

                case ViewPortConfig.types.profile:
                    viewport.translateX = (viewport._width / 2) - (center.z * scale);
                    viewport.translateY = (viewport._height / 2) - (center.y * scale);
                    break;
            }
        }
    }

});
