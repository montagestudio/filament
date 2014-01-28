/* global localStorage */
var Montage = require("montage/core/core").Montage;
var Promise = require("montage/core/promise").Promise;
var github = require("adaptor/client/core/github");
var RangeController = require("montage/core/range-controller").RangeController;
var RepositoryController = require("adaptor/client/core/repository-controller").RepositoryController;

var MAX_RECENT_ITEMS = 10;

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
            this._updateUserRepositories().then(function() {
                self._validateRecentRepositories();
            }).done();

            //initialize default value
            this.selectedGroup = this.owned;
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
                    /* jshint -W106 */
                    // This is the format expected by the github API, ignoring for now
                    repo.pushed_at = +new Date(repo.pushed_at);
                    /* jshint +W106 */
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
            var self = this,
                deferred = Promise.defer();

            if (self.ownedRepositoriesContent.content.length === 0) {

                self.ownedRepositoriesContent.content.clear();
                // get repo list from github
                self._githubApi.then(function (githubApi) {
                    return githubApi.listRepositories({type: "public"});
                })
                .then(function (repos) {
                    var pendingCommands = repos.length;

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
                            if (-- pendingCommands === 0) {
                                deferred.resolve();
                            }
                        }).done();
                    });

                }).done();
            } else {
                deferred.resolve();
            }

            return deferred.promise;
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

    addRepositoryToRecent: {
        value: function(repository) {
            var recentRepositories = this._recentRepositoriesCache;

            var pos = -1;
            recentRepositories.some(function(item, index) {
                if (item.name === repository.repo) {
                    pos = index;
                    return true;
                }
                return false;
            });
            if (pos === -1) {   // New item
                var toRemove = recentRepositories.length - (MAX_RECENT_ITEMS - 1);
                if (toRemove > 0) {
                    recentRepositories.splice(MAX_RECENT_ITEMS, toRemove);
                }
            } else {            //Existing item
                recentRepositories.splice(pos, 1);
            }

            recentRepositories.unshift(
               this._createRepositoryArchive(repository)
            );
            this._setRecentRepositories(recentRepositories);
        }
    },

    _createRepositoryArchive: {
        value: function(repository) {
            var project = {
                owner: {
                    login: repository.owner
                },
                name: repository.repo
            };
            return project;
        }
    },


    _initRecentRepositories: {
        value: function() {
            //init local storage if needed
            var recentRepositories = localStorage.getItem("recent_repositories");
            if (!recentRepositories) {
                this._recentRepositoriesCache = [];
                this._setRecentRepositories(this._recentRepositoriesCache);
            } else {
                recentRepositories = JSON.parse(recentRepositories);

                if (recentRepositories.length > MAX_RECENT_ITEMS) {
                    recentRepositories.splice(MAX_RECENT_ITEMS, recentRepositories.length - MAX_RECENT_ITEMS);
                }
                this._recentRepositoriesCache = recentRepositories;
            }
        }
    },

    _validateRecentRepositories: {
        value: function() {
            var repoNames = [],
                recentRepos = this._recentRepositoriesCache,
                nbrRecentRepos = recentRepos.length,
                i;

            this.ownedRepositoriesContent.organizedContent.forEach(function(item) {
                repoNames.push(item.name);
            });

            for (i = nbrRecentRepos - 1; i >= 0; i --) {
                if (repoNames.indexOf(recentRepos[i].name.toLowerCase()) === -1) {
                    recentRepos.splice(i, 1);
                }
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
