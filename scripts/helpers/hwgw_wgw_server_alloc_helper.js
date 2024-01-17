let WGW_RESERVED = 0.5;

export function getHWGWAllocation(ns){    
    let purchasedServers = ns.getPurchasedServers();
    let pSCount = purchasedServers.length;
    let wgwCount = Math.ceil(WGW_RESERVED * pSCount);
    return purchasedServers.slice(0, purchasedServers.length-wgwCount); 
}

export function getWGWAllocation(ns){   
    let purchasedServers = ns.getPurchasedServers();
    let pSCount = purchasedServers.length;
    let wgwCount = Math.floor(WGW_RESERVED * pSCount);  
    return purchasedServers.slice(purchasedServers.length-wgwCount);
}

export function setAllocations(ns, wgwCount, serverCount){    
    let result = (wgwCount / serverCount) * 100;
    if (isNaN(result))
        result = 40;

    result = roundDownToNearestFour(result);
    result = result / 100;

    if (result > 0.96)
        result = 0.96;

    if (result < 0.04)
        result = 0.04;
    WGW_RESERVED = result;
}

function roundDownToNearestFour(number) {
    return Math.floor(number / 4) * 4;
}
