import { Handler, Services } from 'scripts/data/file_list.js';
import { _timeout } from 'scripts/enums/timeout.js';

/** @param {NS} ns */
export async function main(ns) {
    disableLogs(ns);
    let startTime = new Date();
    while (true){
        if (!ns.isRunning(Handler.ContractPortHandler))
            ns.run(Handler.ContractPortHandler, 1);
        
        await ns.sleep(_timeout.SECONDS_5);
        
        if (!ns.isRunning(Handler.ContractReader))
            ns.run(Handler.ContractReader, 1);

        await ns.sleep(_timeout.MINUTE_5);

        let currentTime = new Date();
        if (currentTime > startTime + _timeout.HOUR_1)
            break;
    }

    killContractScript(ns);
    ns.run(Services.Contract, 1 , ...[startTime]);
}

function killContractScript(ns){
    let homeP = ns.ps(server);
    let contractHandlers = homeP.filter((x) => x.filename === Handler.ContractReader ||
         x.filename === Handler.ContractSolver || filename === Handler.ContractPortHandler);
    for (let runScript in contractHandlers){
        ns.kill(runScript.pid);
    }
}

/** @params {NS} ns */
function disableLogs(ns) {
    ns.disableLog("disableLog");
    ns.disableLog("tail");
    ns.disableLog("sleep");
    ns.disableLog("run");
    ns.disableLog("scan");
    ns.disableLog("isRunning");
}