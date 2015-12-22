/* global localStorage */
/* jshint -W079 */
var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    github = require("adaptor/client/core/github"),
    RangeController = require("montage/core/range-controller").RangeController,
    RepositoryController = require("adaptor/client/core/repository-controller").RepositoryController;
/* jshint +W079 */

var SORT_PATH = "-pushed_at",
    TYPE_USER = 'USER',
    LOGIN_MY_REPOS = 'my_repos',
    LOGIN_CONTRIBUTING_ON = 'contributing_on',
    LOCAL_STORAGE_INDEX = 'cachedRepositories',
    LOCAL_STORAGE_PREFIX = 'cachedRepositories_',
    LOCAL_STORAGE_REPOSITORIES_COUNT_KEY = "cachedProcessedRepositoriesCount";

/* jshint -W106 */
var GitUser = Montage.specialize({
    login: {
        value: null
    },

    displayedName: {
        value: null
    },

    publicRepositories: {
        value: null
    },

    privateRepositories: {
        value: null
    },

    collaborators: {
        value: null
    },

    listOwnedRepositories: {
        value: true
    },

    listContributedRepositories: {
        value: true
    },

    initWithGithubUser: {
        value: function(githubUser) {
            this.login = githubUser.login;
            this.displayedName = this.login;
            this.publicRepositories = githubUser.public_repos;
            this.privateRepositories = githubUser.total_private_repos;
            this.collaborators = githubUser.collaborators || 0;
            this.type = TYPE_USER;
            return this;
        }
    }
});
/* jshint +W106 */

