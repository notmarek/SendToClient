import styles, { stylesheet } from './style.module.css';
import { testClient, detectClient } from './clientUtils';
import { profileManager } from './profileManager';
const clientSelectorOnChange = (e, shadow) => {
  if (
    shadow.querySelector('#host').value === '' &&
    e.target.value !== 'unknown'
  )
    shadow.querySelector('#host').value =
      e.target.value === 'flood'
        ? document.location.href.replace(/\/overview|login\/$/, '')
        : document.location.href.replace(/\/$/, '');
  shadow.querySelector('#category').hidden = e.target.value !== 'qbit';
  shadow.querySelector("label[for='category']").hidden =
    e.target.value !== 'qbit';
  if (e.target.value === 'qbit') {
    shadow.querySelector('#category>select').onload();
  }
  shadow.querySelector("label[for='username']").hidden =
    e.target.value === 'deluge';
  shadow.querySelector('#username').hidden = e.target.value === 'deluge';
};

function ClientSelector({ shadow }) {
  return (
    <>
      <label for="client">Client:</label>

      <select
        id="client"
        name="client"
        onchange={(e) => clientSelectorOnChange(e, shadow)}
      >
        <option value="none" default>
          None
        </option>
        <option value="deluge">Deluge</option>
        <option value="flood">Flood</option>
        <option value="qbit">qBittorrent</option>
        <option value="trans">Transmission</option>
        <option value="unknown" hidden>
          Not supported by auto detect
        </option>
      </select>
    </>
  );
}

const profileOnSave = (e, shadow) => {
  let profile = profileManager.getProfile(
    shadow.querySelector('#profile').value
  );
  profile.host = shadow.querySelector('#host').value;
  profile.username = shadow.querySelector('#username').value;
  profile.password = shadow.querySelector('#password').value;
  profile.client = shadow.querySelector('#client').value;
  profile.saveLocation = shadow.querySelector('#saveLocation').value;
  profile.name = shadow.querySelector('#profilename').value;
  profile.category = shadow.querySelector('#category>input').value;
  profileManager.setSelectedProfile(profile.id);
  profileManager.setProfile(profile);
  profileManager.save();
  shadow.querySelector('#profile').innerHTML = null;
  shadow.querySelector('#profile').appendChild(
    VM.m(
      <>
        {profileManager.getProfiles().map((p) => {
          return (
            <option
              selected={p.id === profileManager.selectedProfile.id}
              value={p.id}
            >
              {p.name}
            </option>
          );
        })}
        <option value={profileManager.getNextId()}>New profile</option>
      </>
    )
  );
};

const addSiteToProfile = async (hostname, shadow) => {
  let result = await profileManager.selectedProfile.linkTo(hostname);

  if (
    result !== true &&
    confirm(
      `This site is already linked to "${result}". Do you want to replace it?`
    )
  )
    profileManager.selectedProfile.linkTo(hostname, true);
  profileSelectHandler({ target: shadow.querySelector('#profile') }, shadow);
};
function profileSelectHandler(e, shadow) {
  const profile = profileManager.getProfile(e.target.value);
  profileManager.setSelectedProfile(profile.id);
  shadow.querySelector('#host').value = profile.host;
  shadow.querySelector('#username').value = profile.username;
  shadow.querySelector('#password').value = profile.password;
  shadow.querySelector('#client').value = profile.client;
  shadow.querySelector('#saveLocation').value = profile.saveLocation;
  shadow.querySelector('#profilename').value = profile.name;
  shadow.querySelector('#linkToSite').innerHTML = null;
  shadow.querySelector('#linkToSite').appendChild(
    VM.m(
      <>
        {profileManager.selectedProfile.linkedTo.map((site) => (
          <option value={site}>{site}</option>
        ))}
        {profileManager.selectedProfile.linkedTo.includes(
          location.hostname
        ) ? null : (
          <option value={location.hostname}>Link to this site.</option>
        )}
      </>
    )
  );
  shadow
    .querySelector('select#client')
    .onchange({ target: shadow.querySelector('select#client') });
}

function ProfileSelector({ shadow }) {
  return (
    <>
      <label for="profile">Profile:</label>
      <select
        id="profile"
        name="profile"
        onchange={(e) => profileSelectHandler(e, shadow)}
      >
        {profileManager.getProfiles().map((p) => {
          return (
            <option
              selected={p.id === profileManager.selectedProfile.id}
              value={p.id}
            >
              {p.name}
            </option>
          );
        })}
        <option value={profileManager.getNextId()}>New profile</option>
      </select>
    </>
  );
}

