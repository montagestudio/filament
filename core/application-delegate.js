var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    track = require("track"),
    request = require("core/request");

var LICENSES = require("./licenses.html").content;

exports.ApplicationDelegate = Montage.specialize({

    application: {
        value: null
    },

    _deferredApplication: {
        value: null
    },

    _deferredMainComponent: {
        value: null
    },

    accessToken: {
        get: function () {
            if (typeof this._accessToken === "undefined") {
                this._accessToken = localStorage.getItem("MontageStudioToken");
            }
            return this._accessToken;
        },
        set: function (value) {
            this._accessToken = value;
            if (typeof value === "undefined") {
                localStorage.removeItem("MontageStudioToken");
            } else {
                localStorage.setItem("MontageStudioToken", value);
            }
        }
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


            Promise.all([self._deferredApplication.promise, self._deferredMainComponent.promise])
                .spread(function (app, mainComponent) {
                    self.application = app;
                    self.mainComponent = mainComponent;
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

    request: {
        value: function (req) {
            var loc = window.location;
            if (req.subdomain) {
                req.url = loc.protocol + "//" + req.subdomain + "." + loc.host + (req.url[0] === "/" ? "" : "/") + req.url;
            }
            req.headers = req.headers || {};
            var childService = this.application.service.childServices.toArray()[0];
            if (childService && childService.authorization) {
                req.headers["x-access-token"] = childService.authorization[0].token;
            }
            return request.requestOk(req);
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
