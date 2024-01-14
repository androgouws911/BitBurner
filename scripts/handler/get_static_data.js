import { StaticServerData } from 'scripts/models/static_server_model.js';
import { Data } from 'scripts/data/file_list.js';
import { readDataFromFile, writeDataToFile } from 'scripts/handler/data_file_handler.js';

export async function main(ns) {
    let data = readDataFromFile(Data.All, ns);
    let staticDataList = [];
    data.forEach((x) => {
        let name = x;
        let maxMoney = ns.getServerMaxMoney(x);
        let maxRam = ns.getServerMaxRam(x);
        let ports = ns.getServerNumPortsRequired(x);
        let hackLevel = ns.getServerRequiredHackingLevel(x);
        let minSec = ns.getServerMinSecurityLevel(x);

        let staticData = new StaticServerData(name, maxMoney, maxRam, ports, hackLevel, minSec);
        staticDataList.push(staticData);
    });

    writeDataToFile(Data.Static, staticDataList, ns);
}