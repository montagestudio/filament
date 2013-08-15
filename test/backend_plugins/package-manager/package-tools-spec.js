var PackageTools = require("../../../backend_plugins/package-manager-library/package-manager-tools").PackageManagerTools;

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
            expect(PackageTools.isRequestValid(42)).toEqual(false);
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
            expect(PackageTools.isRequestValid(42)).toEqual(false);
        });

        it("can begin with the character v", function() {

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


    describe("request format", function () {

        it("should respect the following format: name[@version]", function() {

            expect(PackageTools.isRequestValid('montage@1.2.3')).toEqual(true);
            expect(PackageTools.isRequestValid('montage@1.2.')).toEqual(false);
            expect(PackageTools.isRequestValid('montage@')).toEqual(false);
            expect(PackageTools.isRequestValid('montage@@')).toEqual(false);
            expect(PackageTools.isRequestValid('montage@montage')).toEqual(false);
            expect(PackageTools.isRequestValid('montage@1.2.3@montage')).toEqual(false);
            expect(PackageTools.isRequestValid('montage')).toEqual(true);
            expect(PackageTools.isRequestValid('   ')).toEqual(false);
            expect(PackageTools.isRequestValid('  montage@1.2.3 ')).toEqual(false);
            expect(PackageTools.isRequestValid('@')).toEqual(false);
            expect(PackageTools.isRequestValid(42)).toEqual(false);
        });

        it("should accept valid git urls", function() {

            expect(PackageTools.isRequestValid('git://git@github.com:declarativ/palette.git')).toEqual(true);
            expect(PackageTools.isRequestValid('git+ssh://git@github.com:declarativ/palette.git')).toEqual(true);
            expect(PackageTools.isRequestValid('git+ssh://git@github.com:declarativ/.git')).toEqual(false);
            expect(PackageTools.isRequestValid('git+http://github.com:declarativ/palette.git')).toEqual(true);
            expect(PackageTools.isRequestValid('git+https://git@github.com:declarativ/palette.git#445')).toEqual(true);
            expect(PackageTools.isRequestValid('git+ftp://git@github.com:declarativ/palette.git')).toEqual(false);
            expect(PackageTools.isRequestValid('git://git@github.com:declarativ/palette.git#93930#')).toEqual(false);
        });

    });

    describe("getting a Module Object", function () {

        it("from the following format: name[@version]", function() {
            var montage = PackageTools.getModuleFromString('montage@1.2.3'),
                filament = PackageTools.getModuleFromString('filament@'),
                wrongModuleName = PackageTools.getModuleFromString('.filament@1.2.3'),
                emptyModule = PackageTools.getModuleFromString('@'),
                falselyModule = PackageTools.getModuleFromString(45);

            expect(montage.name).toEqual('montage');
            expect(montage.version).toEqual('1.2.3');

            expect(filament.name).toEqual('filament');
            expect(filament.version).toBeNull();

            expect(emptyModule.name).toBeNull();
            expect(emptyModule.version).toBeNull();

            expect(falselyModule).toBeNull();

            expect(wrongModuleName.name).toBeNull();
            expect(wrongModuleName.version).toBeNull();
        });

    });

    describe("person format", function () {

        it("should format correctly a string into an object, which respect the following format: 'name <email> (url)'", function() {
            var person = PackageTools.formatPersonFromString('pierre frisch <pierre.frisch@declarativ.com> (montage.com)');

            expect(person.name).toEqual('pierre frisch');
            expect(person.email).toEqual('pierre.frisch@declarativ.com');
            expect(person.url).toEqual('montage.com');
        });

    });

    describe("person containers", function () {
        var containerArray;

        beforeEach(function() {
            containerArray = [
                'bob <bob@declarativ.com> (declarativ.com)',
                {
                    name: 'bob',
                    email: 'bob@declarativ.com',
                    url: 'declarativ.com'
                },
                9
            ];
        });

        it("should format correctly a set of persons", function() {
            var containerFormatted = PackageTools.formatPersonsContainer(containerArray);

            for (var i = 0, length = containerFormatted.length; i < length; i++) {
                expect(containerFormatted[0].name).toEqual('bob');
                expect(containerFormatted[0].email).toEqual('bob@declarativ.com');
                expect(containerFormatted[0].url).toEqual('declarativ.com');
            }
        });

        it("should remove wrong person format", function() {
            containerArray.push(true);
            containerArray.push({});

            var containerFormatted = PackageTools.formatPersonsContainer(containerArray);

            for (var i = 0, length = containerFormatted.length; i < length; i++) {
                expect(containerFormatted.length).toEqual(2);
            }
        });

    });

});
