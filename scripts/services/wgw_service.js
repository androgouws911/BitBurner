import { writeToPort, readFromPort } from 'scripts/handler/port_handler.js';
import { getWGWPostData } from 'scripts/helpers/thread_calc_helper.js';
import { SCRIPT_RAM } from 'scripts/handler/general_handler.js';
import { ThreadServer } from 'scripts/models/thread_models.js';
import { _port_list } from 'scripts/enums/ports.js';
import { Action, Services } from 'scripts/data/file_list.js';
import { getWGWAllocation } from 'scripts/helpers/hwgw_wgw_server_alloc_helper';
import { handleTailState } from 'scripts/helpers/tail_helper';

const state = {
    Ready : 1,
    Prepped : 2,
    Hacked : 3
};

let serverObjects = [];
const home = "home";
const HALF_SECOND = 500;
const ONE_SECOND = 1000;
const TEN_SECONDS = 10000;

/** @param {NS} ns */
export async function main(ns) {
    let sizeX = 500;
    let sizeY = 450;
    let posX = 1545;
    let posY = 930;
    ns.atExit(() => {
        ns.closeTail();
        let hwgw = ns.getRunningScript(Services.HWGW, home);
        if (hwgw)
            ns.kill(hwgw.pid);
    });
    disableLogs(ns);
    await ns.sleep(TEN_SECONDS);
    while (true){        
        handleTailState(ns, sizeX, sizeY, posX, posY);
        fetchThreads(ns);
        let maxThreads = getMaxThreads();
        let data = await readFromPort(ns, _port_list.WGW_THREADS);
        if (data == null){
            await ns.sleep(HALF_SECOND);
            continue;
        }
        updateThreads(ns);
        let endTime;        
        let currentTime = new Date().getTime();
        let post = await getWGWPostData(ns, data.name, 1);
        let threads = post.W1Threads + post.W2Threads + post.GThreads;
        let player = ns.getPlayer();
        let server = ns.getServer(data.name);
        if (threads > 0){
            ns.printf(`Mending ${data.name}`);
            ns.printf(`Total Threads: [ W1:${post.W1Threads}, G:${post.GThreads}, W2:${post.W2Threads} ]`)
            let batchList = getBatchList(post);
            let toBePosted = true;
            while (toBePosted){
                let result = await executeThreadsToServers(ns, batchList, data.name);
                if (result === null)
                    toBePosted = false;
                else{  
                    let updatedPost = calculateRemaingPostData(result, post);
                    batchList = getBatchList(updatedPost);
                    threads = post.W1Threads + post.W2Threads + post.GThreads;
                    post = updatedPost;
                    updateThreads(ns);
                    let availableThreads = getAvailableThreads();
                    let minThread = threads*0.2;
                    while (availableThreads < minThread){
                        await ns.sleep(ONE_SECOND);
                        updateThreads(ns);
                        availableThreads = getAvailableThreads();

                        if (availableThreads >= maxThreads)
                            break;
                    }            
                }
            }
            let weakT = ns.formulas.hacking.weakenTime(server, player);
            currentTime = new Date().getTime();
            endTime = currentTime + weakT + TEN_SECONDS;
        }
        else{
            ns.printf(`No prep required: ${data.name}`);
            endTime = currentTime;
        }
        data.state = state.Prepped;
        data.time = endTime + ONE_SECOND;
        ns.printf(`Writing to Handler: ${data.name}`);
        ns.printf(`Wait Time: ${ns.tFormat(data.time - new Date().getTime())}`);
        ns.printf(`${"-".repeat(50)}`);
        await writeToPort(ns, _port_list.HANDLER_PORT, data);
    }
}
/** @param {NS} ns */
async function executeThreadsToServers(ns, batchList, target) {
    let totalNeeded = 0;
    let threadsUsed = 0;
    let execBuilder = [];
    for (let batch of batchList){
        let threadsNeeded = batch[1];
        totalNeeded+=threadsNeeded;
        let currentLeft = threadsNeeded;
        let action = batch[0];
        let delay = batch[2];
        let counter = 0;
        serverObjects.sort((a, b) => b.ServerName - a.ServerName);
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
            x.AvailableThreads -= useThreads;
            threadsUsed+=useThreads;
            if (currentLeft === 0 || getAvailableThreads() <= 0)
                return true;
            });
        }
    }    
    execBuilder.forEach((x) => {
        if (x[2] === 0)
            return;
        
        let actionString = `${x[0].slice(x[0].length-7, x[0].length-3)}`;
        let paddedThreads = `${x[2]}`.padEnd(5, " ");
        ns.printf(`A:${actionString} - T:${paddedThreads} D:${ns.formatNumber(x[3][1], 2)}`);
        ns.exec(x[0], x[1], x[2], ...x[3]);
    });

    if (threadsUsed !== totalNeeded)
        return execBuilder;

    return null;
}

