var Montage = require("montage").Montage,
    application = require("montage/core/application").application,
    GithubUser = require("logic/model/github-user").GithubUser;

exports.UserController = Montage.specialize({

    init: {
        value: function () {
            return this;
        }
    },

    _user: {
        value: null
    },

    user: {
        get: function () {
            if (!this._user) {
                this.getUser().done();
            }

            return this._user;
        }
    },

    getUser: {
        value: function () {
            if (!this._getUserPromise) {
                var self = this;
                this._getUserPromise = application.service.fetchData(GithubUser)
                    .then(function (data) {
                        var user = data[0];
                        self.dispatchBeforeOwnPropertyChange("user", self._user);
                        self._user = user;
                        self.dispatchOwnPropertyChange("user", self._user);
                        return user;
                    });
            }

            return this._getUserPromise;
        }
    }
});
