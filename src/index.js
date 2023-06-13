import { profileManager } from './profileManager';
import { Settings } from './settings';
import { createButtons } from './trackerUtils';

GM.registerMenuCommand('Settings', () => {
  Settings();
});
const profileQuickSwitcher = () => {
  let id = GM.registerMenuCommand(
    `Selected Profile: ${profileManager.selectedProfile.name}`,
    () => {}
  );
  window.addEventListener('profileChanged', () => {
    GM.unregisterMenuCommand(id);
    profileQuickSwitcher();
    window.removeEventListener('profileChanged', () => {});
  });
};

profileManager.load().then(() => {
  profileQuickSwitcher();
  createButtons();
});
