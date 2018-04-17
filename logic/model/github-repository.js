var Montage = require("montage/core/core").Montage;

exports.GithubRepository = Montage.specialize({

    name: {
        value: null
    },

    description: {
        value: null
    },

    homepage: {
        value: null
    },

    private: {
        value: false
    },

    hasIssues: {
        value: true
    },

    hasDownloads: {
        value: true
    },

    teamId: {
        value: null
    },

    autoInit: {
        value: false
    },

    gitignoreTemplate: {
        value: null
    },

    constructor: {
        value: function GithubRepository() {
            this.description = "";
            this.homepage = "";
        }
    },

    pushedAtInSeconds: {
        get: function () {
            return +new Date(this.pushedAt);
        }
    }

});
