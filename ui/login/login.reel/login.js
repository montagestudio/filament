/**
 * @requires montage/ui/component
 */
var Component = require("montage/ui/component").Component;

/**
 * @class Login
 * @extends Component
 */
exports.Login = Component.specialize(/** @lends Login# */ {

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
    },

    handleLoginButtonAction: {
        value: function () {
            window.location = window.location.protocol + "//auth." + window.location.host + "/github";
        }
    }
});
