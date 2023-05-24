// global CSS

import { profileManager } from './profileManager';
import { Settings } from './settings';
import { createButtons } from './trackerUtils';
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

GM.registerMenuCommand('Settings', () => {
  Settings();
});
const profileQuickSwitcher = () => {
  let id = GM.registerMenuCommand(
    `Selected Profile: ${profileManager.selectedProfile.name}`,
    () => {
      let next_profile =
        profileManager.profiles.findIndex(
          (e) => e.id === profileManager.selectedProfile.id
        ) + 1;
      profileManager.setSelectedProfile(
        next_profile < profileManager.profiles.length ? next_profile : 0
      );
      GM.unregisterMenuCommand(id);
      Settings;
      profileQuickSwitcher();
    }
  );
};

profileManager.load().then(() => {
  profileQuickSwitcher();
  createButtons();
});
