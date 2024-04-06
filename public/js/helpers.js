(() => {
  const AppHelpers = {};

  AppHelpers.queryStringToObject = (queryString) => {
    const params = new URLSearchParams(queryString);
    const result = {};

    for (const [key, value] of params.entries()) {
      const parts = key.split('[');
      let obj = result;
      for (let i = 0; i < parts.length; i++) {
        const currentKey = parts[i].replace(/\]$/, '');
        if (!obj[currentKey]) {
          if (i === parts.length - 1) {
            obj[currentKey] = decodeURIComponent(value);
          } else {
            obj[currentKey] = {};
          }
        }
        obj = obj[currentKey];
      }
    }
    return result;
  };

  AppHelpers.objectToQueryString = (obj, parentKey = '') => {
    let queryString = '';
    let sep = '';

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const encodedKey = parentKey
          ? `${parentKey}[${encodeURIComponent(key)}]`
          : encodeURIComponent(key);

        if (typeof value === 'object') {
          const subQueryString = objectToQueryString(value, encodedKey);
          queryString += subQueryString ? `${sep}${subQueryString}` : '';
        } else {
          queryString += `${sep}${encodedKey}=${encodeURIComponent(value)}`;
        }
        sep = '&';
      }
    }
    return queryString;
  };

  window.AppHelpers = AppHelpers;
})();
