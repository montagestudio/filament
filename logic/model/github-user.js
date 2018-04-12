var Montage = require("montage/core/core").Montage;

exports.GithubUser = Montage.specialize({
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

    type: {
        value: null
    }
});
