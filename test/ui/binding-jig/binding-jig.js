var TestPageLoader = require("montage-testing/testpageloader").TestPageLoader,
    BindingJig = require("ui/binding-jig.reel/binding-jig.js").BindingJig,
    bindingJig = new BindingJig();

TestPageLoader.queueTest("escape-frb", function(testPage){
    describe("Escape FRB double quotes", function () {
        var frb;

        it("is classList.has correctly escaped", function (){
            frb = 'classList.has("active")';
            expect(frb).toBe('classList.has(\"active\")');
        });

        it("are quote concatenated correctly escaped", function (){
            frb = '\'"\' + @textField.value + \'"\'';
            expect(frb).toBe('\'\"\' + @textField.value + \'\"\'');
        });
    });
});