import { testClient, addTorrent } from './clientUtils';

class Profile {
  constructor(id, name, host, username, password, client, saveLocation) {
    this.id = id;
    this.name = name;
    this.host = host;
    this.username = username;
    this.password = password;
    this.client = client;
    this.saveLocation = saveLocation;
  }

  async testConnection() {
    return await testClient(
      this.host,
      this.username,
      this.password,
      this.client
    );
  }

  async addTorrent(torrent_uri) {
    return await addTorrent(
      torrent_uri,
      this.host,
      this.username,
      this.password,
      this.client,
      this.saveLocation
    );
  }
}

export const profileManager = {
  profiles: [],
  selectedProfile: null,
  addProfile: function (profile) {
    this.profiles.push(profile);
  },
  removeProfile: function (id) {
    this.profiles = this.profiles.find((p) => p.id === id);
  },
  getProfile: function (id) {
    return this.profiles.find((p) => p.id === id) ?? new Profile(id, 'Default', '', '', '', 'none', '');
  },
  getProfiles: function () {
    if (this.profiles.length === 0) this.load();
    return this.profiles.length === 0
      ? [new Profile(0, 'Default', '', '', '', 'none', '')]
      : this.profiles;
  },
  save: function () {
    GM.setValue('profiles', JSON.stringify(this.profiles));
    GM.setValue('selectedProfile', this.selectedProfile.id);
  },
  load: async function () {
    const profiles = await GM.getValue('profiles');
    if (profiles) {
      this.profiles = JSON.parse(profiles);
    }
    this.selectedProfile = this.profiles[await GM.getValue('selectedProfile') ?? 0] ?? new Profile(0, 'Default', '', '', '', 'none', '');
  },
};