async function loadCategories(shadow) {
  let options = await profileManager.selectedProfile.getCategories().then((e) =>
    e.map((cat) => (
      <option
        value={cat}
        selected={profileManager.selectedProfile.category === cat}
      >
        {cat}
      </option>
    ))
  );
  options.push(
    <option
      value=""
      default
      selected={profileManager.selectedProfile.category === ''}
    >
      Default
    </option>
  );
  shadow.querySelector('#category>input').value =
    profileManager.selectedProfile.category;
  shadow.querySelector('select[name="category"]').innerHTML = null;
  shadow
    .querySelector('select[name="category"]')
    .appendChild(VM.m(<>{options}</>));
}
function CategorySelector({ shadow, hidden }) {
  return (
    <>
      <label for="category" hidden={hidden}>
        Category:
      </label>
      <div id="category" hidden={hidden} className={styles.select_input}>
        <select
          name="category"
          onload={() => loadCategories(shadow)}
          onchange={(e) =>
            (shadow.querySelector('#category>input').value = e.target.value)
          }
        ></select>
        <input type="text" name="category" />
      </div>
    </>
  );
}

function LinkToSite({ shadow }) {
  return (
    <>
      <label for="linkToSite">Linked to:</label>
      <select
        onchange={async (e) => {
          if (profileManager.selectedProfile.linkedTo.includes(e.target.value))
            confirm('Do you want to unlink this site?') &&
              profileManager.selectedProfile.unlinkFrom(e.target.value);
          else await addSiteToProfile(e.target.value, shadow);
        }}
        id="linkToSite"
        name="linkToSite"
      >
        {profileManager.selectedProfile.linkedTo.map((site) => (
          <option value={site}>{site}</option>
        ))}
        {profileManager.selectedProfile.linkedTo.includes(
          location.hostname
        ) ? null : (
          <option value={location.hostname}>Link to this site.</option>
        )}
      </select>
    </>
  );
}

function SettingsElement({ panel }) {
  const shadow = panel.root;
  return (
    <>
      <div className={styles.title}>SendToClient</div>
      <div>
        <form
          className={styles.settings}
          onsubmit={async (e) => {
            e.preventDefault();
            profileOnSave(e, shadow);
            return false;
          }}
        >
          <ProfileSelector shadow={shadow} />
          <LinkToSite shadow={shadow} />
          <ClientSelector shadow={shadow} />
          <label for="profilename">Profile name:</label>
          <input type="text" id="profilename" name="profilename" />
          <label for="host">Host:</label>
          <input type="text" id="host" name="host" />
          <label for="username">Username:</label>
          <input type="text" id="username" name="username" />
          <label for="password">Password:</label>
          <input type="password" id="password" name="password" />
          <CategorySelector
            hidden={profileManager.selectedProfile.client !== 'qbit'}
            shadow={shadow}
          />

          <label for="saveLocation">Save location:</label>
          <input type="text" id="saveLocation" name="saveLocation" />
          <button
            onclick={async (e) => {
              e.preventDefault();
              shadow.querySelector('select#client').value = await detectClient(
                shadow.querySelector('#host').value
              );
              shadow
                .querySelector('select#client')
                .onchange({ target: shadow.querySelector('select#client') });
              return false;
            }}
          >
            Detect client
          </button>
          <button
            onclick={async (e) => {
              e.preventDefault();
              shadow.querySelector('#res').innerText = (await testClient(
                shadow.querySelector('#host').value,
                shadow.querySelector('#username').value,
                shadow.querySelector('#password').value,
                shadow.querySelector('select#client').value
              ))
                ? 'Client seems to be working'
                : "Client doesn't seem to be working";
              return false;
            }}
          >
            Test client
          </button>
          <input type="submit" value="Save" />
          <button onclick={(e) => panel.hide()}>Close</button>
        </form>
        <p id="res" style="text-align: center;"></p>
      </div>
    </>
  );
}

export const Settings = () => {
  const panel = VM.getPanel({
    theme: 'dark',
    shadow: true,
    style: stylesheet,
  });
  // give the panel access to itself :)
  panel.setContent(<SettingsElement panel={panel} />);
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
  profileSelectHandler(
    { target: { value: profileManager.selectedProfile.id } },
    panel.root
  );
};
