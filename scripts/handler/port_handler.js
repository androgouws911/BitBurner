 const NULL_MESSAGE = "NULL PORT DATA";
 
 /** @param {NS} ns */
export async function writeToPort(ns, portNum, writeData) {
    while(!ns.tryWritePort(portNum, JSON.stringify(writeData))){
        await ns.sleep(500);
    }
}

export async function readFromPort(ns, portNum){
    while(ns.peek(portNum) != NULL_MESSAGE){
        return JSON.parse(ns.readPort(portNum));
    }
    return null;
}

export async function peekPort(ns, portNum){
    while(ns.peek(portNum) == NULL_MESSAGE){
        await ns.sleep(500);
    }
}

/** @param {NS} ns */
export function clearNumPort(ns, portNum){
    ns.clearPort(portNum);
}
