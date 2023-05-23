// global CSS

import { profileManager } from './profileManager';
import { Settings } from './settings';
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

profileManager.load();
GM.registerMenuCommand('Settings', Settings);
