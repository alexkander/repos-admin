(() => {
  const onModalShow = (evt) => {
    const repoDirectory = evt.relatedTarget.dataset.directory;
    const branchLargeName = evt.relatedTarget.dataset.branchLargeName;
    const branchShortName = evt.relatedTarget.dataset.branchShortName;

    evt.target.querySelector('[name=directory]').value = repoDirectory;
    evt.target.querySelector('[name=branchLargeName]').value = branchLargeName;
    evt.target.querySelector('[name=newBranchName]').value = branchShortName;

    AppHelpers.prepareLabels(evt.target);
  };

  document.querySelectorAll('.app--modalBranchCheckout').forEach((element) => {
    element.addEventListener('show.bs.modal', onModalShow);
  });
})();
