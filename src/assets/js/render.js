const { DownloaderHelper } = require('node-downloader-helper');
const { shell, ipcRenderer } = require('electron');

const decompress = require('decompress');
const _7z = require('7zip-min');

const fs = require('fs');

const util = require('util');
const exec = util.promisify(require('child_process').exec);

Object.assign(console, require('electron-log').functions);

const body = document.getElementById("body");
const iBody = document.getElementById("realbody");
const sBody = document.getElementById("settingsBody");
const sBtn = document.getElementById("settingsBtn");

async function isRunning(query) {
    let cmd = '';
    switch (process.platform) {
        case 'win32':
            cmd = `tasklist /FI "IMAGENAME eq ${query}"`;
            break;
        case 'darwin':
            cmd = `ps -ax | grep ${query}`;
            break;
        case 'linux':
            cmd = `ps -A`;
            break;
        default:
            return false;
    }

    try {
        const { stdout } = await exec(cmd);
        return stdout.toLowerCase().indexOf(query.toLowerCase()) > -1;
    } catch (error) {
        console.error(`Error executing command: ${cmd}`, error);
        return false;
    }
}

async function resetProgram() {
    let number = 0;

    body.innerHTML = "";
    sBody.innerHTML = "";
    sBtn.innerHTML = `<button type="button" class="btn btn-secondary bottom-right" onclick="settings('button')"><i class="bi bi-gear"></i></button>`;
    iBody.style.background = localStorage.getItem('darkmode') ? "#23272B" : "#ffffff";

    const appsDirectory = directory();
    const res = await (await fetch("https://prince527github.github.io/App-Store/apps.json")).json();

    for (const app of res.apps) {
        body.innerHTML += `<div class="col"><div class="card h-100 text-wrap text-white" style="background-image:url('${app.program.image}');background-repeat:no-repeat;background-attachment:fixed;background-size:cover;"><div class="card-body"><h5 class="card-title">${app.program.title} v${app.downloads.version}</h5><ul class="list-group list-group-flush"><li class="list-group-item text-white" style="background-color:transparent;"><img class="avatar" src="${app.author.image}" alt="author-image"><span class="author">${app.author.name}</span><h6><i class="bi bi-twitter"></i> ${app.author.twitter}</h6></li></ul><p class="card-text">${app.program.description}</p><div class="card-body text-white" id="btn-div-${number}"><a onclick="setupProgram(${number})" href="#" class="card-link btn btn-secondary"><i class="bi bi-download"></i></a></div></div></div></div>`;

        const appFolder = app.downloads.folder ? app.downloads.folder : app.program.title;
        if (fs.existsSync(`${appsDirectory}/${appFolder}`)) document.getElementById(`btn-div-${number}`).innerHTML = `<a onclick="startProgram(${number})" href="#" class="card-link btn btn-secondary"><i class="bi bi-play"></i></a><a onclick="deleteProgram(${number})" href="#" class="card-link btn btn-secondary"><i class="bi bi-trash2"></i></a>`;

        number++;
    }
}

