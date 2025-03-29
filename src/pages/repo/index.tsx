import { GetServerSideProps } from 'next';

import RepoTable from '../../components/RepoTable';
import { repoController } from '../../modules/repo/repo.controller';

const RepoHome = RepoTable;

export const getServerSideProps: GetServerSideProps = async () => {
  const records = await repoController.getAllRepos();
  return {
    props: { records },
  };
};

export default RepoHome;
