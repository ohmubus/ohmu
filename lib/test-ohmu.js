;(function (window) {
    "use strict"

    describe("This test rig", () => {
        it("should work fine", () => {
            (true).should.be.ok()
        })

        var xhr, requests

        before(() => {
            xhr = sinon.useFakeXMLHttpRequest()
            requests = []

            xhr.onCreate = function (req) { requests.push(req) }
        })

        after(() => { xhr.restore() })

        it("should let me mock ajax calls", () => {
            var path = "/first"

            var cb = sinon.spy()

            function did (res, stat, xhr) {
                requests.length.should.eql(1)
                cb.called.should.be.true()
            }

            function awughsheeit (err) { // eh?
                cb(err)
            }

            function doJax (cb) {
                jQuery.ajax({ url: path }).done(did).fail(awughsheeit)
            }

            doJax()
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

/**
 *        Test stuff:
 *
 *            Async downloader for heirarchical dependencies served over the wire
 *            So lets test:
 *
 *            * Order: deps need to be assembled (not neccessarily downloaded) in
 *            a particular order (assembled as in "handed to cognition")
 *
 *            I guess that's it.  Making sure the plumbing works is dum, cause
 *            it's jQuery (for now)
 *
 *           Need to figure out the nature of it's ordering mech
 *
 */

    })
})(window)
