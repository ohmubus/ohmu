;(function (window) {
    "use strict"

    var ohmu = window.ohmu;

    describe("This test rig", function() {
        it("should work fine", function() {
            (true).should.be.ok()
        });

        var xhr, requests;

        before(function() {
            xhr = sinon.useFakeXMLHttpRequest();
            requests = [];

            xhr.onCreate = function (req) { requests.push(req) }
        });

        after(function(){ xhr.restore() });

        it("should let me mock ajax calls",function() {
            var path = "/first";

            var cb = sinon.spy();

            function did (res, stat, xhr) {
                requests.length.should.eql(1);
                cb.called.should.be.true();
            }

            function awughsheeit (err) { // eh?
                cb(err);
            }

            function doJax (cb) {
                jQuery.ajax({ url: path }).done(did).fail(awughsheeit);
            }

            doJax();
        })
    })

    describe("The ohmu", function () {
        it("are here", function (done) {
            ohmu.should.be.ok();
            done();
        });

        it('should emit error event', function(done){

            var url = 'cogs/does_not_exist.html';
            ohmu.request(url);
            ohmu.status(url).run(function(status, fromUrl){
                fromUrl.should.eql(url);
                if(status === 'error')
                    done();
            }).auto();

        });


        describe('Lifecycle of an Ohmu request', function(){

                //this.timeout(80);
                it('should receive new, 3 errors, then failed', function(done){

                    var url = 'cogs/does_not_exist_either.html';
                    var expected = ['new','error','error','error','failed'];
                    var i = -1;

                    ohmu.request(url);

                    ohmu.status(url).run(function(status, fromUrl){

                        i++;
                        fromUrl.should.eql(url);
                        status.should.eql(expected[i]);

                        if(i === expected.length - 1)
                            done();

                    }).auto();

                });

                it('should receive new and loaded and done for lone file', function(done){

                    var url = 'cogs/alone.html';
                    var expected = ['new','loaded','done'];
                    var i = -1;

                    ohmu.request(url);

                    ohmu.status(url).run(function(status, fromUrl){

                        i++;
                        fromUrl.should.eql(url);
                        status.should.eql(expected[i]);

                        if(status === 'loaded')
                            ohmu.commune(url);

                        if(i === expected.length - 1)
                            done();

                    }).auto();

                })


                it('should receive new and loaded and done for file with kids', function(done){

                    var url = 'cogs/has_kids.html';
                    var expected = ['new','loaded','gather','done'];
                    var i = -1;

                    ohmu.request(url);

                    ohmu.status(url).run(function(status, fromUrl){

                        i++;
                        fromUrl.should.eql(url);
                        status.should.eql(expected[i]);

                        if(status === 'loaded')
                            ohmu.commune(url, ['cogs/kid1.html','cogs/kid2.html']);

                        if(i === expected.length - 1)
                            done();

                    }).auto();

                })



            }
        );


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
