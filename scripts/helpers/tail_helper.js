import { readDataFromFile, writeDataToFile } from "scripts/handler/data_file_handler";
import { Data } from "scripts/data/file_list";

/** @param {NS} ns */
export function main(ns){
    if (ns.args[0] === undefined || !ns.args[0])
        writeDataToFile(Data.TailState, false, ns);
    else
        writeDataToFile(Data.TailState, true, ns);
}

export function oTail(ns, sizeX, sizeY, posX, posY){
    ns.tail();
    ns.resizeTail(sizeX,sizeY);
    ns.moveTail(posX, posY);
}

export function cTail(ns){
    ns.closeTail();
}

export function handleTailState(ns, sizeX, sizeY, posX, posY){
    let tailState = readDataFromFile(Data.TailState, ns)[0];
    if (tailState)
        oTail(ns, sizeX, sizeY, posX, posY);
    else
        cTail(ns);
}
