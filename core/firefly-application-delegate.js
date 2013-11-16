var ApplicationDelegate = require("./application-delegate").ApplicationDelegate;

exports.FireflyApplicationDelegate = ApplicationDelegate.specialize({

    constructor: {
        value: function ApplicationDelegate () {
            this.super();
        }
    }

});
