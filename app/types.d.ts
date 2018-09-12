import { UserDocument } from "./models/user";
import { NovelDocument } from "./models/novel";
import { ChapterDocument } from "./models/chapter";
import { CommentDocument } from "./models/comment";
import { CategoryDocument } from "./models/category";

import {Request, Response} from 'express';

declare global {
  namespace Express {
    export interface User extends UserDocument {

    }

    export interface Request {
      flash(): { [key: string]: string[] };
      flash(message: string): any;
      flash(event: string, message: string): any;
      categoryName(cat: string): string;
      get(header: string): string;
      params: {[key: string]: string};
      query: {[key: string]: string};

      session?: Session;

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

import EResponse = Express.Response;
import ERequest = Express.Request;

export { EResponse as Response, ERequest as Request };
