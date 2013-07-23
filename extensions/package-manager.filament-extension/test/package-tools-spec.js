var PackageTools = require("../../../extensions/package-manager.filament-extension/core/package-tools").PackageTools;

describe("package-tools", function () {

    describe("name validation", function () {

        it("should not begins with a dot or an underscore", function() {

            expect(PackageTools.isNameValid('_hello_world')).toEqual(false);
            expect(PackageTools.isNameValid('.hello_world')).toEqual(false);
        });

        it("should not be node or js", function() {

            expect(PackageTools.isNameValid('node')).toEqual(false);
            expect(PackageTools.isNameValid('NODE')).toEqual(false);
            expect(PackageTools.isNameValid('NoDe')).toEqual(false);
            expect(PackageTools.isNameValid('JS')).toEqual(false);
            expect(PackageTools.isNameValid('js')).toEqual(false);
            expect(PackageTools.isNameValid('leet')).toEqual(true);
        });

        it("can contains these characters: _ - . ~", function() {

            expect(PackageTools.isNameValid('hello_world___')).toEqual(true);
            expect(PackageTools.isNameValid('mike--')).toEqual(true);
            expect(PackageTools.isNameValid('benoit.marchant..')).toEqual(true);
            expect(PackageTools.isNameValid('~francois~~')).toEqual(true);
            expect(PackageTools.isNameValid('a-~_.b--~~_..')).toEqual(true);
            expect(PackageTools.isNameValid('a!#@+=')).toEqual(false);
        });

        it("can contains number", function() {

            expect(PackageTools.isNameValid('hello_world_42')).toEqual(true);
            expect(PackageTools.isNameValid('13h37')).toEqual(true);
            expect(PackageTools.isNameValid('v1.2.3')).toEqual(true);
        });

        it("should have at least one character", function() {

            expect(PackageTools.isNameValid('')).toEqual(false);
            expect(PackageTools.isNameValid('a')).toEqual(true);
        });

        it("should contains just characters from the Unicode block (Basic Latin)", function() {

            expect(PackageTools.isNameValid('jean-françois')).toEqual(false);
            expect(PackageTools.isNameValid('你好')).toEqual(false);
            expect(PackageTools.isNameValid('€')).toEqual(false);
        });

    });

    describe("version validation", function () {

        it("should respect at least this format: [number].[number].[number]", function() {

            expect(PackageTools.isVersionValid('1.2.3')).toEqual(true);
            expect(PackageTools.isVersionValid('1.2.x')).toEqual(false);
            expect(PackageTools.isVersionValid('1.2')).toEqual(false);
            expect(PackageTools.isVersionValid('1.')).toEqual(false);
            expect(PackageTools.isVersionValid('1')).toEqual(false);
            expect(PackageTools.isVersionValid('x.x.x')).toEqual(false);
            expect(PackageTools.isVersionValid('a.b.c')).toEqual(false);
        });

        it("can begins with the character v", function() {

            expect(PackageTools.isVersionValid('v1.2.3')).toEqual(true);
            expect(PackageTools.isVersionValid('t1.2.3')).toEqual(false);
        });

        it("can have a valid tag", function() {

            expect(PackageTools.isVersionValid('v1.2.3-alpha')).toEqual(true);
            expect(PackageTools.isVersionValid('v1.2.3-pre-')).toEqual(false);
            expect(PackageTools.isVersionValid('v1.2.3-pre-release')).toEqual(true);
            expect(PackageTools.isVersionValid('v1.2.3-hello')).toEqual(true);
            expect(PackageTools.isVersionValid('v1.2.3+alpha')).toEqual(false);
            expect(PackageTools.isVersionValid('v1.2.3-alpha$%')).toEqual(false);
            expect(PackageTools.isVersionValid('v1.2.3-1')).toEqual(true);
            expect(PackageTools.isVersionValid('v1.2.3-1-pre-release')).toEqual(true);
        });

    });

    describe("email validation", function () {


    });

    describe("url Validation", function () {
        it("can begins with http://, https://, www.", function() {

            expect(PackageTools.isUrlValid('http://montagejs.com')).toEqual(true);
            expect(PackageTools.isUrlValid('http://www.montagejs.com')).toEqual(true);
            expect(PackageTools.isUrlValid('http://www.montagejs.com/jean')).toEqual(true);

            expect(PackageTools.isUrlValid('htt/www.montagejs.com')).toEqual(false);
            expect(PackageTools.isUrlValid('httpwww.montagejs.com')).toEqual(true);

            expect(PackageTools.isUrlValid('https://montagejs.com')).toEqual(true);
            expect(PackageTools.isUrlValid('https://www.montagejs.com')).toEqual(true);
            expect(PackageTools.isUrlValid('ww.montagejs.com')).toEqual(true);
            expect(PackageTools.isUrlValid('montagejs.com')).toEqual(true);
        });

    });

    describe("person Validation", function () {

        it("should be an object and have at least a property called 'name', which should be a string and not empty ", function() {

            expect(PackageTools.getValidPerson('hello_world')).toBeNull();
            expect(PackageTools.getValidPerson({})).toBeNull();
            expect(PackageTools.getValidPerson({age: 33})).toBeNull();
            expect(PackageTools.getValidPerson({name: 'bill'})).not.toBeNull();
            expect(PackageTools.getValidPerson({name: 'a'})).not.toBeNull();
            expect(PackageTools.getValidPerson({name: 4})).toBeNull();
            expect(PackageTools.getValidPerson({name: ''})).toBeNull();
        });

    });

    describe("person Cleaning", function () {
        var personNotValid;

        beforeEach(function() {
            personNotValid = {
                name: 'steve',
                url: 'stevecom',
                email: 4,
                age: ''
            };
        });

        it("whether contains url or email should be valid", function() {

            expect(PackageTools.getValidPerson(personNotValid).url).toEqual('');
            expect(PackageTools.getValidPerson(personNotValid).email).toEqual('');
        });

        it("should contain just allowed properties, which are: 'name', 'url' and 'email", function() {

            expect(PackageTools.getValidPerson(personNotValid).name).not.toBeUndefined();
            expect(PackageTools.getValidPerson(personNotValid).url).not.toBeUndefined();
            expect(PackageTools.getValidPerson(personNotValid).email).not.toBeUndefined();
            expect(PackageTools.getValidPerson(personNotValid).age).toBeUndefined();
        });

    });

});
