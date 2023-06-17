import { XFetch } from './XFetch';

/**
 * @deprecated
 */
export const addTorrent = async (
  torrentUrl,
  clientUrl,
  username,
  password,
  client,
  path,
  category
) => {
  throw new Error('Deprecated.');
  let implementations = {
    qbit: async () => {},
    trans: async (session_id = null) => {},
    flood: async () => {},
    deluge: async () => {},
  };

  await implementations[client]();
};

/**
 * Base class for all clients
 * @abstract
 * @class
 * @property {string} clientUrl
 * @property {string} username
 * @property {string} password
 * @property {string} type
 */
class Client {
  type = 'base';
  constructor(clientUrl, username, password) {
    this.clientUrl = clientUrl;
    this.username = username;
    this.password = password;
  }

  /**
   * Tests if the client is working properly
   * @returns {boolean} success
   */
  async test() {
    return false;
  }

  /**
   * Takes a torrent url and adds it to the client
   * @param {string} torrentUrl
   * @returns {boolean} success
   */
  async addTorrent(torrentUrl) {
    return false;
  }
}
/**
 * Class for transmission
 * @class
 * @extends Client
 * @property {object} headers
 * @property {string} headers.Authorization
 * @property {string} headers.Content-Type
 */
class Transmission extends Client {
  type = 'trans';
  constructor(clientUrl, username, password) {
    super(clientUrl, username, password);
    this.headers = {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      'Content-Type': 'application/json',
    };
  }

  async test() {
    let headers = {
      ...this.headers,
      'X-Transmission-Session-Id': null,
    };
    let res = await XFetch.post(
      `${this.clientUrl}/transmission/rpc`,
      null,
      headers
    );
    if (res.raw.status !== 401) {
      return true;
    }
    return false;
  }

  /**
   * @param {string} torrentUrl
   * @param {string} path
   * @param {string} session_id - optional, the code will acquire it if not provided
   */
  async addTorrent(torrentUrl, path, session_id = null) {
    let headers = {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      'Content-Type': 'application/json',
    };
    if (session_id) headers['X-Transmission-Session-Id'] = session_id;
    let res = await XFetch.post(
      `${clientUrl}/transmission/rpc`,
      JSON.stringify({
        arguments: { filename: torrentUrl, 'download-dir': path },
        method: 'torrent-add',
      }),
      headers
    );
    if (res.raw.status === 409) {
      return this.addTorrent(
        torrentUrl,
        path,
        (await res.headers())['X-Transmission-Session-Id']
      );
    }
  }
}

/**
 * Class for qBittorrent
 * @class
 * @extends Client
 */
class qBittorrent extends Client {
  type = 'qbit';
  async test() {
    let res = await XFetch.post(
      `${this.clientUrl}/api/v2/auth/login`,
      `username=${this.username}&password=${this.password}`,
      { 'Content-Type': 'application/x-www-form-urlencoded', cookie: 'SID=' }
    );
    if ((await res.text()) === 'Ok.') {
      return true;
    }
    return false;
  }

  /**
   * @param {string} torrentUrl
   * @param {string} path - optional
   * @param {string} category - optional
   */
  async addTorrent(torrentUrl, path = null, category = null) {
    XFetch.post(
      `${this.clientUrl}/api/v2/auth/login`,
      `username=${this.username}&password=${this.password}`,
      { 'content-type': 'application/x-www-form-urlencoded' }
    );
    let torrent_data = new FormData();
    torrent_data.append('urls', torrentUrl);
    if (path) torrent_data.append('savepath', path);
    if (category) torrent_data.append('category', category);
    XFetch.post(`${this.clientUrl}/api/v2/torrents/add`, torrent_data);
  }

  /**
   * Get's the categories from the client
   * @returns {string[]} categories
   */
  async getCategories() {
    XFetch.post(
      `${this.clientUrl}/api/v2/auth/login`,
      `username=${this.username}&password=${this.password}`,
      { 'content-type': 'application/x-www-form-urlencoded' }
    );
    let res = await XFetch.get(`${this.clientUrl}/api/v2/torrents/categories`);
    try {
      return Object.keys(await res.json());
    } catch {
      return [];
    }
  }
}

/**
 * Class for Flood
 * @class
 * @extends Client
 */
class Flood extends Client {
  type = 'flood';
  async test() {
    let res = await XFetch.post(
      `${this.clientUrl}/api/auth/authenticate`,
      JSON.stringify({ password: this.password, username: this.username }),
      { 'content-type': 'application/json' }
    );
    try {
      if ((await res.json()).success) return true;
    } catch (e) {
      return false;
    }
    return false;
  }

  /**
   * @param {string} torrentUrl
   * @param {string} path - optional
   */
  async addTorrent(torrentUrl, path = null) {
    XFetch.post(
      `${this.clientUrl}/api/auth/authenticate`,
      JSON.stringify({ password: this.password, username: this.username }),
      { 'content-type': 'application/json' }
    );
    XFetch.post(
      `${this.clientUrl}/api/torrents/add-urls`,
      JSON.stringify({ urls: [torrentUrl], destination: path, start: true }),
      { 'content-type': 'application/json' }
    );
  }
}

/**
 * Class for Deluge
 * @class
 * @extends Client
 */
class Deluge extends Client {
  type = 'deluge';
  async test() {
    let res = await XFetch.post(
      `${this.clientUrl}/json`,
      JSON.stringify({
        method: 'auth.login',
        params: [this.password],
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
  }

  /**
   * @param {string} torrentUrl
   * @param {string} path - optional
   */
  async addTorrent(torrentUrl, path = null) {
    XFetch.post(
      `${this.clientUrl}/json`,
      JSON.stringify({
        method: 'auth.login',
        params: [this.password],
        id: 0,
      }),
      { 'content-type': 'application/json' }
    );
    let res = await XFetch.post(
      `${this.clientUrl}/json`,
      JSON.stringify({
        method: 'web.download_torrent_from_url',
        params: [torrentUrl],
        id: 1,
      }),
      { 'content-type': 'application/json' }
    );
    XFetch.post(
      `${this.clientUrl}/json`,
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
  }
}

/**
 * A factory to create a client
 * @param {string} clientUrl
 * @param {string} username
 * @param {string} password
 * @param {string} client - optional - will be detected if not provided
 * @returns {Client}
 */
export const clientFactory = (clientUrl, username, password, client = null) => {
  let clients = {
    flood: Flood,
    deluge: Deluge,
    qbit: qBittorrent,
    trans: Transmission,
  };
  return new clients[client || detectClient(clientUrl)](
    clientUrl,
    username,
    password
  );
};

/**
 * @deprecated
 */
export async function testClient(clientUrl, username, password, client) {
  throw new Error('Deprecated');
  let clients = {
    trans: async () => {},
    qbit: async () => {},
    deluge: async () => {},
    flood: async () => {},
  };
  let result = await clients[client]();
  return result;
}

/**
 * Detects the client
 * @param {string} url
 * @returns {string} client
 */
export async function detectClient(url) {
  const res = await XFetch.get(url);
  const body = await res.text();
  const headers = await res.headers();
  if (headers.hasOwnProperty('WWW-Authenticate')) {
    const wwwAuthenticateHeader = headers['WWW-Authenticate'];
    if (wwwAuthenticateHeader.includes('"Transmission"')) return 'trans';
  }
  if (body.includes('<title>Deluge ')) return 'deluge';
  if (body.includes('<title>Flood</title>')) return 'flood';
  if (body.includes('<title>qBittorrent ')) return 'qbit';
  return 'unknown';
}
