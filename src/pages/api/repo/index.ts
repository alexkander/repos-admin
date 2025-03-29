import type { NextApiRequest, NextApiResponse } from 'next';

import { RepoController } from '../../../modules/repo/repo.controller';

const repoController = new RepoController();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const repos = await repoController.getAllRepos();
    res.status(200).json(repos);
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
