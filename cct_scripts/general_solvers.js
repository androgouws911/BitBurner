export function algorithmicStockTraderI(data) {
    let maxCur = 0;
    let maxSoFar = 0;
    for (let i = 1; i < data.length; ++i) {
        maxCur = Math.max(0, maxCur += data[i] - data[i - 1]);
        maxSoFar = Math.max(maxCur, maxSoFar);
    }

    return maxSoFar;
}

export function algorithmicStockTraderII(data) {
    let profit = 0;
    for (let p = 1; p < data.length; ++p) {
        profit += Math.max(data[p] - data[p - 1], 0);
    }

    return profit;
}

export function algorithmicStockTraderIII(data) {
    let hold1 = Number.MIN_SAFE_INTEGER;
    let hold2 = Number.MIN_SAFE_INTEGER;
    let release1 = 0;
    let release2 = 0;
    for (const price of data) {
        release2 = Math.max(release2, hold2 + price);
        hold2 = Math.max(hold2, release1 - price);
        release1 = Math.max(release1, hold1 + price);
        hold1 = Math.max(hold1, price * -1);
    }

    return release2;
}

export function algorithmicStockTraderIV(data) {
    const k = (data[0]);
    const prices = (data[1]);

    const len = prices.length;
    if (len < 2) { return (parseInt(0)); }
    if (k > len / 2) {
        let res = 0;
        for (let i = 1; i < len; ++i) {
            res += Math.max(prices[i] - prices[i - 1], 0);
        }

        return res;
    }

    const hold = [];
    const rele = [];
    hold.length = k + 1;
    rele.length = k + 1;
    for (let i = 0; i <= k; ++i) {
        hold[i] = Number.MIN_SAFE_INTEGER;
        rele[i] = 0;
    }

    let cur;
    for (let i = 0; i < len; ++i) {
        cur = prices[i];
        for (let j = k; j > 0; --j) {
            rele[j] = Math.max(rele[j], hold[j] + cur);
            hold[j] = Math.max(hold[j], rele[j - 1] - cur);
        }
    }

    return rele[k];
}

export function arrayJumpingGameI(data) {
    const n = data.length;
    let i = 0;
    for (let reach = 0; i < n && i <= reach; ++i) {
        reach = Math.max(i + data[i], reach);
    }
    const solution = (i === n);

    return solution ? 1 : 0;
}

export function arrayJumpingGameII(data) {
    const n = data.length;
    let reach = 0;
    let jumps = 0;
    let lastJump = -1;
    while (reach < n - 1) {
        let jumpedFrom = -1;
        for (let i = reach; i > lastJump; i--) {
            if (i + data[i] > reach) {
                reach = i + data[i];
                jumpedFrom = i;
            }
        }
        if (jumpedFrom === -1) {
            jumps = 0;
            break;
        }
        lastJump = jumpedFrom;
        jumps++;
    }
    return jumps;
}

export function findLargestPrime(number) {
    let divisor = 2;
    while (number > 1) {
        if (number % divisor === 0) {
            number /= divisor;
        } else {
            divisor++;
        }
    }
    return divisor;
}

export function generateIPAddresses(data) {
    const ret = [];
    for (let a = 1; a <= 3; ++a) {
        for (let b = 1; b <= 3; ++b) {
            for (let c = 1; c <= 3; ++c) {
                for (let d = 1; d <= 3; ++d) {
                    if (a + b + c + d === data.length) {
                        const A = parseInt(data.substring(0, a), 10);
                        const B = parseInt(data.substring(a, a + b), 10);
                        const C = parseInt(data.substring(a + b, a + b + c), 10);
                        const D = parseInt(data.substring(a + b + c, a + b + c + d), 10);
                        if (A <= 255 && B <= 255 && C <= 255 && D <= 255) {
                            const ip = [A.toString(), ".",
                                        B.toString(), ".",
                                        C.toString(), ".",
                                        D.toString()].join("");
                            if (ip.length === data.length + 3) {
                                ret.push(ip);
                            }
                        }
                    }
                }
            }
        }
    }
    return ret;
}

export function mergeOverlappingIntervals(data) {
    let i, j;
    let rangeMax = 0;
    let rangeMin = 999;
    let outputRanges = [];

    for (i = 0; i < data.length; i++) {
        rangeMin = Math.min(rangeMin, data[i][0]);
        rangeMax = Math.max(rangeMax, data[i][1]);
    }

    let activeRange = 0;
    let startRange, inRange;

    for (i = rangeMin; i <= rangeMax + 1; i++) {
        inRange = 0;

        for (j = 0; j < data.length; j++) {
            if (i >= data[j][0] && i < data[j][1]) {
                inRange = 1;

                if (activeRange === 0) {
                    activeRange = 1;
                    startRange = i;
                }
            }
        }

        if (activeRange === 1 && inRange === 0) {
            activeRange = 0;
            outputRanges[outputRanges.length] = [startRange, i];
        }
    }

    return JSON.stringify(outputRanges);
}

