var Montage = require("montage/core/core").Montage,
    Promise = require("montage/core/promise").Promise,
    application = require("montage/core/application").application,
    RangeController = require("montage/core/range-controller").RangeController,
    RepositoryController = require("core/repository-controller").RepositoryController,
    GithubUser = require("logic/model/github-user").GithubUser,
    GithubOrganization = require("logic/model/github-organization").GithubOrganization,
    GithubRepository = require("logic/model/github-repository").GithubRepository;

var SORT_PATH = "-pushedAtInSeconds";

var ContributingUser = Montage.specialize({
    constructor: {
        value: function ContributingUser() {
            this.login = "Contributing on";
        }
    }
});

var RepositoriesController = Montage.specialize({

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
        }
    },

    loadOrganizations: {
        value: function() {
            var self = this;
            return application.service.fetchData(GithubUser)
                .then(function (users) {
                    var user = users[0];
                    self._githubUser = user;
                    self.organizationsController.add(user);
                    self.organizationsController.select(user);

                    var contributingUser = new ContributingUser();
                    self.organizationsController.add(contributingUser);

                    return application.service.fetchData(GithubOrganization);
                })
                .then(function (organizations) {
                    self.organizationsController.addEach(organizations);
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
            var self = this;
            var organization = this._selectedOrganization;
            var repository = application.service.createDataObject(GithubRepository);
            repository.name = repositoryName;
            Object.assign(repository, options);
            if (organization.constructor === GithubOrganization) {
                repository.owner = organization;
            } else {
                repository.owner = this._githubUser;
            }
            return application.service.saveDataObject(repository)
                .then(function () {
                    // TODO: :(. I want saveDataObject to give me my updated data object back
                    var parameters = {
                        repo: repositoryName
                    };
                    if (organization.constructor === GithubOrganization) {
                        parameters.org = organization.login;
                    } else {
                        parameters.owner = self._githubUser.login;
                    }
                    return application.service.fetchData(GithubRepository, {
                        parameters: parameters
                    });
                })
                .then(function (repositories) {
                    var repository = repositories[0];
                    self._repositoriesContents[repository.owner.login].content.push(repository);
                    return repository;
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

            organization = organization || this._githubUser;
            return self._githubApi
                .then(function(githubApi) {
                    return githubApi.forkRepositoryInOrganization(owner, name, organization);
                })
                .then(function(repo) {
                    self._repositoriesContents[organization.login].content.push(repo);
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

    selectOrganization: {
        value: function(organization) {
            var self = this;
            self._selectedOrganization = organization;
            if (typeof self._repositoriesContents[organization.login] === "undefined") {
                self._repositoriesContents[organization.login] = new RangeController().initWithContent([]);
                self._repositoriesContents[organization.login].sortPath = SORT_PATH;
                self._loadValidRepositoriesForOwner(organization).done();
            }
            self.contentController = self._repositoriesContents[organization.login];
        }
    },

    updateRepositories: {
        value: function() {
            var owner = this._selectedOrganization;
            this._repositoriesContents[owner.login].content.clear();
            return this._loadValidRepositoriesForOwner(owner);
        }
    },

    _loadValidRepositoriesForOwner: {
        value: function (owner) {
            var self = this;

            self.processedRepositories = 0;
            self._repositoriesCount = 0;

            var parameters = {};
            if (owner.constructor === GithubUser) {
                parameters.affiliation = "owner";
            } else if (owner.constructor === ContributingUser) {
                parameters.affiliation = "collaborator";
            } else {
                parameters.org = owner.login;
            }
            return application.service.fetchData(GithubRepository, {
                parameters: parameters
            }).then(function (repositories) {
                self.repositoriesCount += repositories.length;
                var filterRepositories = repositories.map(function (repository) {
                    return self._isRepositoryValid(repository)
                        .then(function (isValid) {
                            if (isValid) {
                                self._repositoriesContents[owner.login].add(repository);
                            }
                            ++self.processedRepositories;
                        });
                });
                return Promise.all(filterRepositories);
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
                        return repositoryController.getParent()
                            .then(function (parent) {
                                if (parent) {
                                    repo.parent = parent;
                                }
                                return isValid;
                            });
                    }
                    return isValid;
                });
        }
    }
});


exports.repositoriesController = new RepositoriesController();
