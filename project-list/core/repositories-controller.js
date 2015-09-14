/* global localStorage */
var Montage = require("montage/core/core").Montage;
var Promise = require("montage/core/promise").Promise;
var github = require("adaptor/client/core/github");
var RangeController = require("montage/core/range-controller").RangeController;
var RepositoryController = require("adaptor/client/core/repository-controller").RepositoryController;

var MAX_RECENT_ITEMS = 10;
var LOCAL_STORAGE_OWN_REPOSITORIES_KEY = "cachedOwnedRepositories";
var LOCAL_STORAGE_ORGANIZATIONS_KEY = "cachedOrganizations";
var LOCAL_STORAGE_REPOSITORIES_COUNT_KEY = "cachedProcessedRepositoriesCount";

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

    organizationsController: {
        value: null
    },

    constructor: {
        value: function RepositoriesController() {
            this.groups = [this.recent, this.owned];
            this.addPathChangeListener("selectedGroup", this, "_getListOfRepositories");
            this._initRecentRepositories();
            this.recentRepositoriesContent = new RangeController().initWithContent(this._recentRepositoriesCache);
            this._githubApi = github.githubApi();
            this._ownedRepositoriesContent = new RangeController().initWithContent([]);
            this._ownedRepositoriesContent.sortPath = "-pushed_at";
            this._organizationsRepositoriesContents = {};
            this.organizationsController = new RangeController().initWithContent([]);

            //initialize default value
            this.selectedGroup = this.owned;
            var self = this;
            this._githubApi.then(function(githubApi) {
                self._githubUser = githubApi.getUser();
                self._githubUser
                    .then(function(user) {
                        self.organizationsController.add(user);
                        self.organizationsController.select(user);
                    });
            });
        }
    },

    loadOrganizations: {
        value: function() {
            var self = this;
            this._githubApi
                .then(function(githubApi) {
                    githubApi.listUserOrganizations()
                        .then(function(organizations) {
                            self.organizationsController.addEach(organizations);
                        });
                });
            this._loadOrganizationsRepositoriesFromCache();
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
                    self.cacheUserRepositories();
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
            if (this._selectedOrganization && this._selectedOrganization.login) {
                this.contentController = this._organizationsRepositoriesContents[this._selectedOrganization.login];
            } else {
                if (this.selectedGroup === this.recent) {
                    this.contentController = this.recentRepositoriesContent;
                } else if (this.selectedGroup === this.owned) {
                    this.contentController = this._ownedRepositoriesContent;
                }
            }
        }
    },

    _repositoriesCount: {
        value: 0
    },

    repositoriesCount: {
        get: function () {
            return this._repositoriesCount;
        },

        set: function (value) {
            if (value === this._repositoriesCount) {
                return;
            }

            if (this._repositoriesCount && value > this._repositoriesCount) {
                var growth = value / this._repositoriesCount;
                this.processedRepositories = Math.ceil(this.processedRepositories * growth);
            }
            this._repositoriesCount = value;
        }
    },

    processedRepositories: {
        value: 0
    },

    _increaseProcessedRepositories: {
        value: function() {
            this.processedRepositories++;
        }
    },

    updateUserRepositories: {
        value: function(page) {
            var self = this,
                perPage = 30,
                githubUser;

            page = page || 1;

            this._ownedRepositoriesContent.content.clear();
            return this._githubUser
                .then(function(user) {
                    githubUser = user;
                    return self._githubApi;
                })
                .then(function(_githubApi) {
                    //jshint -W106
                    var options = {page: page, per_page: perPage};
                    //jshint +W106
                    return _githubApi.listOwnRepositories(options);
                })
                .then(function(userRepositories) {
                    self.repositoriesCount += userRepositories.length;
                    var filteringPromises = [];
                    for (var i = 0; i < userRepositories.length; i++) {
                        filteringPromises.push(self._filterValidRepositories(userRepositories[i], self._ownedRepositoriesContent));
                    }
                    if (userRepositories.length === perPage) {
                        return self.updateUserRepositories(++page)
                            .then(function() {
                                return Promise.all(filteringPromises);
                            });
                    } else {
                        return Promise.all(filteringPromises);
                    }
                });
        }
    },

    _loadOrganizationsRepositoriesFromCache: {
        value: function () {
            if (!this._organizationsRepositoriesContents){
                this._organizationsRepositoriesContents = [];
            }
            var cached = localStorage.getItem(LOCAL_STORAGE_ORGANIZATIONS_KEY);
            if (cached) {
                try {
                    var cachedContent = JSON.parse(cached);
                    for (var organizationName in cachedContent) {
                        if (cachedContent.hasOwnProperty(organizationName)) {
                            if (!this._organizationsRepositoriesContents[organizationName]) {
                                this._organizationsRepositoriesContents[organizationName] = new RangeController().initWithContent(cachedContent[organizationName]);
                            }
                        }
                    }
                } catch (exception) {
                    console.warn("Unable to parse cached organizations repositories because of error:", exception.message);
                    localStorage.remove(LOCAL_STORAGE_ORGANIZATIONS_KEY);
                }
            }
        }
    },

    selectOrganization: {
        value: function(organization) {
            var self = this;
            this.organizationsController.clearSelection();
            this.organizationsController.select(organization);
            this._githubUser.then(function(user) {
                if (organization.login === user.login) {
                    self._selectedOrganization = null;
                } else {
                    self._selectedOrganization = organization;
                    if (typeof self._organizationsRepositoriesContents[organization.login] === "undefined") {
                        self._organizationsRepositoriesContents[organization.login] = new RangeController().initWithContent([]);
                    }
                    self._loadOrganizationRepositories(organization)
                        .then(function(isFromCache) {
                            if (!isFromCache) {
                                self.cacheOrganizationsRepositories();
                            }
                        });
                }
                self._getListOfRepositories();
            });
        }
    },

    _loadOrganizationRepositories: {
        value: function(organization, page) {
            if (page || typeof this._organizationsRepositoriesContents[organization.login] === "undefined" || this._organizationsRepositoriesContents[organization.login].content.length === 0) {
                var self = this,
                    perPage = 30;

                if (!page) {
                    page = 1;
                    self.processedRepositories = 0;
                    self._repositoriesCount = 0;
                }
                page = page || 1;

                var organizationName = organization.login;
                return self._githubApi
                    .then(function (githubApi) {
                        //jshint -W106
                        var options = {page: page, per_page: perPage};
                        //jshint +W106
                        return githubApi.listOrganizationRepositories(organizationName, options);
                    })
                    .then(function (repositories) {
                        self.repositoriesCount += repositories.length;
                        var filteringPromises = [];
                        for (var i = 0; i < repositories.length; i++) {
                            filteringPromises.push(self._filterValidRepositories(repositories[i], self._organizationsRepositoriesContents[organizationName]));
                        }
                        if (repositories.length >= perPage) {
                            return self._loadOrganizationRepositories(organization, ++page);
                        } else {
                            return Promise.all(filteringPromises)
                                .then(function() {
                                    return false;
                                });
                        }
                    });
            } else {
                return Promise.resolve(true);
            }
        }
    },

    _filterValidRepositories: {
        value: function (repository, targetRangeController) {
            var self = this;
            return this._isValidRepository(repository)
                .then(function (isValidRepository) {
                    if (isValidRepository) {
                        //jshint -W106
                        repository.pushed_at = +new Date(repository.pushed_at);
                        //jshint +W106
                        targetRangeController.content.push(repository);
                    }
                    self._increaseProcessedRepositories();
                    return isValidRepository;
                });
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

                var cachedOwnedRepositories = localStorage.getItem(LOCAL_STORAGE_OWN_REPOSITORIES_KEY);
                if (cachedOwnedRepositories) {
                    try {
                        self._ownedRepositoriesContent.content.addEach(JSON.parse(cachedOwnedRepositories));
                        // TODO: call self._validateUserRepositoriesCache if we ever change the Github API scope to have `user`
                    } catch (error) {
                        console.warn("Failed to parse cached owned repositories because " + error.message);
                        localStorage.removeItem(LOCAL_STORAGE_OWN_REPOSITORIES_KEY);
                    }
                }

                // second if to fetch repositories if the JSON.parse failed
                if (!this._ownedRepositoriesContent.content.length) {
                    this.updateAndCacheRepositories().done();
                }
            }

            return this._ownedRepositoriesContent;
        },
        set: function (value) {
            this._ownedRepositoriesContent = value;
        }
    },

    _validateUserRepositoriesCache: {
        value: function () {
            var self = this;
            return this._githubUser.then(function(user) {
                /* jshint -W106 */
                if (!user.public_repos || !user.total_private_repos) {
                    throw "Failed to validate cache, Github's API result is incomplete";
                }
                var userRepositoriesCount = user.public_repos + user.total_private_repos,
                    cachedCount = localStorage.getItem(LOCAL_STORAGE_REPOSITORIES_COUNT_KEY),
                    count;
                userRepositoriesCount += (user.collaborators) ? user.collaborators : 0;
                /* jshint +W106 */
                if (!cachedCount) {
                    // no cache count to check against
                    self.updateAndCacheRepositories();
                }
                count = JSON.parse(cachedCount);
                if (count !== userRepositoriesCount) {
                    self.updateAndCacheRepositories();
                }
            });
        }
    },

    clearCachedRepositories: {
        value: function () {
            this.repositoriesCount = 0;
            localStorage.removeItem(LOCAL_STORAGE_REPOSITORIES_COUNT_KEY);

            this.processedRepositories = 0;
            localStorage.removeItem(LOCAL_STORAGE_OWN_REPOSITORIES_KEY);

            return Promise();
        }
    },

    updateAndCacheRepositories: {
        value: function () {
            var self = this;
            this.repositoriesCount = 0;
            this.processedRepositories = 0;
            if (this._selectedOrganization) {
                this._organizationsRepositoriesContents[this._selectedOrganization.login].clear();
                return this._loadOrganizationRepositories(this._selectedOrganization)
                    .then(function() {
                        self.cacheOrganizationsRepositories();
                    });
            }else {
                return this.updateUserRepositories()
                    .then(function () {
                        self.cacheUserRepositories();
                    });
            }
        }
    },

    cacheUserRepositories: {
        value: function () {
            localStorage.setItem(LOCAL_STORAGE_OWN_REPOSITORIES_KEY, JSON.stringify(this._ownedRepositoriesContent.content));
            localStorage.setItem(LOCAL_STORAGE_REPOSITORIES_COUNT_KEY, JSON.stringify(this.repositoriesCount));
            this._validateRecentRepositories();
        }
    },

    cacheOrganizationsRepositories: {
        value: function () {
            var cache = {};
            for (var organizationName in this._organizationsRepositoriesContents) {
                if (this._organizationsRepositoriesContents.hasOwnProperty(organizationName)) {
                    cache[organizationName] = this._organizationsRepositoriesContents[organizationName].content;
                }
            }
            localStorage.setItem(LOCAL_STORAGE_ORGANIZATIONS_KEY, JSON.stringify(cache));
            //this._validateRecentRepositories();
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

    _githubUser: {
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
    },

    _organizationsRepositoriesContents: {
        value: null
    },

    _selectedOrganization: {
        value: null
    }
});


exports.repositoriesController = new RepositoriesController();
