/**
 * ohmu.js (v1.0.0)
 *
 * Copyright (c) 2015 Scott Southworth & Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at:
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 *
 * @authors Scott Southworth @darkmarmot
 *
 */

;(function(){

    "use strict";

    var ohmu = {};
    var bus = this.catbus;
    var fileMonitor = bus.demandTree('OHMU'); // todo host should be defined within a tree
    var suffixOnRequests = '';

    var statusData = fileMonitor.demandData('STATUS'); // topics are urls, data is status: new, loaded, failed, done
    var infoData = fileMonitor.demandData('INFO'); // topics are urls, data is full file dependency info
    var dependencyData = fileMonitor.demandData('DEPENDENCY'); // topics are urls, data is full file dependency info

    // file status: new, loaded, gather, failed, done

    // topics: info, gather, failed, done, dependency


    ohmu.status = function sensor(url){
        return statusData.on(url);
    };

    ohmu.request = function request(url){

        var info = infoData.read(url);
        if(!info)
            initializeInfo(url);

    };

    ohmu.commune = function commune(url, needs){

        var info = infoData.read(url);
        if(info.status !== 'loaded')
            return;

        if(!needs || needs.length === 0){
            info.status = 'done';
            info.needs = null;
            updateFileInfo(info, url);
        } else {
            info.direct_needs = needs;
            info.status = 'gather';
            monitor(info, needs);
            updateFileInfo(info, url);
        }

    };

    ohmu.suffix = function suffix(suffix){
        suffixOnRequests = suffix;
    };

    function isLoaded(status) { return status === 'loaded';}

    function areAllNeedsLoaded(needs){

        console.log('check:',needs);

        for(var url in needs){
            var status = needs[url];
            if(status === 'failed') return false;
            if(status !== 'loaded' && status !== 'done') return false;
        }
        return true;
    }

    function monitor(info, needs){

        var all_needs = info.all_needs;
        var info_url = info.url;

        for(var i = 0; i < needs.length; i++){
            var need_url = needs[i];
            if(!all_needs.hasOwnProperty(need_url)){
                ohmu.request(need_url);
                statusData.on(need_url).host(info_url).run(function(status, need_url){
                    var info = infoData.read(info_url);
                    info.all_needs[need_url] = status;
                    if(areAllNeedsLoaded(info.all_needs)) {
                        info.status = 'done';
                        updateFileInfo(info, info_url);
                    }
                }).auto();
            }
        };
    }

    function initializeInfo(url) {


        var info = {
            url: url,
            requested: false,
            loaded: false,
            done: false,
            error_count: 0,
            error_text: '',
            file_text: '',
            status: 'new',
            all_needs: {}, // urls to load, includes child dependencies
            direct_needs: {} // can be object - key is url, value is status
        };

        infoData.write(info, url);
        infoData.on(url).host(url).extract('status').emit(url).pipe(statusData).auto();
        statusData.on(url).host(url).emit(url).run(statusChanged).auto();

    }

    var statusCallbacks = {
        new: download,
        error: retryDownload
    };

    function statusChanged(status, url){
        var method = statusCallbacks[status];
        if(method)
            method.call(null, url);
    }

    function updateFileInfo(info, url){
        infoData.write(info, url);
    }

    function download(url){

        $.ajax({url: url + suffixOnRequests, dataType: "text"})
            .done(function(response, status, xhr ){

                console.log('got:'+url);

                var info = infoData.read(url);
                info.file_text = response;
                info.status = 'loaded';
                updateFileInfo(info, url);

            })
            .fail(function(){

                console.log('fail:'+url);
                var info = infoData.read(url);
                info.error_count++;
                info.status = info.error_count > 3 ? 'failed' : 'error';
                updateFileInfo(info, url);

            });
    }

    //if(info.parsing_method){
    //    info.file_text = response;
    //    info.direct_dependencies = info.parsing_method.call(null, info); // [{url: x, parsing_method: f}]
    //}
    //
    //info.status = info.direct_dependencies.length > 0 ? 'gather' : 'done'; // look for dependencies


    function considerDependencies(originUrl, dependencyInfo){

        var fully_loaded = true; // assertion to disprove
        var origin = fileMonitor.demandData(originUrl);
        var origin_info = origin.read('info');

        origin_info.dependencies_status[dependencyInfo.url] = dependencyInfo.status;

        for(var i = 0; i < origin_info.dependencies.length; i++){
            var dependency = origin_info.dependencies[i];
            var dependency_status = origin_info.dependencies_status[dependency.url];

            if(dependency_status === 'failed'){
                origin_info.status = 'failed';
                origin.write(origin_info, 'info');
                return;
            } else if (dependency_status !== 'done'){
                fully_loaded = false;
                break;
            }

        }

        if(fully_loaded || origin_info.dependencies.length === 0){
            origin_info.status = 'done';
            origin.write(origin_info, 'info');
        }

    }

    //function addDependencies(receiverInfo, dependencyList) {
    //
    //    var receiverUrl = receiverInfo.url;
    //    var receiver = fileMonitor.demandData(receiverUrl);
    //
    //    dependencyList.forEach(function (d) { // {url, parsing_method }
    //        if (receiverInfo.all_dependencies[d.url]) {
    //
    //        }
    //    });
    //
    //}
    //

    function addDependencies(url, dependencies){

    }

    function downloadDependencies(url) {
        var info = infoData.read(url);
        addDependencies(url, info.direct_dependencies);
    }

    function g(){
        receiverInfo.direct_dependencies.forEach(function(d){ // {url, parsing_method }
            if(receiverInfo.all_dependencies[d.url]){

            }
        });

        var dependencyChange = function(dependencyInfo){
            console.log('dep change',originUrl, dependencyInfo);
            considerDependencies(originUrl, dependencyInfo);
        };

        var dependencyAdded = function(dependencyInfo){
            var receiver_info = receiver.read('info');
            var added = false;
            for(var i = 0; i < dependencyInfo.direct_dependencies.length; i++){
                var required_file = dependencyInfo.direct_dependencies[i];
                if(!receiver_info.status_of_required_files.hasOwnProperty(required_file.url)){
                    receiver_info.status_of_required_files[required_file.url] = 'new'; // as in unresolved
                    added = true;
                }
            }
            if(added)
                receiver.write('require', dependencyInfo);
        };



        receiver.write(info, 'require');

        for(var i = 0; i < dependencies.length; i++){

            var dependency = dependencies[i];
            var download = ohmu.request(dependency.url, dependency.parsing_method);
            download.on('require').host(originUrl).run(dependencyAdded).auto();
            download.on('failed').host(originUrl).run(dependencyChange).auto();
            download.on('done').host(originUrl).run(dependencyChange).auto();

        }

        //receiver.on('dependency').run(dependencyChange).auto();

    }
    //
    //function monitorDependency(receiver, dependencyUrl){
    //    var download = ohmu.request(dependency.url, dependency.parsing_method);
    //    download.on('require').host(originUrl).run(dependencyAdded).auto();
    //    download.on('failed').host(originUrl).run(dependencyChange).auto();
    //    download.on('done').host(originUrl).run(dependencyChange).auto();
    //}

    function retryDownload(url){

        var info = infoData.read(url);
        var delay = info.error_count * 1;
        setTimeout(function(){
            download(url);
        }, delay);

    }

    function noteFailed(url){

        //var info = infoData.read(url);
        //
        //var d = fileMonitor.demandData(info.url);
        //d.write(info, 'failed');
        //console.log('FAILED:'+info.url);
    }

    function noteDone(info){

        //var d = fileMonitor.demandData(info.url);
        //d.write(info, 'done');
        //console.log('done:'+info.url);

    }

    if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
        define([], function() {
            return ohmu;
        });
        this.ohmu = ohmu;
    } else if ((typeof module !== "undefined" && module !== null) && (module.exports != null)) {
        module.exports = ohmu;
    } else {
        this.ohmu = ohmu;
    }

}).call(this);