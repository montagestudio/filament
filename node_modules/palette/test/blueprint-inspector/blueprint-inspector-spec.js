/* <copyright>
 </copyright> */
var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader;

TestPageLoader.queueTest("blueprint-inspector-test/blueprint-inspector-test", function (testPage) {

    describe("blueprint-inspector/blueprint-inspector-spec", function () {
        var blueprintEditor;
        var booleanPropertyEditor;
        var datePropertyEditor;
        var enumPropertyEditor;
        var numberPropertyEditor;
        var objectPropertyEditor;
        var stringPropertyEditor;
        var urlPropertyEditor;

        beforeEach(function () {
            blueprintEditor = testPage.test.blueprintEditor;
            booleanPropertyEditor = testPage.test.booleanPropertyEditor;
            datePropertyEditor = testPage.test.datePropertyEditor;
            enumPropertyEditor = testPage.test.enumPropertyEditor;
            numberPropertyEditor = testPage.test.numberPropertyEditor;
            objectPropertyEditor = testPage.test.objectPropertyEditor;
            stringPropertyEditor = testPage.test.stringPropertyEditor;
            urlPropertyEditor = testPage.test.urlPropertyEditor;
        });

        it("can create new blueprint inspector", function () {
            expect(blueprintEditor).toBeTruthy();
            expect(blueprintEditor.object).toBeTruthy();
            expect(blueprintEditor.blueprint).toBeTruthy();
        });

        it("can create new boolean property inspector", function () {
            expect(booleanPropertyEditor).toBeTruthy();
            expect(booleanPropertyEditor.objectValue).toBe(false);
            expect(booleanPropertyEditor.propertyBlueprint).toBeTruthy();
            // Toggle the value in the compoent
            booleanPropertyEditor.childComponents[1].childComponents[0].checked = true;
            expect(booleanPropertyEditor.objectValue).toBe(true);
        });

        it("can create new date property inspector", function () {
            expect(datePropertyEditor).toBeTruthy();
            expect(datePropertyEditor.objectValue).toBeTruthy();
            expect(datePropertyEditor.propertyBlueprint).toBeTruthy();
        });

        it("can create new enum property inspector", function () {
            expect(enumPropertyEditor).toBeTruthy();
            expect(enumPropertyEditor.objectValue).toBe("blue");
            expect(enumPropertyEditor.propertyBlueprint).toBeTruthy();
            // Toggle the value in the compoent
            enumPropertyEditor.childComponents[1].childComponents[0].selection = "red";
            expect(enumPropertyEditor.objectValue).toBe("red");
        });

        it("can create new number property inspector", function () {
            expect(numberPropertyEditor).toBeTruthy();
            expect(numberPropertyEditor.objectValue).toBe(42);
            expect(numberPropertyEditor.propertyBlueprint).toBeTruthy();
            // Toggle the value in the compoent
            numberPropertyEditor.childComponents[1].childComponents[0].value = 51;
            expect(numberPropertyEditor.objectValue).toBe(51);
        });

        it("can create new object property inspector", function () {
            expect(objectPropertyEditor).toBeTruthy();
            expect(objectPropertyEditor.objectValue).toBeTruthy();
            expect(objectPropertyEditor.propertyBlueprint).toBeTruthy();
        });

        it("can create new string property inspector", function () {
            expect(stringPropertyEditor).toBeTruthy();
            expect(stringPropertyEditor.objectValue).toBe("default");
            expect(stringPropertyEditor.propertyBlueprint).toBeTruthy();
             // Toggle the value in the compoent
            stringPropertyEditor.childComponents[1].childComponents[0].value = "Arcachon";
            expect(stringPropertyEditor.objectValue).toBe("Arcachon");
        });

        it("can create new url property inspector", function () {
            expect(urlPropertyEditor).toBeTruthy();
            expect(urlPropertyEditor.objectValue).toBeTruthy();
            expect(urlPropertyEditor.propertyBlueprint).toBeTruthy();
        });
    });

});
