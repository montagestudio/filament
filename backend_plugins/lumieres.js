var path = require("path"),
    fs = require("fs");

exports.getPlugins = function() {
    var result = [],
        parentPath = path.join(global.clientPath, "plugins");

    if (fs.existsSync(parentPath)) {
        var list = fs.readdirSync(parentPath);

        for (var i in list) {
            var fileName = list[i];
            // For now accept any file that ends with .js
            if (path.extname(fileName).toLowerCase() == ".js") {
                result.push("fs:/" + path.join(parentPath, fileName));
            }
        }
    }

    return result;
};

exports.createApplication = function(url) {
    // TODO: Write me!
    console.log("--- createApplication", url);
    return null;
};