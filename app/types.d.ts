import { UserDocument } from "./models/user";
import { NovelDocument } from "./models/novel";
import { ChapterDocument } from "./models/chapter";
import { CommentDocument } from "./models/comment";
import { CategoryDocument } from "./models/category";

declare global {
  namespace Express {
    export interface User extends UserDocument {

    }

    export interface Request {
      flash(): { [key: string]: string[] };
      flash(message: string): any;
      flash(event: string, message: string): any;
      categoryName(cat: string): string;
  
      user?: User;
      viewedUser?: UserDocument;
      chapter?: ChapterDocument;
      comment?: CommentDocument;
      categories?: CategoryDocument[];
      category?: CategoryDocument;
      novel?: NovelDocument;
      body: any;
      ip: string;
    }

    export interface Response {
      locals: {[_: string]: any};
    }
  }
}
