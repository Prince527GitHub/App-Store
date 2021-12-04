const exec = require('child_process').exec;
const decompress = require('decompress');
const log = require('electron-log');
const _7z = require('7zip-min');
const axios = require('axios');
const fs = require('fs');
const {
    DownloadWorker,
    utils
} = require("rapid-downloader");
const {
    DownloaderHelper
} = require('node-downloader-helper');
const {
    shell,
    ipcRenderer
} = require('electron');

Object.assign(console, log.functions);

const isRunning = (query, cb) => {
    let platform = process.platform;
    let cmd = '';
    switch (platform) {
        case 'win32':
            cmd = `tasklist`;
            break;
        case 'darwin':
            cmd = `ps -ax | grep ${query}`;
            break;
        case 'linux':
            cmd = `ps -A`;
            break;
        default:
            break;
    }
    exec(cmd, (err, stdout, stderr) => {
        cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
    });
}

const updateOnlineStatus = () => {
    return navigator.onLine ? 'online' : 'offline'
}

window.addEventListener('online', updateOnlineStatus)
window.addEventListener('offline', updateOnlineStatus)

async function addProgram() {
    if(updateOnlineStatus() == 'offline') {
        alert('You are offline. Please connect to the internet.')
        return ipcRenderer.invoke('quit-app');
    }
    let number = 0;
    const apps = await axios.get("https://prince527github.github.io/App-Store/apps.json");
    apps.data.apps.forEach(async (app) => {
        document.getElementById("body").innerHTML += `<div class="column is-half"><div class="card"><p class="card-header-title">${app.program.title}</p><div class="card-image"><figure class="image is-4by3"><img src="${app.program.image}" alt="showcase"></figure></div><div class="card-content"><div class="media"><div class="media-left"><figure class="image is-48x48"><img class="avatar_img" src="${app.author.image}" alt="author-image"></figure></div><div class="media-content"><p class="title is-4" id="author">${app.author.name}</p><p class="subtitle is-6" id="twitter">${app.author.twitter}</p></div></div><div class="content" id="description">${app.program.description}</div><footer class="card-footer" id="btn-div-${number}"><a onclick="setupProgram(${number})" href="#" class="card-footer-item">Install</a></footer></div></div></div>`;
        let appFolder = app.program.title;
        if (app.downloads.folder.option === "true") appFolder = app.downloads.folder.name;
        if (fs.existsSync(`${__dirname}/assets/apps/${appFolder}`)) document.getElementById(`btn-div-${number}`).innerHTML = `<a onclick="startProgram(${number})" href="#" class="card-footer-item">Launch</a><a onclick="deleteProgram(${number})" href="#" class="card-footer-item">Delete</a>`; 
        number++;
    });
}

addProgram();

async function resetProgram() {
    let number = 0;
    document.getElementById("body").innerHTML = "1";
    document.getElementById("body").innerHTML = "";
    const apps = await axios.get("https://prince527github.github.io/App-Store/apps.json");
    apps.data.apps.forEach(async (app) => {
        document.getElementById("body").innerHTML += `<div class="column is-half"><div class="card"><p class="card-header-title">${app.program.title}</p><div class="card-image"><figure class="image is-4by3"><img src="${app.program.image}" alt="showcase"></figure></div><div class="card-content"><div class="media"><div class="media-left"><figure class="image is-48x48"><img class="avatar_img" src="${app.author.image}" alt="author-image"></figure></div><div class="media-content"><p class="title is-4" id="author">${app.author.name}</p><p class="subtitle is-6" id="twitter">${app.author.twitter}</p></div></div><div class="content" id="description">${app.program.description}</div><footer class="card-footer" id="btn-div-${number}"><a onclick="setupProgram(${number})" href="#" class="card-footer-item">Install</a></footer></div></div></div>`;
        let appFolder = app.program.title;
        if (app.downloads.folder.option === "true") appFolder = app.downloads.folder.name;
        if (fs.existsSync(`${__dirname}/assets/apps/${appFolder}`)) document.getElementById(`btn-div-${number}`).innerHTML = `<a onclick="startProgram(${number})" href="#" class="card-footer-item">Launch</a><a onclick="deleteProgram(${number})" href="#" class="card-footer-item">Delete</a>`; 
        number++;
    });
}

