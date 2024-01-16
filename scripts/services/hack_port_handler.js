import { getHackTargetList } from 'scripts/handler/get_best_hack_server.js';
import { writeToPort } from 'scripts/handler/port_handler.js';
import { Action, Services } from 'scripts/data/file_list.js';
import { _port_list } from 'scripts/enums/ports.js';
import { getHWGWAllocation, getWGWAllocation, setAllocations } from 'scripts/helpers/hwgw_wgw_server_alloc_helper';

//#region Constants
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

const capState = {
    High: 1,
    Low: 2,
    Mid: 3
}

const MAX_TARGETS = 15;
const TENTH_SECOND = 100;
const HALF_SECOND = 500;
const ONE_SECOND = 1000;
const HALF_MINUTE = 30000;
const ONE_MINUTE = 60000;
const TEN_MINUTES = 600000;
const NULL_MESSAGE = "NULL PORT DATA";
const home = "home";
// #endregion
// #region Variables
//General
let REFRESH_PERIOD;
let refreshState;
let lastRefreshed;
//Target Handling
let handlerList;
let targetList;
let activeList;
let deactivateList;
//Port Handlers
let hwgwPortHandler;
let wgwPortHandler;
let mainHandler;
let historyHandler;
//Instance Handling
let historyList;
let toBeKilled;
let capacityCount;
let capacityState;
let lastInstanceCheck;
let lastAllocChange;
// #endregion

/** @param {NS} ns */
export async function main(ns) {
// #region Default state values (On Start)
    handlerList = [];
    targetList = [];
    activeList = [];
    deactivateList = [];
    historyList = [];
    toBeKilled = [];
    refreshState = rstate.Ready;//Preset fetch data immediately
    capacityCount = 0;
    capacityState = capState.Mid;//Default to Mid prior to normalization
    lastInstanceCheck = new Date().getTime() + ONE_MINUTE;//Wait for 1min to allow for normalization of servers
    lastAllocChange = new Date().getTime();
    setAllocations(ns, 12,25);
// #endregion
// #region Tail view setup & exit handling (Kill all 3 services)
    ns.tail();
    ns.resizeTail(450,720);
    ns.moveTail(1295, 0);
    ns.atExit(() => {
        ns.closeTail();
        let wgw = ns.getRunningScript(Services.WGW, home);
        if (wgw)
            ns.kill(wgw.pid);
    });
// #endregion
// #region Required setup - log spam & port handler setup and clearing
    disableLogs(ns);
    hwgwPortHandler = ns.getPortHandle(_port_list.HWGW_THREADS);
    wgwPortHandler = ns.getPortHandle(_port_list.WGW_THREADS);
    mainHandler = ns.getPortHandle(_port_list.HANDLER_PORT);
    historyHandler  = ns.getPortHandle(_port_list.HISTORY_PORT);

    hwgwPortHandler.clear();
    wgwPortHandler.clear();
    mainHandler.clear();
    historyHandler.clear();
    
    addOrUpdateInstance({id: 1, target: ""});//add default HWGW instance
// #endregion
    ns.printf(`Handler Initialized`);
    await writeToPort(ns, _port_list.MAIN_SERVICE_PORT, true);
    await ns.sleep(TENTH_SECOND);
    //Active Loop
    while (true){
        REFRESH_PERIOD = setRefreshRate(ns);
        await refreshTargets(ns);//Check for new targets
        updateInstanceRequired(ns);//Check if we nees more or less instances
        await ns.sleep(HALF_SECOND);
        if (historyHandler.peek() !== NULL_MESSAGE){//check for HWGW target data
            while (historyHandler.peek() !== NULL_MESSAGE){      
                let portRead = historyHandler.read();
                let data = JSON.parse(portRead);
                
                addOrUpdateInstance(data);
                await ns.sleep(5);
            }
        }//end of Instance data update handling

        if (mainHandler.peek() !== NULL_MESSAGE){//check for active posts
            ns.printf("Handler Queue received data");
            while (mainHandler.peek() !== NULL_MESSAGE){            
                let portRead = mainHandler.read();
                let data = JSON.parse(portRead);
                if (toBeKilled.length > 0)
                    killRequiredInstance(ns, data.name);
                
                handlerList.push(data);
                await ns.sleep(5);
            }
        }//end of post handling for response port

        if (handlerList.length < 1){//No posts
            await ns.sleep(HALF_SECOND);
            continue;
        }

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
            await ns.sleep(HALF_SECOND);
            continue;
        }//end of "Waiting" area - No posts ready to be handed off

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
        }//end of HWGW queue handling

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
        }//end of WGW queue handling

        removeItem(handleItem);//Post handled - remove from queue
    }
}

