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
        packageDocument._updateDependenciesAfterSaving = function () {};
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
            }
        };
        packageDocument._modificationsAccepted = function () {};
        spyOn(packageDocument, '_modificationsAccepted');
    });

    it('should be able to save a valid package name value.', function () {

        expect(packageDocument.setProperty('name', 'MyApp')).toEqual(true);
        expect(packageDocument._modificationsAccepted).toHaveBeenCalled();
        expect(packageDocument.name).toEqual('MyApp');
    });

    it('should reject a invalid package version value.', function () {

        expect(packageDocument.setProperty('name', '.MyApp')).toEqual(false);
        expect(packageDocument._modificationsAccepted).not.toHaveBeenCalled();
    });

    it('should be able to save a valid package version value.', function () {

        expect(packageDocument.setProperty('version', '1.2.3')).toEqual(true);
        expect(packageDocument._modificationsAccepted).toHaveBeenCalled();
        expect(packageDocument.version).toEqual('1.2.3');
    });

    it('should reject a invalid package version value.', function () {

        expect(packageDocument.setProperty('version', '#1.2.3')).toEqual(false);
        expect(packageDocument._modificationsAccepted).not.toHaveBeenCalled();

        expect(packageDocument.setProperty('version', '')).toEqual(false);
        expect(packageDocument._modificationsAccepted).not.toHaveBeenCalled();
    });

    it('should be able to save a valid package private value.', function () {

        expect(packageDocument.setProperty('private', true)).toEqual(true);
        expect(packageDocument._modificationsAccepted).toHaveBeenCalled();
        expect(packageDocument.private).toEqual(true);
    });

    it('should reject a invalid package private value.', function () {

        expect(packageDocument.setProperty('private', null)).toEqual(false);
        expect(packageDocument._modificationsAccepted).not.toHaveBeenCalled();
    });

    it('should be able to save a valid package license value.', function () {

        expect(packageDocument.setProperty('license', 'mit')).toEqual(true);
        expect(packageDocument._modificationsAccepted).toHaveBeenCalled();
        expect(packageDocument.license).toEqual('mit');
    });

    it('should reject a invalid package license value.', function () {

        expect(packageDocument.setProperty('license', 1)).toEqual(false);
        expect(packageDocument._modificationsAccepted).not.toHaveBeenCalled();
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
        expect(packageDocument._modificationsAccepted).toHaveBeenCalled();
    });

    it('should reject a invalid package author value.', function () {

        expect(packageDocument.setProperty('author', 'bill')).toEqual(false);
        expect(packageDocument._modificationsAccepted).not.toHaveBeenCalled();
    });

    it('should be able to save a valid package description value.', function () {

        expect(packageDocument.setProperty('description', 'hello world')).toEqual(true);
        expect(packageDocument._modificationsAccepted).toHaveBeenCalled();
        expect(packageDocument.description).toEqual('hello world');
    });

    it('should reject a invalid package description value.', function () {

        expect(packageDocument.setProperty('description', {})).toEqual(false);
        expect(packageDocument._modificationsAccepted).not.toHaveBeenCalled();
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
            montage = packageDocument.findDependency('montage', DependencyNames.devDependencies),
            montageTestingIndex = packageDocument.findDependency('montage-testing', DependencyNames.devDependencies, true);

        expect(digit.name).toEqual('digit');
        expect(montage).toEqual(null);
        expect(montage).toEqual(null);
        expect(packageDocument.dependencyCollection.devDependencies[montageTestingIndex].name).toEqual('montage-testing');

        packageDocument.findDependency('montage', DependencyNames.dependencies, function (index, element) {
            expect(index).toBeGreaterThan(-1);
            expect(element.name).toEqual('montage');
        });
    });

    it('Should be able to reset any dependency types.', function () {

        packageDocument._resetDependencies();
        expect(packageDocument.dependencyCollection.dependencies.length).toEqual(0);
    });

    it('Should be able to add a dependency according to its type.', function () {
        var oldLength = packageDocument.dependencyCollection.dependencies.length;
        packageDocument._insertDependency({
            name: 'joey',
            version: '1.2.3'
        });

        expect(packageDocument.dependencyCollection.dependencies.length).toBeGreaterThan(oldLength);
        expect(packageDocument.dependencyCollection.dependencies[
            packageDocument.findDependency('joey', DependencyNames.dependencies, true)
            ].name).toEqual('joey');

        oldLength = packageDocument.dependencyCollection.devDependencies.length;

        packageDocument._insertDependency({
            name: 'matte',
            version: '1.2.3',
            type: DependencyNames.devDependencies
        });

        expect(packageDocument.dependencyCollection.devDependencies.length).toBeGreaterThan(oldLength);

        packageDocument._insertDependency({ // should remove the previous dependency from the 'devDependencies' container and add it to the 'dependencies' one.
            name: 'matte',
            version: '1.2.3',
            type: DependencyNames.dependencies
        });

        expect(packageDocument.dependencyCollection.devDependencies.length).toEqual(oldLength);
        expect(packageDocument.findDependency('matte', DependencyNames.dependencies)).toBeDefined();
        expect(packageDocument.findDependency('matte', DependencyNames.devDependencies)).toEqual(null);
    });

    it('Should be able to add a dependency according to its type and save it.', function () {
        var oldLength = Object.keys(packageDocument._package.dependencies).length;
        packageDocument._insertDependency({
            name: 'joey',
            version: '1.2.3'
        }, true);

        expect(Object.keys(packageDocument._package.dependencies).length).toBeGreaterThan(oldLength);
        expect(packageDocument._modificationsAccepted).toHaveBeenCalled();
    });

    it('Should be able to remove a dependency from the file and save it.', function () {
        packageDocument._insertDependency({
            name: 'joey',
            version: '1.2.3',
            type: DependencyNames.dependencies
        }, true);

        var oldLength = Object.keys(packageDocument._package.dependencies).length;
        packageDocument._removeDependencyFromFile('joey', true);

        expect(Object.keys(packageDocument._package.dependencies).length).toBeLessThan(oldLength);
        expect(packageDocument._modificationsAccepted.calls.length).toEqual(2);
    });

    it('Should sort correctly dependencies according to their type.', function () {
        packageDocument._classifyDependencies([ // reset dependencies
            {
                name: 'matte',
                version: '1.2.3',
                type: DependencyNames.dependencies
            },
            {
                name: 'montage',
                version: '1.2.3',
                type: DependencyNames.dependencies
            },
            {
                ame: 'joey',
                version: '1.2.3',
                type: DependencyNames.devDependencies
            }
        ]);

        expect(packageDocument.dependencyCollection.dependencies.length).toEqual(2);
        expect(packageDocument.dependencyCollection.devDependencies.length).toEqual(1);
    });

});
