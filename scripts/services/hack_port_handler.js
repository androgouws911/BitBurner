import { writeToPort } from 'scripts/handler/port_handler.js';
import { getHackTargetList } from 'scripts/handler/get_best_hack_server.js';
import { Action, Services, Handler } from 'scripts/data/file_list.js';
import { _port_list } from 'scripts/enums/ports.js';

const state = {
    Ready : 1,
    Prepped : 2,
    Hacked : 3
};

const ONE_SECOND = 1000;
const FIVE_SECONDS = 5000;
const HALF_MINUTE = 30000;
const ONE_MINUTE = 60000;
const NULL_MESSAGE = "NULL PORT DATA";
const home = "home";

let waitingList;
let activeList;
let readyList;
let hwgwPortHandler;
let wgwPortHandler;
let mainHandler;
let nextPrepTime;

/** @param {NS} ns */
export async function main(ns) {
    disableLogs(ns);
    activeList = [];
    waitingList = [];
    readyList = [];
    nextPrepTime = new Date().getTime()-1000;

    ns.atExit(() => {
        ns.scriptKill(Services.WGW, home);
        ns.scriptKill(Services.HWGW, home);
        ns.closeTail();
    });

    hwgwPortHandler = ns.getPortHandle(_port_list.HWGW_THREADS);
    wgwPortHandler = ns.getPortHandle(_port_list.WGW_THREADS);
    mainHandler = ns.getPortHandle(_port_list.HANDLER_PORT);

    hwgwPortHandler.clear();
    wgwPortHandler.clear();
    mainHandler.clear();

    writeToPort(ns, _port_list.MAIN_SERVICE_PORT, true);
    
    debugger;
    while (true){
        let currentTime = new Date().getTime();
        if (nextPrepTime <= currentTime){
            ns.printf(`Prepping servers`);
            ns.run(Services.PrepHackServers, 1);
            await ns.sleep(FIVE_SECONDS);
            ns.run(Handler.AutoBackDoor, 1);
            ns.run(Handler.TorHandler, 1);
            ns.printf(`Update Target List`);
            let tempList = await getHackTargetList(ns);
            tempList.forEach((x) => {
                if (activeList.includes(x.name))
                    return;
    
                activeList.push(x.name);
                waitingList.push({name: x.name, time: currentTime});
                ns.printf(`${x.name} added to target list`);
            });
            nextPrepTime = currentTime + ONE_MINUTE;
        }//Prep servers and check for any new targets

        await ns.sleep(ONE_SECOND);

        for (let item of waitingList){
            currentTime = new Date().getTime();
            if (item.time > currentTime)
                continue;
        

            let homeScripts = getActiveHomeScripts(ns);
            let serverScripts = getActiveServerScripts(ns);
            if (hasActiveScripts(item, homeScripts) || hasActiveScripts(item, serverScripts)){
                item.time = currentTime + HALF_MINUTE;
                continue;
            }

            if (targetInIdealState(ns, item.name))
                readyList.push({ name: item.name, state: state.Prepped });
            else
                readyList.push({ name: item.name, state: state.Hacked });

            ns.printf(`${item.name} moved to ready`);
            let index = waitingList.findIndex(x => x.name === item.name);
            waitingList.splice(index, 1);
        }//Handle WaitList

        for (let item of readyList){
            await ns.sleep(ONE_SECOND);    
            let readyPost = { name: item.name, time: null };
            let postData = JSON.stringify(readyPost);
            if (item.state === state.Prepped){
                if (hwgwPortHandler.full())
                    continue;

                let writeResult = hwgwPortHandler.tryWrite(postData);
                if (!writeResult)
                    continue;

                ns.printf(`${item.name} submitted to HWGW`);
            }//Handle ready to be hacked

            if (item.state === state.Hacked){
                if (wgwPortHandler.full())
                    continue;

                let writeResult = wgwPortHandler.tryWrite(postData);
                if (!writeResult)
                    continue;

                ns.printf(`${item.name} submitted to WGW`);
            }//Handle ready to be prepped
            
            let index = readyList.findIndex(x => x.name === readyPost.name);
            readyList.splice(index, 1);
        }//Handle ready list

        await ns.sleep(ONE_SECOND);

        if (mainHandler.peek() !== NULL_MESSAGE){//check for active posts
            while (mainHandler.peek() !== NULL_MESSAGE){            
                let portRead = mainHandler.read();
                let data = JSON.parse(portRead);
                
                waitingList.push(data);
                await ns.sleep(ONE_SECOND);
            }
        }//Handle returning data

        if (waitingList.length > 1){
            let tempTime = new Date().getTime();
            let minTime = waitingList.reduce((min, item) => {
                if (item.time < min) {
                    return item.time;
                } else {
                    return min;
                }
            }, waitingList[0].time);
            let currentDate = new Date();
            let timeFormatted = currentDate.toLocaleTimeString(`sv`)
            let minTimeString = minTime - tempTime;
            ns.printf(`${timeFormatted} - W: ${waitingList.length} (${ns.tFormat(minTimeString)})`);
        }//Print next wait period

        await ns.sleep(ONE_SECOND);
    }

}

const activeScriptCheckList = [Action.Hack, Action.Grow, Action.Weak];
function hasActiveScripts(item, psList){
    for (let listItem of psList){
        let fileName = listItem.fileName;
        let target = listItem.args[0];

        if (target === item.name && activeScriptCheckList.includes(fileName))
            return true;
    }

    return false;
}

function getActiveHomeScripts(ns){
    let results = ns.ps(home);
    if (results === undefined || results === null ||results.length < 0)
        return [];
    return results;
}

function getActiveServerScripts(ns){
    let purchasedServers = ns.getPurchasedServers();
    if (purchasedServers.length < 1)
        return null;

    let results = [];
    purchasedServers.forEach((x) => {
        let psList = ns.ps(x);
        if (psList.length < 1)
            return;

        psList.forEach((y) => {
            results.push(y);
        });
    });

    return results;
}

function targetInIdealState(ns, targetName){
    let minSec = ns.getServerMinSecurityLevel(targetName);
    let curSec = ns.getServerSecurityLevel(targetName);
    let availM = ns.getServerMoneyAvailable(targetName);
    let maxM = ns.getServerMaxMoney(targetName);

    if (minSec != curSec)
        return false;

    if (availM != maxM)
        return false;

    return true;
}

function disableLogs(ns){
    ns.disableLog("disableLog");
    ns.disableLog("getServerRequiredHackingLevel");
    ns.disableLog("getServerMinSecurityLevel");
    ns.disableLog("getServerNumPortsRequired");
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("getServerSecurityLevel");
    ns.disableLog("getServerMaxMoney");
    ns.disableLog("getServerUsedRam");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("getHackingLevel");
    ns.disableLog("resizeTail");
    ns.disableLog("getPlayer");
    ns.disableLog("getServer");
    ns.disableLog("moveTail");
    ns.disableLog("atExit");
    ns.disableLog("sleep");
    ns.disableLog("scan");
    ns.disableLog("exec");
    ns.disableLog("tail");
    ns.disableLog("run");
}