export function minimumPathTriangle(data) {
    let i, j;

    for (i = 1; i < data.length; i++) {
        for (j = 0; j < data[i].length; j++) {
            data[i][j] += Math.min(data[i - 1][Math.max(0, j - 1)], data[i - 1][Math.min(j, data[i - 1].length - 1)]);
        }
    }

    let finalRow = data[data.length - 1];
    let finalMinimum = 999;
    for (i = 0; i < finalRow.length; i++) {
        finalMinimum = Math.min(finalMinimum, finalRow[i]);
    }

    return finalMinimum;
}

export function spiralizedMatrix(data) {
    let i, j;

    let arrayY = data.length;
    let arrayX = data[0].length;

    let loopCount = Math.ceil(arrayX / 2) + 1;
    let marginData = [0, 1, 1, 0];

    let resultData = [];

    let lastWaypoint = [0, 0];

    resultData[0] = data[0][0];

    for (i = 0; i < loopCount; i++) {
        if (marginData[0] + marginData[2] <= arrayY && marginData[1] + marginData[3] <= arrayX) {
            for (j = lastWaypoint[1] + 1; j <= arrayX - marginData[1]; j++) {
                resultData[resultData.length] = data[lastWaypoint[0]][j];
            }

            lastWaypoint = [0 + marginData[0], arrayX - marginData[1]];
            marginData[0] += 1;
        }
        if (marginData[0] + marginData[2] <= arrayY && marginData[1] + marginData[3] <= arrayX) {
            for (j = lastWaypoint[0] + 1; j <= arrayY - marginData[2]; j++) {
                resultData[resultData.length] = data[j][lastWaypoint[1]];
            }

            lastWaypoint = [arrayY - marginData[2], arrayX - marginData[1]];
            marginData[1] += 1;
        }
        if (marginData[0] + marginData[2] <= arrayY && marginData[1] + marginData[3] <= arrayX) {
            for (j = lastWaypoint[1] - 1; j >= 0 + marginData[3]; j--) {
                resultData[resultData.length] = data[lastWaypoint[0]][j];
            }

            lastWaypoint = [arrayY - marginData[2], 0 + marginData[3]];
            marginData[2] += 1;
        }
        if (marginData[0] + marginData[2] <= arrayY && marginData[1] + marginData[3] <= arrayX) {
            for (j = lastWaypoint[0] - 1; j >= 0 + marginData[0]; j--) {
                resultData[resultData.length] = data[j][lastWaypoint[1]];
            }

            lastWaypoint = [0 + marginData[0], 0 + marginData[3]];
            marginData[3] += 1;
        }
    }

    return JSON.stringify(resultData);
}

export function subArrayWithMaximumSum(data) {
    let nums = data.slice();
    for (let i = 1; i < nums.length; i++) {
        nums[i] = Math.max(nums[i], nums[i] + nums[i - 1]);
    }

    return parseInt(Math.max(...nums), 10);
}

export function totalWaysToSum(data) {
    const ways = [1];
    ways.length = data + 1;
    ways.fill(0, 1);
    for (let i = 1; i < data; ++i) {
        for (let j = i; j <= data; ++j) {
            ways[j] += ways[j - i];
        }
    }

    return ways[data];
}

export function totalWaysToSumII(data) {
    const n = data[0];
    const s = data[1];
    const ways = [1];
    ways.length = n + 1;
    ways.fill(0, 1);
    for (let i = 0; i < s.length; i++) {
        for (let j = s[i]; j <= n; j++) {
            ways[j] += ways[j - s[i]];
        }
    }
    return ways[n];
}

export function uniquePaths(data) {
    const n = data[0]; // Number of rows
    const m = data[1]; // Number of columns
    const currentRow = [];
    currentRow.length = n;

    for (let i = 0; i < n; i++) {
        currentRow[i] = 1;
    }
    for (let row = 1; row < m; row++) {
        for (let i = 1; i < n; i++) {
            currentRow[i] += currentRow[i - 1];
        }
    }

    return currentRow[n - 1];
}

export function uniquePathsII(data) {
    let i, j;
    let pathsTo = [];
    for (i = 0; i < data.length; i++) {
        pathsTo[i] = [];
        for (j = 0; j < data[0].length; j++) {
            pathsTo[i][j] = 0;
        }
    }
    pathsTo[0][0] = 1;

    for (i = 0; i < data.length; i++) {
        for (j = 0; j < data[0].length; j++) {
            if (i > 0 && j > 0 && !data[i][j]) {
                pathsTo[i][j] = pathsTo[i][j - 1] + pathsTo[i - 1][j];
            } else if (i > 0 && !data[i][j]) {
                pathsTo[i][j] = pathsTo[i - 1][j];
            } else if (j > 0 && !data[i][j]) {
                pathsTo[i][j] = pathsTo[i][j - 1];
            } else if (i === 0 && j === 0 && !data[i][j]) {
                pathsTo[0][0] = 1;
            } else {
                pathsTo[i][j] = 0;
            }
        }
    }

    return pathsTo[pathsTo.length - 1][pathsTo[0].length - 1];
}

