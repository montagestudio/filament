/* global localStorage */
var Montage = require("montage/core/core").Montage;
var github = require("adaptor/client/core/github");
var Promise = require("montage/core/promise").Promise;
var RangeController = require("montage/core/range-controller").RangeController;
var RepositoryController = require("adaptor/client/core/repository-controller").RepositoryController;

var Group = Montage.specialize( {

    constructor: {
        value: function Group(name) {
            this.name = name;
        }
    },

    name: {
        value: null
    }

});

var RepositoriesController = Montage.specialize({

    constructor: {
        value: function RepositoriesController() {
            var self = this;

            this.groups = [this.recent, this.owned];
            this.addPathChangeListener("selectedGroup", this, "_getListOfRepositories");
            this._initRecentRepositories();
            this.recentRepositoriesContent = new RangeController().initWithContent(this._recentRepositoriesCache);
            this._githubApi = github.githubApi();
            this.ownedRepositoriesContent = new RangeController().initWithContent([]);
            this.ownedRepositoriesContent.sortPath = "-pushed_at";
            this._updateUserRepositories();

            //initialize default value
            this.selectedGroup = this.owned;

            this._githubApi.then(function (githubApi) {
                return githubApi.getUser();
            }).then(function(user) {
                self.user = {
                    name: user.name || user.login,
                    //jshint -W106
                    avatarUrl: user.avatar_url,
                    url: user.html_url
                    //jshint +W106
                };
            }).done();
        }
    },


    open: {
        value: function(repository) {
            window.location.pathname = "/" + repository.owner.login + "/" + repository.name;
        }
    },

    createRepository: {
        value: function(name, description) {
            var self = this;

            return this._githubApi.then(function(githubApi) {
                return githubApi.createRepository(name, description)
                .then(function(repo) {
                    repo.pushed_at = +new Date(repo.pushed_at);
                    self.ownedRepositoriesContent.content.push(repo);
                });
            });
        }
    },

    _getListOfRepositories: {
        value: function() {
            if (this.selectedGroup === this.recent) {
                this.contentController = this.recentRepositoriesContent;
            } else if (this.selectedGroup === this.owned) {
                this.contentController = this.ownedRepositoriesContent;
            }
        }
    },

    _updateUserRepositories: {
        value: function() {
            var self = this;
            if (self.ownedRepositoriesContent.content.length === 0) {

                self.ownedRepositoriesContent.content.clear();
                // get repo list from github
                self._githubApi.then(function (githubApi) {
                    return githubApi.listRepositories({type: "public"});
                })
                .then(function (repos) {
                    self.totalDocuments = repos.length;
                    self.processedDocuments = 0;

                    // HACK: workaround for progress not being able to have max = 0
                    // it's set as 1. (MON-402)
                    if (self.totalDocuments === 0) {
                        self.processedDocuments = 1;
                    }
                    repos.forEach(function(repo) {
                        self._isValidRepository(repo)
                       .then(function(isValidRepository) {
                            if (isValidRepository) {
                                //jshint -W106
                                repo.pushed_at = +new Date(repo.pushed_at);
                                //jshint +W106
                                self.ownedRepositoriesContent.content.push(repo);
                            }
                            self.processedDocuments++;
                        }).done();
                    });
                }).done();
            }
        }
    },

    /**
     * A repository is valid if it's a Montage repository or an empty
     * repository.
     */
    _isValidRepository: {
        value: function(repo) {
            var repositoryController = new RepositoryController();

            repositoryController.init(repo.owner.login, repo.name);

            return repositoryController.isMontageRepository()
            .then(function(value) {
                return value || repositoryController.isRepositoryEmpty();
            });
        }
    },

    _recentRepositoriesCache: {
        value: null
    },

    _addRepositoryToRecent: {
        value: function(repository) {
            var recentRepositories = this._recentRepositoriesCache;

            if (recentRepositories.filter(function (item) {
                return item.name === repository.name;
            }).length === 0 ) {
                var toRemove = recentRepositories.length - 9;
                if (toRemove > 0) {
                    recentRepositories.splice(0,toRemove);
                }
                recentRepositories.unshift(
                   this._createRepositoryArchive(repository)
                );
                this._setRecentRepositories(recentRepositories);
            }
        }
    },

    _createRepositoryArchive: {
        value: function(repository) {
            return  {
                "name": repository.name
            };
        }
    },


    _initRecentRepositories: {
        value: function() {
            var self = this;
            //init local storage if needed
            var recentRepositories = localStorage.getItem("recent_repositories");
            if (!recentRepositories) {
                this._recentRepositoriesCache = [];
                this._setRecentRepositories(this._recentRepositoriesCache);
            } else {
                this._recentRepositoriesCache = JSON.parse(recentRepositories);
            }
        }
    },

    _setRecentRepositories: {
        value: function(recentRepositories) {
            localStorage.setItem("recent_repositories", JSON.stringify(recentRepositories));
        }
    },


    selectedGroup: {
        value: null
    },

    _authToken: {
        value: null
    },

    _githubApi: {
        value: null
    },

    type: {
        value: null
    },

    contentController: {
        value: null
    },

    groups: {
        value: null
    },

    recent: {
        value: new Group("Recent")
    },

    owned: {
        value: new Group("Owned")
    },

    all: {
        value: new Group("All")
    }
});


exports.repositoriesController = new RepositoriesController();
