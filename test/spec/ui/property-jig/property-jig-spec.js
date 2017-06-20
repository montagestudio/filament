var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("property-jig-test", function(testPage) {
    describe("ui/property-jig", function() {

        var test,
            propertyJig,
            object;

        beforeEach(function () {
            test = testPage.test;
            propertyJig = test.propertyJig;
            object = {};
        });

        it("renders", function () {
            expect(propertyJig).toBeTruthy();
        });

        describe("property editing", function () {
            beforeEach(function () {
                propertyJig.model = {
                    targetObject: object,
                    key: "someProperty",
                    bound: false,
                    value: "someValue"
                };
            });

            it("can create a new property", function () {
                spyOn(test.editingDocument, "setOwnedObjectProperty").and.callThrough();
                propertyJig.handleDefineButtonAction();
                expect(test.editingDocument.setOwnedObjectProperty).toHaveBeenCalled();
                expect(test.editingDocument.setOwnedObjectProperty.calls.argsFor(0)[0]).toBe(object);
                expect(test.editingDocument.setOwnedObjectProperty.calls.argsFor(0)[1]).toBe("someProperty");
                expect(test.editingDocument.setOwnedObjectProperty.calls.argsFor(0)[2]).toBe("someValue");
            });
        });

        describe("binding editing", function () {
            it("can create a new binding", function () {
                propertyJig.model = {
                    targetObject: object,
                    bound: true,
                    key: "targetPath",
                    sourcePath: "sourcePath",
                    oneway: true
                };
                spyOn(test.editingDocument, "defineOwnedObjectBinding").and.callThrough();
                propertyJig.handleDefineButtonAction();
                expect(test.editingDocument.defineOwnedObjectBinding).toHaveBeenCalled();
                expect(test.editingDocument.defineOwnedObjectBinding.calls.argsFor(0)[0]).toBe(object);
                expect(test.editingDocument.defineOwnedObjectBinding.calls.argsFor(0)[1]).toBe("targetPath");
                expect(test.editingDocument.defineOwnedObjectBinding.calls.argsFor(0)[2]).toBe(true);
                expect(test.editingDocument.defineOwnedObjectBinding.calls.argsFor(0)[3]).toBe("sourcePath");
                expect(test.editingDocument.defineOwnedObjectBinding.calls.argsFor(0)[4]).toBeFalsy();
            });

            it("can edit a new binding", function () {
                propertyJig.model = {
                    targetObject: object,
                    bound: true,
                    key: "targetPath",
                    sourcePath: "sourcePath",
                    oneway: true
                };
                propertyJig.existingBinding = {
                    targetObject: object,
                    bound: true,
                    key: "targetPath",
                    sourcePath: "alternatePath",
                    oneway: false
                };
                spyOn(test.editingDocument, "updateOwnedObjectBinding").and.callThrough();
                propertyJig.handleDefineButtonAction();
                expect(test.editingDocument.updateOwnedObjectBinding).toHaveBeenCalled();
                expect(test.editingDocument.updateOwnedObjectBinding.calls.argsFor(0)[0]).toBe(object);
                expect(test.editingDocument.updateOwnedObjectBinding.calls.argsFor(0)[1]).toBe(propertyJig.existingBinding);
                expect(test.editingDocument.updateOwnedObjectBinding.calls.argsFor(0)[2]).toBe("targetPath");
                expect(test.editingDocument.updateOwnedObjectBinding.calls.argsFor(0)[3]).toBe(true);
                expect(test.editingDocument.updateOwnedObjectBinding.calls.argsFor(0)[4]).toBe("sourcePath");
                expect(test.editingDocument.updateOwnedObjectBinding.calls.argsFor(0)[5]).toBeFalsy();
            });
        });
    });
});

