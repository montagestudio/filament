var Component = require("montage/ui/component").Component;

exports.Tree = Component.specialize({

    ignoreRoot: {
        value: false
    },

    expandedPath: {
        value: null
    },

    treeController: {
        value: null
    }

});
