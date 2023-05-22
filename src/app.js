// global CSS
import globalCss from './style.css';
// CSS modules
import styles, { stylesheet } from './style.module.css';

/* Notes
 * Profiles
 * Let you setup multiple clients and switch between them
 * Each profile has a name, host, username(*), password, and client type, save location
 * Client types
 * Transmission
 * Deluge
 * Flood
 * qBittorrent
 * rTorrent (?)
 * uTorrent (?)
 * Vuze (?)
 * Tixati (?)
 * BiglyBT (?)
 */

class profile {
  id = 0;
  name = '';
  host = '';
  username = '';
  password = '';
  client = '';
  saveLocation = '';
  constructor(id, name, host, username, password, client, saveLocation) {
    this.id = id;
    this.name = name;
    this.host = host;
    this.username = username;
    this.password = password;
    this.client = client;
    this.saveLocation = saveLocation;
  }

  async testConnection() {}

  async addTorrent(torrent) {}
}

const profileManager = {
  profiles: [],
  addProfile: function (profile) {
    this.profiles.push(profile);
  },
  removeProfile: function (id) {
    this.profiles = this.profiles.find((p) => p.id === id);
  },
  getProfile: function (id) {
    return this.profiles.find((p) => p.id === id);
  },
  getProfiles: function () {
    return this.profiles;
  },
  save: function () {
    GM.setValue('profiles', JSON.stringify(this.profiles));
  },
  load: async function () {
    const profiles = await GM.getValue('profiles');
    if (profiles) {
      this.profiles = JSON.parse(profiles);
    }
  },
};

GM.post = async (url, data, headers = {}) => {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: 'POST',
      url,
      headers,
      data,
      onload: (res) => {
        resolve({
          json: async () => JSON.parse(res.responseText),
          text: async () => res.responseText,
          headers: async () =>
            res.responseHeaders.split('\r\n').map((h) => h.split(': ')),
          raw: res,
        });
      },
    });
  });
};

GM.get = async (url) => {
  return new Promise((resolve, reject) => {
    GM.xmlHttpRequest({
      method: 'GET',
      url,
      headers: {
        Accept: 'application/json',
      },
      onload: (res) => {
        resolve({
          json: async () => JSON.parse(res.responseText),
          text: async () => res.responseText,
          headers: async () =>
            Object.fromEntries(
              res.responseHeaders.split('\r\n').map((h) => h.split(': '))
            ),
          raw: res,
        });
      },
    });
  });
};

async function testClient(url, username, password, client) {
  let clients = {
    trans: async () => {
      let headers = {
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        'Content-Type': 'application/json',
        'X-Transmission-Session-Id': null,
      };
      let res = await GM.post(`${url}/transmission/rpc`, null, headers);
      if (res.raw.status !== 401) {
        return true;
      }
      return false;
    },
    qbit: async () => {
      let res = await GM.post(
        `${url}/api/v2/auth/login`,
        `username=${username}&password=${password}`,
        { 'content-type': 'application/x-www-form-urlencoded', cookie: 'SID=' }
      );
      if ((await res.text()) === 'Ok.') {
        return true;
      }
      return false;
    },
    deluge: async () => {
      let res = await GM.post(
        `${url}/json`,
        JSON.stringify({
          method: 'auth.login',
          params: [password],
          id: 0,
        }),
        { 'content-type': 'application/json' }
      );
      try {
        if ((await res.json()).result) {
          return true;
        }
      } catch (e) {
        return false;
      }
      return false;
    },
    flood: async () => {
      let res = await GM.post(
        `${url}/api/auth/authenticate`,
        JSON.stringify({ password, username }),
        { 'content-type': 'application/json' }
      );
      try {
        if ((await res.json()).success) return true;
      } catch (e) {
        return false;
      }
      return false;
    },
  };
  let result = await clients[client]();
  console.log('result', result);
  return result;
}

