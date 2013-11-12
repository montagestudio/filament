var Montage = require("montage").Montage,
    Component = require("montage/ui/component").Component;

exports.Abc = Montage.create(Component, {
    value: {
        value: "fail"
    }
});
