/**
 * @module core/reference-manager
 * @requires montage/core/core
 */
var Montage = require("montage/core/core").Montage;
var Map = require("montage/collections/map").Map;
/**
 * @class ReferenceManager
 * @extends Montage
 */
var ReferenceManager = Montage.specialize(/** @lends ReferenceManager# */ {
    constructor: {
        value: function ReferenceManager() {
            this.super();
            this._sourceForElement = new Map();
        }
    },

    startSession: {
        value: function (recipient) {
            this._session = new Session(this, recipient);
            return this._session;

        }
    },

    endSession: {
        value: function (session) {
            var data = this._session.end();
            this._session = null;
            return data;
        }
    },

    hasSession: {
        get: function () {
            return this._session !== null;
        }
    },

    registerVisualizer: {
        value: function (visualizer) {
            this._visualizer = visualizer;
        }
    },

    registerActiveSource: {
        value: function (activeSource) {
            if (this._session._activeSource === null) {
                this._session._activeSource = activeSource;
                return activeSource;
            } else {
                // return failure
                return false;
            }
        }
    },

    unregisterActiveSource: {
        value: function (activeSource) {
            if (this._session._activeSource === activeSource) {
                this._session._activeSource = null;
            }
        }
    },

    registerSourceForElement: {
        value: function (outlet, element) {
            this._sourceForElement.set(element,outlet);
        }
    },

    unregisterSourceForElement: {
        value: function (outlet, element) {
            this._sourceForElement.delete(element);
        }
    },

    sourceForElement: {
        value: function (element) {
            return this._sourceForElement.get(element);
        }
    },

    _sourceForElement: {
        value: null
    },

    _session: {
        value: null
    },

    _visualizer: {
        value: null
    }

});
exports.sharedReferenceManager = new ReferenceManager();

var Session = Montage.specialize(/** @lends Session# */ {
    constructor: {
        value: function Session(manager, recipient) {
            this.super();
            this._recipient = recipient;
            this._manager = manager;
            this._acceptTypes = [];
        }
    },

    visualizer: {
        get: function () {
            return this._manager._visualizer;
        }
    },

    startPosition: {
        value: function (x, y) {
            this.startPositionX = x;
            this.startPositionY = y;
            if(this.visualizer) {
                this.visualizer.start(this);
            }
        }
    },

    position: {
        value: function (x, y) {
            this.positionX = x;
            this.positionY = y;

            if(this.visualizer) {
                this.visualizer.move(this);
            }

            var startElement = document.elementFromPoint(x, y);
            var element,
                source,
                outside;

            if (startElement) {
                // then see if we need to tell it to stop
                if(this._activeSource) {
                    outside = true;
                    element = startElement;
                    while (element = element.parentNode) {
                        source = this._manager.sourceForElement(element);
                        if (source === this._activeSource) {
                            outside = false;
                            break;
                        }
                    }
                    if(outside) {
                        this._activeSource.leave();
                    }
                }
                //if the _activeSource hasn't changed in the mean time
                if (!this._activeSource) {
                    // see if we have one that needs to start
                    // the lowest one in the dom tree
                    element = startElement;
                    while(element = element.parentNode) {
                        source = this._manager.sourceForElement(element);
                        if(source) {
                            source.enter();
                            break;
                        }
                    }
                }
            }
        }
    },

    setAcceptedTypes: {
        value: function (acceptedTypes) {
            var i = 0,
            acceptedTypesLength = acceptedTypes.length;
            for (i; i < acceptedTypesLength; i++) {
                var acceptedType = acceptedTypes[i];
                this._acceptTypes.push(acceptedType);
            }
        }
    },

    accepts: {
        value: function (type) {
            return this._acceptTypes.has(type);
        }
    },

    end: {
        value: function () {
            if (this.visualizer) {
                this.visualizer.end(this);
            }
            if (this._activeSource) {
                return this._activeSource.provideReference(this);
            }
        }
    },


    positionX: {
        value: null
    },

    positionY: {
        value: null
    },

    startPositionX: {
        value: null
    },

    startPositionY: {
        value: null
    },

    _acceptTypes: {
        value: null
    },

    _manager: {
        value: null
    },

    _recipient: {
        value: null
    },

    _activeSource: {
        value: null
    }
});
