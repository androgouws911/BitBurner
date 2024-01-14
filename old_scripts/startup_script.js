const home = "home";
import { bestServerArgs } from 'old_scripts/get_best_hackable_server.js';
const loopSleeper = 60000;

/** @param {NS} ns */
export async function main(ns) {
    var idealPID = 0;
    ns.run('old_scripts/prep_all_servers.js');
    let bBusy = true;
    while (bBusy){
        await ns.sleep(100);        
        if (!ns.isRunning(`old_scripts/prep_all_servers.js`))
            bBusy = false;
    }
    await ns.sleep(1000);
    let pidList = ns.ps(home);
    let prepId = findPidByFilename(pidList, 'old_scripts/prep_all_servers.js');
    bBusy = true;
    while (bBusy){
        await ns.sleep(500);
        if (!ns.isRunning(prepId))
            bBusy = false;
    }
    let managerRunning = findPidByFilename(pidList, "old_scripts/ideal_manage.js");
    await ns.sleep(2000);
    if (managerRunning === null || managerRunning === 0) {
        ns.run("old_scripts/setup_idle_hackable.js");
        await ns.sleep(2000);
    }

    var tempScriptList = ns.ps(home);
    idealPID = findPidByFilename(tempScriptList, "old_scripts/ideal_manage.js");
    if (idealPID === null || idealPID === 0) {
        ns.tprint("CRITICAL - MANAGE SCRIPT EXECUTION FAILURE");
        return;
    }

    while (true) {
        let currentPIDList = ns.ps(home);
        let currentArgs = getArgsByPID(currentPIDList, idealPID);
        let currentServer = currentArgs[0];
        let bestArgs = await bestServerArgs(ns);
        let bestServer = bestArgs[0];

        if (currentServer != bestServer) {
            await killManagerLoop(ns);
            idealPID = ns.run("old_scripts/setup_idle_hackable.js");
        }

        await ns.sleep(loopSleeper);
    }
}

/** @param {NS} ns */
async function killManagerLoop(ns) {
    var waitForScripts = true;
    while (waitForScripts) {
        await ns.sleep(1000);
        let activeScripts = ns.ps(home);
        try {
            let managerPID = findPidByFilename(activeScripts, "old_scripts/ideal_manage.js");
            let hackPID = findPidByFilename(activeScripts, "old_scripts/ideal_hack.js");
            let weakenPID = findPidByFilename(activeScripts, "old_scripts/ideal_weaken.js");
            let growPID = findPidByFilename(activeScripts, "old_scripts/ideal_grow.js");

            if (managerPID !== 0)
                await ns.kill(managerPID);

            if (hackPID !== 0)
                await ns.kill(hackPID);

            if (weakenPID !== 0)
                await ns.kill(weakenPID);

            if (growPID !== 0)
                await ns.kill(growPID);

            if (managerPID === 0 && growPID === 0 && weakenPID === 0 && hackPID === 0)
                waitForScripts = false;
        }
        catch (err) {
            ns.printf(`ERROR: killManagerLoop - ${err}`);
            ns.tail();
        }
    }
}

function getArgsByPID(sourceList, pidToFind) {
    if (pidToFind === 0 || pidToFind === null)
        return null;
    const item = sourceList.find(item => item.pid === pidToFind);
    return item ? item.args : null;
}

function findPidByFilename(scriptList, targetFilename) {
    for (const item of scriptList) {
        if (item.filename === targetFilename)
            return item.pid;
    }
    return 0;
}