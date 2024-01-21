const factionExludeList = ["Sector-12", "Volhaven","Chongqing","New Tokyo","Ishima","Aevum"];

/** @param {NS} ns */
export async function main(ns) {
    let factionList = ns.singularity.checkFactionInvitations();
    let filteredList = filterList(factionList, factionExludeList);

    if (filteredList.length > 0)
        filteredList.forEach((x) => ns.singularity.joinFaction(x));
}

function filterList(sourceList, removeList) {
    if (sourceList.length < 1)
        return sourceList;

    return sourceList.filter(function (rl) {
        return !removeList.includes(rl);
    });
}