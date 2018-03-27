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

            window.addEventListener("popstate", this.handleLocationChange.bind(this));

            Promise.all([self._deferredApplication.promise, self._deferredMainComponent.promise])
                .spread(function (app, mainComponent) {
                    self.application = app;
                    self.mainComponent = mainComponent;
                    self.handleLocationChange();
                });
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

            // TODO this is a temporary workaround to redirect keyEquivalents to the
            // toolbar as a last resort if they make it up here
            app.addEventListener("keyPress", this);
            app.addEventListener("menuAction", this, false);

            this._deferredApplication.resolve(app);
        }
    },

    handleLocationChange: {
        value: function () {
            var self = this;
            var newToken = this._getHashParam(window.location, "token");
            if (newToken) {
                this.storeToken(newToken);
                // Get rid of the hash from the location
                window.history.replaceState({}, window.location.href.split("#")[0], window.location.href.split("#")[0]);
            }
            request.requestOk({
                url: "/auth",
                headers: {
                    "x-access-token": localStorage.getItem("MontageStudioToken")
                }
            }).then(function () {
                var pathname = window.location.pathname;
                self.isAuthenticated = true;

                if (pathname.split("/").length === 3) {
                    // --> /owner/repo
                    self.isProjectOpen = true;
                } else {
                    // --> /
                    self.isProjectOpen = false;
                }
            }).catch(function () {
                self.isAuthenticated = false;
            }).done();
        }
    },

    changeLocation: {
        value: function (location) {
            window.history.pushState({}, location, location);
            this.handleLocationChange();
        }
    },

    _getHashParam: {
        value: function (url, name) {
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            var regex = new RegExp('[#&?]' + name + '=([^;]*)'),
                results = regex.exec(url.search || url.hash);

            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        }
    },

    storeToken: {
        value: function (token) {
            localStorage.setItem("MontageStudioToken", token);
        }
    },

    clearToken: {
        value: function () {
            localStorage.removeItem("MontageStudioToken");
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
