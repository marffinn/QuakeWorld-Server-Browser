const $ = require("jquery");
const fs = require("fs");
const { spawn, exec } = require("child_process");
const { webContents } = require("electron/main");
const { webFrame } = require("electron/renderer");
const { log } = require("console");

const QSTAT_PATH = require("path").join(__dirname, "assets/qstat.exe");
let progressBar = $(".progress_bar_percentage");
let visibleServers = [];

let updateFromMaster = () => {
   progressBar.show();

   const ls = spawn("assets/qstat.exe", [
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
      "assets/servers.json",
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
         compileServerList();
         let d = new Date();
         let h = d.getHours();
         let m = d.getMinutes();
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
      $(".btn_refresh_servers").css({ background: "" }).prop("disabled", false);
      cardRender();
   });
};

let cardRender = () => {
   let serverList = null;

   let rawdata = fs.readFileSync(`assets/cacheservers.json`);
   serverList = JSON.parse(rawdata);

   $(".appServerList").empty();
   $(".btn_refresh_servers").prop("disabled", false).removeClass("disabled");

   for (let s in serverList) {
      if (serverList[s].numplayers === 0 || serverList[s].maxplayers >= 20)
         continue;
      else {
         visibleServers.push("qws " + serverList[s].address);

         let oneServerPrepare = `<div class="server-card" href="${serverList[s].address}" serverList-name="${serverList[s].name}" id="${s}">
          <div class="server-card-bg">
            <img src="assets/mapshots/${serverList[s].map}.jpg" alt="${serverList[s].map}"/>
            <div class="serverPing">${serverList[s].ping}</div>
            <div class="serverMap">${serverList[s].map}</div>
            <div class="serverName"> ${serverList[s].name} </div>
            <div class="serverGameTime"> ${serverList[s].rules.status} </div>
            <div class="serverPlayers">${serverList[s].numplayers}/${serverList[s].maxplayers}</div>
          </div>
          <div class="serverPlayersContainer"></div>
        </div>`;

         $(".appServerList").append(oneServerPrepare);
         let pl = loadPlayers(serverList[s].players);
         $("[id=" + s + "] .serverPlayersContainer").html(pl);
      }
   }

   masonryReload();
   for (let i in visibleServers) {
      console.log(visibleServers[i]);
   }
};

let loadPlayers = (data) => {
   var digg = $("<div>", { class: "indPlayer" });
   for (let i in data) {
      switch (data[i].score) {
         case -9999:
            digg.append(`<p style="background-color:#22001cd6;order: -1"><span class="inPlayerName">${data[i].name}</span>
        <span class="inPlayerScore">spec</span></p>`);
            break;
         default:
            digg.append(`<p><span class="inPlayerName">${data[i].name}</span>
            <span class="inPlayerScore">${data[i].score}</span></p>`);
      }
   }
   digg = digg[0];
   return digg;
};

let onAppLoad = () => {
   cardRender();
};

let compileServerList = () => {
   fs.readFile("./assets/servers.json", "utf8", function (err, data) {
      if (err) return console.log(err);
      let theJson = JSON.parse(data);
      for (let g in theJson) {
         if (theJson[g].gametype != "qw" || theJson[g].ping >= 120) {
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
      }
   );
});

$(".btn_update_masters").on("click", updateFromMaster);
$(".btn_refresh_servers").on("click", readServers);
$(".btn_read_servers").on("click", cardRender);

let masonryReload = () => {
   $(function () {
      $(".appServerList").masonryGrid({
         columns: 3,
         breakpoint: 500,
      });
   });
};

$("html").on("resize", function () {
   masonryReload();
});

onAppLoad();
