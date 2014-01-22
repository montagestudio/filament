/*global describe,beforeEach,it,expect,waitsFor,runs*/

var PackageQueueManager = require("../../../extensions/package-manager.filament-extension/core/packages-queue-manager").PackageQueueManager,
    ACTION_INSTALLING = 0,
    ACTION_REMOVING = 1;

describe("package queue manager", function () {
    var packageDocument, installed;

    beforeEach(function() {
        packageDocument = {};

        packageDocument.environmentBridge = {
            projectUrl: '/'
        };

        installed = null;

        packageDocument.done = function (elements) {
            installed = elements;
        };
    });

    it("should be able to install several packages and returns information about them.", function() {

        runs(function() {
            PackageQueueManager.load(packageDocument, 'done');
            PackageQueueManager.installModule('montage', false);
            PackageQueueManager.installModule('digit@1.1.1', false);
            PackageQueueManager.installModule(5, false);
            PackageQueueManager.installModule('matte@1.2.3@4.5.6', false);
            PackageQueueManager.installModule({name: 'joey'}, false);
            expect(PackageQueueManager.isRunning).toEqual(true);
        });

        waitsFor(function() {
            return !!installed;
        }, "The PackageQueueManager should call the function 'done'", 750);


        runs(function() {
            expect(PackageQueueManager.isQueueEmpty()).toEqual(true);
            expect(PackageQueueManager.isRunning).toEqual(false);

            expect(Array.isArray(installed)).toEqual(true);
            expect(installed.length).toEqual(4);
            expect(installed[0].name).toEqual('montage');
            expect(installed[1].version).toEqual('1.1.1');
            expect(installed[2].version).toEqual('1.2.3');
            expect(installed[3].name).toEqual('joey');

            for (var i = 0, length = installed.length; i < length; i++) {
                var element = installed[i];
                expect(element.action).toEqual(ACTION_INSTALLING);
                expect(element.error).toEqual(false);
            }
        });

    });

    it("should be able to remove several packages and returns information about them.", function() {

        runs(function() {
            PackageQueueManager.load(packageDocument, 'done');
            PackageQueueManager.uninstallModule('montage', false);
            PackageQueueManager.uninstallModule('joey', false);
        });

        waitsFor(function() {
            return !!installed;
        }, "The PackageQueueManager should call the function 'done'", 750);


        runs(function() {
            expect(installed.length).toEqual(2);
            expect(installed[0].name).toEqual('montage');

            for (var i = 0, length = installed.length; i < length; i++) {
                var element = installed[i];
                expect(element.action).toEqual(ACTION_REMOVING);
                expect(element.error).toEqual(false);
            }
        });

    });


    it("should be able to remove and install several packages and returns information about them.", function() {

        runs(function() {
            PackageQueueManager.load(packageDocument, 'done');
            PackageQueueManager.installModule('montage', false);
            PackageQueueManager.installModule('joey', false);
            PackageQueueManager.uninstallModule('joey', false);
        });

        waitsFor(function() {
            return !!installed;
        }, "The PackageQueueManager should call the done function", 750);


        runs(function() {
            expect(installed[0].action).toEqual(ACTION_INSTALLING);
            expect(installed[2].action).toEqual(ACTION_REMOVING);

        });

    });

});
