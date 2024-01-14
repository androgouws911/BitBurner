/** @param {NS} ns */
export async function main(ns) {
    ns.disableLog("disableLog");
    ns.disableLog("tprintf");
    ns.disableLog("ui.clearTerminal");
    ns.ui.clearTerminal();
    let jsFiles = ns.ls("home", ".js");
    let txtFiles = ns.ls("home", ".txt");
    if (ns.args[0] !== undefined) {
        jsFiles = filterFiles(ns.args[0], jsFiles);
        txtFiles = filterFiles(ns.args[0], txtFiles);
    }

    if (ns.args[1] !== undefined) {
        jsFiles = addRAMRequired(jsFiles, ns);
    }

    jsFiles = sortList(jsFiles);
    txtFiles = sortList(txtFiles);

    ns.tprintf(`
Scripts
-------------------`);
    jsFiles.forEach((x) => {
        ns.tprintf(`${x}`);
    });
    ns.tprintf(`-------------------

Data
-------------------`);
    txtFiles.forEach((x) => {
        ns.tprintf(`${x}`);
    });
    ns.tprintf(
        `------------------`);
}

function filterFiles(filterText, dataList) {
    if (dataList.length < 1)
        return dataList;

    return dataList.filter((str) => str.includes(filterText));
}
/** @param {NS} ns */
function addRAMRequired(dataList, ns) {
    if (dataList.length < 1)
        return dataList;

    const maxNameLength = Math.max(...dataList.map((x) => x.length)) + 10;
    const formattedStrings = dataList.map((x) => {
        const namePadding = " ".repeat(maxNameLength - x.length);
        return `${x}${namePadding} | RAM: ${ns.getScriptRam(x)}GB`;
    });

    return formattedStrings;
}

function sortList(stringList) {
    const linesWithSlash = stringList.filter((line) => line.includes('/'));
    const linesWithoutSlash = stringList.filter((line) => !line.includes('/'));
    const sortedLinesWithSlash = linesWithSlash.sort((a, b) => a.localeCompare(b));
    const sortedLinesWithoutSlash = linesWithoutSlash.sort((a, b) => a.localeCompare(b));
    const sortedList = sortedLinesWithSlash.concat(sortedLinesWithoutSlash);

    return sortedList;
}