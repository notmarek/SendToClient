const ButtonTypes = {
  simple: 0,
  extended: 1,
}

export const globalSettingsManager = {
  settings: {
    button_type: ButtonTypes.simple,
  },

  get button_type() {
    return this.settings.button_type;
  },

  set button_type(val) {
    this.settings.button_type = val;
    this.save();
  },

  async load() {
    this.settings = JSON.parse(await GM.getValue('settings'));
  },


  async save() {
    await GM.setValue('settings', JSON.stringify(this.settings));
  },
}
