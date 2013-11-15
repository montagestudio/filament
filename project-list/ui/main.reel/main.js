/* global lumieres */
var Montage = require("montage/core/core").Montage;
var Component = require("montage/ui/component").Component;
var GithubApi = require("adaptor/client/core/github-api");
var GithubFs = require("adaptor/client/core/fs-github");
var Promise = require("montage/core/promise").Promise;
var Q = require("q");

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
                    self._accessToken = token;
                    self._updateUserRepositories(self.recentDocuments = []);
                });
            }
        }
    },

    _updateUserRepositories: {
        value: function(userRepositories) {
            var self = this;

            userRepositories.clear();

            // get repo list from github
            this._githubApi = new GithubApi(this._accessToken);
            return this._githubApi.listRepositories().then(function (repos) {
                self.totalDocuments = repos.length;
                self.processedDocuments = 0;

                repos.forEach(function(repo) {
                    return self._isMontageRepository(repo)
                    .then(function(isMontageRepository) {
                        if (isMontageRepository) {
                            repo.pushed_at = +new Date(repo.pushed_at);
                            userRepositories.push(repo);
                        }
                        self.processedDocuments++;
                    }).done();
                });
            });
        }
    },

    _isMontageRepository: {
        value: function(repo) {
            var githubFs = new GithubFs(repo.owner.login, repo.name, this._accessToken);

            return githubFs.exists("/package.json").then(function(exists) {
                if (exists) {
                    return githubFs.read("/package.json").then(function(content) {
                        try {
                            var packageDescription = JSON.parse(content);
                        } catch(ex) {
                            // not a JSON file
                            return false;
                        }

                        if (packageDescription.dependencies &&
                            "montage" in packageDescription.dependencies) {
                            return true;
                        } else {
                            return false;
                        }
                    });
                } else {
                    return false;
                }
            });
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