async function setupProgram(number) {
    const apps = await axios.get("https://prince527github.github.io/App-Store/apps.json");
    const fetchedData = apps.data.apps[number];
    console.log(fetchedData.downloads.windows);
    console.log(`${fetchedData.program.title}.${fetchedData.downloads.compressed}`);
    let appFolder = fetchedData.program.title;
    let dir = `${__dirname}/assets/apps/${appFolder}`;
    if (fetchedData.downloads.folder.option === "true") {
        appFolder = fetchedData.downloads.folder.name;
        dir = `${__dirname}/assets/apps/`;
    } 
    if (!fs.existsSync(`${__dirname}/assets/apps/${appFolder}`)) {
        if (fetchedData.downloads.windows.includes("https://github.com/")) {
            const dl = new DownloaderHelper(fetchedData.downloads.windows, `${__dirname}/assets/download/`, {
                fileName: `${fetchedData.program.title}.${fetchedData.downloads.compressed}`
            });
            dl.on('end', () => {
                console.log('Download Completed')
                if (fetchedData.downloads.compressed === "zip") {
                    decompress(`${__dirname}/assets/download/${fetchedData.program.title}.${fetchedData.downloads.compressed}`, dir).then(files => {
                        console.log('done!');
                        fs.unlink(`${__dirname}/assets/download/${fetchedData.program.title}.${fetchedData.downloads.compressed}`, (err) => {
                            if (err) return console.log(err);
                            shell.openPath(`${__dirname}/assets/apps/${appFolder}/${fetchedData.downloads.filename}`);
                            return resetProgram();
                        });
                    });
                } else if (fetchedData.downloads.compressed === "7z") {
                    _7z.unpack(`${__dirname}/assets/download/${fetchedData.program.title}.${fetchedData.downloads.compressed}`, dir, err => {
                        if (err) return console.log(err);
                        if (!err) {
                            console.log('7z unpack done');
                            fs.unlink(`${__dirname}/assets/download/${fetchedData.program.title}.${fetchedData.downloads.compressed}`, (err) => {
                                if (err) return console.log(err);
                                shell.openPath(`${__dirname}/assets/apps/${appFolder}/${fetchedData.downloads.filename}`);
                                return resetProgram();
                            });
                        }
                    });
                }
            })
            dl.start();
        } else {
            const worker = new DownloadWorker(fetchedData.downloads.windows, `${__dirname}/assets/download/${fetchedData.program.title}.${fetchedData.downloads.compressed}`, {
                maxConnections: 8
            });
            worker.on('ready', () => {
                worker.on('start', () => {
                    console.log('started')
                })
                worker.on('progress', (progress) => {
                    const speed = utils.dynamicSpeedUnitDisplay(progress.bytesPerSecond, 2);
                    console.log(`${progress.completedPercent}% - ${speed}`)
                });
                worker.on('finishing', () => console.log('Download is finishing'));
                worker.on('end', () => {
                    console.log('Download is done')
                    if (fetchedData.downloads.compressed === "zip") {
                        decompress(`${__dirname}/assets/download/${fetchedData.program.title}.${fetchedData.downloads.compressed}`, dir).then(files => {
                            console.log('done!');
                            fs.unlink(`${__dirname}/assets/download/${fetchedData.program.title}.${fetchedData.downloads.compressed}`, (err) => {
                                if (err) return console.log(err);
                                shell.openPath(`${__dirname}/assets/apps/${appFolder}/${fetchedData.downloads.filename}`);
                                return resetProgram();
                            });
                        });
                    } else if (fetchedData.downloads.compressed === "7z") {
                        _7z.unpack(`${__dirname}/assets/download/${fetchedData.program.title}.${fetchedData.downloads.compressed}`, dir, err => {
                            if (err) return console.log(err);
                            if (!err) {
                                console.log('7z unpack done');
                                fs.unlink(`${__dirname}/assets/download/${fetchedData.program.title}.${fetchedData.downloads.compressed}`, (err) => {
                                    if (err) return console.log(err);
                                    shell.openPath(`${__dirname}/assets/apps/${appFolder}/${fetchedData.downloads.filename}`);
                                    return resetProgram();
                                });
                            }
                        });
                    }
                });
                worker.start();
            });
        }
    }
}

async function startProgram(number) {
    const apps = await axios.get("https://prince527github.github.io/App-Store/apps.json");
    const fetchedData = apps.data.apps[number];
    let appFolder = fetchedData.program.title;
    if (fetchedData.downloads.folder.option === "true") appFolder = fetchedData.downloads.folder.name;
    shell.openPath(`${__dirname}/assets/apps/${appFolder}/${fetchedData.downloads.filename}`);
}

async function deleteProgram(number) {
    const apps = await axios.get("https://prince527github.github.io/App-Store/apps.json");
    const fetchedData = apps.data.apps[number];
    let appFolder = fetchedData.program.title;
    if (fetchedData.downloads.folder.option === "true") appFolder = fetchedData.downloads.folder.name;
    isRunning(fetchedData.downloads.filename, (status) => {
        if(status === true) return resetProgram();
        fs.rmdir(`${__dirname}/assets/apps/${appFolder}`, { recursive: true }, (err) => {
            if (err) return console.log(err);
            return resetProgram();
        });
    });
}