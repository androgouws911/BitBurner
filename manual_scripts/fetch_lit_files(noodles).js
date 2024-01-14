import { crawl } from 'scripts/handler/server_crawl.js';
import { listIsBlank } from 'scripts/handler/general_handler.js';
/** @param {NS} ns */
export async function main(ns) {
    let servers = getServerList(ns);
    let fileList = getFiles(ns, servers);
    storeLitFiles(ns, fileList);

}
function getFiles(ns, servers){
    if (listIsBlank(servers))
        return;

    let files = [];
    servers.forEach((x) => {
        let list = ns.ls(x, ".lit");
        if (listIsBlank(list))
            return;
        
        files.push([x, list]);
    });

    return files;
}
/** @param {NS} ns */
function storeLitFiles(ns, files){
    if (listIsBlank(files))
        return;
    
    

    files.forEach((x) =>{
        let noodleFiles = ns.ls("n00dles", ".lit");
        if (!noodleFiles.includes(x))
            ns.scp(x[1], "n00dles", x[0]);
    });
}

function getServerList(ns){
    let servers = crawl(ns);

    return servers.filter((x) => {
        return x !== "n00dles";
    });
}