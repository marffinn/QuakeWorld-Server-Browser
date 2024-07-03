const $ = require("jquery");
const fs = require("fs");
const { spawn, exec } = require("child_process");
const { webContents } = require("electron/main");
const { webFrame } = require("electron/renderer");
const { log } = require("console");

const QSTAT_PATH = require("path").join(__dirname, "assets/qstat.exe");
let progressBar = $(".progress_bar_percentage");
let addZero = (i) => {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
};

let updateFromMaster = () => {
  progressBar.show();

  const ls = spawn(`assets/qstat.exe`, [
    "-qwm",
    "master.quakeservers.net:27000",
    "-nh",
    "-ne",
    "-R",
    "-progress",
    "-u",
    "-sort",
    "n",
    "-json",
    "-of",
    `assets/servers.json`,
  ])
    .stderr.on("data", (data) => {
      $(".progress_text").empty();
      let progress = data.toString();
      let bar = progress.substring(0, progress.indexOf(" ("));
      var fields = bar.split("/");
      var currentNum = 100 / fields[1];
      var barPercent = parseInt(fields[0] * currentNum);
      progressBar.css("width", barPercent + "%");
    })
    .on("close", () => {
      readFaji();
      let d = new Date();
      let h = addZero(d.getHours());
      let m = addZero(d.getMinutes());
      let resultInfo = `Last refresh: ${h}:${m}`;
      $(".progress_text").html(resultInfo);
    });
};

let readServers = () => {
  $(".btn_refresh_servers").css({ background: "red" }).prop("disabled", true);
  spawn(`assets/qstat.exe`, [
    "-f",
    "assets/hosts.txt",
    "-nh",
    "-ne",
    "-R",
    "-P",
    "-u",
    "-sort",
    "n",
    "-json",
    "-of",
    `assets/cacheservers.json`,
  ]).on("close", () => {
    let rawdata = fs.readFileSync(`assets/cacheservers.json`);
    let serverList = JSON.parse(rawdata);
    $(".btn_refresh_servers").css({ background: "" }).prop("disabled", false);
    cardRender(serverList);
  });
};

let cardRender = () => {
  let rawdata = fs.readFileSync(`assets/cacheservers.json`);
  let serverList = JSON.parse(rawdata);
  $(".appServerList").empty();
  $(".btn_refresh_servers").prop("disabled", false).removeClass("disabled");

  for (let s in serverList) {
    if (serverList[s].numplayers === 0 || serverList[s].maxplayers >= 20)
      continue;
    else {
      let oneServerPrepare = `
        <div class="server-card" href="${serverList[s].address}" serverList-name="${serverList[s].name}">
          <div class="server-card-bg">
            <img src="assets/mapshots/${serverList[s].map}.jpg" alt="${serverList[s].map}"/>
            <div class="serverPing">${serverList[s].ping}</div>
            <div class="serverMap">${serverList[s].map}</div>
            <div class="serverPlayersContainer"></div>
          </div>
          <div class="serverName"> ${serverList[s].name} </div>
          <div class="serverPlayers">${serverList[s].numplayers}/${serverList[s].maxplayers}</div>
        </div>`;
      for (let l in serverList[s].players) {
        $(".serverPlayersContainer").append(
          `<span>${serverList[0].players[l].name}</span>`
        );
      }
      $(".appServerList").append(oneServerPrepare);
    }
  }
};

let onAppLoad = () => {
  let rawdata = fs.readFileSync(`assets/cacheservers.json`);
  cardRender(rawdata);
};

let readFaji = () => {
  fs.readFile("./assets/servers.json", "utf8", function (err, data) {
    if (err) return console.log(err);
    let theJson = JSON.parse(data);
    for (let g in theJson) {
      if (theJson[g].gametype != "qw" || theJson[g].ping >= 70) {
        continue;
      } else {
        fs.appendFileSync(
          "./assets/hosts.txt",
          "qws " + theJson[g].address + "\n",
          "utf-8"
        );
      }
    }
  });
};

$("body").on("click", ".server-card", function (e) {
  e.preventDefault();
  let oneServerAddress = $(this).attr("href");
  exec(
    `${QSTAT_PATH} -qws ${oneServerAddress} -nh -P -R -sort F -noconsole -json`,
    (err, stdout) => {
      if (err) {
        console.error(err);
      }
      let outInfo = JSON.parse(stdout)[0];

      let sv_name = outInfo.name;
      let sv_address = outInfo.address;
      let sv_map = outInfo.map;
      console.log(sv_name);
    }
  );
});

$(".btn_update_masters").on("click", updateFromMaster);
$(".btn_refresh_servers").on("click", readServers);
$(".btn_read_servers").on("click", cardRender);

onAppLoad();
