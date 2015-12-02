;(function (window) {
    "use strict"

    describe("this test rig", () => {
        it("should work fine", () => {
            (true).should.be.ok()
        })
    })
    describe("ohmu", function () {
        it("is here", function (done) {
            window.ohmu.should.be.ok()
        })
    })
})(window)
