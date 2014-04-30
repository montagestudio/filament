/**
 * @module ui/status.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Status
 * @extends Component
 */
exports.Status = Component.specialize(/** @lends Status# */ {
    constructor: {
        value: function Status() {
            this.super();
            this.badTags = ["minor", "major"];
        }
    },

    init: {
        value: function (options) {
            this.siteUrl = options.siteUrl;
            this.apiKey = options.apiKey;
            this.badTags = options.badTags || this.badTags;
            this.interval = options.interval || this.interval;

            this.url = this.URL.replace("{siteUrl}", options.siteUrl).replace("{apiKey}", options.apiKey);
        }
    },

    URL: {
        value: window.location.protocol + "//api.tumblr.com/v2/blog/{siteUrl}/posts?api_key={apiKey}&limit=1&filter=text"
    },

    _siteUrl: {
        value: null
    },
    siteUrl: {
        get: function() {
            return this._siteUrl;
        },
        set: function(value) {
            if (this._siteUrl === value) {
                return;
            }
            this._siteUrl = value;
            this.url = this.URL.replace("{siteUrl}", this._siteUrl).replace("{apiKey}", this._apiKey);
        }
    },

    _apiKey: {
        value: null
    },
    apiKey: {
        get: function() {
            return this._apiKey;
        },
        set: function(value) {
            if (this._apiKey === value) {
                return;
            }
            this._apiKey = value;
            this.url = this.URL.replace("{siteUrl}", this._siteUrl).replace("{apiKey}", this._apiKey);
        }
    },

    badTags: {
        value: null
    },

    /**
     * How often to check for new statuses in milliseconds
     * @type {number}
     */
    interval: {
        value: 15 * 60 * 1000
    },

    /**
     * How recent a status update must be to be shown in milliseconds
     * @type {number}
     */
    recency: {
        value: 60 * 60 * 1000
    },

    _timeout: {
        value: null
    },

    _random: {
        value: function () {
            return Math.random().toString(16).slice(2, 8) + "" + Math.random().toString(16).slice(2, 8);
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }
            this.check();
        }
    },

    check: {
        value: function () {
            var self = this;

            this._timeout = null;

            // generate unique function name
            var callbackName = "statusCallback" + this._random();
            // make global function named function name
            window[callbackName] = function (data) {
                // remove script tag
                window.document.head.removeChild(script);
                // delete global function
                delete window[callbackName];

                self._timeout = setTimeout(self.check.bind(self), self.interval);

                self.handleResponse(data);
            };

            // make request to url with callback function name
            var script = window.document.createElement("script");
            script.src = this.url + "&callback=" + callbackName;
            window.document.head.appendChild(script);
        }
    },

    stopChecking: {
        value: function () {
            clearTimeout(this._timeout);
        }
    },

    show: {
        value: function (post) {
            this.post = post;
            this.classList.addEach(post.tags.map(function (tag) { return "Status--" + tag; }));
            this.isVisible = true;
        }
    },

    hide: {
        value: function () {
            this.isVisible = false;
            this.classList.deleteEach(this.post.tags.map(function (tag) { return "Status--" + tag; }));
            this.post = null;
        }
    },

    handleResponse: {
        value: function (data) {
            // TODO setTimeout regardless of error
            if (!data || !data.meta || !data.meta.status || data.meta.status !== 200 || !data.response) {
                throw new Error("Could not load status: " + JSON.stringify(data));
            }
            if (!data.response.posts || !data.response.posts.length) {
                throw new Error("No status posts");
            }
            var post = data.response.posts[0];

            // post.updated is in seconds
            var timestamp = post.timestamp * 1000;
            if (timestamp < (Date.now() - this.recency)) {
                return;
            }

            // if post has any of the bad tags call given callback
            var tags = post.tags;
            var isGood = this.badTags.every(function (badTag) {
                return tags.indexOf(badTag) === -1;
            });

            if (!isGood) {
                this.show(post);
            }
        }
    },

    handleRefreshAction: {
        value: function (event) {
            this.stopChecking();
            this.check();
        }
    },

    handleCloseAction: {
        value: function (event) {
            this.hide();
        }
    }

});
