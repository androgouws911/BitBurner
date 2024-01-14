import { Action } from 'scripts/data/file_list.js';
const copyList = [ Action.Hack, Action.Grow, Action.Weak];

/** @param {NS} ns */
export async function main(ns) {
    let target = ns.args[0];
    let copied = ns.scp(copyList, target, "home");
    if (!copied)
        ns.tprint(`ERROR: Failed to copy files to ${target} (copy)`);
}
