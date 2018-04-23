var Montage = require("montage/core/core").Montage,
    DataService = require("montage/data/service/data-service").DataService,
    Promise = require("montage/core/promise").Promise,
    track = require("track"),
    request = require("core/request"),
    applicationService = require("data/montage-data.mjson").montageObject,
    FireflyAuthorizationPanel = require("ui/firefly-authorization-panel.reel/firefly-authorization-panel").FireflyAuthorizationPanel,
    GithubAuthorizationPanel = require("ui/github-authorization-panel.reel/github-authorization-panel").GithubAuthorizationPanel;

var LICENSES = require("./licenses.html").content;

exports.ApplicationDelegate = Montage.specialize({

    application: {
        value: null
    },

    isAuthenticated: {
        value: false
    },

    constructor: {
        value: function () {
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

            DataService.authorizationManager.delegate = this;
        }
    },

    willFinishLoading: {
        value: function (app) {
            var self = this;

            this.application = app;
            this.application.service = applicationService;

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
        }
    },

    authorizationManagerWillInstantiateAuthorizationPanelForService: {
        value: function(authorizationManager, authorizationPanel, authorizationService) {
            this.isAuthenticationLoading = true;
            var panel = new authorizationPanel();
            if (authorizationPanel === FireflyAuthorizationPanel) {
                this.fireflyAuthorizationPanel = panel;
            } else if (authorizationPanel === GithubAuthorizationPanel) {
                this.githubAuthorizationPanel = panel;
            }
            return panel;
        }
    },

    authorizationManagerDidAuthorizeService: {
        value: function(authorizationManager, dataService) {
            this.isAuthenticated = true;
            this.isAuthenticationLoading = false;
        }
    },

    logout: {
        value: function () {
            if (this.githubAuthorizationPanel) {
                this.githubAuthorizationPanel.logout();
            }
            this.isAuthenticated = false;
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
                req.headers["x-access-token"] = childService.authorization[0];
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
