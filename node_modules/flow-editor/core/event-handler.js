var Montage = require("montage").Montage,
    Application = require("montage/core/application").application;

exports.EventHandler = Montage.specialize({

    initWithDelegateAndViewPorts: {
        value: function (delegate, viewPorts) {
            this.super();

            Application.addEventListener("flowPropertyChangeStart", this, false);
            Application.addEventListener("flowPropertyChange", this, false);
            Application.addEventListener("flowPropertyChangeEnd", this, false);
            Application.addEventListener("flowPropertyChangeSet", this, false);

            this.viewPorts = viewPorts;
            this.delegate = delegate;

            return this;
        }
    },

    delegate: {
        value: null
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

    _editingStart: {
        value: null
    },

    _editingChange: {
        value: null
    },

    captureMousedown: {
        value: function (event) {
            this._handleFlowEditingStart(event);
            document.addEventListener("mouseup", this, false);
        }
    },

    handleViewportChange: {
        value: function (event) {
            if (this._editingStart) {
                this._handleFlowEditingChange(event);
            }
        }
    },

    handleMouseup: {
        value: function (event) {
            this._handleFlowEditingEnd(event);
            document.removeEventListener("mouseup", this, false);
        }
    },

    handleFlowPropertyChangeStart: {
        value: function (event) {
            this._handleFlowEditingStart(event);
        }
    },

    handleFlowPropertyChange: {
        value: function (event) {
            this._handleFlowEditingChange(event);
        }
    },

    handleFlowPropertyChangeEnd: {
        value: function (event) {
            this._handleFlowEditingEnd(event);
        }
    },

    handleFlowPropertyChangeSet: {
        value: function (event) {
            this._handleFlowEditingStart(event);
            this._handleFlowEditingChange(event);
            this._handleFlowEditingEnd(event);
        }
    },

    _handleFlowEditingStart: {
        value: function (event) {
            if (this.delegate && typeof this.delegate.handleFlowEditingStart === "function") {
                this.delegate.handleFlowEditingStart(event);
            }

            this._editingStart = true;
        }
    },

    _handleFlowEditingChange: {
        value: function (event) {
            if (this.delegate && typeof this.delegate.handleFlowEditing === "function") {
                this.delegate.handleFlowEditing(event);
            }

            this._editingChange = true;
        }
    },

    _handleFlowEditingEnd: {
        value: function (event) {
            if (this._editingChange) {
                if (this.delegate && typeof this.delegate.handleFlowEditingEnd === "function") {
                    this.delegate.handleFlowEditingEnd(event);
                }
            } else {
                if (this.delegate && typeof this.delegate.handleFlowEditingCancel === "function") {
                    this.delegate.handleFlowEditingCancel(event);
                }
            }

            this._editingStart = false;
            this._editingChange = false;
        }
    }

});
