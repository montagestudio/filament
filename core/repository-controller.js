var Montage = require("montage").Montage;
var Promise = require("montage/core/promise").Promise;
var GithubFs = require("core/github-fs").GithubFs;
var application = require("montage/core/application").application;
var GithubBranch = require("logic/model/github-branch").GithubBranch;
var GithubRepository = require("logic/model/github-repository").GithubRepository;
var Workspace = require("logic/model/workspace").Workspace;

/**
 * The functions provided by this file should be converted into a service.
 * Everything that requires a session token should definitely be provided by
 * the backend to avoid exposing the token to the client ever.
 * However, we can still offload some of the git related work to the client
 * if the repository we're working with is public.
 *
 * It's also worth considering splitting the services provided by this file into
 * two: project related operations and git repo related operations.
 * It's possible that we need information on a particular git repo that isn't
 * a project.
 */

exports.RepositoryController = Montage.specialize({
    owner: {
        value: null
    },

    repo: {
        value: null
    },

    _isNonEmptyRepository: {
        value: null
    },

    constructor: {
        value: function RepositoryController() {

        }
    },

    init: {
        value: function(owner, repo) {
            this.owner = owner;
            this.repo = repo;

            return this;
        }
    },

    initializeRepositoryWorkspace: {
        value: function() {
            var self = this;
            var done = Promise.defer();

            return application.delegate.request({
                method: "POST",
                url: "/" + this.owner + "/" + this.repo + "/init",
                subdomain: "api"
            }).then(function () {
                function poll() {
                    application.delegate.request({
                        method: "GET",
                        url: "/" + self.owner + "/" + self.repo + "/init/progress",
                        subdomain: "api"
                    })
                    .then(function (response) {
                        var message = JSON.parse(response.body);
                        if (message.state === "pending") {
                            setTimeout(poll, 5000);
                        } else if (message.state === "fulfilled") {
                            done.resolve();
                        } else if (message.state === "rejected") {
                            done.reject(new Error("Initialize failed"));
                        }
                    }).catch(done.reject);
                }

                poll();

                return done.promise;
            });
        }
    },

    isRepositoryEmpty: {
        value: function() {
            var self = this,
                emptynessPromise;

            if (this._isNonEmptyRepository) {
                emptynessPromise = Promise.resolve(false);
            } else {
                emptynessPromise = application.service.fetchData(GithubBranch, {
                    parameters: {
                        owner: self.owner,
                        repo: self.repo
                    }
                }).then(function (branches) {
                    return branches.length === 0;
                });
            }

            return emptynessPromise;
        }
    },

    isMontageRepository: {
        value: function() {
            var self = this,
                githubToken = application.service.childServices.toArray[0].authorization[0].githubAuthorization.token,
                githubFs = new GithubFs(this.owner, this.repo, githubToken);
            return githubFs.readFromDefaultBranch('/package.json')
                .then(function(content) {
                    self._isNonEmptyRepository = true;
                    if (content) {
                        try {
                            var packageDescription = JSON.parse(content);
                            return packageDescription.dependencies && "montage" in packageDescription.dependencies;
                        } catch(ex) {
                            // not a JSON file
                            return false;
                        }
                    } else {
                        return false;
                    }
                }, function() {
                    return false;
                });
        }
    },

    getParent: {
        value: function() {
            var self = this;

            return application.service.fetchData(GithubRepository, {
                parameters: {
                    owner: self.owner,
                    repo: self.repo
                }
            }).then(function (repository) {
                return repository.parent;
            });
        }
    },

    repositoryExists: {
        value: function() {
            var self = this;

            return application.service.fetchData(GithubRepository, {
                parameters: {
                    owner: self.owner,
                    repo: self.repo
                }
            }).then(function (data) {
                var repository = data[0];
                return !!repository;
            }).catch(function (err) {
                if ("Not Found" === err.message) {
                    return false;
                } else {
                    throw err;
                }
            });
        }
    },

    getRepositoryUrl: {
        value: function() {
            var self = this;

            return application.service.fetchData(GithubRepository, {
                parameters: {
                    owner: self.owner,
                    repo: self.repo
                }
            }).then(function (repo) {
                return repo.htmlUrl;
            });
        }
    },

    workspaceExists: {
        value: function() {
            return application.service.fetchData(Workspace, {
                parameters: {
                    owner: this.owner,
                    repo: this.repo
                }
            })
            .then(function(message) {
                return message.created;
            });
        }
    },

    createComponent: {
        value: function(name, packageHome, destination) {
            return application.delegate.request({
                method: "POST",
                url: "/" + this.owner + "/" + this.repo + "/components",
                subdomain: "api",
                data: {
                    "name": name,
                    "packageHome": packageHome,
                    "destination": destination
                }
            });
        }
    },

    createModule: {
        value: function(name, extendsModuleId, extendsName, destination) {
            return application.delegate.request({
                method: "POST",
                url: "/" + this.owner + "/" + this.repo + "/modules",
                subdomain: "api",
                data: {
                    "name": name,
                    "extendsModuleId": extendsModuleId,
                    "extendsName": extendsName,
                    "destination": destination
                }
            });
        }
    },

    saveFile: {
        value: function(filename, contents) {
            filename = this._removeProjectIdFromPath(filename);
            return application.delegate.request({
                method: "POST",
                url: "/" + this.owner + "/" + this.repo + "/save",
                subdomain: "api",
                data: {
                    "filename": filename,
                    "contents": contents
                }
            });
        }
    },

    flush: {
        value: function(message) {
            return application.delegate.request({
                method: "POST",
                url: "/" + this.owner + "/" + this.repo + "/flush",
                subdomain: "api",
                data: {
                    message: message
                }
            });
        }
    },

    _projectIdRegex: {
        value: /^\/.+?\/.+?\/.+?\//
    },

    _removeProjectIdFromPath: {
        value: function (path) {
            return path.replace(this._projectIdRegex, "");
        }
    }
});
