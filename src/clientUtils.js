import { XFetch } from './XFetch';

// TODO: Create an _addTo compat function

export const addTorrent = async (
  torrentUrl,
  clientUrl,
  username,
  password,
  client,
  path
) => {
  let implementations = {
    qbit: async () => {
      XFetch.post(
        `${clientUrl}/api/v2/auth/login`,
        `username=${username}&password=${password}`,
        { 'content-type': 'application/x-www-form-urlencoded' }
      );
      let tor_data = new FormData();
      tor_data.append('urls', torrentUrl);
      if (path) {
        tor_data.append('savepath', path);
      }
      XFetch.post(`${clientUrl}/api/v2/torrents/add`, tor_data);
    },
    trans: async (session_id = null) => {
      let headers = {
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        'Content-Type': 'application/json',
      };
      if (session_id) headers['X-Transmission-Session-Id'] = session_id;
      let res = await XFetch.post(
        `${clientUrl}/transmission/rpc`,
        JSON.stringify({
          arguments: { filename: url, 'download-dir': path },
          method: 'torrent-add',
        }),
        headers
      );
      if (res.raw.status === 409) {
        implementations.trans((await res.headers())['X-Transmission-Session-Id']);
      }
    },
    flood: async () => {
      // login
      XFetch.post(
        `${clientUrl}/api/auth/authenticate`,
        JSON.stringify({ password, username }),
        { 'content-type': 'application/json' }
      );
      XFetch.post(
        `${clientUrl}/api/torrents/add-urls`,
        JSON.stringify({ urls: [torrentUrl], destination: path, start: true }),
        { 'content-type': 'application/json' }
      );
    },
    deluge: async () => {
      XFetch.post(
        `${clientUrl}/json`,
        JSON.stringify({
          method: 'auth.login',
          params: [password],
          id: 0,
        }),
        { 'content-type': 'application/json' }
      );
      let res = await XFetch.post(
        `${clientUrl}/json`,
        JSON.stringify({
          method: 'web.download_torrent_from_url',
          params: [torrentUrl],
          id: 1,
        }),
        { 'content-type': 'application/json' }
      );
      XFetch.post(
        `${clientUrl}/json`,
        JSON.stringify({
          method: 'web.add_torrents',
          params: [
            [
              {
                path: (await res.json()).result,
                options: {
                  add_paused: false,
                  download_location: path,
                },
              },
            ],
          ],
          id: 2,
        }),
        { 'content-type': 'application/json' }
      );
    },
  };

   await implementations[client]();
};

export async function testClient(url, username, password, client) {
  let clients = {
    trans: async () => {
      let headers = {
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        'Content-Type': 'application/json',
        'X-Transmission-Session-Id': null,
      };
      let res = await XFetch.post(`${url}/transmission/rpc`, null, headers);
      if (res.raw.status !== 401) {
        return true;
      }
      return false;
    },
    qbit: async () => {
      let res = await XFetch.post(
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
      let res = await XFetch.post(
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
      let res = await XFetch.post(
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

export async function detectClient(url) {
  const res = await XFetch.get(url);
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
