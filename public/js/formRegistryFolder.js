(() => {
  const newQuery = AppHelpers.queryStringToObject(location.search);

  const onFormSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const payload = {};
    for (var pair of formData.entries()) {
      payload[pair[0]] = pair[1];
    }
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };
    fetch('/folder', options).then(async (res) => {
      const data = await res.json();
      console.log(data);
      newQuery.msg = 'Folder created';
      location.search = AppHelpers.objectToQueryString(newQuery);
    });
  };

  document.querySelectorAll('.app--formRegistryFolder').forEach((element) => {
    element.addEventListener('submit', onFormSubmit);
  });
})();
