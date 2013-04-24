var Montage = require("montage").Montage;
var LibraryItem = require("filament-extension/core/library-item").LibraryItem;

//TODO assets like the icons for use in library items should be versioned with the extensions themselves
//TODO each extension really should be its own package, anticipate consuming extensions from elsewhere
var packageLocation = require.location;

var RssControllerLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "ng-rss/rss-controller"
        }
    },

    name: {
        value: "RSS Controller"
    },

    label: {
        value: "RSS Controller"
    },

    icon: {
        value: packageLocation + "assets/rss-controller.png"
    }
});

var RssViewLibraryItem = Montage.create(LibraryItem, {

    serialization: {
        value: {
            "prototype": "ng-rss/ui/rss-view.reel",
            "properties": {
                "element": {"#": "rssView"}
            }
        }
    },

    name: {
        value: "RSS View"
    },

    label: {
        value: "RSS View"
    },

    icon: {
        value: packageLocation + "assets/rss-view.png"
    },

    html: {
        value: '<div data-montage-id="rssView" class="rssDemo-Main-rssView"></div>'
    }

});

exports.libraryItems = {
    "ng-rss/ui/rss-view.reel": RssViewLibraryItem,
};

exports.libraryAdditions = [RssControllerLibraryItem];
