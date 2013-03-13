var Montage = require("montage").Montage;
var Component = require("montage/ui/component").Component;

exports.Tree = Montage.create(Component, {

    treeController: {
        value: null
    }

});
