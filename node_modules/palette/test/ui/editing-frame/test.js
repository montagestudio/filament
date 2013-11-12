var Montage = require("montage").Montage,
    TestController = require("montage-testing/test-controller").TestController;

exports.Test = Montage.create(TestController, {

    editingFrame: {
        value: null
    }

});
