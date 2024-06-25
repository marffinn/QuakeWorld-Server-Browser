const $ = require("jquery");
const fs = require("fs");
const { spawn, exec } = require("child_process");
const { webContents } = require("electron/main");
const { webFrame } = require("electron/renderer");
const { log } = require("console");

const QSTAT_PATH = require("path").join(__dirname, "assets/qstat.exe");
let progressBar = $(".progress_bar_percentage");

let updateFromMaster = () => {
  let addZero = (i) => {
    if (i < 10) {
      i = "0" + i;
    }
    return i;
  };
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
      let progress = data.toString();
      let bar = progress.substring(0, progress.indexOf(" ("));
      var fields = bar.split("/");
      var currentNum = 100 / fields[1];
      var barPercent = parseInt(fields[0] * currentNum);
      progressBar.css("width", barPercent + "%");
    })
    .on("close", () => {
      let d = new Date();
      let h = addZero(d.getHours());
      let m = addZero(d.getMinutes());
      let resultInfo = `Last refresh: ${h}:${m}`;
      $(".progress_text").html(resultInfo);
    });
};

let readServers = () => {
  $(".btn_refresh_servers").prop("disabled", true).addClass("disabled");

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
    $(".appServerList").empty();
    let rawdata = fs.readFileSync(`assets/cacheservers.json`);
    let serverList = JSON.parse(rawdata);
    for (let s in serverList) {
      if (
        serverList[s].map === undefined ||
        serverList[s].map === "?" ||
        serverList[s].numplayers == "0"
      )
        continue;
      else {
        let oneServerPrepare = `<tr href="${serverList[s].address}" data-name="${serverList[s].name}" data-ping="${serverList[s].ping}" data-playerno="${serverList[s].numplayers}">
                      <th class="serverName text-truncate">${serverList[s].name}</th>
                      <th class="serverPing">${serverList[s].ping}</th>
                      <th class="serverMap">${serverList[s].map}</th>
                      <th class="serverPlayers">${serverList[s].numplayers}/${serverList[s].maxplayers}</th>
                  </tr>`;
        $(".appServerList").append(oneServerPrepare);
      }
    }
    $(".btn_refresh_servers").prop("disabled", false).removeClass("disabled");
  });
};

$(".btn_update_masters").on("click", updateFromMaster);
$(".btn_refresh_servers").on("click", readServers);

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
    }
  );
});

let onAppLoad = () => {
  let rawdata = fs.readFileSync(`assets/cacheservers.json`);
  let serverList = JSON.parse(rawdata);
  for (let s in serverList) {
    if (serverList[s].map === undefined || serverList[s].map === "?") continue;
    else {
      let oneServerPrepare = `<div class="server-card" href="${serverList[s].address}" data-name="${serverList[s].name}">
              <div class="server-card-bg">
                <img src="assets/mapshots/${serverList[s].map}.jpg" alt="${serverList[s].map}"/>
                <div class="serverPing">${serverList[s].ping}</div>
                <div class="serverMap">${serverList[s].map}</div>
              </div>
              <div class="serverName"> ${serverList[s].name} </div>
              <div class="serverPlayers">${serverList[s].numplayers}/${serverList[s].maxplayers}</div>
          </div>`;
      $(".appServerList").append(oneServerPrepare);
    }
  }
};

onAppLoad();
