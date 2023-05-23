export const XFetch = {
  post: async (url, data, headers = {}) => {
    return new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: 'POST',
        url,
        headers,
        data,
        onload: (res) => {
          resolve({
            json: async () => JSON.parse(res.responseText),
            text: async () => res.responseText,
            headers: async () =>
              Object.fromEntries(
                res.responseHeaders.split('\r\n').map((h) => h.split(': '))
              ),
            raw: res,
          });
        },
      });
    });
  },
  get: async (url) => {
    return new Promise((resolve, reject) => {
      GM.xmlHttpRequest({
        method: 'GET',
        url,
        headers: {
          Accept: 'application/json',
        },
        onload: (res) => {
          resolve({
            json: async () => JSON.parse(res.responseText),
            text: async () => res.responseText,
            headers: async () =>
              Object.fromEntries(
                res.responseHeaders.split('\r\n').map((h) => h.split(': '))
              ),
            raw: res,
          });
        },
      });
    });
  },
};
