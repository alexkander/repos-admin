(() => {
  const onModalShow = (evt) => {
    const remoteBranchId = evt.relatedTarget.dataset.remoteBranchId;
    const branchName = evt.relatedTarget.dataset.branchName;

    const select = evt.target.querySelector('[name=remoteBranchId]');
    const input = evt.target.querySelector('[name=branchName]');

    select.value = remoteBranchId;
    input.value = branchName;
  };

  document
    .getElementById('appModalCheckout')
    .addEventListener('show.bs.modal', onModalShow);
})();
