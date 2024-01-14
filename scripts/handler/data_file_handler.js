/** @param {NS} ns */
export function readDataFromFile(fileName, ns) {
    let data = ns.read(fileName);
    let dataList = data.split("|");
    if (Array.isArray(dataList)){
        if (dataList < 1)
            return null;
    
        let results = [];
        dataList.forEach((x) => {
            let record = JSON.parse(x);
            results.push(record);
        });
    
        if (results.length < 1)
            return null;
    
        return results;
    }
    else
        return data;
}
/** @param {NS} ns */
export function writeDataToFile(fileName, dataList, ns) {
    let stringyData = getStringData(dataList, ns);
    if (ns.fileExists(fileName))
        ns.clear(fileName);
    ns.write(fileName, stringyData);
}

export function getStringData(data) {
    if (data.length == 0)
        return "";

    if (Array.isArray(data)) {
        let stringyData = "";
        data.forEach((x) => {
            let stringyX = JSON.stringify(x);
            stringyData += "|" + stringyX;
        });

        if (stringyData[0] == '|')
            stringyData = stringyData.slice(1);

        return stringyData;
    }

    return JSON.stringify(data);

}