function calculateRemaingPostData(execBuilder, postData){
    let execValues = getExecBuilderValues(execBuilder);

    let w1ExecutedItem = findItemByActionTypeAndSecondElement(Action.Weak, postData.W1Delay, execValues);
    if (w1ExecutedItem === undefined)
        w1ExecutedItem = { action: Action.Weak, threads: 0 };
    let gExecutedItem = findItemByActionTypeAndSecondElement(Action.Grow, postData.GDelay, execValues);
    if (gExecutedItem === undefined)
        gExecutedItem = { action: Action.Grow, threads: 0 };
    let w2ExecutedItem = findItemByActionTypeAndSecondElement(Action.Weak, postData.W2Delay, execValues);
    if (w2ExecutedItem === undefined)
        w2ExecutedItem = { action: Action.Weak, threads: 0 };
    let result = {
        ServerName: postData.ServerName,
        W1Delay: postData.W1Delay,
        GDelay: postData.GDelay,
        W2Delay: postData.W2Delay,
        W1Threads: postData.W1Threads - w1ExecutedItem.threads,
        GThreads: postData.GThreads - gExecutedItem.threads,
        W2Threads: postData.W2Threads - w2ExecutedItem.threads,
    };

    return result;
}

function getExecBuilderValues(execBuilderList){
    const result = [];  
    for (const item of execBuilderList) {
        const action = item[0];
        const delay = item[3][1];
    
        const existingResult = result.find((entry) => entry.action === action && entry.delay === delay);
  
        if (existingResult) {
            existingResult.threads += item[2];
        } else {
            const newResult = {
                action,
                threads: item[2],
                delay: delay,
            };
            result.push(newResult);
        }
    }

    return result;
}

function findItemByActionTypeAndSecondElement(action, delay, resultList) {
    return resultList.find((item) => item.action === action && item.delay === delay);
}

function getBatchList(data){
    let resultList = [];

    let w1Batch = getBatchItem(data.W1Delay, data.W1Threads, Action.Weak);
    let gBatch = getBatchItem(data.GDelay, data.GThreads, Action.Grow);
    let w2Batch = getBatchItem(data.W2Delay, data.W2Threads, Action.Weak);

    resultList.push(w1Batch);
    resultList.push(gBatch);
    resultList.push(w2Batch);

    return resultList;
}

function getBatchItem(delay, threads, action){
    return [action, threads, delay]
}

function getAvailableThreads(){
    return serverObjects.reduce((total, server) => {
        return total + server.AvailableThreads; }, 0);
}

function getMaxThreads(){
    return serverObjects.reduce((total, server) => {
        return total + server.MaxThreads; }, 0);
}

function updateThreads(ns) {
    fetchThreads(ns);
    serverObjects.forEach((x) => {
        x.UsedThreads = calcServerUsedThreads(ns, x.ServerName);
        x.AvailableThreads = x.MaxThreads - x.UsedThreads;
    });
}
function calcServerUsedThreads(ns, name) {
    let ram = ns.getServerUsedRam(name);
    if (ram === 0) return 0;

    return Math.ceil(ram / SCRIPT_RAM);
}

function fetchThreads(ns) {
    serverObjects = [];
    let allocate = getWGWAllocation(ns);
    allocate.forEach((x) => {
        let maxRam = ns.getServerMaxRam(x);
        let maxThreads = Math.floor(maxRam / SCRIPT_RAM);
        serverObjects.push(new ThreadServer(x, maxThreads, 0));
    });
}

function getRandomNumber() {
    let min = 1;
    let max = 150;
    let randomDecimal = Math.random();
    let randomNumber = min + randomDecimal * (max - min + 1);
    return Math.floor(randomNumber);
}

function disableLogs(ns){
    ns.disableLog("disableLog");
    ns.disableLog("getServerMaxRam");
    ns.disableLog("getServerUsedRam");
    ns.disableLog("sleep");
    ns.disableLog("getServerMoneyAvailable");
    ns.disableLog("getServerMaxMoney");
    ns.disableLog("getServerMinSecurityLevel");
    ns.disableLog("getServerSecurityLevel");
    ns.disableLog("ui.clearTerminal");
    ns.disableLog("exec");
    ns.disableLog("atExit");
    ns.disableLog("tail");
    ns.disableLog("moveTail");
    ns.disableLog("resizeTail");
    ns.disableLog("getHackingLevel");
    ns.disableLog("getPlayer");
    ns.disableLog("getServer");
}