/** @param {NS} ns */
export function printHandler(ns, textValue, terminalPrint) {
    const printFunction = printActions[terminalPrint];
    if (printFunction === undefined || printFunction === null)
        return ns.tprint(textValue);
    return printFunction(ns, textValue);
}

const printActions = {
    true: (ns, textValue) => {return ns.tprintf(textValue);},
    false: (ns, textValue) => {return ns.printf(textValue);}
}