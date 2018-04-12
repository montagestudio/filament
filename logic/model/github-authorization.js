var Montage = require("montage/core/core").Montage;

/**
 * @class GithubAuthorization
 * @extends Montage
 */
exports.GithubAuthorization = Montage.specialize(/** @lends GithubAuthorization.prototype */ {

    profile: {
        value: undefined
    },

    token: {
        value: undefined
    }
});
