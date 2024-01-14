import { writeDataToFile } from 'scripts/handler/data_file_handler.js';
import { Data } from 'scripts/data/file_list.js';

/** @param {NS} ns */
export async function main(ns) {
    writeDataToFile(Data.ShouldKill, true, ns);
}