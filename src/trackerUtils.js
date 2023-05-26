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
    name: 'BLU UNIT3D',
    matches: ['blutopia.cc', 'aither.cc'],
    run: async () => {
      let rid = await fetch(
        Array.from(document.querySelectorAll('ul>li>a')).find(
          (e) => e.innerText === 'My Profile'
        ).href + '/rsskey/edit'
      )
        .then((e) => e.text())
        .then(
          (e) =>
            e
              .replaceAll(/\s/g, '')
              .match(
                /name="current_rsskey"readonlytype="text"value="(.*?)">/
              )[1]
        );
      handlers.find((h) => h.name === 'UNIT3D').run(rid);
    },
  },
  {
    name: 'UNIT3D',
    matches: ['desitorrents.tv', 'jptv.club', 'telly.wtf', 'torrentseeds.org'],
    run: async (rid = null) => {
      if (!rid) {
        rid = await fetch(
          Array.from(document.querySelectorAll('ul>li>a')).find((e) =>
            e.innerText.includes('My Profile')
          ).href + '/settings/security'
        )
          .then((e) => e.text())
          .then((e) => e.match(/ current_rid">(.*?)</)[1]);
      }
      const appendButton = () => {
        Array.from(document.querySelectorAll('a[title="Download"]'))
          .concat(
            Array.from(
              document.querySelectorAll(
                'button[title="Download"], button[data-original-title="Download"]'
              )
            ).map((e) => e.parentElement)
          )
          .forEach((a) => {
            let parent = a.parentElement;
            let torrentUrl =
              a.href.replace('/torrents/', '/torrent/') + `.${rid}`;
            parent.appendChild(
              VM.m(
                <a
                  href="#"
                  onclick={async (e) => {
                    e.preventDefault();
                    await profileManager.selectedProfile.addTorrent(torrentUrl);
                    e.target.innerText = 'Added!';
                    e.target.onclick = null;
                  }}
                >
                  ST
                </a>
              )
            );
          });
      };
      appendButton();
      console.log(
        '[SendToClient] Bypassing CSP so we can listen for soft navigations.'
      );

      document.addEventListener('popstate', () => {
        console.log(
          '[SendToClient] Detected a soft navigation to ' +
            unsafeWindow.location.href
        );
        appendButton();
      });
      // listen for a CSP violation so that we can grab the nonces
      document.addEventListener('securitypolicyviolation', (e) => {
        const nonce = e.originalPolicy.match(/nonce-(.*?)'/)[1];
        let actualScript = VM.m(
          <script nonce={nonce}>
            {`console.log('[SendToClient] Adding a navigation listener.');
            (() => {
              let oldPushState = history.pushState;
              history.pushState = function pushState() {
                  let ret = oldPushState.apply(this, arguments);
                  document.dispatchEvent(new Event('popstate'));
                  return ret;
              };
            })();`}
          </script>
        );
        document.head.appendChild(actualScript).remove();
      });
      // trigger a CSP violation
      document.head
        .appendChild(
          VM.m(<script nonce="nonce-123">window.csp = "csp :(";</script>)
        )
        .remove();
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
