var Montage = require("montage").Montage;
var LibraryItem = require("filament-extension/core/library-item.js").LibraryItem;

//TODO assets like the icons for use in library items should be versioned with the extensions themselves
//TODO each extension really should be its own package, anticipate consuming extensions from elsewhere
var packageLocation = require.location;

//TODO build this automatically
exports.libraryItems = {
    "native/ui/anchor.reel": null,
    "native/ui/button.reel": null,
    "native/ui/image.reel": null,
    "native/ui/input-checkbox.reel": null,
    "native/ui/input-date.reel": null,
    "native/ui/input-number.reel": null,
    "native/ui/input-radio.reel": null,
    "native/ui/input-range.reel": null,
    "native/ui/input-text.reel": null,
    "native/ui/progress.reel": null,
    "native/ui/select.reel": null,
    "native/ui/textarea.reel": null
};

exports.libraryAdditions = [];
