import * as port_handler from 'scripts/handler/port_handler.js';
import { listIsBlank } from 'scripts/handler/general_handler.js';
const PORT = 10;
/** @param {NS} ns */
export async function main(ns) {
    let today = new Date();
    let dateFormatted = today.toLocaleDateString(`sv`); // YYYY-MM-DD
    let timeFormatted = today.toLocaleTimeString(`sv`);
    disableLogs(ns);
    ns.tail();
    ns.atExit(() => {
        ns.closeTail();
    });

    ns.printf(`PORT-RECEIVER: ${dateFormatted} ${timeFormatted} - START`);
    while (true) {
        today = new Date();
        dateFormatted = today.toLocaleDateString(`sv`); // YYYY-MM-DD
        timeFormatted = today.toLocaleTimeString(`sv`);
        ns.printf(`PORT-RECEIVER: ${dateFormatted} ${timeFormatted} - WAITING`);
        let data = await waitOnPort(ns);
        ns.printf(`PORT-RECEIVER: ${dateFormatted} ${timeFormatted} - POSTING`);
        if (!listIsBlank(data)) {
            ns.tprintf(`PORT-RECEIVER: ${dateFormatted} ${timeFormatted} - ${JSON.stringify(data)}`);
            ns.printf(`PORT-RECEIVER: ${dateFormatted} ${timeFormatted} - ${JSON.stringify(data)}`);
            data = null;
            ns.printf(`PORT-RECEIVER: ${dateFormatted} ${timeFormatted} - DATACLEARED`);
        }
        ns.printf(`PORT-RECEIVER: ${dateFormatted} ${timeFormatted} - LOOPING`);
        await ns.sleep(500);
    }
}

async function waitOnPort(ns) {
    let today = new Date();
    let dateFormatted = today.toLocaleDateString(`sv`); // YYYY-MM-DD
    let timeFormatted = today.toLocaleTimeString(`sv`);
    ns.printf(`PORT-RECEIVER: ${dateFormatted} ${timeFormatted} - WAITINGONPORT`);
    return await port_handler.readFromPort(ns, PORT);
}

function disableLogs(ns){
    ns.disableLog("disableLog")
    ns.disableLog("sleep");

}