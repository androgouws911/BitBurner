import { readDataFromFile, writeDataToFile } from "scripts/handler/data_file_handler";
import { Data } from "scripts/data/file_list";

let currentState;
let lastWrite;

/** @param {NS} ns */
export function main(ns){
    if (ns.args[0] === undefined || !ns.args[0])
        currentState = false;//writeDataToFile(Data.TailState, false, ns);
    else
        currentState = true;//writeDataToFile(Data.TailState, true, ns);
    lastWrite = new Date().getTime();
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
    let currentTime = new Date().getTime();
    if (currentTime < lastWrite + 60000){
        if (currentState)
            oTail(ns, sizeX, sizeY, posX, posY);
        else
            cTail(ns);
    }

    // let tailState = readDataFromFile(Data.TailState, ns)[0];

}
