import type { NextApiRequest, NextApiResponse } from 'next';

import { repoRepository } from '../../../modules/repo/repo.repository';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const repos = await repoRepository.find();
    const repo = repos.find((p) => p._id === id);
    if (repo) {
      res.status(200).json(repo);
    } else {
      res.status(404).end(`Producto con ID ${id} no encontrado`);
    }
  } else if (req.method === 'PUT') {
    const updateRepo = await repoRepository.update(id as string, req.body);
    res.status(200).json(updateRepo);
  } else if (req.method === 'DELETE') {
    await repoRepository.remove(id as string);
    res.status(204).end();
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
