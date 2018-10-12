import { DailyCount, DailyThrottle } from '../models';
import { Request } from '../types';

async function addView(req: Request) {
  try {
    if (!req.chapter.public) {
      return;
    }

    if (req.user && req.novel.author.ref.equals(req.user._id)) {
      return;
    }

    try {
      await DailyThrottle.add(req.ip, "view-chapter", req.novel.id, req.chapter.number);
    } catch (err) {
      return;
    }

    await Promise.all([
      req.chapter.update({$inc: {views: 1}}),
      req.novel.update({$inc: {totalViews: 1}}),
      DailyCount.add("view-novel", req.novel.id)
    ]);

    // Todo: instead of counting everytime, schedule jobs?
    const novelViews = await DailyCount.dailyCount("view-novel", req.novel.id);
    await req.novel.update({dailyViews: novelViews});
  } catch (err) {
    console.error(err);
  }
}

export {
  addView
};
