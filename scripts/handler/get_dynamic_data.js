import { DynamicServerData } from 'scripts/models/dynamic_server_model.js';
import { Action, Data } from 'scripts/data/file_list.js';
import { readDataFromFile, writeDataToFile } from 'scripts/handler/data_file_handler.js';
import { SCRIPT_RAM } from 'scripts/handler/general_handler.js';

export async function main(ns) {
    let data = readDataFromFile(Data.Static, ns);
    let dynamicDataList = []
    data.forEach((x) =>{
        let name = x.ServerName;
        let maxThreads = Math.floor(x.MaxRAM / SCRIPT_RAM);
        let filesCopied = ns.fileExists(Action.Weak, x.ServerName);
        let rootStatus = ns.hasRootAccess(name);

        let dynamicData = new DynamicServerData(name, maxThreads, filesCopied, rootStatus);
        dynamicDataList.push(dynamicData);
    });
    
    writeDataToFile(Data.Dynamic, dynamicDataList, ns);
}