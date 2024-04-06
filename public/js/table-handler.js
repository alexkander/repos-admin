(() => {
  const queryStringToObject = (queryString) => {
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

  const objectToQueryString = (obj, parentKey = '') => {
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

  const newQuery = queryStringToObject(location.search);

  const onInputChange = (event) => {
    const input = event.target;
    const text = (input.value || '').trim();
    newQuery.search = newQuery.search || {};
    if (!text) {
      delete newQuery.search[input.name];
    } else {
      newQuery.search[input.name] = text;
    }
  };

  const onButtonClick = () => {
    refreshSearch();
  };

  const refreshSearch = () => {
    const newQueryString = objectToQueryString(newQuery);
    location.search = newQueryString;
  };

  const onSortByClick = function (event) {
    const label = event.target;
    const field = label.dataset.field;
    newQuery.sort = newQuery.sort || {};
    console.log([event, field, label, label.dataset]);
    if (!newQuery.sort[field]) {
      newQuery.sort[field] = 'asc';
    } else if (newQuery.sort[field] === 'asc') {
      newQuery.sort[field] = 'desc';
    } else if (newQuery.sort[field] === 'desc') {
      delete newQuery.sort[field];
    }
    refreshSearch();
  };

  document.querySelectorAll('.app--searchInput').forEach((element) => {
    element.addEventListener('change', onInputChange);
  });

  document.querySelectorAll('.app--searchButton').forEach((element) => {
    element.addEventListener('click', onButtonClick);
  });

  document.querySelectorAll('.app--sortByLabel').forEach((element) => {
    element.addEventListener('click', onSortByClick);
  });
})();
