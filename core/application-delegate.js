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
            req.headers["Content-Type"] = "application/json";
            req.headers["Accept"] = req.headers["Accept"] || "application/json";
            return request.requestOk(req);
        }
    }
});
