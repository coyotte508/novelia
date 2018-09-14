import { DailyCount, DailyThrottle } from '../models';

async function addView(req: Express.Request) {
  try {
    if (!req.chapter.public) {
      return;
    }

    try {
      await DailyThrottle.add(req.ip, "view-chapter");
    } catch (err) {
      return;
    }

    await Promise.all([
      req.chapter.update({$inc: {views: 1}}),
      req.novel.update({$inc: {totalViews: 1}}),
      DailyCount.add("view-novel", req.novel.id)
    ]);
  } catch (err) {
    console.error(err);
  }
}

export {
  addView
};
