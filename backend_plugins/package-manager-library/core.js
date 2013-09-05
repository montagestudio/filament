var PackageManagerError = function (message, code) {
    this.name = "PackageManagerError";
    this.message = message;
    this.code = code;
};

PackageManagerError.prototype = new Error();

exports.PackageManagerError = PackageManagerError;
