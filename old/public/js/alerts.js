(() => {
  const query = AppHelpers.queryStringToObject(location.search);

  if (query.success) {
    document.querySelectorAll('.app--message-success').forEach((element) => {
      element.innerHTML = query.success;
      element.classList.remove('d-none');
    });
  }

  if (query.fails) {
    document.querySelectorAll('.app--message-fails').forEach((element) => {
      element.innerHTML = query.fails;
      element.classList.remove('d-none');
    });
  }
})();
