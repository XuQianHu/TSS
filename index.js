//
// 自动化截取刷卡资料
//

'use strict';	// Whole-script strict mode applied.

const http = require('http');   // NOTE: import default module
const fs = require('fs');       // NOTE: import default module
const querystring = require('querystring'); // NOTE: import default module
//var lodash = require('lodash');
var moment=require('moment');

//
// Step 1: Open login page to get cookie 'ASP.NET_SessionId' and hidden input '_ASPNetRecycleSession'.
//


var _ASPNET_SessionId;
var _ASPNetRecycleSession;

function openLoginPage() {

    function callback(response) {
        let chunks = [];
        response.addListener('data', (chunk) => {
            chunks.push(chunk);
        });
        response.on('end', () => {
            let buff = Buffer.concat(chunks);
            let html = buff.toString();
            if (response.statusCode===200) {
                let fo = fs.createWriteStream('tmp/step1-LoginPage.html');
                fo.write(html);
                fo.end();
                let cookie = response.headers['set-cookie'][0];
                let patc = new RegExp('ASP.NET_SessionId=(.*?);');
                let mc = patc.exec(cookie);
                if (mc) {
                    _ASPNET_SessionId = mc[1];
                    console.log(`Cookie ASP.NET_SessionId: ${_ASPNET_SessionId}`);
                }
                let patm =  new RegExp('<input type="hidden" name="_ASPNetRecycleSession" id="_ASPNetRecycleSession" value="(.*?)" />');
                let mm = patm.exec(html);
                if (mm) {
                    _ASPNetRecycleSession = mm[1];
                    console.log(`Element _ASPNetRecycleSession: ${_ASPNetRecycleSession}`);
                }
                console.log('Step1 login page got.\n');
                login();
            } else {
                let msg = `Step1 HTTP error: ${response.statusMessage}`;
                console.error(msg);
            }
        });
    }

    let req = http.request("http://twhratsql.whq.wistron/OGWeb/LoginForm.aspx", callback);

    req.on('error', e => {
        let msg = `Step1 Problem: ${e.message}`;
        console.error(msg);
    });

    req.end();
}

//
// Step 2: POST data to login to get cookie 'OGWeb'.
//
var OGWeb;

