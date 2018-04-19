/**
 * @module ui/main.reel
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Main
 * @extends Component
 */
exports.Main = Component.specialize(/** @lends Main# */ {
    constructor: {
        value: function Main() {
            this.super();

            this.application.router = this;
            window.addEventListener("popstate", this.handleLocationChange.bind(this));
            this.location = window.location.href;
        }
    },


    isProjectOpen: {
        value: undefined
    },

    location: {
        set: function (location) {
            window.history.pushState({}, location, location);
            this.handleLocationChange();
        }
    },


    handleLocationChange: {
        value: function () {
            var pathname = window.location.pathname;
            if (pathname.split("/").length === 3) {
                // --> /owner/repo
                this.isProjectOpen = true;
            } else {
                // --> /
                this.isProjectOpen = false;
            }
        }
    }
});
