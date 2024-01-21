import { getHWGWPostData_Mock } from 'scripts/helpers/thread_calc_helper.js';
import { writeToPort } from 'scripts/handler/port_handler.js';
import { ThreadServer } from 'scripts/models/thread_models.js';
import { _port_list } from 'scripts/enums/ports.js';
import { Action } from 'scripts/data/file_list.js';

let serverObjects = [];
const TENTH_SECOND = 100;
const QUARTER_SECOND = 250;
const HALF_SECOND = 500;
const ONE_SECOND = 1000;
const FIVE_SECONDS = 5000;
const NULL_MESSAGE = "NULL PORT DATA";

let SPACING = QUARTER_SECOND;
let DELAY = 20;
let SCRIPT_RAM = 0;

/** @param {NS} ns */
export async function main(ns) {
    disableLogs(ns);
    ns.atExit(() => {
        ns.closeTail();
    });

    let targetList = [];
    let hwgwPortHandler = ns.getPortHandle(_port_list.HWGW_THREADS);
    SCRIPT_RAM = ns.getScriptRam(Action.Weak);
    await ns.sleep(FIVE_SECONDS); 

    while (true){
        if (hwgwPortHandler.peek() !== NULL_MESSAGE){//check for active posts
            while (hwgwPortHandler.peek() !== NULL_MESSAGE){
                let currentTime = new Date().getTime();
                let portRead = hwgwPortHandler.read();
                let data = JSON.parse(portRead);
                
                if (!targetList.includes(data.name)){
                    if (!targetInIdealState(ns, data.name)){
                        ns.printf(`${data.name} returned to handler. Not ideal state`);
                        data.time = currentTime;
                        ns.printf(`${"-".repeat(25)}`);
                        await writeToPort(ns, _port_list.HANDLER_PORT, data);
                    }
                    let player = ns.getPlayer();
                    let server = ns.getServer(data.name);                 
                    let weakT = ns.formulas.hacking.weakenTime(server, player);
                    data.time = currentTime + weakT;
                    data.posted = false;
                    data.lastpost = null;
                    ns.printf(`${data.name} added to target list`);
                    targetList.push(data);
                }
                
                await ns.sleep(TENTH_SECOND);
            }
            await ns.sleep(HALF_SECOND);
        }//Handle HWGW data
            
        if (targetList.length < 1)
            continue;

        fetchThreads(ns);
        updateThreads(ns);  

        for(let target of targetList){
            let currentTime = new Date().getTime();
            let player = ns.getPlayer();
            let server = ns.getServer(target.name);
            if (currentTime >= target.time){
                let postData = { name: target.name, time: currentTime }
                if (target.posted){
                    let weakT = ns.formulas.hacking.weakenTime(server, player);
                    postData.time = target.lastpost + weakT;
                }

                await writeToPort(ns, _port_list.HANDLER_PORT, postData);
                let index = targetList.findIndex(x => x.name === postData.name);
                targetList.splice(index, 1);
                ns.printf(`${postData.name} removed and submitted to handler`);
                continue;
            }
            
            if (!targetInIdealState(ns, target.name))
            continue;
        
            updateThreads(ns);  
            let availableThreads = getAvailableThreads();
            let post = await getHWGWPostData_Mock(ns, server, player, DELAY);
            let threads = post.HThreads + post.W1Threads + post.GThreads + post.W2Threads;

            if (availableThreads < threads)
                continue;

            ns.printf(`Hacking ${target.name} - [ H:${post.HThreads}, W1: ${post.W1Threads}, G:${post.GThreads}, W2: ${post.W2Threads} ]`);
            
            let batchList = getBatchList(post);
            let result = await executeThreadsToServers(ns, batchList, target.name);
            target.posted = target.posted || result;
            if (result)
                target.lastpost = new Date().getTime();
        }

        await ns.sleep(SPACING);
    }
}

function targetInIdealState(ns, targetName){
    let minSec = ns.getServerMinSecurityLevel(targetName);
    let curSec = ns.getServerSecurityLevel(targetName);
    let availM = ns.getServerMoneyAvailable(targetName);
    let maxM = ns.getServerMaxMoney(targetName);

    if (minSec !== curSec)
        return false;

    if (availM !== maxM)
        return false;

    return true;
}