var RepositoriesController = Montage.specialize({

    isUserSelected: {
        value: null
    },

    organizationsController: {
        value: null
    },

    ownedRepositories: {
        value: null
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

    _repositoriesContents: {
        value: null
    },

    _selectedOrganization: {
        value: null
    },

    constructor: {
        value: function RepositoriesController() {
            this._repositoriesContents = {};
            this.organizationsController = new RangeController().initWithContent([]);

            var self = this;
            this._githubApi = github.githubApi();
            this._githubApi.then(function(githubApi) {
                self._githubUser = githubApi.getUser()
                    .then(function(user) {
                        var gitUser = new GitUser().initWithGithubUser(user),
                            contributedUser = new GitUser().initWithGithubUser(user);
                        gitUser.listContributedRepositories = false;
                        gitUser.login = LOGIN_MY_REPOS;
                        gitUser.canCreateRepo = true;
                        self.organizationsController.add(gitUser);
                        self.organizationsController.select(gitUser);
                        contributedUser.listOwnedRepositories = false;
                        contributedUser.displayedName = 'Contributing on';
                        contributedUser.login = LOGIN_CONTRIBUTING_ON;
                        self.organizationsController.add(contributedUser);
                        return gitUser;
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
        value: function(repositoryName, options) {
            var self = this,
                githubUser;

            return this._githubUser
                .then(function(user) {
                    githubUser = user;
                    return self._githubApi;
                })
                .then(function(githubApi) {
                    var repositoryCreationPromise;
                    if (self._selectedOrganization.type === TYPE_USER) {
                        repositoryCreationPromise = githubApi.createUserRepository(repositoryName, options);
                    } else {
                        repositoryCreationPromise = githubApi.createOrganizationRepository(self._selectedOrganization.login, repositoryName, options);
                    }
                    return repositoryCreationPromise;
                })
                .then(function(repo) {
                    /* jshint -W106 */
                    // This is the format expected by the github API, ignoring for now
                    repo.pushed_at = +new Date(repo.pushed_at);
                    /* jshint +W106 */
                    self._repositoriesContents[githubUser.login].content.push(repo);
                    self.cacheOwnerRepositories(githubUser);
                    return repo;
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

            return this._githubUser
                .then(function(user) {
                    organization = organization || user;
                    return self._githubApi;
                })
                .then(function(githubApi) {
                    return githubApi.forkRepositoryInOrganization(owner, name, organization);
                })
                .then(function(repo) {
                    /* jshint -W106 */
                    // This is the format expected by the github API, ignoring for now
                    repo.pushed_at = +new Date(repo.pushed_at);
                    /* jshint +W106 */
                    self._repositoriesContents[organization.login].content.push(repo);
                    self.cacheOwnerRepositories(organization);
                    return repo;
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

    _increaseProcessedRepositories: {
        value: function() {
            this.processedRepositories++;
        }
    },

    selectOrganization: {
        value: function(organization) {
            var self = this;
            self._selectedOrganization = organization;
            if (typeof self._repositoriesContents[organization.login] === "undefined") {
                self._repositoriesContents[organization.login] = new RangeController().initWithContent([]);
                self._repositoriesContents[organization.login].sortPath = SORT_PATH;
            }
            self._loadOwnerRepositories(organization)
                .then(function(isFromCache) {
                    if (!isFromCache) {
                        self.cacheOwnerRepositories(organization);
                    }
                    if (self.isUserSelected) {
                        self.ownedRepositories = self._repositoriesContents[organization.login].content;
                    }
                });
            self.contentController = self._repositoriesContents[organization.login];
        }
    },

    updateRepositories: {
        value: function() {
            var self = this,
                owner = this._selectedOrganization;
            localStorage.removeItem(LOCAL_STORAGE_PREFIX + owner.login);
            if (this._repositoriesContents.hasOwnProperty(owner.login)) {
                this._repositoriesContents[owner.login].content.clear();
            } else {
                this._repositoriesContents[owner.login] = new RangeController().initWithContent([]);
                this._repositoriesContents[owner.login].sortPath = SORT_PATH;
            }
            return this._loadOwnerRepositories(owner)
                .then(function() {
                    self.cacheOwnerRepositories(owner);
                });
        }
    },

    _loadOwnerRepositoriesFromCache: {
        value: function(owner) {
            var cachedData = localStorage.getItem(LOCAL_STORAGE_PREFIX + owner.login);
            if (cachedData) {
                var parsedData = JSON.parse(cachedData);
                this._repositoriesContents[owner.login] = new RangeController().initWithContent(parsedData);
                this._repositoriesContents[owner.login].sortPath = SORT_PATH;
            }
        }
    },

    _loadOwnerRepositories: {
        value: function(owner, page) {
            var ownerName = owner.login;
            this._loadOwnerRepositoriesFromCache(owner);
            if (page || typeof this._repositoriesContents[owner.login] === "undefined" || this._repositoriesContents[owner.login].content.length === 0) {
                var self = this,
                    perPage = 30;

                if (!page) {
                    page = 1;
                    self.processedRepositories = 0;
                    self._repositoriesCount = 0;
                }
                page = page || 1;

                return self._githubApi
                    .then(function (githubApi) {
                        //jshint -W106
                        var options = {page: page, per_page: perPage};
                        //jshint +W106
                        if (owner.type === TYPE_USER) {
                            if (owner.login === LOGIN_MY_REPOS) {
                                return githubApi.listOwnedRepositories(options);
                            } else if (owner.login === LOGIN_CONTRIBUTING_ON) {
                                return githubApi.listContributingRepositories(options);
                            }
                        } else {
                            return githubApi.listOrganizationRepositories(ownerName, options);
                        }
                    })
                    .then(function (repositories) {
                        self.repositoriesCount += repositories.length;
                        var filteringPromises = [];
                        for (var i = 0, repositoriesCount = repositories.length; i < repositoriesCount; i++) {
                            filteringPromises.push(self._filterValidRepositories(repositories[i], self._repositoriesContents[ownerName]));
                        }
                        if (repositories.length >= perPage) {
                            return self._loadOwnerRepositories(owner, ++page);
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
            return this._isRepositoryValid(repository)
                .then(function (isRepositoryValid) {
                    if (isRepositoryValid) {
                        //jshint -W106
                        repository.pushed_at = +new Date(repository.pushed_at);
                        //jshint +W106
                        targetRangeController.content.push(repository);
                    }
                    self._increaseProcessedRepositories();
                    return isRepositoryValid;
                });
        }
    },

    /**
     * A repository is valid if it's a Montage repository or an empty
     * repository.
     */
    _isRepositoryValid: {
        value: function(repo) {
            var repositoryController = new RepositoryController().init(repo.owner.login, repo.name),
                isRepositoryValid;

            return repositoryController.isMontageRepository()
                .then(function(isMontageRepository) {
                    return isMontageRepository || repositoryController.isRepositoryEmpty();
                })
                .then(function(isValid) {
                    isRepositoryValid = isValid;
                    if (repo.fork) {
                        return repositoryController.getParent();
                    }
                    return Promise.resolve();
                })
                .then(function(parent) {
                    if (parent) {
                        repo.parent = parent;
                    }
                    return isRepositoryValid;
                });
        }
    },

    clearCachedRepositories: {
        value: function () {
            this.repositoriesCount = 0;
            localStorage.removeItem(LOCAL_STORAGE_REPOSITORIES_COUNT_KEY);

            this.processedRepositories = 0;
            var cachedOrganizationsValue = localStorage.getItem(LOCAL_STORAGE_INDEX) || "[]",
                cachedOrganizations = JSON.parse(cachedOrganizationsValue);
            for (var i = 0, organizationsCount = cachedOrganizations.length; i < organizationsCount; i++) {
                localStorage.removeItem(cachedOrganizations[i]);
            }
            localStorage.removeItem(LOCAL_STORAGE_INDEX);

            return Promise();
        }
    },

    cacheOwnerRepositories: {
        value: function (owner) {
            if (this._repositoriesContents.hasOwnProperty(owner.login)) {
                var cache = this._repositoriesContents[owner.login].content;
                localStorage.setItem(LOCAL_STORAGE_PREFIX + owner.login, JSON.stringify(cache));
                var cachedOrganizationsValue = localStorage.getItem(LOCAL_STORAGE_INDEX) || "[]",
                    cachedOrganizations = JSON.parse(cachedOrganizationsValue);

                cachedOrganizations.push(LOCAL_STORAGE_PREFIX + owner.login);
                localStorage.setItem(LOCAL_STORAGE_INDEX, JSON.stringify(cachedOrganizations));
            }
        }
    }
});


exports.repositoriesController = new RepositoriesController();
