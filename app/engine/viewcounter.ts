import * as NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 3600 * 6
});

function addView(req) {
  if (!req.chapter.public) {
    return;
  }
  if (cache.get(req.chapter.id + "-" + req.ip) !== undefined) {
    return;
  }
  cache.set(req.chapter.id + "-" + req.ip, Date.now());

  req.chapter.update({$inc: {views: 1}}).exec();
  req.novel.update({$inc: {totalViews: 1}}).exec();
}

export {
  addView
};
