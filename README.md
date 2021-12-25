<p align="center">
  <a href="https://github.com/Prince527GitHub/App-Store">
    <img src="https://github.com/Prince527GitHub/App-Store/blob/main/src/assets/image/logo.png?raw=true" alt="EXA-Logo" width="200" height="200">
  </a>

  <h1 align="center">App Store</h1>
</p>

### This is the web server for the launcher.

## Schema
```json
{
    "game": {
        "title": "",
        "description": "",
        "image": ""
    },
    "author": {
        "name": "",
        "twitter": "",
        "image": ""
    },
    "downloads": {
        "version": "",
        "windows": "",
        "filename": "",
        "compressed": "",
        "folder": {
            "option": "",
            "name": ""
        } 
    }
}
```
## Exsemple
```json
{
    "program": {
        "title": "Prince527's MC launcher",
        "description": "A launcher for most of Prince527's MC packs and more!",
        "image": "https://api.serversmp.xyz/upload/prince/electron_GYFOo1wwT1.png"
    },
    "author": {
        "name": "Prince527",
        "twitter": "@Prince527gaming",
        "image": "https://api.serversmp.xyz/upload/prince/pika527v3.png"
    },
    "downloads": {
        "version": "2.0",
        "windows": "https://github.com/Prince527GitHub/Prince527-MC-launcher/releases/download/2.0.5.1/Prince527.s.MC.Launcher.v2.0.5.1.zip",
        "filename": "Prince527's MC Launcher.exe",
        "compressed": "zip",
        "folder": {
            "option": "true",
            "name": "Prince527's MC Launcher"
        } 
    }
}
```
