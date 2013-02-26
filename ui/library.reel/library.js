var Montage = require("montage/core/core").Montage,
    Panel = require("ui/panel.reel").Panel;

exports.Library = Montage.create(Panel, {

    groups: {
        value: null
    },

    groupsController: {
        value: null
    }

});