async function detectClient(url) {
  const res = await GM.get(url);
  const body = await res.text();
  const headers = await res.headers();
  console.log(res.raw);
  if (headers.hasOwnProperty('WWW-Authenticate')) {
    const wwwAuthenticateHeader = headers['WWW-Authenticate'];
    if (wwwAuthenticateHeader.includes('"Transmission"')) return 'trans';
  }
  if (body.includes('<title>Deluge ')) return 'deluge';
  if (body.includes('<title>Flood</title>')) return 'flood';
  if (body.includes('<title>qBittorrent ')) return 'qbit';
  return 'unknown';
}

function Settings(panel) {
  const shadow = panel.panel.root;
  return (
    <>
      <div className={styles.title}>SendToClient</div>
      <div>
        <form
          className={styles.settings}
          onsubmit={async (e) => {
            e.preventDefault();
            return false;
          }}
        >
          <label for="client">Client:</label>
          <select
            id="client"
            name="client"
            onchange={(e) => {
              if (
                shadow.querySelector('#host').value === '' &&
                e.target.value !== 'unknown'
              )
                shadow.querySelector('#host').value =
                  e.target.value === 'flood'
                    ? document.location.href.replace(/\/overview|login\/$/, '')
                    : document.location.href.replace(/\/$/, '');
              shadow.querySelector("label[for='username']").hidden =
                e.target.value === 'deluge';
              shadow.querySelector('#username').hidden =
                e.target.value === 'deluge';
            }}
          >
            <option value="none" default>
              None
            </option>
            <option value="deluge">Deluge</option>
            <option value="flood">Flood</option>
            <option value="qbit">qBittorrent</option>
            <option value="trans">Transmission</option>
            <option value="unknown" hidden>
              Not supported by auto detect
            </option>
          </select>
          <label for="host">Host:</label>
          <input type="text" id="host" name="host" />
          <label for="username">Username:</label>
          <input type="text" id="username" name="username" />
          <label for="password">Password:</label>
          <input type="password" id="password" name="password" />
          <label for="saveLocation">Save location:</label>
          <input type="text" id="saveLocation" name="saveLocation" />
          <button
            onclick={async (e) => {
              console.log(e);
              shadow.querySelector('select#client').value = await detectClient(
                shadow.querySelector('#host').value
              );
              shadow
                .querySelector('select#client')
                .onchange({ target: shadow.querySelector('select#client') });
            }}
          >
            Detect client
          </button>
          <button
            onclick={async (e) => {
              shadow.querySelector('#res').innerText = (await testClient(
                shadow.querySelector('#host').value,
                shadow.querySelector('#username').value,
                shadow.querySelector('#password').value,
                shadow.querySelector('select#client').value
              ))
                ? 'Client seems to be working'
                : "Client doesn't seem to be working";
            }}
          >
            Test client
          </button>
          <input type="submit" value="Save" />
          <button onclick={(e) => panel.panel.hide()}>Close</button>
        </form>
          <p id="res" style="text-align: center;"></p>
      </div>
    </>
  );
}

// Let's create a movable panel using @violentmonkey/ui
const panel = VM.getPanel({
  // content: <Settings />,
  theme: 'dark',
  shadow: true,
  style: [globalCss, stylesheet].join('\n'),
});
// panel.wrapper.style.top = '100px';
// panel.wrapper.style.left = '50vw';
// panel.wrapper.style.overflow = 'hidden';
panel.setContent(<Settings panel={panel} />);
panel.setMovable(false);
// document.body.style.overflow = 'hidden';
let original_show = panel.show;
panel.show = () => {
  original_show.apply(panel);
  document.body.style.overflow = 'hidden';
};

let original_hide = panel.hide;
panel.hide = () => {
  original_hide.apply(panel);
  document.body.style.overflow = 'auto';
};
panel.root.host.style.zIndex = 99999999999;
GM.registerMenuCommand('Settings', () => panel.show());
console.log(panel);
