import { getHackTargetList } from 'scripts/handler/get_best_hack_server.js';
import { writeToPort } from 'scripts/handler/port_handler.js';
import { Action, Services } from 'scripts/data/file_list.js';
import { _port_list } from 'scripts/enums/ports.js';

const state = {
    Ready : 1,
    Prepped : 2,
    Hacked : 3
};

const rstate = {
    Ready : 1,
    Waiting : 2,
    Update : 6
}

const MAX_TARGETS = 30;
const TENTH_SECOND = 100;
const HALF_SECOND = 500;
const ONE_SECOND = 1000;
const HALF_MINUTE = 30000;
const ONE_MINUTE = 60000;
const TEN_MINUTES = 600000;
const NULL_MESSAGE = "NULL PORT DATA";
const home = "home";

let REFRESH_PERIOD;
let handlerList;
let targetList;
let activeList;
let deactivateList;
let refreshState;
let lastRefreshed;
let hwgwPortHandler;
let wgwPortHandler;
let this_handler;


/** @param {NS} ns */
export async function main(ns) {
    //Default state (On Start)
    handlerList = [];
    targetList = [];
    activeList = [];
    deactivateList = [];
    refreshState = rstate.Ready;//Preset fetch data immediately

    //Tail view setup & exit handling (Kill all 3 services)
    ns.tail();
    ns.resizeTail(450,585);
    ns.moveTail(1295, 0);
    ns.atExit(() => {
        ns.closeTail();
        let hwgw5 = ns.getRunningScript(Services.HWGW5, home);
        if (hwgw5)
            ns.kill(hwgw5.pid);
    });
    //Required setup - log spam & port handler setup and clearing
    disableLogs(ns);
    hwgwPortHandler = ns.getPortHandle(_port_list.HWGW_THREADS);
    wgwPortHandler = ns.getPortHandle(_port_list.WGW_THREADS);
    this_handler = ns.getPortHandle(_port_list.HANDLER_PORT);

    hwgwPortHandler.clear();
    wgwPortHandler.clear();
    this_handler.clear();

    ns.printf(`Handler Initialized`);
    //Setup complete
    await writeToPort(ns, _port_list.MAIN_SERVICE_PORT, true);
    await ns.sleep(TENTH_SECOND);

    //Active Loop
    while (true){
        REFRESH_PERIOD = setRefreshRate(ns);
        await refreshTargets(ns);//Check for new targets
        await ns.sleep(HALF_SECOND);
        let peekedData = this_handler.peek();
        if (peekedData !== NULL_MESSAGE){//check for active posts
            ns.printf("Handler Queue received data");
            let portRead = this_handler.read();
            let data = JSON.parse(portRead);
            handlerList.push(data);
        }

        if (handlerList.length < 1)//No posts
            continue;

        let handleItem = findFirstCurrentItem();//Check if post ready
        if (!handleItem){//No posts ready - print time till next
            let tempTime = new Date().getTime();
            let minTime = handlerList.reduce((min, item) => {
                if (item.time < min) {
                  return item.time;
                } else {
                  return min;
                }
              }, handlerList[0].time);

            let currentDate = new Date();
            let timeFormatted = currentDate.toLocaleTimeString(`sv`)
            let minTimeString = minTime - tempTime;
            ns.printf(`${timeFormatted} - W: ${handlerList.length} (${ns.tFormat(minTimeString)})`);
            continue;
        }

        handleItem = deactivateLowTargets(ns, handleItem);//Check if post should be active
        if (handleItem === null || handleItem === undefined || !handleItem)//If no longer active
            continue;
        
        //Active and Ready to be processed
        if (handleItem.state === state.Prepped){//Ready to hack - Send to HWGW
            let scriptList = getActiveHomeScripts(ns);
            let result = hasActiveScripts(handleItem.name, scriptList);
            if (result){
                updateItemTime(handleItem, new Date().getTime() + ONE_MINUTE);                
                ns.printf(`Scripts active: ${handleItem.name} - wait 1min`);
                continue;
            }

            handleItem.state = state.Ready;
            handleItem.time = new Date().getTime();
            while (hwgwPortHandler.full()){
                ns.printf("HWGW handler full - awaiting post");
                await ns.sleep(HALF_SECOND);
            }
            ns.printf(`Writing to HWGW: ${handleItem.name}`);
            hwgwPortHandler.write(JSON.stringify(handleItem));
        }

        if (handleItem.state === state.Hacked){//Ready to prep - Send to WGW
            let scriptList = getActiveServerScripts(ns);
            let result = hasActiveScripts(handleItem.name, scriptList);
            if (result){
                updateItemTime(handleItem, new Date().getTime() + ONE_MINUTE);            
                ns.printf(`Scripts active: ${handleItem.name} - wait 1min`);
                continue;
            }

            handleItem.state = state.Ready;
            handleItem.time = new Date().getTime();
            while (wgwPortHandler.full()){
                ns.printf("WGW handler full - awaiting post");
                await ns.sleep(HALF_SECOND);
            }
            
            ns.printf(`Writing to WGW: ${handleItem.name}`);
            wgwPortHandler.write(JSON.stringify(handleItem));
        }

        removeItem(handleItem);//Post handled - remove from queue
    }
}

