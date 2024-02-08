// TODO: create following functions:
// - catGetByUser - get all cats by current user id
// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
// - catPutAdmin - only admin can change cat owner
// - catDeleteAdmin - only admin can delete cat
// - catDelete - only owner can delete cat X
// - catPut - only owner can update cat X
// - catGet - get cat by id X
// - catListGet - get all cats X
// - catPost - create new cat X
import {Request, Response, NextFunction} from 'express';
import {PostMessage} from '../../types/MessageTypes';
import CustomError from '../../classes/CustomError';
import CatModel from '../models/catModel';
import {Cat, LoginUser} from '../../types/DBTypes';

const catListGet = async (
  _req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const cats = await CatModel.find()
      .select('-__v')
      .populate('owner', 'user_name email');
    if (!cats) {
      console.log(cats);
      next(new CustomError('No cats found', 404));
      return;
    }
    console.log(cats);
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

const catGet = async (
  req: Request<{id: string}>,
  res: Response<Cat>,
  next: NextFunction
) => {
  try {
    const cat = await CatModel.findById(req.params.id)
      .select('-__v')
      .populate('owner', 'user_name email');
    if (!cat) {
      next(new CustomError('Cat not found', 404));
      return;
    }
    res.json(cat);
  } catch (error) {
    next(error);
  }
};

const catPost = async (
  req: Request<{}, {}, Omit<Cat, '_id'>>,
  res: Response<PostMessage, {user: LoginUser}>,
  next: NextFunction
) => {
  try {
    req.body.owner = res.locals.user._id;
    const cat = await CatModel.create(req.body);
    res.status(201).json({message: 'Cat created', _id: cat._id});
  } catch (error) {
    next(error);
  }
};

const catPut = async (
  req: Request<{id: string}, {}, Omit<Cat, '_id'>>,
  res: Response<PostMessage>,
  next: NextFunction
) => {
  try {
    const cat = await CatModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json({message: 'Cat updated', _id: cat._id});
  } catch (error) {
    next(error);
  }
};

const catDelete = async (
  req: Request<{id: string}>,
  res: Response<PostMessage, {user: LoginUser}>,
  next: NextFunction
) => {
  try {
    const options =
      res.locals.user.role === 'admin' ? {} : {owner: res.locals.user._id};

    const cat = (await CatModel.findOneAndDelete({
      _id: req.params.id,
      ...options,
    })) as unknown as Cat;

    if (!cat) {
      throw new CustomError('Cat not found or not your cat', 404);
    }
    res.json({message: 'Cat deleted', _id: cat._id});
  } catch (error) {
    next(error);
  }
};

export default {catListGet, catGet, catPost, catPut, catDelete};
