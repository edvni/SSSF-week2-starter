import {Types} from 'mongoose';
import {UserOutput} from './DBTypes';

type MessageResponse = {
  message: string;
};

type ErrorResponse = MessageResponse & {
  stack?: string;
};

type LoginResponse = {
  token: string;
  user: UserOutput;
};

type PostMessage = MessageResponse & {
  _id: Types.ObjectId;
};

type UploadResponse = MessageResponse & {
  id: number;
};

export {
  MessageResponse,
  ErrorResponse,
  LoginResponse,
  UploadResponse,
  PostMessage,
};
