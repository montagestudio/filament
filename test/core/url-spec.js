var Url = require("filament/core/url");

describe("core/url-spec", function () {

    describe("toModuleId", function () {

        it("throws an error when the url isn't in the package", function () {
            expect(function () {
                Url.toModuleId("fs://localhost/module", "fs://localhost/package/");
            }).toThrow(
                new Error("URL fs://localhost/module must be in package fs://localhost/package/ to be converted to a module ID")
            );
        });

        it("converts to a module ID", function () {
            expect(
                Url.toModuleId( "fs://localhost/package/module", "fs://localhost/package/")
            ).toEqual("module");
        });

        it("removes .js suffix", function () {
            expect(
                Url.toModuleId("fs://localhost/package/module.js", "fs://localhost/package/")
            ).toEqual("module");
        });

        it("removes trailing slash (for directories)", function () {
            expect(
                Url.toModuleId("fs://localhost/package/module/", "fs://localhost/package/")
            ).toEqual("module");
        });

        it("does not remove .js suffix from directory", function () {
            expect(
                Url.toModuleId("fs://localhost/package/module.js/", "fs://localhost/package/")
            ).toEqual("module.js");
        });

        it("handles a package URL without a trailing slash", function () {
            expect(
                Url.toModuleId("fs://localhost/package/module", "fs://localhost/package")
            ).toEqual("module");
        });

    });

});
