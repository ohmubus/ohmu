;(function (window) {
    "use strict"

    describe("This test rig", () => {
        it("should work fine", () => {
            (true).should.be.ok()
        })
    })

    describe("The ohmu", function () {
        it("are here", function (done) {
            window.ohmu.should.be.ok()
            done()
        })

        it("can create Sensors", () => {
            // well, we're getting something
            var sensor = window.ohmu.sensor("/dummy/url", "dummy topic")
            sensor.should.be.ok()

            // i guess it made the sensor
            var d = window.catbus.demandTree("OHMU").findData("/dummy/url")
            d.should.be.ok()
            d.write("here is a msg", "dummy topic")

            var woo
            var thing = function () { woo = "woo"; woo.should.eql("woo")}
            sensor.run(thing) // so the run gets the call back
            // our dummy topic is wired right
        })

    })
})(window)
