var JsValidatorService = require("../../core/services/js-validator").JsValidatorService,
    Q = require("q");

describe("services/js-validator", function() {
    var documentMock;
    beforeEach(function() {
        documentMock = {
            codeMirrorDocument: null
        };
    });

    it("should mark correct code as valid", function() {
        var document = {
            codeMirrorDocument: {
                getValue: function() {
                    return "\
                    var x = 'FOO';\
                    var y = 42;\
                    console.log(x, y);";
                }
            }
        };
        var service = new JsValidatorService();
        service._clearMarks = function() { };
        service._processValidDocument = function() { this._document.isValid = true; };
        service._processInvalidDocument = function() { this._document.isValid = false; };

        var error = service.validate(document);

        expect(error).toBeUndefined();
    });

    it("should find errors in invalid code", function() {
        var document = {
            codeMirrorDocument: {
                getValue: function() {
                    return "\
                    var x = FOO;\
                    var y = 42*'baz';\
                    cons ole.log(x, y);";
                }
            }
        };
        var service = new JsValidatorService();
        service._clearMarks = function() { };
        service._processValidDocument = function() { this._document.isValid = true; };
        service._processInvalidDocument = function() { this._document.isValid = false; };

        var error = service.validate(document);

        expect(error).not.toBeUndefined();
    });
});