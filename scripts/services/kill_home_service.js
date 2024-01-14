import { Services } from 'scripts/data/file_list.js';
import { writeToPort } from 'scripts/handler/port_handler.js';
import { _port_list } from 'scripts/enums/ports.js';

/** @param {NS} ns */
export async function main(ns) {
    let serviceManagerPID = getServiceMManagerPID(ns);
    let killHomeScript = ns.getRunningScript(Services.KillHome);
    if (serviceManagerPID == 0)
        ns.killall("home", true);
    else{
        let processList = ns.ps("home");

        if (processList === undefined || processList.length < 1)
            return;
        
        processList.forEach((x) =>{
            if (x.pid !== serviceManagerPID && x.pid !== killHomeScript.pid)
                ns.kill(x.pid);
        });
    }
    ns.tprintf("KillHome Completed.")
    writeToPort(ns, _port_list.MAIN_SERVICE_PORT, true);
}
/** @param {NS} ns */
function getServiceMManagerPID(ns){
    let result = 0;
    let smRunning = ns.isRunning(Services.Manager);
    if (!smRunning)
        return result;
    
    let runningScript = ns.getRunningScript(Services.Manager);
    if (runningScript != undefined && runningScript != null)
        return runningScript.pid;

    ns.printf(`Service Manager PID: ${runningScript}`)
    return result;
}