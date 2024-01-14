import { filteredCrawlToFile } from 'scripts/handler/server_crawl.js';
import { listIsBlank } from 'scripts/handler/general_handler.js';
import { Data } from 'scripts/data/file_list.js';
/** @param {NS} ns */
export async function main(ns) {
    let ignoreList = [];
    ignoreList = addToList(ignoreList, ["home"]);
    filteredCrawlToFile(ns, ignoreList, Data.All);
}

function addToList(returnList, addList){
        if (listIsBlank(addList))
            return returnList;

        addList.forEach((x) => {
            if (!returnList.includes(x))
                returnList.push(x);
        });

    return returnList;
}