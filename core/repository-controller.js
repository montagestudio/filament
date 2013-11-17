var Montage = require("montage").Montage;
var Promise = require("montage/core/promise").Promise;

exports.RepositoryController = Montage.specialize({
    API_URL: {
        value: window.location.origin
    },

    owner: {
        value: null
    },

    repo: {
        value: null
    },

    constructor: {
        value: function RepositoryController() {

        }
    },

    init: {
        value: function(owner, repo) {
            this.owner = owner;
            this.repo = repo;

            return this;
        }
    },

    initializeRepositoryWorkspace: {
        value: function() {
            return this._request({
                method: "POST",
                url: "/" + this.owner + "/" + this.repo + "/init"
            });
        }
    },

    _request: {
        value: function(request) {
            var xhr = new XMLHttpRequest(),
                deferred = Promise.defer();

            xhr.open(request.method, this.API_URL + request.url);
            xhr.addEventListener("load", function() {
                var message;

                if (xhr.status >= 200 && xhr.status < 300) {
                    if (xhr.responseText) {
                        try {
                            message = JSON.parse(xhr.responseText);
                        } catch (ex) {
                            deferred.reject(ex.message);
                        }
                    }
                    deferred.resolve(message);
                } else {
                    deferred.reject(xhr);
                }
            }, false);
            xhr.addEventListener("error", function() {
                deferred.reject(xhr);
            }, false);

            if (request.data) {
                xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                xhr.send(JSON.stringify(request.data));
            } else {
                xhr.send();
            }

            return deferred.promise;
        }
    }
});