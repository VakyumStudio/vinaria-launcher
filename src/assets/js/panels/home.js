/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

import { logger, database, changePanel} from '../utils.js';

const { Launch, Status } = require('minecraft-java-core-riptiaz');
const { ipcRenderer } = require('electron');
const launch = new Launch();
const pkg = require('../package.json');

const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME)

class Home {
    static id = "home";
    async init(config, news) {
        this.config = config
        this.news = await news
        this.database = await new database().init();
        this.initNews();
        this.initLaunch();
        this.initStatusServer();
        this.initBtn();
        this.bkgrole();
    }

    async initNews() {
        let news = document.querySelector('.news-list');
        if (this.news) {
            if (!this.news.length) {
                let blockNews = document.createElement('div');
                blockNews.classList.add('news-block', 'opacity-1');
                blockNews.innerHTML = `
                    <div class="news-header">
                        <div class="header-text">
                            <div class="title">Aucun news n'ai actuellement disponible.</div>
                        </div>
                    </div>
                    <div class="news-content">
                        <div class="bbWrapper">
                            <p>Vous pourrez suivre ici toutes les news relative au serveur.</p>
                        </div>
                    </div>`
                news.appendChild(blockNews);
            } else {
                for (let News of this.news) {
                    let date = await this.getdate(News.publish_date)
                    let blockNews = document.createElement('div');
                    blockNews.classList.add('news-block');
                    blockNews.innerHTML = `
                        <div class="news-header">
                            <div class="header-text">
                                <div class="title">${News.title}</div>
                            </div>
                            <div class="date">
                                <div class="day">${date.day}</div>
                                <div class="month">${date.month}</div>
                            </div>
                        </div>
                        <div class="news-content">
                            <div class="bbWrapper">
                                <p>${News.content}</p>
                                <p class="news-author"><span> ${News.author}</span></p>
                            </div>
                        </div>`
                    news.appendChild(blockNews);
                }
            }
        } else {
            let blockNews = document.createElement('div');
            blockNews.classList.add('news-block', 'opacity-1');
            blockNews.innerHTML = `
                <div class="news-header">
                    <div class="header-text">
                        <div class="title">Error.</div>
                    </div>
                </div>
                <div class="news-content">
                    <div class="bbWrapper">
                        <p>Impossible de contacter le serveur des news.</br>Merci de vérifier votre configuration.</p>
                    </div>
                </div>`
            // news.appendChild(blockNews);
        }
    }
    async bkgrole () {
        let uuid = (await this.database.get('1234', 'accounts-selected')).value;
        let account = (await this.database.get(uuid.selected, 'accounts')).value;
        if (account.role != "Admin" ?? "Fondateur" ?? "Responsable Modo") {
            document.querySelector(".admin-btn").style.display = "none";
        }
        


        let blockRole = document.createElement("div");
        blockRole.innerHTML = `
        <div>${account.role}</div>
        `
        document.querySelector('.player-role').appendChild(blockRole);
        if(!account.role) {
            document.querySelector(".player-role").style.display = "none";
        }


        let blockMonnaie = document.createElement("div");
        blockMonnaie.innerHTML = `
        <div>${account.monnaie} pts</div>
        `
        document.querySelector('.player-monnaie').appendChild(blockMonnaie);
        if(account.monnaie === "undefined") {
            document.querySelector(".player-monnaie").style.display = "none";
        }

        let title_changelog = document.createElement("div");
        title_changelog.innerHTML = `
        <div>${this.config.changelog_version}</div>
        `
        document.querySelector('.title-change').appendChild(title_changelog);
        if(!this.config.changelog_version) {
            document.querySelector(".title-change").style.display = "none";
        }

        let bbWrapperChange = document.createElement("div");
        bbWrapperChange.innerHTML = `
        <div>${this.config.changelog_new}</div>
        `
        document.querySelector('.bbWrapperChange').appendChild(bbWrapperChange);
        if(!this.config.changelog_new) {
            document.querySelector(".bbWrapperChange").style.display = "none";
        }

        let serverimg = document.querySelector('.server-img')
        serverimg.setAttribute("src", `${this.config.server_img}`)
        if(!this.config.server_img) {
            serverimg.style.display = "none";
        }


        if (account.role === "Responsable Modo") {
            document.body.style.background = `linear-gradient(#00000066, #00000066) url(${this.config.homeimg_respmodo}) black no-repeat center center scroll`
        }
        if (account.role === "Membre") {
            document.body.style.background = `linear-gradient(#00000066, #00000066) url(${this.config.homeimg_member}) black no-repeat center center scroll`
        }
        if (account.role === "Fondateur") {
            document.body.style.background = `linear-gradient(#00000066, #00000066) url(${this.config.homeimg_fonda}) black no-repeat center center scroll`
        }
        if (account.role === "Dev") {
            document.body.style.background = `linear-gradient(#00000066, #00000066), url("${this.config.homeimg_dev}") black no-repeat center center scroll`
        }
        if (account.role === "Admin") {
            document.body.style.background = `linear-gradient(#00000066, #00000066) url(${this.config.homeimg_admin}) black no-repeat center center scroll`
        }
        if (account.role === "Helper") {
            document.body.style.background = `linear-gradient(#00000066, #00000066) url(${this.config.homeimg_helper}) black no-repeat center center scroll`
        }
        if (account.role === "Modo") {
            document.body.style.background = `linear-gradient(#00000066, #00000066) url(${this.config.homeimg_modo}) black no-repeat center center scroll`
        }
        if (account.role === "VIP") {
            document.body.style.background = `linear-gradient(#00000066, #00000066) url(${this.config.homeimg_vip})  black no-repeat center center scroll`
        }
        
       
    }

