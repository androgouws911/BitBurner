export async function main(ns) {
  const serverList = ["first-host", "second-host", "third-host", "512-host"];

  serverList.forEach(function(item){
    ns.killall(item);
  });
}