import { GetServerSideProps } from 'next';

import RepoTable from '../../components/RepoTable';
import { RepoService } from '../../modules/repo/repo.service';

const RepoHome = RepoTable;

export const getServerSideProps: GetServerSideProps = async () => {
  const repoService = new RepoService();
  const records = await repoService.find();
  return {
    props: { records },
  };
};

export default RepoHome;