function handleTargetListData(ns, target){    
    let currentTime = new Date().getTime();
    let targetData = { name: target.name, time: currentTime, state: state.Ready };
    let stringData = JSON.stringify(targetData);
    if (activeList.includes(target.name)){
        ns.printf(`${target.name} already active`);
        return;
    }

    if (targetInIdealState(ns, target.name)){
        if (hwgwPortHandler.full()){
            ns.printf("HWGW handler full");
            return;
        }

        let result = hwgwPortHandler.tryWrite(stringData);
        if (!result){
            ns.printf("HWGW failed to write");
            return;
        }

    }
    else{
        if (wgwPortHandler.full()){
            ns.printf("WGW handler full");
            return;
        }

        let result = wgwPortHandler.tryWrite(stringData);
        if (!result){
            ns.printf("WGW failed to write");
            return;
        }
    }

    ns.printf(`New Target: ${target.name}`);
    activeList.push(target.name);
    if (targetList.length > 1)
        targetList = targetList.filter((x) => { return x.name !== target.name; });
}

function deactivateLowTargets(ns, data){
    if (deactivateList.length < 1)
        return data;

    if (deactivateList.includes(data.name)){
        ns.printf(`${data.name} removed from active roster`);
        let index = deactivateList.findIndex(item => item === data.name);
        deactivateList.splice(index, 1);
        return null;
    }

    return data;
}

async function refreshTargets(ns){
    let currentTime = new Date().getTime();    
    if (refreshState === rstate.Waiting){//Wait for refresh
        if (lastRefreshed + REFRESH_PERIOD > currentTime)
            return;

        ns.printf("Refresh initiated");
        refreshState = rstate.Ready;
        return;
    }
    
    if (refreshState === rstate.Ready){//Fetch All data
        ns.run(Services.PrepHackServers, 1);
        ns.printf("Prepping new hackable servers...");
        await ns.sleep(HALF_SECOND);
        refreshState = rstate.Update;
        return;
    }

    if (ns.isRunning(Services.PrepHackServers)){
        await ns.sleep(HALF_SECOND);
        return;
    }

    ns.printf(`Getting new targets....`);//Fetch target list
    targetList = await getHackTargetList(ns);
     if (targetList.length > MAX_TARGETS);
        targetList = targetList.slice(0, MAX_TARGETS);
    
    ns.printf(`Comparing ${targetList.length} targets`);
    let tempActiveStoreList = [];//Temp store current active list
    activeList.forEach((x) => tempActiveStoreList.push(x));

    for (let target of targetList){
        if (activeList.includes(target.name)){//Target should still be active
            let index = tempActiveStoreList.findIndex(item => item === target.name);
            tempActiveStoreList.splice(index, 1);
            continue;
        }
         
        await ns.sleep(HALF_SECOND);
        handleTargetListData(ns, target);//Add to active list
    }

    tempActiveStoreList.forEach((x) => {//Remove old targets from active
        let index = activeList.findIndex(item => item === x);
        if (index !== -1){
            activeList.splice(index, 1);
            deactivateList.push(x);
        }
    });

    //Reset state for next refresh
    lastRefreshed = new Date().getTime();
    ns.printf(`Refresh completed (Next: ${ns.tFormat(REFRESH_PERIOD)})`);
    refreshState = rstate.Waiting;
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

function removeItem(itemToRemove){
    let index = handlerList.findIndex(item => item === itemToRemove);
    if (index !== -1)
        handlerList.splice(index, 1);
}

function updateItemTime(itemToUpdate, newTime) {
    let index = handlerList.findIndex(item => item === itemToUpdate);
  
    if (index !== -1)
        handlerList[index].time = newTime;

}

function findFirstCurrentItem() {
    let currentTime = new Date().getTime();
    let filteredList = handlerList.filter(item => item.state === state.Prepped || item.state === state.Hacked);
    let currentItem = filteredList.find(item => currentTime > item.time);
  
    return currentItem;
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

function setRefreshRate(ns){
    let hackLevel = ns.getHackingLevel();
    return getRefreshPeriod(hackLevel);
}

function disableLogs(ns){
    ns.disableLog("disableLog");
    ns.disableLog("getServerRequiredHackingLevel");
    ns.disableLog("getServerMinSecurityLevel");
    ns.disableLog("getServerNumPortsRequired");
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("getServerSecurityLevel");
    ns.disableLog("getServerMaxMoney");
    ns.disableLog("ui.clearTerminal");
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

function getRefreshPeriod(playerHackLevel) {
    for (const threshold of refresh_threshold) {
        if (playerHackLevel < threshold.level) {
            return threshold.value;
        }
    }

    return 0; 
}

const refresh_threshold = [
    { level: 100, value: HALF_MINUTE },
    { level: 1999, value: ONE_MINUTE },
    { level: Infinity, value: TEN_MINUTES },
];