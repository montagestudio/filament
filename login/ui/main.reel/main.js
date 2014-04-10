/**
 * @module ./main.reel
 * @requires montage/ui/component
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
        }
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            if (localStorage && JSON.parse(localStorage.getItem("needsTutorial")) === null) {
                localStorage.setItem("needsTutorial", true);
            }
        }
    }
});
