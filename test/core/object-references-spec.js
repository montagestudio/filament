var ObjectReferences = require("core/object-references").ObjectReferences;

describe("core/object-references-spec", function () {
    var references, one, two, property;
    beforeEach(function () {
        references = new ObjectReferences();
        property = "property";

        one = {};
        two = {};
        two[property] = one;
    });

    describe("get", function () {
        it("returns a set for a previously unseen object", function () {
            expect(references.get(one)).toBeDefined();
            expect(references.get(one).toArray()).toEqual([]);
        });
    });

    describe("add", function () {
        it("adds a reference for the object", function () {
            references.add(one, two, property);

            expect(references.get(one).toArray()).toEqual([[two, property]]);
        });

        it("only adds one reference for the object", function () {
            references.add(one, two, property);
            references.add(one, two, property);

            expect(references.get(one).toArray()).toEqual([[two, property]]);
        });
    });

    describe("delete", function () {
        beforeEach(function () {
            references.add(one, two, property);
        });

        it("deletes the reference", function () {
            references.delete(one, two, property);

            expect(references.get(one).toArray()).toEqual([]);
        });
    });

    describe("forEach", function () {
        var three, anotherProperty;
        beforeEach(function () {
            references.add(one, two, property);

            anotherProperty = "@#$%^&*";
            two[anotherProperty] = one;
            references.add(one, two, anotherProperty);

            three = {};
            three[property] = one;
            references.add(one, three, property);
        });

        it("passes through the this", function () {
            var thisArg = {};
            references.forEach(one, function () {
                expect(this).toBe(thisArg);
            }, thisArg);
        });

        it("calls the callback for each reference", function () {
            var callback = jasmine.createSpy();
            references.forEach(one, callback);

            expect(callback.callCount).toEqual(3);
            expect(callback.argsForCall[0]).toEqual([two, property]);
            expect(callback.argsForCall[1]).toEqual([two, anotherProperty]);
            expect(callback.argsForCall[2]).toEqual([three, property]);
        });
    });
});
