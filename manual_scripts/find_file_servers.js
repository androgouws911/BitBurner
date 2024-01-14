import { crawl } from 'scripts/handler/server_crawl.js';
import { listIsBlank } from 'scripts/handler/general_handler.js';

const serverDivider = "-".repeat(20);
//USAGE: run filename arg0 arg1 arg2
//Blank filters should contain "null" if other filters are needed.

// arg0 = Server Filter - i.e home | n00dles etc
// arg1 = File Filter - i.e ".cct" | ".msg" | "scripts/" etc
// arg2 = Formatting modifier - 1 - Contract Formatting
//       - 0/2/Null/anything else - Normal Formatting

/** @param {NS} ns */
export async function main(ns) {
    cleanLog(ns);

    let server = setServer(ns, ns.args[0]);
    let filter = setFilter(ns.args[1]);
    let format = setFormat(ns.args[2]);

    ns.ui.clearTerminal();
    printContract(ns, server, filter, format);
    return;

}
function printContract(ns, servers, filter, format) {
    switch (format) {
        case 1: printContractFormatting(ns, servers, filter); break;
        case 0:
        default: printNormalFormat(ns, servers, filter); break;
    }
}

function printNormalFormat(ns, servers, filter) {
    let maxNameLength = Math.max(...servers.map((x) => x.length)) + 10;
    servers.map((x) => {
        let fileList = ns.ls(x, filter);
        if (listIsBlank(fileList))
            return;

        const namePadding = " ".repeat(maxNameLength - x.length);
        ns.tprintf(`${x}${namePadding} ${JSON.stringify(fileList)}`);
    });
}

function printContractFormatting(ns, servers, filter) {
    servers.map((x) => {
        let fileList = ns.ls(x, filter);
        if (listIsBlank(fileList))
            return;

        ns.tprintf(`Server: ${x}`)
        ns.tprintf(serverDivider);
        fileList.map((y) => { ns.tprintf(y); });
        ns.tprintf("\n");
    });
}

function setFilter(arg){
    if (arg === undefined || arg === null || arg === "null")
        return "";
    
    return arg;
}

function setServer(ns, arg){
    if (arg === undefined || arg === null || arg === "null")
        return crawl(ns);
        
    return [arg];        
}

function setFormat(arg) {
    if (arg === undefined || arg === null || arg > 1 || arg === 0)
        return 0;

    return 1;
}

function cleanLog(ns) {
    ns.disableLog("disableLog");
    ns.disableLog("tprintf");
}