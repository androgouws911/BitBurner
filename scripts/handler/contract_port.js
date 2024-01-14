import { _port_list } from 'scripts/enums/ports.js';
import { Handler } from 'scripts/data/file_list.js';
import { _timeout } from 'scripts/enums/timeout.js';

const NULL_MESSAGE = "NULL PORT DATA";

/** @param {NS} ns */
export async function main(ns) {
    disableLogs(ns);
    while (true) {
        await waitForPeekedData(ns);
        await ns.sleep(_timeout.MINUTE_5);
    }
}
/** @param {NS} ns */
async function waitForPeekedData(ns) {
    while (ns.peek(_port_list.CONTRACT_PORT) == NULL_MESSAGE) {
        await ns.sleep(_timeout.SECONDS_2);
    }
    ns.printf(`PEEKDED: ${ns.printf(ns.peek(_port_list.CONTRACT_PORT))}`);
    if (!ns.isRunning(Handler.ContractSolver)) {
        ns.run(Handler.ContractSolver, 1);
    }
}

function disableLogs(ns) {
    ns.disableLog("disableLog")
    ns.disableLog("sleep");
    ns.disableLog("peek");
    ns.disableLog("run");
}