function login() {

    function callback(response) {
        let chunks = [];
        response.addListener('data', (chunk) => {
            chunks.push(chunk);
        });
        response.on('end', () => {
            let buff = Buffer.concat(chunks);
            let html = buff.toString();
            if (response.statusCode===302) {
                let fo = fs.createWriteStream('tmp/step2-login.html');
                fo.write(html);
                fo.end();
                let cookie = response.headers['set-cookie'][0];
                let patc = new RegExp('OGWeb=(.*?);');
                let mc = patc.exec(cookie);
                if (mc) {
                    OGWeb = mc[1];
                    console.log('Cookie OGWeb got.');
                }
                console.log('Step2 done.\n');
                step3();
            } else {
                let msg = `Step2 HTTP error: ${response.statusMessage}`;
                console.error(msg);
            }
        });
    }

    let postData = querystring.stringify({
        '__ctl07_Scroll': '0,0',
        '__VIEWSTATE': '/wEPDwULLTEyMTM0NTM5MDcPFCsAAmQUKwABZBYCAgMPFgIeBXN0eWxlBTFiZWhhdmlvcjp1cmwoL09HV2ViL3RxdWFya19jbGllbnQvZm9ybS9mb3JtLmh0Yyk7FhACCA8UKwAEZGRnaGQCCg8PFgIeDEVycm9yTWVzc2FnZQUZQWNjb3VudCBjYW4gbm90IGJlIGVtcHR5LmRkAgwPDxYCHwEFGlBhc3N3b3JkIGNhbiBub3QgYmUgZW1wdHkuZGQCDQ8PFgIeB1Zpc2libGVoZGQCDg8UKwAEZGRnaGQCEg8UKwADDxYCHgRUZXh0BSlXZWxjb21lIFRvIOe3r+WJteizh+mAmuiCoeS7veaciemZkOWFrOWPuGRkZ2QCFA8UKwADDxYCHwMFK0Jlc3QgUmVzb2x1dGlvbjoxMDI0IHggNzY4OyBJRSA2LjAgb3IgYWJvdmVkZGdkAhsPFCsAAmQoKWdTeXN0ZW0uRHJhd2luZy5Qb2ludCwgU3lzdGVtLkRyYXdpbmcsIFZlcnNpb249Mi4wLjAuMCwgQ3VsdHVyZT1uZXV0cmFsLCBQdWJsaWNLZXlUb2tlbj1iMDNmNWY3ZjExZDUwYTNhBDAsIDBkGAEFHl9fQ29udHJvbHNSZXF1aXJlUG9zdEJhY2tLZXlfXxYCBQVjdGwwNwUITG9naW5CdG6vo0TFNrmm9RKH7uSQ+NY2OXccyA==',
        '__VIEWSTATEGENERATOR': 'F163E3A2',
        '_PageInstance': '1',
        '__EVENTVALIDATION': '/wEWBAK20LBAAsiTss0OArOuiN0CArmtoJkDPmmwqug37xjPhGglEwK8JU9zleg=',
        'UserPassword': 'S0808001',
        'UserAccount': 'S0808001',
        'LoginBtn.x': '74',
        'LoginBtn.y': '10',
        '_ASPNetRecycleSession': _ASPNetRecycleSession
    });
    //console.log(postData);
    let req = http.request({
        hostname: "twhratsql.whq.wistron",
        path: "/OGWeb/LoginForm.aspx",
        method: "POST",
        headers: {
            'Cookie': 'ASP.NET_SessionId='+_ASPNET_SessionId,   // NOTED.
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    }, callback);

    req.on('error', e => {
        let msg = `Step2 Problem: ${e.message}`;
        console.error(msg);
    });

    req.write(postData);
    req.end();
}

//
// Step 3: Open EntryLogQueryForm.aspx page to get hidden input '_ASPNetRecycleSession', '__VIEWSTATE' and '__EVENTVALIDATION'.
//
var __VIEWSTATE = '';
var __EVENTVALIDATION = '';

function step3() {

    function callback(response) {
        let chunks = [];
        response.addListener('data', (chunk) => {
            chunks.push(chunk);
        });
        response.on('end', () => {
            let buff = Buffer.concat(chunks);
            let html = buff.toString();
            if (response.statusCode===200) {
                let fo = fs.createWriteStream('tmp/step3.html');
                fo.write(html);
                fo.end();
                let patm =  new RegExp('<input type="hidden" name="_ASPNetRecycleSession" id="_ASPNetRecycleSession" value="(.*?)" />');
                let mm = patm.exec(html);
                if (mm) {
                    _ASPNetRecycleSession = mm[1];
                    console.log(`Element _ASPNetRecycleSession: ${_ASPNetRecycleSession}`);
                }
                let patv =  new RegExp('<input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="(.*?)"');
                let mv = patv.exec(html);
                if (mv) {
                    __VIEWSTATE = mv[1];
                    console.log('Element __VIEWSTATE got');
                }
                let pate =  new RegExp('<input type="hidden" name="__EVENTVALIDATION" id="__EVENTVALIDATION" value="(.*?)"');
                let me = pate.exec(html);
                if (me) {
                    __EVENTVALIDATION = me[1];
                    console.log('Element __EVENTVALIDATION got');
                }
                console.log('Step3 done.\n');
                askAll();
            } else {
                let msg = `Step3 HTTP error: ${response.statusMessage}`;
                console.error(msg);
            }
        });
    }

    let req = http.request({
        hostname: "twhratsql.whq.wistron",
        path: "/OGWeb/OGWebReport/EntryLogQueryForm.aspx",
        //method: "GET",    // Default can be omitted.
        headers: {
            'Cookie': `ASP.NET_SessionId=${_ASPNET_SessionId}; OGWeb=${OGWeb}`  // important
        }
    }, callback);

    req.on('error', e => {
        let msg = `Step3 Problem: ${e.message}`;
        console.error(msg);
    });

    req.end();
}

//
// Step 4: POST data to inquire.
//
/**
 * 截取某人的刷卡资料。
 * @param {*} beginDate 开始日期
 * @param {*} endDate 截止日期
 * @param {*} employeeIdOrName 工号或名字
 * @param {*} nextPage if go to next page
 * @param {*} nextStep 完成后调用此function
 */
var begin_Date ;
var end_Date ;
function inquire(beginDate, endDate, employeeIdOrName, nextPage, nextStep) {
    begin_Date = beginDate;
    end_Date = endDate;

    function callback(response) {
        let chunks = [];
        response.addListener('data', (chunk) => {
            chunks.push(chunk);
        });
        response.on('end', () => {
            let buff = Buffer.concat(chunks);
            let html = buff.toString();
            if ( response.statusCode === 200 ) {
                let result = parseKQ(html);
                let fo = fs.createWriteStream(`tmp/step4-inquire-${employeeIdOrName}-${result.curPage}.html`);
                fo.write(html);
                fo.end();
                if ( result.curPage < result.numPages ) {
                    inquire(beginDate, endDate, employeeIdOrName, true, nextStep);
                } else {
                    console.log(`Inquiry about ${employeeIdOrName} is done.`);
                    if ( nextStep ) {   // If provided.
                        nextStep();
                    }
                }
            } else {
                console.error(`Inquiry HTTP error: ${response.statusMessage}`);
            }
        });
    }

    var beginTime = '0:00';
    var endTime = '23:59';

    let postObj = {
        'TQuarkScriptManager1': 'QueryResultUpdatePanel|QueryBtn',
        'TQuarkScriptManager1_HiddenField': ';;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:411fea1c:865923e8;;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:91bd373d:d7d5263e:f8df1b50;;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:e7c87f07:bbfda34c:30a78ec5;;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:9b7907bc:9349f837:d4245214;;AjaxControlToolkit, Version=1.0.20229.20821, Culture=neutral, PublicKeyToken=28f01b0e84b6d53e:en-US:c5c982cc-4942-4683-9b48-c2c58277700f:e3d6b3ac;',
        '__ctl07_Scroll': '0,0',
        '__VIEWSTATEGENERATOR': 'A21EDEFC',
        '_ASPNetRecycleSession': _ASPNetRecycleSession,
        '__VIEWSTATE': __VIEWSTATE,
        '_PageInstance': 26,
        '__EVENTVALIDATION': __EVENTVALIDATION,
        'AttNoNameCtrl1$InputTB': '上海欽江路',
        'BeginDateTB$Editor': beginDate,
        'BeginDateTB$_TimeEdit': beginTime,
        'EndDateTB$Editor': endDate,
        'EndDateTB$_TimeEdit': endTime,
        'EmpNoNameCtrl1$InputTB': employeeIdOrName
    };
    if ( nextPage ) {
        postObj['GridPageNavigator1$NextBtn'] = 'Next Page';
    } else {
        postObj['QueryBtn'] = 'Inquire';
    }

    let postData = querystring.stringify(postObj);

    let req = http.request({
        hostname: "twhratsql.whq.wistron",
        path: "/OGWeb/OGWebReport/EntryLogQueryForm.aspx",
        method: "POST",
        headers: {
            'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; .NET CLR 2.0.50727; .NET CLR 3.0.30729; .NET CLR 3.5.30729; MAARJS)',	// mimic IE 11 // important
            'X-MicrosoftAjax': 'Delta=true',    // important
            'Cookie': `ASP.NET_SessionId=${_ASPNET_SessionId}; OGWeb=${OGWeb}`,  // important
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    }, callback);

    req.on('error', e => {
        console.error(`Step4 Problem: ${e.message}`);
    });

    req.end(postData);
}

/**
 * Parse the input html to get 刷卡 data.
 * @param {*} html 
 * @return number of current page and number of total pages.
 */
var info_true = new Array;
let arr_info = new Array;
var clock_time_out ;
var clock_time_in ;
var clock_number = 1;

function parseKQ(html) {
    // Get number of pages.
    let curPage = 1;
    let numPages = 1;
    let rexTotal = new RegExp('<span id="GridPageNavigator1_CurrentPageLB">(.*?)</span>[^]*?<span id="GridPageNavigator1_TotalPageLB">(.*?)</span>');
    let match = rexTotal.exec(html);
    if ( match ) {
        curPage = parseInt(match[1]);
        numPages = parseInt(match[2]);
        console.log(`Page: ${curPage} / ${numPages}`);
    }

    // Update __VIEWSTATE __EVENTVALIDATION
    let rexVS = new RegExp("__VIEWSTATE[\|](.*?)[\|]");
    let matVS = rexVS.exec(html);
    if ( matVS ) {
        __VIEWSTATE = matVS[1];
    }
    let rexEV = new RegExp("__EVENTVALIDATION[\|](.*?)[\|]");
    let matEV = rexEV.exec(html);
    if ( matEV ) {
        __EVENTVALIDATION = matEV[1];
    }
    // Print 刷卡 data
    while (true) 
    {
        let rex =  new RegExp('<td>(.*?)</td><td>&nbsp;</td><td><.*?>(.*?)</a></td><td>(.*?)</td><td>.*?</td><td>(.*?)</td>',
            'g');   // NOTE: 'g' is important
        let m = rex.exec(html);
        if (m) 
        {
            let this_day = moment(`${m[4]}`).format('YYYY-MM-DD');
            let this_week = moment(this_day,'YYYY-MM-DD').format('E');
            arr_info.push({ Department :`${m[1]}`, EID :`${m[2]}` , Name : `${m[3]}` , Clock_Time : `${m[4]}` , Week : this_week , status : ''});
            html = html.substr(rex.lastIndex);
        } 
        else 
        {
			break;
        }
    }
    //console.table(info_true , ["Department","EID","Name","Clock_Time"]);
    return {curPage: curPage, numPages: numPages};
}
function timesheet()
{
    var date_diff = moment(end_Date).diff(moment(begin_Date), "day");

    arr_info.reverse();//倒序

    for(let i=0 ; i<arr_info.length; i++)
    {
        
        var this_day = moment(arr_info[i]["Clock_Time"]).format('YYYY-MM-DD');
        var this_Clock_Time = arr_info[i]["Clock_Time"];
        var week = moment(begin_Date,'YYYY-MM-DD').format('E');
        if(i != arr_info.length-1)
        {
            var next_day = moment(arr_info[i+1]["Clock_Time"]).format('YYYY-MM-DD');
            var next_EID = arr_info[i+1]["EID"]
        }
        else
        {
             next_day = null;
        }
        for(let j=0 ; j<=date_diff ; j++)
        {
            if(!moment(begin_Date).isSame(this_day))
            {
                week = moment(begin_Date,'YYYY-MM-DD').format('E');
                info_true.push({ Department :arr_info[i]["Department"], EID :arr_info[i]["EID"] , Name : arr_info[i]["Name"] , Date: begin_Date ,clock_time_in : null  , clock_time_out : null , Week : week, status : arr_info[i]["status"]});
                begin_Date = moment(moment(begin_Date).add(1, 'days')).format('YYYY-MM-DD');  
            }
            else
            {
                break;
            }
        }

        if(this_day != next_day)
        {
            clock_time_out = this_Clock_Time;
            if(clock_number == 1)
            {
                clock_time_in = this_Clock_Time;
                clock_time_out = "";
            }
            
            info_true.push({ Department :arr_info[i]["Department"], EID :arr_info[i]["EID"] , Name : arr_info[i]["Name"] , Date: this_day , clock_time_in : clock_time_in ,clock_time_out : clock_time_out, Week : week, status : arr_info[i]["status"]});
            clock_number = 1;
            begin_Date = moment(moment(begin_Date).add(1, 'days')).format('YYYY-MM-DD');
            if(arr_info[i]["EID"] != next_EID)
            {
                begin_Date = moment(moment(begin_Date).subtract(date_diff+1, 'days')).format('YYYY-MM-DD');
            }
        }
        else
        {
            if(clock_number == 1)
            {
                clock_time_in = this_Clock_Time
            }
            clock_number++;
        }
        //console.log(`i:${i},arr_info:${JSON.stringify(arr_info[i])}`);
    }
    
    for(let i=0; i<info_true.length; i++)
    {
        
        var status ='';
        var this_clock_time_day = moment(info_true[i]["Date"]).format('YYYY-MM-DD');
        var this_clock_time_in = moment(info_true[i]["clock_time_in"]).format('YYYY-MM-DD HH:mm:ss');
        var this_clock_time_out = moment(info_true[i]["clock_time_out"]).format('YYYY-MM-DD HH:mm:ss');
        var isweekend ;

        var isHoliday = moment(this_clock_time_day).isBetween('2020-12-31', '2021-1-04');

        if(info_true[i]["Week"] == 7)
        {
            isweekend = true;
            info_true[i]["Week"] = "星期日";
        }
        else if(info_true[i]["Week"] == 6)
        {
            isweekend = true;
            info_true[i]["Week"] = "星期六";
        }
        else if(info_true[i]["Week"] == 5)
        {
            isweekend = false;
            info_true[i]["Week"] = "星期五";
        }
        else if(info_true[i]["Week"] == 4)
        {
            isweekend = false;
            info_true[i]["Week"] = "星期四";
        }
        else if(info_true[i]["Week"] == 3)
        {
            isweekend = false;
            info_true[i]["Week"] = "星期三";
        }
        else if(info_true[i]["Week"] == 2)
        {
            isweekend = false;
            info_true[i]["Week"] = "星期二";
        }
        else if(info_true[i]["Week"] == 1)
        {
            isweekend = false;
            info_true[i]["Week"] = "星期一";
        }

        if(info_true[i]["clock_time_out"] == "" && info_true[i]["clock_time_in"] != "")
        {
            status += "只刷卡一次 ";
        }
        if(moment(this_clock_time_in).isAfter(this_clock_time_day+' 08:50:59'))
        {
            status += "迟到 ";
        }
        if(moment(info_true[i]["clock_time_out"]).diff(moment(info_true[i]["clock_time_in"]), 'hour') < 9)//moment(this_clock_time_out).isBefore(this_clock_time_day+' 16:50:59'))
        {
            status += "早退 ";
        }
        if(!isweekend && !isHoliday)
        {
            if(moment(info_true[i]["clock_time_out"]).diff(moment(info_true[i]["clock_time_in"]), 'hour') > 11)
            {
                status += "平时加班 ";
            }
            else if(info_true[i]["clock_time_out"] == null && info_true[i]["clock_time_in"] == null)
            {
                status = "请假 ";
            }
        }
        if(isweekend)
        {
            if(moment(info_true[i]["clock_time_out"]).diff(moment(info_true[i]["clock_time_in"]), 'hour') > 1)
            {
                status += "周末加班 ";
            }
            else
            {
                status = "周末 ";
            }
        }
        if(isHoliday)
        {
            status += "假期 ";
        }
        if(status == '')
        {
            status = "--";
        }
        info_true[i]["status"] = status;
        info_true[i]["clock_time_in"] = this_clock_time_in;
        info_true[i]["clock_time_out"] = this_clock_time_out;
    }

    console.table(info_true , ["Department","EID","Name","Date","clock_time_in","clock_time_out","Week","status"]);
}

function askAll() {
    inquire('2021-1-01', '2021-01-28', 'S2004002', false,
    ()=> inquire('2021-1-01', '2021-1-28', 'S2004001', false,
    ()=> inquire('2021-1-01', '2021-1-28', 'ANNE', false,
    ()=> inquire('2021-1-01', '2021-1-28', 'LANCE LI', false,
    ()=> inquire('2021-1-01', '2021-1-28', 'JOY YANG', false,
    function() { 
        timesheet();
        console.log("All done.") 
    } )))));
    

}

require('moment/locale/zh-cn')
moment.locale('zh-cn');
openLoginPage();    // Where it all begins.
