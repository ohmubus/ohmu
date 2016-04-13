;(function (window) {
    "use strict";

    var ohmu = window.ohmu;

    ohmu.parser = function(fileText){
        var files = fileText.split(',');
        var result = {};
        for(var i = 0; i < files.length; i++){
            var file = files[i];
            if(file)
                result[file] = {parse: true, url: file};
        }
        return {requests: result, blueprint: null, script: null, display: null};
    };

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
        });
    });

    describe("The ohmu", function () {

        it("are here", function (done) {
            ohmu.should.be.ok();
            done();
        });

        it('should emit error event', function(done){

            var url = 'cogs/does_not_exist.html';

            ohmu.watch(url).run(function(info){
                info.url.should.eql(url);
                if(info.status === 'error')
                    done();
            }).auto();

            ohmu.request({url: url, parse: true});
        });


        describe('Lifecycle of an Ohmu request', function(){

                //this.timeout(80);
                it('should receive new, error, then failed', function(done){

                    var url = 'cogs/does_not_exist_either.html';
                    var expected = ['new','error','failed'];
                    var i = -1;

                    ohmu.request({url: url, parse: true});

                    ohmu.watch(url).run(function(info){

                        i++;
                        info.url.should.eql(url);
                        info.status.should.eql(expected[i]);

                        if(i === expected.length - 1)
                            done();

                    }).auto();

                });

                it('should receive new and loaded and done for lone file', function(done){

                    var url = 'cogs/alone.html';
                    var expected = ['new','loaded','parsed','waiting','done'];
                    var i = -1;

                    ohmu.request({url: url, parse: true});

                    ohmu.watch(url).run(function(info){

                        i++;
                        info.url.should.eql(url);
                        info.status.should.eql(expected[i]);

                        if(i === expected.length - 1)
                            done();

                    }).auto();

                });


                it('should receive new and loaded and done for file with kids', function(done){

                    var url = 'cogs/has_kids.html';
                    var expected = ['new','loaded','parsed','waiting','done'];
                    var i = -1;

                    ohmu.request({url: url, parse: true});

                    ohmu.watch(url).run(function(info){

                        i++;
                        info.url.should.eql(url);
                        info.status.should.eql(expected[i]);

                        console.log(info.status, info.url);
                        if(i === expected.length - 1) {
                            console.log('done!');
                            done();
                        }

                    }).auto();

                });

                it('should receive done for same file with kids', function(done){

                    var url = 'cogs/has_kids.html';
                    var expected = ['done'];
                    var i = -1;

                    ohmu.request({url: url, parse: true});

                    ohmu.watch(url).run(function(info){

                        i++;
                        info.url.should.eql(url);
                        info.status.should.eql(expected[i]);

                        console.log(info.status, info.url);
                        if(i === expected.length - 1) {
                            console.log('done!');
                            done();
                        }

                    }).auto();

                });

                it('should receive new and loaded and done for other file with overlapping kids', function(done){

                    var url = 'cogs/has_kids_too.html';
                    var expected = ['new','loaded','parsed','waiting','done'];
                    var i = -1;

                    ohmu.request({url: url, parse: true});

                    ohmu.watch(url).run(function(info){

                        i++;
                        info.url.should.eql(url);
                        info.status.should.eql(expected[i]);

                        console.log(info.status, info.url);
                        if(i === expected.length - 1) {
                            console.log('done!');
                            done();
                        }

                    }).auto();

                });

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
})(window);
