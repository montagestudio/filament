var Target = require("montage/core/target").Target;

exports.ViewPortEventManager = Target.specialize({

    initWithViewPorts: {
        value: function (viewPorts) {
            this.viewPorts = viewPorts;

            return this;
        }
    },

    _viewPorts: {
        value: null
    },

    viewPorts: {
        set: function (viewPorts) {
            if (Array.isArray(viewPorts)) {
                var self = this,
                    updated = function (event) { self.handleViewportChange(event);};

                viewPorts.forEach(function (viewPort, index) {

                    // viewports share the same scene, so just need to add listeners on the first viewport
                    // fixme: fix hypothetical memory leaks here.
                    if (index === 0) {
                        viewPort.scene._data.addEventListener("vectorChange", updated, false);
                        viewPort.scene._data.addEventListener("bezierCurveChange", updated, false);
                        viewPort.scene._data.addEventListener("bezierSplineChange", updated, false);
                        viewPort.scene._data.addEventListener("cameraChange", updated, false);
                        viewPort.scene._data.addEventListener("sceneChange", updated, false);
                    }

                    viewPort.element.addEventListener("mousedown", self, true);
                });

                this._viewPorts = viewPorts;
            }
        },
        get: function () {
            return this._viewPorts;
        }
    },

    _viewportChange: {
        value: null
    },

    captureMousedown: {
        value: function (event) {
            this.dispatchEventNamed("viewportChangeStart", true, true);
            document.addEventListener("mouseup", this, false);
        }
    },

    handleMouseup: {
        value: function (event) {
            if (this._viewportChange) {
                this.dispatchEventNamed("viewportChangeEnd", true, true);
            } else {
                this.dispatchEventNamed("viewportChangeCancel", true, true);
            }

            this._viewportChange = false;
            document.removeEventListener("mouseup", this, false);
        }
    },

    handleViewportChange: {
        value: function (event) {
            this.dispatchEventNamed("viewportChange", true, true);
            this._viewportChange = true;
        }
    }

});
