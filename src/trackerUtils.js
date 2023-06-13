import { profileManager } from './profileManager';

const STBTN = ({ torrentUrl }) => {
  return (
    <a
      title={`Add to ${profileManager.selectedProfile.name}.`}
      href="#"
      className="sendtoclient"
      onclick={async (e) => {
        e.preventDefault();
        await profileManager.selectedProfile.addTorrent(torrentUrl);
        e.target.innerText = 'Added!';
        e.target.onclick = null;
      }}
    >
      ST
    </a>
  );
};
const FSTBTN = ({ torrentUrl }) => {
  return (
    <a
      href="#"
      title={`Freeleechize and add to ${profileManager.selectedProfile.name}.`}
      className="sendtoclient"
      onclick={async (e) => {
        e.preventDefault();
        if (!confirm('Are you sure you want to use a freeleech token here?'))
          return;
        await profileManager.selectedProfile.addTorrent(torrentUrl);
        e.target.innerText = 'Added!';
        e.target.onclick = null;
      }}
    >
      FST
    </a>
  );
};

const handlers = [
  {
    name: 'Gazelle',
    matches: 'sites[Gazelle]',
    run: async () => {
      for (const a of Array.from(document.querySelectorAll('a')).filter(
        (a) => a.innerText === 'DL' || a.title == 'Download Torrent'
      )) {
        let parent = a.parentElement;
        let torrentUrl = a.href;
        let buttons = Array.from(parent.childNodes).filter(
          (e) => e.nodeName !== '#text'
        );
        let fl = Array.from(parent.querySelectorAll('a')).find(
          (a) => a.innerText === 'FL'
        );
        let fst = fl ? (
          <>
            &nbsp;|&nbsp;
            <FSTBTN torrentUrl={fl.href} />
          </>
        ) : null;
        parent.innerHTML = null;
        parent.appendChild(
          VM.m(
            <>
              [&nbsp;
              {buttons.map((e) => (
                <>{e} | </>
              ))}
              <STBTN torrentUrl={torrentUrl} />
              {fst}
              &nbsp;]
            </>
          )
        );
      }
      window.addEventListener('profileChanged', () => {
        document.querySelectorAll('a.sendtoclient').forEach((e) => {
          if (e.title.includes('Freeleechize')) {
            e.title = `Freeleechize and add to ${profileManager.selectedProfile.name}.`;
          } else {
            e.title = `Add to ${profileManager.selectedProfile.name}.`;
          }
        });
      });
    },
  },
  {
    name: 'BLU UNIT3D',
    matches: 'sites[BLU UNIT3D]',
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
    matches: 'sites[UNIT3D]',
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
            parent.appendChild(VM.m(<STBTN torrentUrl={torrentUrl} />));
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
    name: 'Karagarga',
    matches: 'sites[Karagarga]',
    run: async () => {
      if (unsafeWindow.location.href.includes('details.php')) {
        let dl_btn = document.querySelector('a.index');
        let torrent_uri = dl_btn.href;
        return dl_btn.insertAdjacentElement(
          'afterend',
          VM.m(
            <span>
              &nbsp; <STBTN torrentUrl={torrent_uri} />
            </span>
          )
        );
      }
      document.querySelectorAll("img[alt='Download']").forEach((e) => {
        let parent = e.parentElement;
        let torrent_uri = e.parentElement.href;
        let container = parent.parentElement;
        let st = VM.m(<STBTN torrentUrl={torrent_uri} />);
        container.appendChild(st);
      });
    },
  },
  {
    name: 'TorrentLeech',
    matches: 'sites[TorrentLeech]',
    run: async () => {
      const username = document
        .querySelector('span.link')
        .getAttribute('onclick')
        .match('/profile/(.*?)/view')[1];
      let rid = await fetch(`/profile/${username}/edit`)
        .then((e) => e.text())
        .then(
          (e) =>
            e.replaceAll(/\s/g, '').match(/rss.torrentleech.org\/(.*?)\</)[1]
        );
      document.head.appendChild(
        VM.m(<style>{`td.td-quick-download { display: flex; }`}</style>)
      );
      for (const a of document.querySelectorAll('a.download')) {
        let torrent_uri = a.href.match(/\/download\/(\d*?)\/(.*?)$/);
        torrent_uri = `https://torrentleech.org/rss/download/${torrent_uri[1]}/${rid}/${torrent_uri[2]}`;
        a.parentElement.appendChild(VM.m(<STBTN torrentUrl={torrent_uri} />));
      }
    },
  },
  {
    name: 'AnilistBytes',
    matches: 'sites[AnilistBytes]',
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
      console.log(`%c[SendToClient] Using engine {${handler.name}}`, "color: #42adf5; font-weight: bold; font-size: 1.5em;");
      return handler.name;
    }
  }
};