/** @param {NS} ns */
async function executeThreadsToServers(ns, batchList, target) {
    let execBuilder = [];
    let totalNeeded = 0;
    let totalUsed = 0;
    for (let batch of batchList){
        let threadsNeeded = batch[1];
        totalNeeded += threadsNeeded;
        let currentLeft = threadsNeeded;
        let action = batch[0];
        let delay = batch[2];
        let counter = 0;
        serverObjects.sort((a, b) => b.AvailableThreads - a.AvailableThreads);
        while (counter < threadsNeeded) {
            if (currentLeft === 0 || getAvailableThreads() <= 0)
                break;

            serverObjects.some((x) => {
                if (x.AvailableThreads < 1)
                    return false;
                
            let useThreads = currentLeft >= x.AvailableThreads ? x.AvailableThreads : currentLeft;
            currentLeft -= useThreads;
            let randomNumber = getRandomNumber();
            let execArgs = [target, delay, randomNumber];
            execBuilder.push([action, x.ServerName, useThreads, execArgs]);
            counter += useThreads;
            totalUsed +=useThreads;
            x.AvailableThreads -= useThreads;
            
            if (currentLeft === 0 || getAvailableThreads() <= 0)
                return true;
            });
        }
    }

    if (totalNeeded !== totalUsed)
        return false;

    for (let x of execBuilder){
        while(!targetInIdealState(ns, target)){
            await ns.sleep(1);
            continue;
        }
        
        await ns.exec(x[0], x[1], x[2], ...x[3]);
    }

    return true;
}

function getAvailableThreads(){
    return serverObjects.reduce((total, server) => {
        return total + server.AvailableThreads; }, 0);
}

function getBatchList(data){
    let resultList = [];

    let hBatch = getBatchItem(data.HDelay, data.W1Threads, Action.Hack);
    let w1Batch = getBatchItem(data.W1Delay, data.W1Threads, Action.Weak);
    let gBatch = getBatchItem(data.GDelay, data.GThreads, Action.Grow);
    let w2Batch = getBatchItem(data.W2Delay, data.W2Threads, Action.Weak);

    resultList.push(hBatch);
    resultList.push(w1Batch);
    resultList.push(gBatch);
    resultList.push(w2Batch);

    return resultList;
}

function getBatchItem(delay, threads, action){
    return [action, threads, delay]
}

function updateThreads(ns) {
    serverObjects.forEach((x) => {
        x.UsedThreads = calcServerUsedThreads(ns, x.ServerName);
        x.AvailableThreads = x.MaxThreads - x.UsedThreads;
    });
}

function fetchThreads(ns) {
    serverObjects = [];
    ns.getPurchasedServers().forEach((x) => {
        let maxRam = ns.getServerMaxRam(x);
        let maxThreads = Math.floor(maxRam / SCRIPT_RAM);
        serverObjects.push(new ThreadServer(x, maxThreads, 0));
    });
}

function calcServerUsedThreads(ns, name) {
    let ram = ns.getServerUsedRam(name);
    if (ram === 0) return 0;

    return Math.ceil(ram / SCRIPT_RAM);
}

function getRandomNumber(min=1, max=150) {
    let randomDecimal = Math.random();
    let randomNumber = min + randomDecimal * (max - min + 1);
    return Math.floor(randomNumber);
}

function disableLogs(ns){
    ns.disableLog("disableLog");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("getServerUsedRam");
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("getServerMaxMoney");
    ns.disableLog("getServerMinSecurityLevel");
    ns.disableLog("getServerSecurityLevel");
    ns.disableLog("ui.clearTerminal");
    ns.disableLog("getHackingLevel");
    ns.disableLog("resizeTail");
    ns.disableLog("getPlayer");
    ns.disableLog("getServer");
    ns.disableLog("moveTail");
    ns.disableLog("atExit");
    ns.disableLog("sleep");
    ns.disableLog("exec");
    ns.disableLog("tail");
}