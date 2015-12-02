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

    var ohmu = window.ohmu = {};
    var bus = this.catbus;
    var fileMonitor = bus.demandTree('OHMU'); // todo host should be within a tree
    var suffixOnRequests = '';

    // topics: info, failed, done, dependency

    ohmu.sensor = function sensor(url, topic){

        var d = fileMonitor.demandData(url);
        return d.on(topic);

    };

    ohmu.request = function request(url, parsingMethod){

        var d = fileMonitor.demandData(url);
        var info = d.read('info');
        if(info && info.status !== 'failed') return; // already requested

        d.on('info').run(infoChange);

        initializeInfo(url, parsingMethod);
        download(url);

    };

    ohmu.suffix = function suffix(suffix){

        suffixOnRequests = suffix;

    };

    function initializeInfo(url, parsingMethod) {

        var d = fileMonitor.demandData(url);

        var info = {
            url: url,
            error_count: 0,
            error_text: '',
            file_text: '',
            status: 'new',
            parsing_method: parsingMethod,
            dependencies: null,
            dependencies_status: {}
        };

        d.write(info, 'info');

    }

    function download(url){

        var d = fileMonitor.demandData(url);

        $.ajax({url: url + suffixOnRequests, dataType: "text"})
            .done(function(response, status, xhr ){

                var info = d.read('info');
                if(info.parsing_method){
                    info.file_text = response;
                    info.dependencies = info.parsing_method.call();
                }
                info.status = info.dependencies ? 'gather' : 'done'; // look for dependencies
                d.write(info, 'info');

            })
            .fail(function(){

                var info = d.read('info');
                info.error_count++;
                info.status = info.error_count > 3 ? 'failed' : 'error';
                d.write(info, 'info');

            });

    }

    function infoChange(info){

        switch(info.status){
            case 'new':
                download(info.url);
                break;
            case 'failed':
                noteFailed(info);
                break;
            case 'error':
                retryDownload(info);
                break;
            case 'done':
                noteDone(info);
                break;
            case 'gather':
                downloadDependencies(info);
                break;
        }

    }

    function considerDependencies(originUrl, dependencyInfo){

        var fully_loaded = true; // assertion to disprove
        var origin = fileMonitor.demandData(originUrl);
        var info = origin.read('info');

        info.dependencies_status[dependencyInfo.url] = dependencyInfo.status;

        for(var dependencyUrl in info.dependencies){
            var status = info.dependencies_status[dependencyUrl];
            if(info.status !== 'failed' && status === 'failed'){
                info.status = 'failed';
                origin.write(info, 'info');
                break;
            } else if (info.status !== 'done'){
                fully_loaded = false;
                break;
            }
        }

        if(fully_loaded){
            info.status = 'done';
            origin.write(info, 'info');
        }

    }

    function downloadDependencies(info){

        var originUrl = info.url;
        var parent = fileMonitor.demandData(originUrl);

        var files = info.dependencies;
        for(var i = 0; i < files.length; i++){
            var file = files[i];
            var dependency = fileMonitor.demandData(file);
            dependency.on('failed').host(originUrl).emit('dependency').pipe(parent);
            dependency.on('done').host(originUrl).emit('dependency').pipe(parent);
        }

        var dependencyChange = function(dependencyInfo){
            considerDependencies(originUrl, dependencyInfo);
        };

        parent.on('dependency').run(dependencyChange);

    }

    function retryDownload(info){

        var delay = info.error_count * 1000;
        setTimeout(function(){
            download(info.url);
        }, delay);

    }


   function noteFailed(info){

       var d = fileMonitor.demandData(info.url);
       d.write(info, 'failed');

   }

    function noteDone(info){

        var d = fileMonitor.demandData(info.url);
        d.write(info, 'done');

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
