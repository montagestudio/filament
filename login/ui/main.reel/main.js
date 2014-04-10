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

    needsTutorial: {
        value: true
    },

    enterDocument: {
        value: function (firstTime) {
            if (!firstTime) {
                return;
            }

            if (localStorage) {
                var needsTutorial = JSON.parse(localStorage.getItem("needsTutorial"));

                if (null === needsTutorial) {
                    localStorage.setItem("needsTutorial", true);
                    needsTutorial = true;
                }

                this.needsTutorial = needsTutorial;
            }
        }
    }
});
