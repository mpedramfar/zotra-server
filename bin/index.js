#!/usr/bin/env node

const path = require('path');
process.env.NODE_CONFIG_DIR = path.resolve(__dirname + "/../config/");

const http = require('http');
const config = require('config');

require('../module/translation-server/src/zotero');
const WebEndpoint    = require('../module/translation-server/src/webEndpoint');
const SearchEndpoint = require('../module/translation-server/src/searchEndpoint');
const ImportEndpoint = require('../module/translation-server/src/importEndpoint');
const ExportEndpoint = require('../module/translation-server/src/exportEndpoint');

Zotero.Utilities.Item.itemToAPIJSON = require('../src/attachments');  // by default, also return attachments 

var try_server_first = config.get('try_server_first');


RequestFromServer = async function(data, endpoint, content_type, param = ""){
    return new Promise(function(resolve, reject){
        const req = http.request({
                hostname: config.get('host'),
                port: config.get('port'),
                path: '/' + endpoint + (param ? "?" + param : ""),
                method: 'POST',
                headers: {
                'Content-Type': content_type,
                'Content-Length': Buffer.byteLength(data),
                },
            }, (res) => {
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    resolve(chunk);
                });
            });
        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}


var filterAttachments = function(items, only_attachments){
    if (Array.isArray(items)) {
        ans = []
        items.forEach((item) => {
            if((item.itemType == 'attachment') == !!only_attachments)
                ans.push(item);
        });
        return ans;
    } else {
        return items;
    }
}


var WebEndpointCLI = async function(data, single=false, only_attachments=false, content_type='text/plain'){
    if (try_server_first) {
        try {
            var output = await RequestFromServer(data, 'web', content_type, (single ? "single=1" : ""));
            output = JSON.parse(output);
            return filterAttachments(output, only_attachments);
        } catch (e) {       // Server is not running or not reachable
            try_server_first = false;
        }
    }

    if (content_type == 'application/json')
        data = JSON.parse(data);
    ctx = {
        headers: [],
        request: {body: data, query: {single: single}},
        response: {},
        throw: (...x)=>console.error(...x),
        assert: (...x)=>null,
        is: (...x)=>null,
        set: (...x)=>null
    }
    await Zotero.Translators.init();
    await WebEndpoint.handle(ctx, null);
    return filterAttachments(ctx.response.body, only_attachments);
}

var SearchEndpointCLI = async function(data, only_attachments=false){
    if (try_server_first) {
        try {
            output = await RequestFromServer(data, 'search', 'text/plain');
            output = JSON.parse(output);
            return filterAttachments(output, only_attachments);
        } catch (e) {       // Server is not running or not reachable
            try_server_first = false;
        }
    }

    ctx = {
        headers: [],
        request: {body: data},
        response: {},
        throw: (...x)=>console.error(...x),
        assert: (...x)=>null,
        is: (...x)=>null,
        set: (...x)=>null
    }
    await Zotero.Translators.init();
    await SearchEndpoint.handle(ctx, null);
    return filterAttachments(ctx.response.body, only_attachments);
}

var ImportEndpointCLI = async function(item){
    if (try_server_first) {
        try {
            return await RequestFromServer(data, 'import', 'text/plain');
        } catch (e) {       // Server is not running or not reachable
            try_server_first = false;
        }
    }

    ctx = {
        headers: [],
        request: {body: item},
        response: {},
        throw: (...x)=>console.error(...x),
        assert: (...x)=>null,
        is: (...x)=>null,
        set: (...x)=>null
    }
    await Zotero.Translators.init();
    await ImportEndpoint.handle(ctx, null);
    return ctx.response.body;
}


var ExportEndpointCLI = async function(items, format=null){
    format = format || 'bibtex';

    if(try_server_first){
        try {
            return await RequestFromServer(data, 'export', 'application/json', "format="+format);
        } catch (e) {       // Server is not running or not reachable
            try_server_first = false;
        }
    }

    ctx = {
        headers: [],
        request: {body: items, query: {format: format}},
        response: {},
        throw: (...x)=>console.error(...x),
        assert: (...x)=>null,
        is: (...x)=>null,
        set: (...x)=>null
    }
    await Zotero.Translators.init();
    await ExportEndpoint.handle(ctx, null);
    return ctx.response.body;
}

var Server = async function(){
    require('../module/translation-server/src/server');
}


var main = async function(argv){
    args = argv['_'];

    if (args[0] == 'web') {
        url = args[1];
        ret = await WebEndpointCLI(url, !!argv.single, 
                                    !!argv['only-attachments'], 
                                    (argv['json'] ? 'application/json' : 'text/plain'));
        if(argv['only-attachments']){
            if (Array.isArray(ret)) {
                ret.forEach((item) => {
                    if(item.itemType == 'attachment' && item.mimeType != 'text/html')
                        console.log(item.url);
                });
            }
        }else{
            ret = JSON.stringify(ret);
            console.log(ret);
        }
    } else if (args[0] == 'search') {
        data = args[1];
        ret = await SearchEndpointCLI(data, !!argv['only-attachments']);
        if(argv['only-attachments']){
            ret.forEach((item) => {
                if(item.itemType == 'attachment' && item.mimeType != 'text/html')
                    console.log(item.url);
            });
        }else{
            ret = JSON.stringify(ret);
            console.log(ret);
        }
    } else if(args[0] == 'import') {
        item = args[1];
        ret = await ImportEndpointCLI(item);
        console.log(ret);
    } else if(args[0] == 'export') {
        json = JSON.parse(args[1]);
        ret = await ExportEndpointCLI(json, argv.format);
        console.log(ret);
    } else if(args[0] == 'web_export') {
        url = args[1];
        json = await WebEndpointCLI(url, true); // Here we assume single=1
        ret = await ExportEndpointCLI(json, argv.format);
        console.log(ret);
    } else if(args[0] == 'search_export') {
        data = args[1];
        json = await SearchEndpointCLI(data);
        ret = await ExportEndpointCLI(json, argv.format);
        console.log(ret);
    } else if(args[0] == 'server') {
        Server();
    };
}

const argv = require('yargs/yargs')(process.argv.slice(2))
                .parserConfiguration({
                    "parse-numbers": false,
                    "parse-positional-numbers": false,
                  })
                .option('single', {
                    alias: 's',
                    default: false,
                    type: 'boolean'
                })
                .option('only-attachments', {
                    alias: 'a',
                    default: false,
                    type: 'boolean'
                })
                .option('format', {
                    alias: 'f',
                    default: 'bibtex',
                    type: 'string'
                })
                .option('json', {
                    alias: 'j',
                    default: false,
                    type: 'boolean'
                })
                .help('help')
                .usage("$0 [-s|--single] [-a|--only-attachments] web <url>")
                .usage("$0 [-a|--only-attachments] <-j|--json> web <json>")
                .usage("$0 [-a|--only-attachments] search <search_identifier>")
                .usage("$0 import <data>")
                .usage("$0 [-f <format>|--format <format>] export <json>")
                .usage("$0 server")
                .parse();

main(argv);
