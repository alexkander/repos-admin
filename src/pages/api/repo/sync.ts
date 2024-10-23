import type { NextApiRequest, NextApiResponse } from 'next';

import { RepoController } from '../../../modules/repo/repo.controller';

const repoController = new RepoController();

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const result = await repoController.sync();
    res.status(200).json(result);
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
