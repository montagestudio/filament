var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    track = require("track"),
    FilamentService = require("core/filament-service").FilamentService,
    request = require("./request");

var LICENSES = require("./licenses.html").content;

exports.ApplicationDelegate = Montage.specialize({

    _bridgePromise: {
        value: null
    },

    getEnvironmentBridge: {
        value: function () {
            var self = this;
            var bridgePromise = this._bridgePromise;

            if (!bridgePromise) {
                bridgePromise = require.async("adaptor/client/core/environment-bridge").then(function (exported) {
                    return new exported.EnvironmentBridge().init("filament-backend", new FilamentService(self));
                }).then(function (bridge) {
                    bridge.applicationDelegate = self;
                    if (typeof bridge.setEnableFileDrop === "function") {
                        bridge.setEnableFileDrop(true);
                    }
                    return bridge;
                });
                this._bridgePromise = bridgePromise;
            }

            return bridgePromise;
        }
    },

    isAuthenticated: {
        value: null
    },

    isProjectOpen: {
        value: null
    },

    application: {
        value: null
    },

    viewController: {
        value: null
    },

    projectController: {
        value: null
    },

    extensionController: {
        value: null
    },

    previewController: {
        value: null
    },

    environmentBridge: {
        value: null
    },

    _deferredApplication: {
        value: null
    },

    _deferredMainComponent: {
        value: null
    },

    _deferredRepositoryInitialization: {
        value: null
    },

    showModal: {
        value: false
    },

    isProjectLoaded: {
        value: false
    },

    currentPanelKey: {
        value: null
    },

    constructor: {
        value: function () {
            var self = this;
            this._deferredApplication = Promise.defer();
            this._deferredMainComponent = Promise.defer();

            // Make stack traces from promise errors easily available in the
            // console. Otherwise you need to manually inspect the error.stack
            // in the debugger.
            Promise.onerror = function (error) {
                track.error(error);
                if (error.stack) {
                    console.groupCollapsed("%c Uncaught promise rejection: " + (error.message || error), "color: #F00; font-weight: normal");
                    console.log(error.stack);
                    console.groupEnd();
                } else {
                    throw error;
                }
            };

            request.requestOk({ url: "/auth" })
                .then(function () {
                    self.isAuthenticated = true;
                    return Promise.all([self._deferredApplication.promise, self._deferredMainComponent.promise]);
                })
                .spread(function (app, mainComponent) {
                    var pathname = window.location.pathname;

                    self.application = app;
                    self.mainComponent = mainComponent;

                    if (pathname.split("/").length === 3) {
                        // --> /owner/repo
                        self.isProjectOpen = true;
                    } else {
                        // --> /
                        self.isProjectOpen = false;
                    }
                })
                .catch(function () {
                    self.isAuthenticated = false;
                })
                .done();
        }
    },

    handleComponentLoaded: {
        value: function (evt) {
            this._deferredMainComponent.resolve(evt.detail);
        }
    },

    willFinishLoading: {
        value: function (app) {
            var self = this;

            //TODO sort out where many of these belong, more of the actual handling should probably be here

            window.addEventListener("openRelatedFile", function (evt) {
                var url = evt.detail;
                // FIXME: this method does not exist
                self.openFileUrl(url.replace("file://localhost/", "fs://localhost/")).done();
            });

            window.addEventListener("beforeunload", function () {
                self.willClose();
            }, true);

            // TODO this is a temporary workaround to redirect keyEquivalents to the
            // toolbar as a last resort if they make it up here
            app.addEventListener("keyPress", this);
            app.addEventListener("menuAction", this, false);

            this._deferredApplication.resolve(app);
        }
    },

    willClose: {
        value: function () {
            //TODO only if we're registered
            this.previewController.unregisterPreview().done();
        }
    },


    handleMenuAction: {
        value: function (evt) {
            switch (evt.detail.identifier) {
            case "documentation":
                window.open("http://docs.montagestudio.com/montage-studio/");
                break;
            case "forum":
                window.open("http://forum.montagestudio.com/");
                break;
            case "report":
                window.location = "mailto:feedback@montagestudio.com";
                break;
            case "api":
                window.open("http://docs.montagestudio.com/api/AbstractButton.html");
                break;
            case "framework":
                window.open("http://docs.montagestudio.com/montagejs/");
                break;
            case "licenses":
                var self = this;
                this.showModal = true;
                this.currentPanelKey = "info";
                this.infoPanel.getResponse(LICENSES, "Close")
                .then(function() {
                    self.showModal = false;
                    self.currentPanelKey = null;
                }).done();
                break;
            }
        }
    },

    handleKeyPress: {
        value: function (evt) {
            if ("menuAction" === evt.identifier) {
                var component = evt.keyComposer.component;
                if (typeof component.handleKeyPress === "function") {
                    component.handleKeyPress(evt);
                }
            }
        }
    }
});