export function shortestPath(data) {
    const numRows = data.length;
    if (numRows === 0) return "";

    const numCols = data[0].length;
    if (numCols === 0) return "";

    const directions = [[-1, 0, 'U'], [1, 0, 'D'], [0, -1, 'L'], [0, 1, 'R']];
    const visited = new Array(numRows).fill(null).map(() => new Array(numCols).fill(false));
    const queue = [];
    const start = [0, 0];
    const end = [numRows - 1, numCols - 1];

    queue.push([start, ""]);

    while (queue.length > 0) {
        const [current, path] = queue.shift();
        const [row, col] = current;

        if (row === end[0] && col === end[1]) {
            return path; // Found the shortest path
        }

        for (const [dr, dc, move] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (
                newRow >= 0 &&
                newRow < numRows &&
                newCol >= 0 &&
                newCol < numCols &&
                data[newRow][newCol] === 0 &&
                !visited[newRow][newCol]
            ) {
                visited[newRow][newCol] = true;
                queue.push([
                    [newRow, newCol],
                    path + move,
                ]);
            }
        }
    }

    return ""; // No path found
}

export function rleCompression(data) {
    const input = data;
    let answer = ``;
    for (let i = 0; i < input.length; i) {
        let char = input[i];
        let count = 1;
        while (
            i + count < input.length &&
            count < 9 &&
            input[i + count] == char
        ) {
            count++;
        }

        answer += `${count}${char}`;
        i += count;
    }

    return answer;
}

export function sanitizeParentheses(data) {
    function isParenthesis(char) {
        return char === '(' || char === ')';
    }

    function isValid(data) {
        let balance = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i] === '(') {
                balance++;
            } else if (data[i] === ')') {
                balance--;
                if (balance < 0) {
                    return false;
                }
            }
        }
        return balance === 0;
    }

    let result = [];
    let visited = new Set();
    let queue = [data];
    let found = false;

    while (queue.length > 0) {
        const current = queue.shift();

        if (isValid(current)) {
            result.push(current);
            found = true;
        }

        if (found)
            continue;


        for (let i = 0; i < current.length; i++) {
            if (!isParenthesis(current[i]))
                continue;

            let next = current.substring(0, i) + current.substring(i + 1);

            if (!visited.has(next)) {
                visited.add(next);
                queue.push(next);
            }
        }
    }

    return result.length > 0 ? result : [""];
}

export function ceaserCipher(data) {
    const cipher = [...data[0]]
        .map((a) => (a === " " ? a : String.fromCharCode(((a.charCodeAt(0) - 65 - data[1] + 26) % 26) + 65)))
        .join("");
    return cipher;
}

export function vigenereCiphere(data) {
    const cipher = [...data[0]]
        .map((a, i) => {
            return a === " "
                ? a
                : String.fromCharCode(((a.charCodeAt(0) - 2 * 65 + data[1].charCodeAt(i % data[1].length)) % 26) + 65);
        })
        .join("");
    return cipher;
}

export function properColoring(data) {
    const nTh = data[0];
    const edges = data[1];

    function neighbourhood(vertex) {
        const adjLeft = edges.filter(([a, _]) => a === vertex).map(([_, b]) => b);
        const adjRight = edges.filter(([_, b]) => b === vertex).map(([a, _]) => a);
        return adjLeft.concat(adjRight);
    }

    const coloring = Array(nTh).fill(undefined);
    while (coloring.some((val) => val === undefined)) {
        const initialVertex = coloring.findIndex((val) => val === undefined);
        coloring[initialVertex] = 0;
        const frontier = [initialVertex];

        while (frontier.length > 0) {
            const v = frontier.pop() || 0;
            const neighbors = neighbourhood(v);

            for (const u of neighbors) {
                if (coloring[u] === undefined) {
                    if (coloring[v] === 0) coloring[u] = 1;
                    else coloring[u] = 0;

                    frontier.push(u);
                } else if (coloring[u] === coloring[v]) {
                    return [];
                }
            }
        }
    }

    return coloring;
}

export function findValidMathExpressions(data) {
    const num = data[0];
    const target = data[1];

    function helper(res, path, num, target, pos, evaluated, multed) {
        if (pos === num.length) {
            if (target === evaluated) {
                res.push(path);
            }
            return;
        }

        for (let i = pos; i < num.length; ++i) {
            if (i != pos && num[pos] == '0') { break; }
            const cur = parseInt(num.substring(pos, i + 1));

            if (pos === 0) {
                helper(res, path + cur, num, target, i + 1, cur, cur);
            } else {
                helper(res, path + "+" + cur, num, target, i + 1, evaluated + cur, cur);
                helper(res, path + "-" + cur, num, target, i + 1, evaluated - cur, -cur);
                helper(res, path + "*" + cur, num, target, i + 1, evaluated - multed + multed * cur, multed * cur);
            }
        }
    }

    const result = [];
    helper(result, "", num, target, 0, 0, 0);

    return result;
}