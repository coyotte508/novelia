import Router from 'express-promise-router';
import { Image } from '../../models';
import { assert404 } from '../utils';

const router = Router();

router.get('/:type/:filename', async (req, res) => {
  const stream = await Image.downloadStream(req.params.type, req.params.filename);

  assert404(!!stream, "Image not found");

  stream.pipe(res);
});

export default router;
