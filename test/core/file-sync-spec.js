var FileSyncService = require("../../core/file-sync").FileSyncService,
    Q = require("q");

describe("core/file-sync-spec", function() {
    var bridgeMock, handlerMock;

    beforeEach(function() {
        bridgeMock = {
            callCount: 0,
            hash: function (url) {
                this.callCount++;
                return Q.resolve('bar');
            }
        };
        handlerMock = {
            handle: function() {
                return Q.resolve();
            }
        };
        documentMock = {
            url: 'foo',
            content: ''
        };
    });

    it("should periodically poll workspace file hash", function(done) {
        var document = {
            url: 'baz',
            content: ''
        };
        var intervalId = setInterval(function() {
            document.content = ''+new Date().getMilliseconds();
        }, 5); // Let's ensure local content is different at each call
        var service = new FileSyncService(document, bridgeMock);
        service.setHandler(handlerMock);

        service.start(10);

        setTimeout(function() {
            expect(bridgeMock.callCount).toEqual(3);
            clearInterval(intervalId);
            service.stop();
            done();
        }, 29);
    });

    it("should stop polling when service is stopped", function(done) {
        var service = new FileSyncService(documentMock, bridgeMock);
        service.setHandler(handlerMock);

        service.start(100);
        service.stop();

        setTimeout(function() {
            expect(bridgeMock.callCount).toEqual(1);
            service.stop();
            done();
        }, 29);
    });

    it("should call handlers", function(done) {
        var handler = {
            called: false,
            myMethod: function(hash) {
                this.called = true;
                return Q.resolve();
            }
        };

        var service = new FileSyncService(documentMock, bridgeMock);
        service.setHandler(handler, 'myMethod');

        service.start(10)
            .then(function() {
                return service.stop()
            })
            .then(function() {
                expect(handler.called).toBeTruthy();
                done();
            });

    });

    it("should call call default method on handlers", function(done) {
        var handler = {
            called: false,
            handle: function(hash) {
                this.called = true;
                return Q.resolve();
            }
        };

        var service = new FileSyncService(documentMock, bridgeMock);
        service.setHandler(handler);

        service.start(10)
            .then(function() {
                return service.stop()
            })
            .then(function() {
                expect(handler.called).toBeTruthy();
                done();
            });

    });
});