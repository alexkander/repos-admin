(() => {
  const query = AppHelpers.queryStringToObject(location.search);

  if (query.msg) {
    document.querySelectorAll('.app--message').forEach((element) => {
      element.innerHTML = query.msg;
    });
  }
})();
