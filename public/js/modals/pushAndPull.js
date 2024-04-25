(() => {
  const onModalShow = (evt) => {
    const repoDirectory = evt.relatedTarget.dataset.directory;
    const branchLargeName = evt.relatedTarget.dataset.branchLargeName;

    evt.target.querySelector('[name=directory]').value = repoDirectory;
    evt.target.querySelector('[name=branchLargeName]').value = branchLargeName;
    evt.target.querySelector('[name=remoteName]').value = '';
  };

  document.querySelectorAll('.app--modalPushAndPull').forEach((element) => {
    element.addEventListener('show.bs.modal', onModalShow);
  });
})();