    async initLaunch() {
        document.querySelector('.play-btn').addEventListener('click', async () => {
            let urlpkg = pkg.user ? `${pkg.url}/${pkg.user}` : pkg.url;
            let uuid = (await this.database.get('1234', 'accounts-selected')).value;
            let account = (await this.database.get(uuid.selected, 'accounts')).value;
            let ram = (await this.database.get('1234', 'ram')).value;
            let javaPath = (await this.database.get('1234', 'java-path')).value;
            let javaArgs = (await this.database.get('1234', 'java-args')).value;
            let Resolution = (await this.database.get('1234', 'screen')).value;
            let launcherSettings = (await this.database.get('1234', 'launcher')).value;
            let screen;

            let playBtn = document.querySelector('.play-btn');
            let info = document.querySelector(".text-download")
            let progressBar = document.querySelector(".progress-bar")

            if (Resolution.screen.width == '<auto>') {
                screen = false
            } else {
                screen = {
                    width: Resolution.screen.width,
                    height: Resolution.screen.height
                }
            }

            let opts = {
                url: this.config.game_url === "" || this.config.game_url === undefined ? `${urlpkg}/files` : this.config.game_url,
                authenticator: account,
                path: `${dataDirectory}/${process.platform == 'darwin' ? this.config.dataDirectory : `.${this.config.dataDirectory}`}`,
                version: this.config.game_version,
                detached: launcherSettings.launcher.close === 'close-all' ? false : true,
                java: this.config.java,
                javapath: javaPath.path,
                args: [...javaArgs.args, ...this.config.game_args],
                screen,
                modde: this.config.modde,
                verify: this.config.verify,
                ignored: this.config.ignored,
                memory: {
                    min: `${ram.ramMin * 1024}M`,
                    max: `${ram.ramMax * 1024}M`
                }
            }

            playBtn.style.display = "none"
            info.style.display = "block"
            launch.Launch(opts);

            launch.on('progress', (DL, totDL) => {
                progressBar.style.display = "block"
                document.querySelector(".text-download").innerHTML = `Téléchargement ${((DL / totDL) * 100).toFixed(0)}%`
                ipcRenderer.send('main-window-progress', { DL, totDL })
                progressBar.value = DL;
                progressBar.max = totDL;
            })

            launch.on('speed', (speed) => {
                console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
            })

            launch.on('check', (e) => {
                progressBar.style.display = "block"
                document.querySelector(".text-download").innerHTML = `Vérification ${((DL / totDL) * 100).toFixed(0)}%`
                progressBar.value = DL;
                progressBar.max = totDL;

            })

            launch.on('data', (e) => {
                new logger('Minecraft', '#36b030');
                if (launcherSettings.launcher.close === 'close-launcher') ipcRenderer.send("main-window-hide");
                progressBar.style.display = "none"
                info.innerHTML = `Demarrage en cours...`
                console.log(e);
            })

            launch.on('close', () => {
                if (launcherSettings.launcher.close === 'close-launcher') ipcRenderer.send("main-window-show");
                progressBar.style.display = "none"
                info.style.display = "none"
                playBtn.style.display = "block"
                info.innerHTML = `Vérification`
                new logger('Launcher', '#7289da');
                console.log('Close');
            })
        })
    }

    async initStatusServer() {
        let nameServer = document.querySelector('.server-text .name');
        let serverMs = document.querySelector('.server-text .desc');
        let playersConnected = document.querySelector('.etat-text .text');
        let online = document.querySelector(".etat-text .online");
        let serverPing = await new Status(this.config.status.ip, this.config.status.port).getStatus();

        if (!serverPing.error) {
            nameServer.textContent = this.config.status.nameServer;
            serverMs.innerHTML = `<span class="green">En ligne</span> - ${serverPing.ms}ms`;
            online.classList.toggle("off");
            playersConnected.textContent = serverPing.playersConnect;
        } else if (serverPing.error) {
            nameServer.textContent = 'Serveur indisponible';
            serverMs.innerHTML = `<span class="red">Hors ligne</span>`;
        }
    }

    initBtn() {
        let azauth = pkg.user ? `${pkg.azauth}/${pkg.user}` : pkg.azauth
        document.querySelector('.settings-btn').addEventListener('click', () => {
            changePanel('settings');
        });
        document.querySelector('.admin-btn').addEventListener('click', () => {
            const { shell } = require('electron')
            shell.openExternal(`${azauth}/admin`)
        })
    }

    async getdate(e) {
        let date = new Date(e)
        let year = date.getFullYear()
        let month = date.getMonth() + 1
        let day = date.getDate()
        let allMonth = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
        return { year: year, month: allMonth[month - 1], day: day }
    }
}
export default Home;