async function setupProgram(number) {
    try {
        const res = await (await fetch("https://prince527github.github.io/App-Store/apps.json")).json();
        const apps = res.apps[number];

        const appsDirectory = directory();
        const appFolder = apps.downloads.folder ? apps.downloads.folder : apps.program.title;

        const bootFile = `${appsDirectory}/${appFolder}/${apps.downloads.filename}`;

        const downloadFile = `${apps.program.title}.${apps.downloads.compressed}`;
        const downloadFolder = `${__dirname}/assets/download/${downloadFile}`;

        const extractFolder = `${appsDirectory}/${apps.downloads.folder ? "" : apps.program.title}`;

        if (fs.existsSync(`${appsDirectory}/${appFolder}`)) return startProgram(number);

        const dl = new DownloaderHelper(apps.downloads.windows, `${__dirname}/assets/download/`, { fileName: downloadFile });

        dl.on('start', () => {
            body.innerHTML = "";
            sBtn.innerHTML = "";
            sBody.innerHTML = `<div class="midle-div"><div class="spinner-border ${localStorage.getItem('darkmode') ? 'text-light' : 'text-dark'}" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
        });

        dl.on('end', async () => {
            try {
                if (apps.downloads.compressed === "zip") await decompress(downloadFolder, extractFolder);
                else if (apps.downloads.compressed === "7z") await new Promise((resolve, reject) => {
                    _7z.unpack(downloadFolder, extractFolder, (err) => {
                        if (err) {
                            console.log(err);
                            reject(err);
                        } else resolve();
                    });
                });

                fs.unlink(downloadFolder, (err) => {
                    if (err) return resetProgram();

                    shell.openPath(bootFile);
                    return resetProgram();
                });
            } catch (err) {
                console.log(err);
                resetProgram();
            }
        });

        dl.start();
    } catch (err) {
        console.log(err);
        resetProgram();
    }
}



async function startProgram(number) {
    try {
        const res = await (await fetch("https://prince527github.github.io/App-Store/apps.json")).json();

        const app = res.apps[number];

        const appsDirectory = directory();
        const appFolder = app.downloads.folder ? app.downloads.folder : app.program.title;

        await shell.openPath(`${appsDirectory}/${appFolder}/${app.downloads.filename}`);
    } catch (error) {
        console.error(error);
    }
}

async function deleteProgram(number) {
    try {
        const res = await (await fetch("https://prince527github.github.io/App-Store/apps.json")).json();

        body.innerHTML = "";
        sBtn.innerHTML = "";
        sBody.innerHTML = `<div class="midle-div"><div class="spinner-border ${localStorage.getItem('darkmode') ? 'text-light' : 'text-dark'}" role="status"><span class="visually-hidden">Loading...</span></div></div>`;

        const app = res.apps[number];
        const appsDirectory = directory();
        const appFolder = app.downloads.folder ? app.downloads.folder : app.program.title;

        const status = await isRunning(app.downloads.filename);
        if (status === true) return resetProgram();

        await fs.promises.rmdir(`${appsDirectory}/${appFolder}`, { recursive: true });
        resetProgram();
    } catch (error) {
        console.error(error);
        resetProgram();
    }
}

function directory() {
    const path = localStorage.getItem('path');

    return path ? path : `${process.env.APPDATA}/app-store/apps`;
}

let btn = 0;
async function settings(type) {
    if (type === "button") {
        btn = (btn === 0) ? 1 : 0;

        return (btn === 0) ? resetProgram() : settings("html");

    } else if (type === "path") {
        const sPath = document.getElementById("path");

        const file = await ipcRenderer.invoke('open-file');
        if (!file) return settings("html");

        if (localStorage.getItem('path')) await fs.promises.rmdir(localStorage.getItem('path'), { recursive: true });
        localStorage.setItem('path', file);

        sPath.disabled = true;
        return settings("html");

    } else if (type === "path-reset") {
        const sPath = document.getElementById("path");

        sPath.innerHTML = `<i class="bi bi-folder"></i>`;
        sPath.disabled = false;

        document.getElementById("path-reset").disabled = true;

        if (localStorage.getItem('path')) await fs.promises.rmdir(localStorage.getItem('path'), { recursive: true });
        localStorage.removeItem('path');

        return;

    } else if (type === "html") {
        body.innerHTML = "";
        sBody.innerHTML = `
            <div class="midle-div">
                <div class="btn-group" role="group" aria-label="Basic example">
                    <button type="button" class="btn btn-secondary" disabled>Path</button>
                    <button type="button" class="btn btn-secondary" onclick="settings('path')" id="path"><i class="bi bi-folder"></i></button>
                    <button type="button" class="btn btn-secondary" onclick="settings('path_rest')" id="path-reset"><i class="bi bi-folder-x"></i></button>
                </div>
                <br>
                <button type="button" class="btn btn-secondary" onclick="settings('darkmode')" id="darkmode"><i class="bi bi-brightness-high"></i></button>
            </div>`;

        const sDarkMode = document.getElementById("darkmode");
        const sPath = document.getElementById("path");

        sDarkMode.innerHTML = localStorage.getItem('darkmode') ? `<i class="bi bi-moon"></i>` : `<i class="bi bi-brightness-high"></i>`;

        sPath.innerHTML = localStorage.getItem('path') ? `<i class="bi bi-folder-check"></i>` : `<i class="bi bi-folder"></i>`;
        sPath.disabled = !!localStorage.getItem('path');

        return;

    } else if (type === "darkmode") {
        const sDarkMode = document.getElementById("darkmode");

        if (localStorage.getItem('darkmode')) {
            localStorage.removeItem('darkmode');
            sDarkMode.innerHTML = `<i class="bi bi-brightness-high"></i>`;
        } else {
            localStorage.setItem('darkmode', true);
            sDarkMode.innerHTML = `<i class="bi bi-moon"></i>`;
        }

        iBody.style.background = localStorage.getItem('darkmode') ? "#23272B" : "#ffffff";

        return;
    }
}

resetProgram();