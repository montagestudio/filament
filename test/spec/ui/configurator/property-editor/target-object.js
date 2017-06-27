var Montage = require("montage").Montage;

exports.TargetObject = Montage.specialize({

    propertyA: {
        value: "foo"
    },

    propertyB: {
        value: "bar"
    },

    customPropertyA: {
        value: "baz"
    },

    customPropertyB: {
        value: "ban"
    },

    blueprintModuleId:require("montage")._blueprintModuleIdDescriptor,

    blueprint:require("montage")._blueprintDescriptor

});

