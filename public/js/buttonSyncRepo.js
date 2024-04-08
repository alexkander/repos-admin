(() => {
  const onButtonClick = (event) => {
    event.preventDefault();
    const button = event.target;
    button.disabled = true;
    const options = { method: 'POST' };
    const query = AppHelpers.queryStringToObject(location.search);
    fetch('/repo/sync', options)
      .then(async (res) => {
        const data = await res.json();
        console.log(data);
        query.success = `${data.length} repos synchronized`;
        // location.search = AppHelpers.objectToQueryString(query);
      })
      .catch(() => {
        query.fail = 'Error synchronizing repos';
        // location.search = AppHelpers.objectToQueryString(query);
      })
      .finally(() => {
        button.disabled = true;
      });
  };

  document.querySelectorAll('.app--buttonSyncRepo').forEach((element) => {
    element.addEventListener('click', onButtonClick);
  });
})();
