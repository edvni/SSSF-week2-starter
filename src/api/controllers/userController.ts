import {NextFunction, Request, Response} from 'express';
import {UserOutput, User} from '../../types/DBTypes';
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
    const users = await userModel.find().select('-password -role');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const userPost = async (
  req: Request<{}, {}, User>,
  res: Response,
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
    const userOutput: UserOutput = {
      _id: user._id,
      user_name: user.user_name,
      email: user.email,
    };
    res.status(200).json({message: 'User created', data: userOutput});
  } catch (error) {
    next(error);
  }
};

const userGet = async (
  req: Request<{id: string}>,
  res: Response<UserOutput>,
  next: NextFunction
) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select('-password -role');
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    console.log(user);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// prettier-ignore
const userPutCurrent = async (
  req: Request<{}, {}, Omit<User, '_id'>>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = (res.locals.user as User)._id;
    const user = await userModel.findByIdAndUpdate(id, req.body, {
      new: true,
    }).select('-password -role');
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    res.json({message: 'User updated', data: user as UserOutput});
  } catch (error) {
    next(error);
  }
};

const userDeleteCurrent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (await userModel.findByIdAndDelete(
      res.locals.user._id
    )) as unknown as User;

    if (!user) {
      throw new CustomError('User not found', 404);
    }
    const userOutput: UserOutput = {
      _id: user._id,
      user_name: user.user_name,
      email: user.email,
    };

    res.json({message: 'User deleted successfully', data: userOutput});
  } catch (error) {
    next(error);
  }
};

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  if (!res.locals.user) {
    next(new CustomError('token not valid', 403));
  } else {
    const userOutput: UserOutput = {
      _id: (res.locals.user as User)._id,
      email: (res.locals.user as User).email,
      user_name: (res.locals.user as User).user_name,
    };
    res.json(userOutput);
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
