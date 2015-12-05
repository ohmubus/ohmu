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

    // return status sensor of url, returns string: new, failed, loaded, parsed, done
    function getStatus(url){
        return statusData.read(url);
    }

    // return file text of url, valid after loaded
    function getContent(url){
        var info = getInfo(url);
        return info && info.file_text;
    }

    function getInfo(url){
        return infoData.read(url);
    }

    ohmu.status = function ohmu_status(url){
        return getStatus(url)
    };

    // return status sensor of url, returns on change of: new, failed, loaded, parsed, done
    // initiates download
    ohmu.request = function ohmu_request(url){
        return getRequest(url);
    };

    function doRequest(url, context){

        context = context || url;

        if(!getInfo(url)) {
            initRequest(url, context);
            return true;
        }

        return false;
    }

    ohmu.commune = function ohmu_commune(url, needs){

        var info = getInfo(url);
        if(info.status !== 'loaded')
            return false;

        if(!needs || needs.length === 0){
            info.status = 'done';
            info.needs = null;
            updateInfo(info);
        } else {
            info.needs = needs;
            info.status = 'parsed';
            addNeedsToContext(info.context, needs);
            updateInfo(info);
            monitor(info, needs);
        }

        return true;

    };

    ohmu.suffix = function suffix(suffix){
        suffixOnRequests = suffix;
    };

    function addNeedsToContext(context_url, needs){
        var context_info = getInfo(context_url);
        for(var i = 0; i < needs.length; i++){
            var need_url = needs[i];
            context_info.status_of_needs[need_url] = 'unknown'; // sensors will update this with actual status momentarily
        }
        updateInfo(context_info);
    }

    function evaluateNeeds(context_url, need_status, need_url){

        var info = getInfo(context_url);
        if(info.status !== 'parsed')
            return; // only changes parsed state to done or failed

        var needs = info.status_of_needs;
        needs[need_url] = need_status;

        // any need failed -> context failed
        if(need_status === 'failed'){
            info.status = 'failed';
            updateInfo(info);
            return;
        }

        // all needs parsed or done -> to context done
        if(need_status !== 'parsed' && need_status !== 'done')
            return; // can't change status based on the new value

        for(var status in needs){
            if(status !== 'parsed' && status !== 'done')
                return; // not all status flags are ready
        }

        info.status = 'done';
        updateInfo(info);

    }

    function monitor(info, needs){

        var context_url = info.context;

        function needStatusChanged(status, need_url){
            evaluateNeeds(context_url, status, need_url);
        }

        for(var i = 0; i < needs.length; i++){
            var need_url = needs[i];
            doRequest(need_url, context_url);
            statusData.on(need_url).host(context_url).change().run(needStatusChanged).auto();
        }

    }


    function initRequest(url, context) {

        var info = {
            url: url,
            context: context,
            error_count: 0,
            error_text: '',
            file_text: '',
            status: 'new', // (new, failed, loaded, parsed, done)
            needs: [],
            status_of_needs: {} // can be object - key is url, value is status
        };

        updateInfo(info);
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

    function updateInfo(info){
        infoData.write(info, info.url);
    }

    function download(url){

        $.ajax({url: url + suffixOnRequests, dataType: "text"})
            .done(function(response, status, xhr ){

                console.log('got:'+url);

                var info = getInfo(url);
                info.file_text = response;
                info.status = 'loaded';
                updateInfo(info);

            })
            .fail(function(){

                console.log('fail:'+url);
                var info = getInfo(url);
                info.error_count++;
                if(info.error_count > 3)
                    info.status = 'failed';
                else
                    retryDownload(url);

                updateInfo(info);

            });
    }

    function retryDownload(url){

        var info = infoData.read(url);
        var delay = info.error_count * 1;
        setTimeout(function(){
            download(url);
        }, delay);

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