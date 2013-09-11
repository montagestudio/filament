var Bindings = require("montage/core/bindings").Bindings;
var SideDataConverter = require("core/side-data-converter").SideDataConverter;

describe("core/side-data-converter-spec", function () {
    var converter;

    beforeEach(function () {
        converter = new SideDataConverter();
    });

    it("returns null for falsey input", function () {
        expect(converter.convert(void 0)).toBe(null);
        expect(converter.convert(null)).toBe(null);
    });

    it("returns an object", function () {
        var input = {};
        var output = converter.convert(input);
        expect(output).toEqual({});
        expect(output).not.toBe(input);
    });

    it("returns different objects for different inputs", function () {
        expect(converter.convert({})).not.toBe(converter.convert({}));
    });

    it("returns the same object for the same input", function () {
        var object = {};
        expect(converter.convert(object)).toBe(converter.convert(object));
    });

    it("can be used in a binding", function () {
        var a = {}, b = {};
        var object = {
            "in": a
        };
        Bindings.defineBinding(object, "out", {"<-": "in", converter: converter});
        var aOut = object.out;
        expect(aOut).toEqual({});
        expect(aOut).not.toBe(a);

        object.in = b;
        var bOut = object.out;
        expect(bOut).toEqual({});
        expect(bOut).not.toBe(a);
        expect(bOut).not.toBe(aOut);
    });
});
