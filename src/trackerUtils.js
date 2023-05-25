import { profileManager } from './profileManager';

const handlers = [
  {
    name: 'Gazelle',
    matches: [
      'gazellegames.net',
      'animebytes.tv',
      'orpheus.network',
      'passthepopcorn.me',
      'greatposterwall.com',
      'redacted.ch',
      'jpopsuki.eu',
      'tv-vault.me',
      'sugoimusic.me',
      'ianon.app',
      'alpharatio.cc',
      'uhdbits.org',
      'morethantv.me',
      'empornium.is',
      'deepbassnine.com',
      'broadcasthe.net',
      'secret-cinema.pw',
    ],
    run: async () => {
      for (const a of Array.from(document.querySelectorAll('a')).filter(
        (a) => a.innerText === 'DL' || a.title == 'Download Torrent'
      )) {
        let parent = a.parentElement;
        let torrentUrl = a.href;
        let buttons = Array.from(parent.childNodes).filter(
          (e) => e.nodeName !== '#text'
        );
        console.log(parent);
        parent.innerHTML = null;
        parent.appendChild(
          VM.m(
            <>
              [&nbsp;
              {buttons.map((e) => (
                <>{e} | </>
              ))}
              <a
                href="#"
                title={`Add to ${profileManager.selectedProfile.name}.`}
                onclick={async (e) => {
                  e.preventDefault();
                  await profileManager.selectedProfile.addTorrent(torrentUrl);
                  e.target.innerText = 'Added!';
                  e.target.onclick = null;
                }}
              >
                ST
              </a>
              &nbsp;]
            </>
          )
        );
      }
    },
  },
  {
    name: 'AnilistBytes',
    matches: ['anilist.co'],
    run: async () => {
      unsafeWindow._addTo = async (torrentUrl) =>
        profileManager.selectedProfile.addTorrent(torrentUrl);
    },
  },
];

export const createButtons = async () => {
  for (const handler of handlers) {
    const regex = handler.matches.join('|');
    if (unsafeWindow.location.href.match(regex)) {
      handler.run();
      console.log('Matched ' + handler.name);
      return handler.name;
    }
  }
};
