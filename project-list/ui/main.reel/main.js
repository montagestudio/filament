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
            return this._githubApi.listRepositories({type: "public"})
            .then(function (repos) {
                self.totalDocuments = repos.length;
                self.processedDocuments = 0;

                // HACK: workaround for progress not being able to have max = 0
                // it's set as 1. (MON-402)
                if (self.totalDocuments == 0) {
                    self.processedDocuments = 1;
                }

                repos.forEach(function(repo) {
                    self._isValidRepository(repo)
                    .then(function(isValidRepository) {
                        if (isValidRepository) {
                            repo.pushed_at = +new Date(repo.pushed_at);
                            userRepositories.push(repo);
                        }
                        self.processedDocuments++;
                    }).done();
                });
            });
        }
    },

    /**
     * A repository is valid if it's a Montage repository or an empty
     * repository.
     */
    _isValidRepository: {
        value: function(repo) {
            var self = this;

            return this._isMontageRepository(repo)
            .then(function(value) {
                return value || self._isEmptyRepository(repo);
            });
        }
    },

    /**
     * A Montage repository as a package.json and declares a dependency on
     * montage.
     */
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

    /**
     * An empty repository doesn't have branches.
     */
    _isEmptyRepository: {
        value: function(repo) {
            return this._githubApi.listBranches(repo.owner.login, repo.name)
            .then(function(branches) {
                return branches.length === 0;
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
            this.templateObjects.newAppFormCondition.condition = true;
        }
    },

    handleCancelNewAppButtonAction: {
        value: function () {
            this.templateObjects.newAppFormCondition.condition = false;
        }
    },

    handleCreateNewAppButtonAction: {
        value: function () {
            var name = this.templateObjects.newAppName.value,
                description = this.templateObjects.newAppDescription.value,
                self = this;

            this._githubApi.createRepository(name, {
                description: description
            }).then(function(repo) {
                repo.pushed_at = +new Date(repo.pushed_at);
                self.recentDocuments.push(repo);
                self.templateObjects.newAppFormCondition.condition = false;
            });
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
