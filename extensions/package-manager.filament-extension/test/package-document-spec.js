var PackageDocument = require("../../../extensions/package-manager.filament-extension/core/package-document").PackageDocument,
    DependencyNames = require("../../../extensions/package-manager.filament-extension/core/package-tools").DependencyNames,
    Promise = require("montage/core/promise").Promise;

describe("package document", function () {
    var packageDocument;

    beforeEach(function() {
        packageDocument = PackageDocument.create();
        packageDocument._package = {
            dependencies: {},
            devDependencies:{}
        };
        packageDocument._livePackage = {};
        packageDocument._dependencyCollection = {
            dependencies: [
                {
                    name: 'montage',
                    version: '1.2.2'
                },
                {
                    name: 'digit',
                    version: '1.2.2'
                }
            ],
            devDependencies: [
                {
                    name: 'montage-testing',
                    version: '1.2.3'
                }
            ]
        };
        packageDocument.sharedProjectController = {
            environmentBridge: {
                save: function () {
                    return Promise();
                }
            },

            packageDescription: {
                name: null
            }
        };
    });

    it('should be able to save a valid package name value.', function () {

        expect(packageDocument.setProperty('name', 'MyApp')).toEqual(true);
        expect(packageDocument.name).toEqual('MyApp');
    });

    it('should reject a invalid package version value.', function () {

        expect(packageDocument.setProperty('name', '.MyApp')).toEqual(false);
    });

    it('should be able to save a valid package version value.', function () {

        expect(packageDocument.setProperty('version', '1.2.3')).toEqual(true);
        expect(packageDocument.version).toEqual('1.2.3');
    });

    it('should reject a invalid package version value.', function () {

        expect(packageDocument.setProperty('version', '#1.2.3')).toEqual(false);

        expect(packageDocument.setProperty('version', '')).toEqual(false);
    });

    it('should be able to save a valid package private value.', function () {

        expect(packageDocument.setProperty('private', true)).toEqual(true);
        expect(packageDocument.private).toEqual(true);
    });

    it('should reject a invalid package private value.', function () {

        expect(packageDocument.setProperty('private', null)).toEqual(false);
    });

    it('should be able to save a valid package license value.', function () {

        expect(packageDocument.setProperty('license', 'mit')).toEqual(true);
        expect(packageDocument.license).toEqual('mit');
    });

    it('should reject a invalid package license value.', function () {

        expect(packageDocument.setProperty('license', 1)).toEqual(false);
    });

    it('should be able to save a valid package author value.', function () {

        packageDocument.setProperty('author', {
            name: 'bob',
            url: 'bob@declarativ.com',
            email: 'declarativ.com',
            extraneous: 'test'
        });

        expect(packageDocument.author.name).toEqual('bob');
        expect(packageDocument.author.extraneous).not.toBeDefined();
    });

    it('should reject a invalid package author value.', function () {

        expect(packageDocument.setProperty('author', 'bill')).toEqual(false);
    });

    it('should be able to save a valid package description value.', function () {

        expect(packageDocument.setProperty('description', 'hello world')).toEqual(true);
        expect(packageDocument.description).toEqual('hello world');
    });

    it('should reject a invalid package description value.', function () {

        expect(packageDocument.setProperty('description', {})).toEqual(false);
    });

    it('should be able to add a maintainer and remove it.', function () {
        var bob = {
            name: 'bob',
            email: 'bob@declarativ.com',
            url: 'declarativ.com'
        };

        packageDocument.addMaintainer(bob);

        expect(packageDocument.maintainers.length).toEqual(1);
        expect(packageDocument.removeMaintainer(bob)).toEqual(true);
        expect(packageDocument.maintainers.length).toEqual(0);
    });

    it('should be able to find a dependency.', function () {
        var digit = packageDocument.findDependency('digit'),
            montage = packageDocument.findDependency('montage', DependencyNames.dev),
            montageTestingIndex = packageDocument.findDependency('montage-testing', DependencyNames.dev, true);

        expect(digit.name).toEqual('digit');
        expect(montage).toEqual(null);
        expect(montage).toEqual(null);
        expect(packageDocument.dependencyCollection.devDependencies[montageTestingIndex].name).toEqual('montage-testing');

        packageDocument.findDependency('montage', DependencyNames.regular, function (index, element) {
            expect(index).toBeGreaterThan(-1);
            expect(element.name).toEqual('montage');
        });
    });

    it('Should be able to add a dependency according to its type.', function () {
        var oldLength = packageDocument.dependencyCollection.dependencies.length;
        packageDocument._addDependencyToCollection({
            name: 'joey',
            version: '1.2.3'
        });

        expect(packageDocument.dependencyCollection.dependencies.length).toBeGreaterThan(oldLength);
        expect(packageDocument.dependencyCollection.dependencies[
            packageDocument.findDependency('joey', DependencyNames.regular, true)
            ].name).toEqual('joey');

        oldLength = packageDocument.dependencyCollection.devDependencies.length;

        packageDocument._addDependencyToCollection({
            name: 'matte',
            version: '1.2.3',
            type: DependencyNames.dev
        });

        expect(packageDocument.dependencyCollection.devDependencies.length).toBeGreaterThan(oldLength);

        packageDocument._addDependencyToCollection({ // should remove the previous dependency from the 'devDependencies' container and add it to the 'dependencies' one.
            name: 'matte',
            version: '1.2.3',
            type: DependencyNames.regular
        });

        expect(packageDocument.dependencyCollection.devDependencies.length).toEqual(oldLength);
        expect(packageDocument.findDependency('matte', DependencyNames.regular)).toBeDefined();
        expect(packageDocument.findDependency('matte', DependencyNames.dev)).toEqual(null);
    });

    it('Should be able to remove a dependency from the dependency collection', function () {
        packageDocument._addDependencyToCollection({
            name: 'joey',
            version: '1.2.3',
            type: DependencyNames.regular
        });

        var oldLength = Object.keys(packageDocument.dependencyCollection.dependencies).length;
        packageDocument._removeDependencyFromCollection('joey');

        expect(Object.keys(packageDocument.dependencyCollection.dependencies).length).toBeLessThan(oldLength);
    });

});
