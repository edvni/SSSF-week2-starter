import {NextFunction, Request, Response} from 'express';
import {UserOutput, User, LoginUser} from '../../types/DBTypes';
import {MessageResponse, PostMessage} from '../../types/MessageTypes';
import userModel from '../models/userModel';
import bcrypt from 'bcryptjs';
import CustomError from '../../classes/CustomError';
// TODO: create the following functions:
// - userGet - get user by id X
// - userListGet - get all users X
// - userPost - create new user. Remember to hash password X
// - userPutCurrent - update current user
// - userDeleteCurrent - delete current user
// - checkToken - check if current user token is valid: return data from res.locals.user as UserOutput. No need for database query

const userListGet = async (
  _req: Request,
  res: Response<UserOutput[]>,
  next: NextFunction
) => {
  try {
    const users = await userModel.find();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const userPost = async (
  req: Request<{}, {}, User>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  try {
    const salt = bcrypt.genSaltSync(10);

    const userInput = {
      user_name: req.body.user_name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, salt),
      role: 'user',
    };

    const user = await userModel.create(userInput);
    console.log(user);
    res.status(201).json({message: 'User created'});
  } catch (error) {
    next(error);
  }
};

const userGet = async (
  req: Request<{id: string}>,
  res: Response<User>,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    const user = await userModel.findById(userId);

    if (!user) {
      throw new CustomError('User not found', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const userPutCurrent = async (
  req: Request<{id: string}, {}, Omit<User, '_id'>>,
  res: Response<PostMessage>,
  next: NextFunction
) => {
  try {
    const user = await userModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    res.json({message: 'User updated', _id: user._id});
  } catch (error) {
    next(error);
  }
};

const userDeleteCurrent = async (
  req: Request<{id: string}>,
  res: Response<{message: string}>,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    const user = await userModel.findByIdAndDelete(userId);

    if (!user) {
      throw new CustomError('User not found', 404);
    }

    res.json({message: 'User deleted successfully'});
  } catch (error) {
    next(error);
  }
};

const checkToken = (
  _req: Request,
  res: Response<UserOutput>,
  next: NextFunction
) => {
  try {
    const userData = res.locals.user;

    if (!userData) {
      throw new CustomError('Unauthorized access', 401);
    }

    res.json(userData);
  } catch (error) {
    next(error);
  }
};

export {
  userListGet,
  userPost,
  userGet,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
};
