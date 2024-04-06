(() => {
  const newQuery = AppHelpers.queryStringToObject(location.search);

  const onButtonClick = (event) => {
    event.preventDefault();
    const button = event.target;
    button.disabled = true;
    const options = { method: 'POST' };
    fetch('/repo/sync ', options)
      .then(async (res) => {
        const data = await res.json();
        console.log(data);
        newQuery.msg = 'Repos synchronized';
        // location.search = AppHelpers.objectToQueryString(newQuery);
      })
      .catch(() => {
        // newQuery.msg = 'Repos synchronized';
        // location.search = AppHelpers.objectToQueryString(newQuery);
      })
      .finally(() => {
        button.disabled = true;
      });
  };

  document.querySelectorAll('.app--buttonSyncRepo').forEach((element) => {
    element.addEventListener('click', onButtonClick);
  });
})();
