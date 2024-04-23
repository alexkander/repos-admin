(() => {
  const newQuery = AppHelpers.queryStringToObject(location.search);

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
    const newQueryString = AppHelpers.objectToQueryString(newQuery);
    location.search = newQueryString;
  };

  const onSortByClick = function (event) {
    const label = event.target;
    const field = label.dataset.field;
    newQuery.sort = newQuery.sort || {};
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
