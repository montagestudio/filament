var PackageTools = require("../../../extensions/package-manager.filament-extension/core/package-tools").ToolsBox;

describe("package-tools", function () {

    it("email validation.", function() {

        expect(PackageTools.isEmailValid('pierre@declarativ.com')).toEqual(true);
        expect(PackageTools.isEmailValid('pierre.frisch@declarativ.com')).toEqual(true);
        expect(PackageTools.isEmailValid('pierre+frisch@declarativ.com')).toEqual(true);
        expect(PackageTools.isEmailValid('pierredeclarativ.com')).toEqual(false);
        expect(PackageTools.isEmailValid('pierre.frisch @declarativ.com')).toEqual(false);
        expect(PackageTools.isEmailValid('pierre@declarativ.com')).toEqual(true);
        expect(PackageTools.isEmailValid('pierre.frisch@declarativ.c')).toEqual(false);
        expect(PackageTools.isEmailValid({})).toEqual(false);
    });

    it("should able to get package's name from a git url.", function() {

        expect(PackageTools.findModuleNameFormGitUrl('git://git@github.com:declarativ/palette.git')).toEqual('palette');
        expect(PackageTools.findModuleNameFormGitUrl('git+ssh://git@github.com:declarativ/palet te.git')).toBeUndefined();
        expect(PackageTools.findModuleNameFormGitUrl('git+ssh://git@github.com:declarativ/.git')).toBeUndefined();
        expect(PackageTools.findModuleNameFormGitUrl('http://git@github.com:declarativ/palette.git')).toBeUndefined();
        expect(PackageTools.findModuleNameFormGitUrl('git+http://git@github.com/declarativ/p.git')).toEqual('p');
        expect(PackageTools.findModuleNameFormGitUrl('git+http://github.com/declarativ/.palette.git')).toBeUndefined();
        expect(PackageTools.findModuleNameFormGitUrl('git+https://git@github.com/declarativ/palette.git#445')).toEqual('palette');
        expect(PackageTools.findModuleNameFormGitUrl('git://git@github.com:declarativ/palette.git#93930#')).toBeUndefined();
    });

    describe("url Validation:", function () {
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

    describe("person Validation:", function () {

        it("getValidPerson function should returns a valid Person Object or null", function() {

            expect(PackageTools.getValidPerson('hello_world')).toBeNull();
            expect(PackageTools.getValidPerson({})).toBeNull();
            expect(PackageTools.getValidPerson({age: 33})).toBeNull();
            expect(PackageTools.getValidPerson({name: 'bill'})).not.toBeNull();
            expect(PackageTools.getValidPerson({name: 'a'})).not.toBeNull();
            expect(PackageTools.getValidPerson({name: 4})).toBeNull();
            expect(PackageTools.getValidPerson({name: ''})).not.toBeNull();
        });

    });

    describe("person Cleaning:", function () {
        var personNotValid;

        beforeEach(function() {
            personNotValid = {
                name: 'steve',
                url: 'stevecom',
                email: 4,
                age: ''
            };
        });

        it("whether contains url or email should be valid.", function() {

            expect(PackageTools.getValidPerson(personNotValid).url).toEqual('');
            expect(PackageTools.getValidPerson(personNotValid).email).toEqual('');
        });

        it("should contain just allowed properties, which are: 'name', 'url' and 'email.", function() {

            expect(PackageTools.getValidPerson(personNotValid).name).not.toBeUndefined();
            expect(PackageTools.getValidPerson(personNotValid).url).not.toBeUndefined();
            expect(PackageTools.getValidPerson(personNotValid).email).not.toBeUndefined();
            expect(PackageTools.getValidPerson(personNotValid).age).toBeUndefined();
        });

    });

});
