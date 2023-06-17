import { clientFactory } from './clientUtils';

class Profile {
  constructor(
    id,
    name,
    host,
    username,
    password,
    client,
    saveLocation,
    category,
    linkedTo = []
  ) {
    this.id = id;
    this.name = name;
    this.username = username;
    this.password = password;
    this.client = clientFactory(host, username, password, client);
    this.saveLocation = saveLocation;
    this.category = category;
    this.linkedTo = linkedTo;
  }
  async linkTo(site, replace = false) {
    let alreadyLinkedTo = profileManager.profiles.find((p) =>
      p.linkedTo.includes(site)
    );
    if (alreadyLinkedTo && !replace) {
      return alreadyLinkedTo.name;
    } else if (alreadyLinkedTo && replace) {
      alreadyLinkedTo.unlinkFrom(site);
    }
    if (this.linkedTo.includes(site)) return true;
    this.linkedTo.push(site);
    profileManager.save();
    return true;
  }
  async unlinkFrom(site) {
    this.linkedTo = this.linkedTo.filter((s) => s !== site);
    profileManager.save();
  }
  async getCategories() {
    if (this.client.type != 'qbit') return [];
    let res = await this.client.getCategories();
    return res;
  }
  async testConnection() {
    return await this.client.test();
  }

  async addTorrent(torrent_uri) {
    return await this.client.addTorrent(
      torrent_uri,
      this.saveLocation,
      this.category
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
    return (
      this.profiles.find((p) => Number(p.id) === Number(id)) ??
      new Profile(id, 'New Profile', '', '', '', 'none', '', '')
    );
  },
  getProfiles: function () {
    if (this.profiles.length === 0) this.load();
    return this.profiles;
  },
  setSelectedProfile: function (id) {
    this.selectedProfile = this.getProfile(id);
    window.dispatchEvent(
      new CustomEvent('profileChanged', { detail: this.selectedProfile })
    );
  },
  setProfile: function (profile) {
    if (!this.profiles.includes(this.getProfile(profile.id))) {
      this.profiles.push(profile);
    } else {
      this.profiles = this.profiles.map((p) => {
        if (p.id === profile.id) {
          p = profile;
        }
        return p;
      });
    }
  },
  getNextId: function () {
    if (this.profiles.length === 0) return 0;
    return (
      Number(this.profiles.sort((a, b) => Number(b.id) > Number(a.id))[0].id) +
      1
    );
  },
  save: function () {
    GM.setValue('profiles', JSON.stringify(this.profiles));
    GM.setValue('selectedProfile', this.selectedProfile.id);
  },
  load: async function () {
    const profiles = await GM.getValue('profiles');
    if (profiles) {
      this.profiles = JSON.parse(profiles).map(
        (p) =>
          new Profile(
            p.id,
            p.name,
            p.host,
            p.username,
            p.password,
            p.client,
            p.saveLocation,
            p.category ?? '',
            p.linkedTo ?? []
          )
      );
    }
    for (const profile of this.profiles) {
      for (const site of profile.linkedTo) {
        if (location.href.includes(site)) {
          this.selectedProfile = profile;
          return;
        }
      }
    }
    this.selectedProfile =
      this.getProfile(Number(await GM.getValue('selectedProfile')) ?? 0) ??
      new Profile(0, 'New Profile', '', '', '', 'none', '', '');
  },
};
