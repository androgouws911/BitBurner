import { writeDataToFile } from 'scripts/handler/data_file_handler.js';

export function crawl(ns) {
    let serversSeen = ['home'];

    for (let i = 0; i < serversSeen.length; i++) {
        if (serversSeen[i] === undefined)
            continue;
        
        let check = serversSeen[i];
        if (check === undefined)
            continue;
        
        let thisScan = ns.scan(check);
        for (let j = 0; j < thisScan.length; j++) {
            if (serversSeen.indexOf(thisScan[j]) === -1) {
                serversSeen.push(thisScan[j]);
            }
        }
    }
    
    return serversSeen;
}

export function crawlToFile(ns, file) {
    let servers = crawl(ns);
    writeDataToFile(file, servers, ns);
}

export function filteredCrawlToFile(ns, filters, file) {
    let servers = filteredCrawl(ns, filters);
    writeDataToFile(file, servers, ns);
}

export function filteredCrawl(ns, filters) {
    let servers = crawl(ns);
    servers = filterList(servers, filters);
    return servers;
}

function filterList(sourceList, removeList) {
    if (sourceList.length < 1)
        return sourceList;

    return sourceList.filter(function (rl) {
        return !removeList.includes(rl);
    });
}