// #region Target List handling
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
    let hackLevel = ns.getHackingLevel();
    if (hackLevel < 1000)
        targetList.sort((a, b) => a.time - b.time);
    else
        targetList.sort((a, b) => b.score - a.score);
    
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

    setServerAllocations(ns);
}
// #endregion
// #region Script Validations
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
// #endregion
// #region List handling
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
// #endregion
// #region Instance Caluclations
function updateInstanceRequired(ns){
    let currentTime = new Date().getTime();

    if (lastInstanceCheck + ONE_SECOND > currentTime)
        return;

    let currentState = checkCurrentCapacity(ns);

    if (currentState === capState.Mid || currentState !== capacityState){
        capacityCount = 0;
        capacityState = currentState;
    }
    else
        capacityCount++;

    if (capacityCount >= 300){
        if (currentState === capState.Low && getInstanceCount(ns) < 20)
            createInstance(ns);

        if (currentState === capState.High && getInstanceCount(ns) > 1)
            addInstanceToKillList(ns);


        capacityCount = 0;
        capacityState = capState.Mid;
    }

    lastInstanceCheck = new Date().getTime();
}

function checkCurrentCapacity(ns){
    let lowLim = 0.35;
    let highLim = 0.85;
    let purchasedServers = getHWGWAllocation(ns);
    let totalUsed = purchasedServers.reduce((total, server) => { return total + ns.getServerUsedRam(server); }, 0);
    let totalMax = purchasedServers.reduce((total, server) => { return total + ns.getServerMaxRam(server); }, 0);

    let currentRate = totalUsed / totalMax;
    if (currentRate > lowLim && currentRate < highLim)
        return capState.Mid;
    else if (currentRate < lowLim)
        return capState.Low;
    else
        return capState.High;
}

function setServerAllocations(ns){   
    let currentTime = new Date().getTime();
    
    if (lastAllocChange + HALF_MINUTE > currentTime)
        return;
    
    let hwgwAlloc = getHWGWAllocation(ns);
    let wgwAlloc = getWGWAllocation(ns);
    let hwgwCount = hwgwAlloc.length;
    let wgwCount = wgwAlloc.length;
    let totalHWGWUsed = hwgwAlloc.reduce((total, server) => { return total + ns.getServerUsedRam(server); }, 0);
    let totalHWGWMax = hwgwAlloc.reduce((total, server) => { return total + ns.getServerMaxRam(server); }, 0);
    let totalWGWUsed = wgwAlloc.reduce((total, server) => { return total + ns.getServerUsedRam(server); }, 0);
    let totalWGWMax = wgwAlloc.reduce((total, server) => { return total + ns.getServerMaxRam(server); }, 0);
    let hwgwRatio = totalHWGWUsed / totalHWGWMax;
    let wgwRatio = totalWGWUsed / totalWGWMax;

    if (hwgwRatio < 0.5 && wgwRatio < 0.5)
        return;
    
    if (hwgwRatio >= wgwRatio)
        wgwCount--;
    else
        wgwCount++;

    if (wgwCount > 23)
        wgwCount = 23;

    if (wgwCount < 1)
        wgwCount = 1;
    
    setAllocations(ns, wgwCount, 25);
    lastAllocChange = new Date().getTime();
    ns.printf(`New Alloc: H:${25-wgwCount} | W: ${wgwCount} (P:${hwgwCount}|${25-hwgwCount})`);
}
// #endregion
// #region Instance Creation / Update / Removal
function createInstance(ns){
    let count = getInstanceCount(ns);
    let instanceDetails = { id: count+1, target: "" };
    let index = -1;
    if (historyList.length > 0)
        index = historyList.findIndex(item => item.id === instanceDetails.id);

    if (index === -1)
        historyList.push(instanceDetails);

    if (!ns.isRunning(Services.HWGW, home, ...[count+1]))
        ns.exec(Services.HWGW, home, 1, ...[count+1]);
}

function addOrUpdateInstance(data){
    let index = -1;
    if (historyList.length > 0)
        index = historyList.findIndex(item => item.id === data.id);

    if (index === -1)
        historyList.push(data);
    else
        historyList[index] = data;
}

function addInstanceToKillList(ns){
    let count = getInstanceCount(ns);
    if (!toBeKilled.includes(count))
        toBeKilled.push(count);
}

function killRequiredInstance(ns, targetName){
    let index = -1;
    if (historyList.length > 0)
        index = historyList.findIndex(item => item.target === targetName);

    if (index === -1)
        return;

    if (serverDetails.id === 1)
        return;

    let serverDetails = historyList[index];
    if (toBeKilled.includes(serverDetails.id))
        initiateKill(ns, serverDetails.id);

    if (toBeKilled.length > 0){
        let tbkIndex = toBeKilled.findIndex(item => item = serverDetails.id);
        toBeKilled.splice(tbkIndex, 1);
    }
    
    historyList.splice(index, 1);
}

function initiateKill(ns, id){
    if (ns.isRunning(Services.HWGW, home, ...[id])){
        let script = ns.getRunningScript(Services.HWGW, home, ...[id]);
        if (script !== undefined && script.pid !== 0)
            ns.kill(script.pid);
    }
}

function getInstanceCount(ns){
    let homePs = ns.ps(home);
    let count = homePs.reduce((acc, obj) => {
        if (obj.filename === Services.HWGW) {
          return acc + 1;
        }
        return acc;
      }, 0);

    return count;
}
//#endregion
// #region Housekeeping
function setRefreshRate(ns){
    let hackLevel = ns.getHackingLevel();
    return getRefreshPeriod(hackLevel);
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
    { level: Infinity, value: ONE_MINUTE },
];

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
//#endregion