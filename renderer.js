const $ = require('jquery')
const fs = require('fs')
const path = require('path')
const { spawn, exec } = require('child_process')
const { ipcRenderer } = require('electron')
const { webContents } = require('electron/main')
const { webFrame } = require('electron/renderer')
const { log } = require('console')

let progressBar = $('.progress_bar_percentage')

let addZero = (i) => {
    if (i < 10) {i = "0" + i}
    return i
}

let updateFromMaster = () => {

    progressBar.show();

    const ls = spawn(`qstat.exe`, ["-qwm", "master.quakeservers.net:27000", "-nh", "-ne", "-R", "-progress", "-u", "-sort", "n", "-json", "-of", `servers.json`])
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
    })
}
$('.btn_update_masters').on('click', updateFromMaster)