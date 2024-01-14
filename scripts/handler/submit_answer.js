




/** @param {NS} ns */
export function submitAnswer(ns, answer, contract, lengthList) {
    disableLogs(ns);
    const UNDEFINED = "ERROR: CONTRACT NULL / UNDEFINED)";

    if (contract === null || contract === undefined) {
        ns.printf(UNDEFINED);
        return null;
    }

    const TARGET_LENGTH = Math.max(lengthList[0] - contract.Target.length + 5, 11 - lengthList[0]);
    const FILE_LENGTH = Math.max(lengthList[1] - contract.ContractFile.length + 5, 13 - lengthList[1]);
    const TYPE_LENGTH = Math.max(lengthList[2] - contract.Type.length + 5, 18 - lengthList[2]);
    const TARGET_BUFFER = " ".repeat(TARGET_LENGTH);
    const FILE_BUFFER = " ".repeat(FILE_LENGTH);
    const TYPE_BUFFER = " ".repeat(TYPE_LENGTH);
    
    const COMMON_MESSAGE_CONCAT = ` ${contract.Target}${TARGET_BUFFER}| ${contract.ContractFile}${FILE_BUFFER}| ${contract.Type}${TYPE_BUFFER}| `;
    const ANSWER_NULL = `ERROR:       |${COMMON_MESSAGE_CONCAT}ANSWER WAS NULL - CHECK CODE FOR THIS SOLVER`;
    if (answer === null) {
        ns.printf(ANSWER_NULL);
        return "";
    }
    
    let result = ns.codingcontract.attempt(answer, contract.ContractFile, contract.Target);
    
    const DESTROYED = `ERROR:       |${COMMON_MESSAGE_CONCAT}Contract Destroyed`;
    if (result == "") {
        if (contract.Remaining === 1) {
            ns.printf(DESTROYED);
            return "";
        }
        contract.Remaining = ns.codingcontract.getNumTriesRemaining(contract.ContractFile, contract.Target);
        const NUM_TRY_REMAINING = `ERROR:       |${COMMON_MESSAGE_CONCAT}${contract.Remaining} attempts remaining.`;
        ns.printf(NUM_TRY_REMAINING);
        return "";
    }
    
    const SUCCESS = `SUCCESS:     |${COMMON_MESSAGE_CONCAT}${result}`;
    ns.printf(SUCCESS);
    return result;
}

function disableLogs(ns){
    ns.disableLog("disableLog");
    ns.disableLog("printf");
    ns.disableLog("tprintf");
}