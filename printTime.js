export function main(ns){
    ns.disableLog("disableLog");
    ns.disableLog("tprintf");
    let today = new Date();
    let dateFormatted = today.toLocaleDateString(`sv`); // YYYY-MM-DD
    let timeFormatted = today.toLocaleTimeString(`sv`);
    ns.tprintf(`${dateFormatted} ${timeFormatted}`);
}