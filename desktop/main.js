// Project Two CRM — desktopová aplikace.
// Otevírá týmové CRM z GitHub Pages ve vlastním okně, takže data, přihlášení
// i nové verze jsou stejné jako na webu.
const { app, BrowserWindow, Menu, shell, nativeTheme } = require('electron');
const path = require('path');

const APP_URL = 'https://ggbosky.github.io/projectwodashboard/';
const APP_ORIGIN = new URL(APP_URL).origin;
const APP_PATH = new URL(APP_URL).pathname;

nativeTheme.themeSource = 'dark';

const isAppUrl = (url) => {
  try {
    const u = new URL(url);
    return u.origin === APP_ORIGIN && u.pathname.startsWith(APP_PATH);
  } catch {
    return false;
  }
};

const offlinePage = `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><html lang="cs"><meta charset="utf-8">
<body style="margin:0;height:100vh;display:grid;place-items:center;background:#09090B;color:#FAFAFA;font-family:system-ui,sans-serif">
<div style="text-align:center;max-width:360px">
<div style="font-size:44px;color:#FF5A0F;font-weight:800">2</div>
<h1 style="font-size:20px;margin:12px 0 6px">Nepodařilo se připojit</h1>
<p style="color:#A1A1AA;font-size:14px;line-height:1.5">CRM potřebuje internet — data se ukládají na GitHub. Zkontrolujte připojení.</p>
<button onclick="location.href='${APP_URL}'" style="margin-top:14px;background:#FF5A0F;color:#000;border:0;border-radius:10px;padding:10px 18px;font-weight:600;cursor:pointer">Zkusit znovu</button>
</div></body></html>`)}`;

function createWindow() {
  const win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 900,
    minHeight: 600,
    title: 'Project Two CRM',
    backgroundColor: '#09090B',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  win.once('ready-to-show', () => win.show());
  win.on('page-title-updated', (e) => e.preventDefault());

  // Odkazy mimo CRM (LinkedIn, GitHub…) se otevřou v běžném prohlížeči.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!isAppUrl(url) && !url.startsWith('data:')) {
      e.preventDefault();
      if (/^https?:/.test(url)) shell.openExternal(url);
    }
  });

  win.webContents.on('did-fail-load', (_e, code, _desc, url, isMain) => {
    if (isMain && code !== -3 && isAppUrl(url)) win.loadURL(offlinePage);
  });

  win.loadURL(APP_URL);
}

Menu.setApplicationMenu(
  Menu.buildFromTemplate([
    {
      label: 'Aplikace',
      submenu: [
        { label: 'Obnovit', accelerator: 'F5', click: (_i, w) => w && w.webContents.reloadIgnoringCache() },
        { label: 'Obnovit', accelerator: 'CmdOrCtrl+R', visible: false, click: (_i, w) => w && w.webContents.reloadIgnoringCache() },
        { type: 'separator' },
        { role: 'zoomIn', label: 'Přiblížit' },
        { role: 'zoomOut', label: 'Oddálit' },
        { role: 'resetZoom', label: 'Původní velikost' },
        { role: 'togglefullscreen', label: 'Celá obrazovka' },
        { type: 'separator' },
        { role: 'quit', label: 'Ukončit' },
      ],
    },
    { label: 'Úpravy', submenu: [{ role: 'undo', label: 'Zpět' }, { role: 'redo', label: 'Znovu' }, { type: 'separator' }, { role: 'cut', label: 'Vyjmout' }, { role: 'copy', label: 'Kopírovat' }, { role: 'paste', label: 'Vložit' }, { role: 'selectAll', label: 'Vybrat vše' }] },
  ]),
);

// Jen jedno okno — druhé spuštění přepne na už otevřené.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  app.setAppUserModelId('com.projectwo.crm');
  app.whenReady().then(createWindow);
  app.on('window-all-closed', () => app.quit());
}
