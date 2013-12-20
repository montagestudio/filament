var Set = require("montage/collections/set");
var addValueToSetAt = require("core/add-value-to-set-at");

describe("core/add-value-to-set-at", function () {
    var set;
    beforeEach(function () {
        set = new Set();
        set.add("a");
        set.add("b");
        set.add("c");
    });

    describe("addAt", function () {
        it("does not add en existing item", function () {
            expect(addValueToSetAt(set, "c", 0)).toEqual(false);
            expect(set.toArray()).toEqual(["a", "b", "c"]);
        });

        it("adds at the given position", function () {
            expect(addValueToSetAt(set, "X", 1)).toEqual(true);
            expect(set.toArray()).toEqual(["a", "X", "b", "c"]);
        });

        it("adds at the end when position exceeds the length", function () {
            addValueToSetAt(set, "X", 100);
            expect(set.toArray()).toEqual(["a", "b", "c", "X"]);
        });

        it("leaves set.order with the correct length", function () {
            addValueToSetAt(set, "X", 1);
            expect(set.order.length).toEqual(4);
        });
    });

    describe("pop", function () {
        it("works after addAt", function () {
            addValueToSetAt(set, "X", 0);
            expect(set.pop()).toEqual("c");
            expect(set.toArray()).toEqual(["X", "a", "b"]);

        });
    });

    describe("delete", function () {
        it("works after addAt", function () {
            addValueToSetAt(set, "X", 1);
            expect(set.delete("X")).toEqual(true);
            expect(set.toArray()).toEqual(["a", "b", "c"]);
        });
    });

    describe("range changes", function () {
        it("dispatches before range change", function () {
            var spy = jasmine.createSpy();
            set.addBeforeRangeChangeListener(spy);
            addValueToSetAt(set, "X", 1);

            expect(spy).toHaveBeenCalled();
            expect(spy.mostRecentCall.args[0]).toEqual(["X"]);
            expect(spy.mostRecentCall.args[1]).toEqual([]);
            expect(spy.mostRecentCall.args[2]).toEqual(1);
        });

        it("dispatches range change", function () {
            var spy = jasmine.createSpy();
            set.addRangeChangeListener(spy);
            addValueToSetAt(set, "X", 1);

            expect(spy).toHaveBeenCalled();
            expect(spy.mostRecentCall.args[0]).toEqual(["X"]);
            expect(spy.mostRecentCall.args[1]).toEqual([]);
            expect(spy.mostRecentCall.args[2]).toEqual(1);
        });
    });

});
