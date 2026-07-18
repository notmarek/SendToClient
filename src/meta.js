// ==UserScript==
// @name        SendToClient
// @namespace   NotMareks Scripts
// @description Painlessly send torrents to your bittorrent client.
// @match       STC.sites
// @grant       GM_addStyle
// @grant       GM.registerMenuCommand
// @grant       GM.unregisterMenuCommand
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.xmlHttpRequest
// @version     process.env.VERSION
// @author      process.env.AUTHOR
// @downloadURL https://github.com/epohgib/SendToClient/releases/latest/download/SendToClient.user.js
// @updateURL   https://github.com/epohgib/SendToClient/releases/latest/download/SendToClient.user.js
// @require     https://cdn.jsdelivr.net/combine/npm/@violentmonkey/dom@2,npm/@violentmonkey/ui@0.7
// ==/UserScript==

/**
 * @match STC.sites gets replaced with the sites from the sites.json file
 */
