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
            this.groups = [this.recent, this.owned];
            this.addPathChangeListener("selectedGroup", this, "_getListOfRepositories");
            this._initRecentRepositories();
            this.recentRepositoriesContent = new RangeController().initWithContent(this._recentRepositoriesCache);
            this._githubApi = github.githubApi();
            this._ownedRepositoriesContent = new RangeController().initWithContent([]);
            this._ownedRepositoriesContent.sortPath = "-pushed_at";

            //initialize default value
            this.selectedGroup = this.owned;
        }
    },


    /**
     * Open the specified repository by navigating to the expected URL
     * @param {Object} repository The repository to open
     */
    open: {
        value: function(repository) {
            window.location.pathname = "/" + repository.owner.login + "/" + repository.name;
        }
    },

    /**
     * Create a repository with the specified name and description
     *
     * @param {String} name The name of the repository to create
     * @param {Object} options An object of key-value pair configuration options
     * @return {Promise} A promise for the created repository
     */
    createRepository: {
        value: function(name, options) {
            var self = this;

            return this._githubApi.then(function(githubApi) {
                return githubApi.createRepository(name, options)
                .then(function(repo) {
                    /* jshint -W106 */
                    // This is the format expected by the github API, ignoring for now
                    repo.pushed_at = +new Date(repo.pushed_at);
                    /* jshint +W106 */
                    self._ownedRepositoriesContent.content.push(repo);
                    return repo;
                });
            });
        }
    },

    /**
     * Fork a repository from the specified owner and name
     *
     * @param {String} owner The owner/organization of the repository to fork from
     * @param {String} name An The name of the repository to fork
     * @param {String} organization The organization where to fork to (optional)
     * @return {Promise} A promise for the forked repository
     */
    forkRepository: {
        value: function(owner, name, organization) {
            var self = this;
            return this._githubApi.then(function(githubApi) {
                return githubApi.forkRepositoryInOrganization(owner, name, organization)
                .then(function(repo) {
                    /* jshint -W106 */
                    // This is the format expected by the github API, ignoring for now
                    repo.pushed_at = +new Date(repo.pushed_at);
                    /* jshint +W106 */
                    self._ownedRepositoriesContent.content.push(repo);
                    return repo;
                });
            });
        }
    },

    /**
     * Initialize the repository for the specified login with the specified repositoryName
     *
     * Note this does not validate that the repository specified exists or is receptive
     * to being initialized with a montage project
     *
     * @param {String} ownerLogin The login name of the user
     * @param {String} repositoryName The name of the repository to initialize
     * @return {Promise} A promise for the initialized repository workspace
     */
    initializeRepository: {
        value: function (ownerLogin, repositoryName) {
            var repositoryController = new RepositoryController();
            repositoryController.init(ownerLogin, repositoryName);
            return repositoryController.initializeRepositoryWorkspace();
        }
    },

    _getListOfRepositories: {
        value: function() {
            if (this.selectedGroup === this.recent) {
                this.contentController = this.recentRepositoriesContent;
            } else if (this.selectedGroup === this.owned) {
                this.contentController = this._ownedRepositoriesContent;
            }
        }
    },

    totalDocuments: {
        value: 0
    },

    processedDocuments: {
        value: 0
    },

    _updateUserRepositories: {
        value: function(page) {
            var self = this,
                perPage = 30,
                deferred = Promise.defer();

            page = (page)? page : 1;

            self._ownedRepositoriesContent.content.clear();
            // get repo list from github
            self._githubApi.then(function (githubApi) {
                //jshint -W106
                var options = {page: page, per_page: perPage};
                //jshint +W106
                return githubApi.listRepositories(options);
            })
            .then(function (repos) {
                var pendingCommands = repos.length;

                self.totalDocuments += repos.length;

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
                            self._ownedRepositoriesContent.content.push(repo);
                        }
                        self.processedDocuments++;
                        if (--pendingCommands === 0) {
                            deferred.resolve();
                        }
                    }).done();
                });

                if (repos.length >= perPage) {
                    // If there's another page then we resolve when that's
                    // resolved
                    deferred.resolve(self._updateUserRepositories(page + 1));
                }
            }).done();

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
            var recentRepos = this._recentRepositoriesCache,
                nbrRecentRepos = recentRepos.length,
                repoNames,
                i;

            repoNames = this._ownedRepositoriesContent.organizedContent.map(function(item) {
                return item.name;
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

    _gotOwnedRepositoriesContent: {
        value: false
    },

    _ownedRepositoriesContent: {
        value: null
    },

    ownedRepositoriesContent: {
        get: function () {
            if (!this._gotOwnedRepositoriesContent) {
                this._gotOwnedRepositoriesContent = true;
                var self = this;

                this._updateUserRepositories().then(function() {
                    self._validateRecentRepositories();
                }).done();
            }

            return this._ownedRepositoriesContent;
        },
        set: function (value) {
            this._ownedRepositoriesContent = value;
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
