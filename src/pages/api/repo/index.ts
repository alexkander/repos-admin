import type { NextApiRequest, NextApiResponse } from 'next';

import { RepoRepository } from '../../../types/Repo';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const repos = await RepoRepository.findAsync();
    res.status(200).json(repos);
  } else if (req.method === 'POST') {
    const newRepo = req.body;
    const addedRepo = await RepoRepository.insertAsync(newRepo);
    res.status(201).json(addedRepo);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
