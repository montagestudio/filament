var IntermediateInheritor = function() {};


function ValidationError() {
    var tmp = Error.apply(this, arguments);
    tmp.name = this.name = "ValidationError";
    this.stack = tmp.stack;
    this.message = tmp.message;
    return this;
}

IntermediateInheritor.prototype = Error.prototype;
ValidationError.prototype = new IntermediateInheritor();


function NotModifiedError() {
    var tmp = Error.apply(this, arguments);
    tmp.name = this.name = "NotModifiedError";
    this.stack = tmp.stack;
    this.message = tmp.message;
    return this;
}

IntermediateInheritor.prototype = Error.prototype;
NotModifiedError.prototype = new IntermediateInheritor();


exports.ValidationError = ValidationError;
exports.NotModifiedError = NotModifiedError;
