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
          const subQueryString = AppHelpers.objectToQueryString(
            value,
            encodedKey,
          );
          queryString += subQueryString ? `${sep}${subQueryString}` : '';
        } else {
          queryString += `${sep}${encodedKey}=${encodeURIComponent(value)}`;
        }
        sep = '&';
      }
    }
    return queryString;
  };

  AppHelpers.showSuccessMessage = (msg) => {
    const query = AppHelpers.queryStringToObject(location.search);
    query.success = msg;
    delete query.fails;
    location.search = AppHelpers.objectToQueryString(query);
  };

  AppHelpers.showFailsMessage = (msg) => {
    const query = AppHelpers.queryStringToObject(location.search);
    query.fails = msg;
    delete query.success;
    location.search = AppHelpers.objectToQueryString(query);
  };

  AppHelpers.prepareLabels = (parentElement) => {
    parentElement.querySelectorAll('[data-app--label]').forEach((element) => {
      const prop = element.dataset['app-Label'];
      const input = parentElement.querySelector(`[name=${prop}]`);
      const text = input?.value || '';
      element.innerHTML = text;
    });
  };

  AppHelpers.prepareFormFields = (relatedTarget, target) => {
    Object.keys(relatedTarget.dataset)
      .filter((p) => p.startsWith('app-'))
      .forEach((datasetKey) => {
        const propName = `${datasetKey.substring(4, 5).toLowerCase()}${datasetKey.substring(5)}`;
        const value = relatedTarget.dataset[datasetKey];
        target.querySelector(`[name=${propName}]`).value = value;
      });
  };

  window.AppHelpers = AppHelpers;
})();
