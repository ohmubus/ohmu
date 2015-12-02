;(function (window) {
    "use strict"

    describe("this test rig", () => {
        it("should work fine", () => {
            (true).should.be.ok()
        })
    })

    describe("The ohmu", function () {
        it("are here", function (done) {
            window.ohmu.should.be.ok()
            done()
        })
    })
})(window)
