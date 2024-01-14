import { ContractModel } from 'scripts/models/contract_model.js'
import { submitAnswer } from 'scripts/handler/submit_answer.js';
import { readFromPort } from 'scripts/handler/port_handler.js';
import { listIsBlank } from 'scripts/handler/general_handler.js';
import { _port_list} from 'scripts/enums/ports.js';
import { _timeout } from 'scripts/enums/timeout.js';
import * as hamming_codes from 'cct_scripts/hamming_code.js';
import * as general_codes from 'cct_scripts/general_solvers.js';
import * as lz_codes from 'cct_scripts/lz_code.js';

/** @param {NS} ns */
export async function main(ns) {
    disableLogs(ns);
    let data = await getPortData(ns);

    if (data == null)
        return;

    let contractList = Array.isArray(data) ? data : JSON.parse(data);
    let submissions = getContractSolverData(ns, contractList);
    let successCount = 0;
    let processedCount = 0;

    if (listIsBlank(submissions))
        return;

    let targetBuffer = Math.max(...submissions.map((z) => z.Target.length));
    let fileBuffer = Math.max(...submissions.map((y) => y.ContractFile.length));
    let typeBuffer = Math.max(...submissions.map((x) => x.Type.length));
    let lengths = [targetBuffer, fileBuffer, typeBuffer];
    submissions.forEach((x) => {
        let contract = new ContractModel(x);
        let answer = solverHandler(contract);
        let result = submitAnswer(ns, answer, contract, lengths);
        ns.printf(`${answer} Submitted: ${result}`);
        if (result !== null && result !== "")
            successCount++;

        processedCount++;
    });
    if (processedCount == 0){
        ns.tprintf("ERROR: FAILED TO SOLVE CONTRACTS");
        return;
    }

    ns.tprintf(`SUCCESS: CONTRACTS_SOLVER - ${successCount} contracts processed. (${processedCount} attempts)`)

}

async function getPortData(ns){
    let data = null;
    while (data == null){
        data = await readFromPort(ns, _port_list.CONTRACT_PORT);
        ns.printf(JSON.stringify(data));
        if (data == null)
            await ns.sleep(_timeout.SECONDS_10);
    }
    
    return data;
}

/** @param {NS} ns */
function solverHandler(contract) {
    const contractType = contract.Type;
    const actionFunction = contractActions[contractType];
    if (!contractActions.hasOwnProperty(contractType))
        return contractActions.default();

    return actionFunction(contract);
}
/** @param{NS} ns */
function getContractSolverData(ns, contractList) {
    if (listIsBlank(contractList))
        return null;

        let submissions = [];
        for (let item of contractList) {
            if (!ns.fileExists(item[1], item[0]))
                continue;
            
            let contractItem = {
                Target: item[0],
                ContractFile: item[1],
                Type: ns.codingcontract.getContractType(item[1], item[0]),
                Data: ns.codingcontract.getData(item[1], item[0])
            };
            let contObj = new ContractModel(contractItem.Type, contractItem.Data, "", 10, contractItem.ContractFile, contractItem.Target);
            submissions.push(contObj);
        }

    if (listIsBlank(submissions))
        return null;

    return submissions;
}

/** @param {NS} ns */
function disableLogs(ns) {
    ns.disableLog("disableLog");
    ns.disableLog("codingcontract.attempt");
    ns.disableLog("codingcontract.getContractType");
    ns.disableLog("codingcontract.getData");
    ns.disableLog("sleep");
}

const contractActions = {
    "Algorithmic Stock Trader I": (contract) => { return general_codes.algorithmicStockTraderI(contract.Data); },
    "Algorithmic Stock Trader II": (contract) => { return general_codes.algorithmicStockTraderII(contract.Data); },
    "Algorithmic Stock Trader III": (contract) => { return general_codes.algorithmicStockTraderIII(contract.Data); },
    "Algorithmic Stock Trader IV": (contract) => { return general_codes.algorithmicStockTraderIV(contract.Data); },
    "Array Jumping Game": (contract) => { return general_codes.arrayJumpingGameI(contract.Data); },
    "Array Jumping Game II": (contract) => { return general_codes.arrayJumpingGameII(contract.Data); },
    "Compression I: RLE Compression": (contract) => { return general_codes.rleCompression(contract.Data); },
    "Compression II: LZ Decompression": (contract) => { return lz_codes.decode(contract.Data); },
    "Compression III: LZ Compression": (contract) => { return lz_codes.encode(contract.Data); },
    "Encryption I: Caesar Cipher": (contract) => { return general_codes.ceaserCipher(contract.Data); },
    "Encryption II: Vigenère Cipher": (contract) => { return general_codes.vigenereCiphere(contract.Data); },
    "Find All Valid Math Expressions": (contract) => { return general_codes.findValidMathExpressions(contract.Data); },
    "Find Largest Prime Factor": (contract) => { return general_codes.findLargestPrime(contract.Data); },
    "Generate IP Addresses": (contract) => { return general_codes.generateIPAddresses(contract.Data); },
    "HammingCodes: Integer to Encoded Binary": (contract) => { return hamming_codes.encode(contract.Data); },
    "HammingCodes: Encoded Binary to Integer": (contract) => { return hamming_codes.decode(contract.Data); },
    "Merge Overlapping Intervals": (contract) => { return general_codes.mergeOverlappingIntervals(contract.Data); },
    "Minimum Path Sum in a Triangle": (contract) => { return general_codes.minimumPathTriangle(contract.Data); },
    "Proper 2-Coloring of a Graph": (contract) => { return general_codes.properColoring(contract.Data); },
    "Sanitize Parentheses in Expression": (contract) => { return general_codes.sanitizeParentheses(contract.Data); },
    "Shortest Path in a Grid": (contract) => { return general_codes.shortestPath(contract.Data); },
    "Spiralize Matrix": (contract) => { return general_codes.spiralizedMatrix(contract.Data); },
    "Subarray with Maximum Sum": (contract) => { return general_codes.subArrayWithMaximumSum(contract.Data); },
    "Total Ways to Sum": (contract) => { return general_codes.totalWaysToSum(contract.Data); },
    "Total Ways to Sum II": (contract) => { return general_codes.totalWaysToSumII(contract.Data); },
    "Unique Paths in a Grid I": (contract) => { return general_codes.uniquePaths(contract.Data); },
    "Unique Paths in a Grid II": (contract) => { return general_codes.uniquePathsII(contract.Data); },
    default: () => { return null; } // Default action when contract.Type is not found
};