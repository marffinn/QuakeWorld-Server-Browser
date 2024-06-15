const $ = require('jquery')
const fs = require('fs')
const path = require('path')
const { spawn, exec } = require('child_process')
const { ipcRenderer } = require('electron')
const { webContents } = require('electron/main')
const { webFrame } = require('electron/renderer')
const { log } = require('console')

let progressBar = $('.progress_bar_percentage')



let updateFromMaster = () => {
    // helper function for correct array rendering
    let addZero = (i) => {
        if (i < 10) {i = "0" + i}
        return i
    }
    // UI stuff
    progressBar.show();

    const ls = spawn(`assets/qstat.exe`, ["-qwm", "master.quakeservers.net:27000", "-nh", "-ne", "-R", "-progress", "-u", "-sort", "n", "-json", "-of", `assets/servers.json`])
    ls.stderr.on('data', (data) => {
        let progress = data.toString()
        let bar = progress.substring(0, progress.indexOf(' ('))
        var fields = bar.split('/')
        var currentNum = (100 / fields[1])
        var barPercent = parseInt(fields[0] * currentNum)
        progressBar.css('width', barPercent +'%')
    })
    ls.on('close', () => {
        let d = new Date()
        let h = addZero(d.getHours())
        let m = addZero(d.getMinutes())
        let resultInfo = `Last refresh: ${h}:${m}`
        $('.progress_text').html(resultInfo)
        // progressBar.fadeOut(500)
    })
}

let readServers = () => {
    let rawdata = fs.readFileSync( `assets/servers.json` )
    let serverList = JSON.parse(rawdata)
    for (let s in serverList) {
        if( serverList[s].ping >= 41 || serverList[s].map === undefined || serverList[s].map === "?" ) continue
        else {

            let oneServerPrepare =
                `<tr href="${serverList[s].address}" data-name="${serverList[s].name}" data-ping="${serverList[s].ping}" data-playerno="${serverList[s].numplayers}">
                    <th class="serverName"><a href="${serverList[s].address}">${serverList[s].name}</a></th>
                    <th class="serverPing">${serverList[s].ping}</th>
                    <th class="serverMap">${serverList[s].map}</th>
                    <th class="serverPlayers">${serverList[s].numplayers}/${serverList[s].maxplayers}</th>
                </tr>`
            $('.appServerList').append(oneServerPrepare)
        }
    }
}
$('.btn_update_masters').on('click', updateFromMaster)
$('.btn_refresh_servers').on('click', readServers)
