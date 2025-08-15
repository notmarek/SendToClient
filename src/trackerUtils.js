import { profileManager } from './profileManager';
import { globalSettingsManager } from './globalSettingsManager.js';
import styles, { stylesheet } from './style.module.css';
function ExtendeSTCProfile({ panel, profile, torrentUrl }) {
  return (<button style="display: block; padding: 5px; margin: 5px; cursor: pointer;" onclick={
    (e)=>{
      profile.addTorrent(torrentUrl);
      return panel.hide();
    }
  }>
    {profile.name}
  </button>
  );
};
function ExtendedSTCElement({ panel, torrentUrl }) {
  let profiles = [];
  for (let profile of profileManager.profiles) {
    profiles.push(<ExtendeSTCProfile panel={panel} profile={profile} torrentUrl={torrentUrl}/>);
  }
  return (<div style="display: flex; flex-direction: column; align-items: center; justify-content:center;">
    Choose which profile to send to
   {profiles}
  <button style="display: block; padding: 5px; margin: 5px; background-color: #fe0000; cursor: pointer;" onclick={() => panel.hide()}>Cancel</button>
    </div>);
};

const ExtendedSTC = (torrentUrl) => {
  const panel = VM.getPanel({
    theme: 'dark',
    shadow: true,
    style: stylesheet,
  });
  // give the panel access to itself :)
  panel.setContent(<ExtendedSTCElement panel={panel} torrentUrl={torrentUrl} />);
  panel.setMovable(false);
  panel.wrapper.children[0].classList.add(styles.wrapper);
  let original_show = panel.show;
  panel.show = () => {
    original_show.apply(panel);
    document.body.style.overflow = 'hidden';
  };

  let original_hide = panel.hide;
  panel.hide = () => {
    original_hide.apply(panel);
    document.body.style.overflow = 'auto';
  };
  panel.show();
};
const XSTBTN = ({ torrentUrl, freeleech }) => {
  return (
    <a title="Add to client - extended!"
       href="#"
       className="sendtoclient"
       onclick={async (e) => {
          if (freeleech)
           if (!confirm('After sending to client a feeleech token will be consumed!'))
            return;

          ExtendedSTC(torrentUrl);
       }}
    >
    X{freeleech ? "F" : ""}ST
    </a>
  );
}
const STBTN = ({ torrentUrl }) => {
  return globalSettingsManager.button_type ? <XSTBTN freeleech={false} torrentUrl={torrentUrl}/> : (
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
  return globalSettingsManager.button_type ? <XSTBTN freeleech={true} torrentUrl={torrentUrl} /> : (
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

const handlers = [{
  name: 'Gazelle',
  matches: ["gazellegames.net", "animebytes.tv", "orpheus.network", "passthepopcorn.me", "greatposterwall.com", "redacted.ch", "jpopsuki.eu", "tv-vault.me", "sugoimusic.me", "ianon.app", "alpharatio.cc", "uhdbits.org", "morethantv.me", "empornium.is", "deepbassnine.com", "broadcasthe.net", "secret-cinema.pw"],
  run: async () => {
    const links = Array.from(document.querySelectorAll('a')).filter(a =>
      a.innerText.trim() === 'DL' ||
      a.title === 'Download Torrent' ||
      a.classList.contains('link_1')
    );

    for (const a of links) {
      let parent = a.closest('.basic-movie-list__torrent__action');
      if (!parent) {
        parent = a.parentElement;
      }
      let torrentUrl = a.href;
      let buttons = Array.from(parent.childNodes).filter(e => e.nodeName !== '#text');
      let fl = Array.from(parent.querySelectorAll('a')).find(a => a.innerText === 'FL');
      let fst = fl ? VM.h(VM.Fragment, null, "\xA0|\xA0", VM.h(FSTBTN, {
        torrentUrl: fl.href
      })) : null;

      parent.innerHTML = ''; // Use '' instead of null to avoid issues
      parent.appendChild(VM.m(VM.h(VM.Fragment, null, "[\xA0", buttons.map(e => VM.h(VM.Fragment, null, e, " | ")), VM.h(STBTN, {
        torrentUrl: torrentUrl
      }), fst, "\xA0]")));
    }

    window.addEventListener('profileChanged', () => {
      document.querySelectorAll('a.sendtoclient').forEach(e => {
        if (e.title.includes('Freeleechize')) {
          e.title = `Freeleechize and add to ${profileManager.selectedProfile.name}.`;
        } else {
          e.title = `Add to ${profileManager.selectedProfile.name}.`;
        }
      });
    });
  }
},
  {
    name: 'BLU UNIT3D',
    matches: 'sites[BLU UNIT3D]',
    run: async (rid = null) => {
      rid = await fetch(
        document.querySelector('.top-nav__username').href + '/rsskeys'
      )
        .then((e) => e.text())
        .then((e) => e.replaceAll(/\s/g, ''))
        .then((e) => e.match(/tbody>*<tr>*<td>*(.*?)<\/td>/)[1]);
      handlers.find((h) => h.name === 'UNIT3D').run(rid);
    },
  },
  {
    name: 'HUNO',
    matches: 'sites[HUNO]',
    run: async (rid = null) => {
      if (!rid) {
        rid = await fetch(
          Array.from(document.querySelectorAll('ul>li>a'))
            .find((e) => e.innerText.includes('My Profile'))
            .href.replace(/\.\d+$/, '') + '/settings/security'
        )
          .then((e) => e.text())
          .then((e) => e.replaceAll(/\s/g, ''))
          .then((e) => e.match(/RSSKey<\/p><codeclass="inline">(.*?)</)[1]);
        const appendButton = () => {
          Array.from(
            document.querySelectorAll('a[href*="/torrents/download/"]')
          ).forEach((a) => {
            let parent = a.parentElement;
            let torrentUrl = `${a.href.replace(
              '/torrents/',
              '/torrent/'
            )}.${rid}`;
            parent.appendChild(
              VM.m(
                <>
                  {' '}
                  <STBTN torrentUrl={torrentUrl} />
                </>
              )
            );
          });
        };
        appendButton();
        let oldPushState = unsafeWindow.history.pushState;
        unsafeWindow.history.pushState = function () {
          console.log(
            '[SendToClient] Detected a soft navigation to ${unsafeWindow.location.href}'
          );
          appendButton();
          return oldPushState.apply(this, arguments);
        };
      }
    },
  },
  {
    name: 'F3NIX',
    matches: 'sites[F3NIX]',
    run: async (rid = null) => {
      if (!rid) {
        rid = await fetch(location.origin + '/settings/security/rsskey')
          .then((e) => e.text())
          .then(
            (e) =>
              e.match(
                /class="beta-form-main" name="null" value="(.*?)" disabled>/
              )[1]
          );
      }
      const appendButton = () => {
        Array.from(
          document.querySelectorAll('a[title="Download Torrent"]')
        ).forEach((a) => {
          let parent = a.parentElement;
          let torrentUrl = `${a.href.replace(
            '/download/',
            '/torrent/download/'
          )}.${rid}`;
          parent.appendChild(
            VM.m(
              <>
                {' '}
                <STBTN torrentUrl={torrentUrl} />
              </>
            )
          );
        });
      };
      appendButton();
      let oldPushState = unsafeWindow.history.pushState;
      unsafeWindow.history.pushState = function () {
        console.log(
          '[SendToClient] Detected a soft navigation to ${unsafeWindow.location.href}'
        );
        appendButton();
        return oldPushState.apply(this, arguments);
      };
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
  document.querySelectorAll('.sendtoclient').forEach(button => button.remove());

  for (const handler of handlers) {
    const regex = handler.matches.join('|');
    if (unsafeWindow.location.href.match(regex)) {
      handler.run();
      console.log(`%c[SendToClient] Using engine {${handler.name}}`, 'color: #42adf5; font-weight: bold; font-size: 1.5em;');
      return handler.name;
    }
  }
};
