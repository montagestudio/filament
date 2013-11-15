/* global lumieres */
var Montage = require("montage/core/core").Montage;
var Component = require("montage/ui/component").Component;
var GithubApi = require("adaptor/client/core/github-api");
var Promise = require("montage/core/promise").Promise;

var IS_IN_LUMIERES = (typeof lumieres !== "undefined");

exports.Main = Montage.create(Component, {

    version: {
        value: "X"
    },

    recentDocuments: {
        value: null
    },

    isFirstRun: {
        value: true
    },

    constructor: {
        value: function Main() {
            this.super();

            var self = this;
            if (IS_IN_LUMIERES) {
                this.version = lumieres.version;

                this.defineBinding("recentDocuments", {
                    "<-": "recentDocuments",
                    source: lumieres
                });

                require.async("adaptor/client/core/lumieres-bridge").then(function (exported) {
                    self.environmentBridge = new exported.LumiereBridge().init("filament-backend");
                    self.environmentBridge.userPreferences.then(function (prefs) {
                        self.isFirstRun = prefs.firstRun;
                        //TODO I don't want firstrun to be set-able as an API, but this feels a little weird
                        self.needsDraw = true;
                    });

                });
            } else {
                require.async("adaptor/client/core/browser-bridge").then(function (exported) {
                    self.environmentBridge = exported.BrowserBridge.create();

                });
                AuthToken().then(function (token) {
                    // get repo list from github
                    self._githubApi = new GithubApi(token);
                    self._githubApi.listRepositories().then(function (repos) {
                        self.recentDocuments = repos;
                    });
                })
            }
        }
    },

    //TODO not show ui until we have an environment bridge
    //This would be a good case of the whole "custom loading scenario" idea
    environmentBridge: {
        value: null
    },

    handleOpenDocument: {
        value: function (evt) {
            this.environmentBridge.open(evt.detail.url).then(function () {
                window.close();
            }).done();
        }
    },

    handleOpenAppButtonAction: {
        value: function () {
            var self = this;
            this.environmentBridge.promptForOpen({canChooseDirectories: true}).then(function (url) {
                if (url) {
                    return self.environmentBridge.open(url).then(function () {
                        window.close();
                    });
                }
            }).done();
        }
    },

    handleNewAppButtonAction: {
        value: function () {
            this.environmentBridge.openNewApplication().then(function () {
                window.close();
            }).done();
        }
    },

    draw: {
        value: function () {
            if (this.isFirstRun) {
                this.element.classList.add("isFirstRun");
            } else {
                this.element.classList.remove("isFirstRun");
            }
        }
    }

});

function AuthToken() {
    var pendingTimeout;
    var timeout = 500;
    var response = Promise.defer();
    var request = new XMLHttpRequest();
    request.open("GET", "/auth/github/token", true);
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            if (request.status === 200) {
                if(pendingTimeout) {
                    clearTimeout(pendingTimeout);
                }
                response.resolve(request.responseText);
            } else {
                response.reject("HTTP " + request.status + " for /auth/token");
            }
        }
    };
    pendingTimeout = setTimeout(response.reject, timeout - 50);
    request.send();
    return response.promise.timeout(timeout);

}
