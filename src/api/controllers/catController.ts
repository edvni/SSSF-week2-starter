// TODO: create following functions:
// - catGetByUser - get all cats by current user id
// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
// - catPutAdmin - only admin can change cat owner X
// - catDeleteAdmin - only admin can delete cat X
// - catDelete - only owner can delete cat X
// - catPut - only owner can update cat X
// - catGet - get cat by id X
// - catListGet - get all cats X
// - catPost - create new cat X
import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import CatModel from '../models/catModel';
import {Cat, User} from '../../types/DBTypes';
import rectangleBounds from '../../utils/rectangleBounds';

const catListGet = async (
  _req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const cats = await CatModel.find()
      .populate({
        path: 'owner',
        select: '-__v -password -role',
      })
      .populate({
        path: 'location',
      });
    res.json(cats);
  } catch (err) {
    next(err);
  }
};

const catGet = async (
  req: Request<{id: string}>,
  res: Response<Cat>,
  next: NextFunction
) => {
  try {
    const cat = await CatModel.findById(req.params.id).populate({
      path: 'owner',
      select: '-__v -password -role',
    });
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json(cat);
  } catch (err) {
    next(err);
  }
};

const catPost = async (
  req: Request<{}, {}, Omit<Cat, '_id'>>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.location) {
      req.body.location = res.locals.coords;
    }
    req.body.owner = res.locals.user._id;
    const cat = await CatModel.create(req.body);
    res.status(200).json({message: 'Cat created', data: cat});
  } catch (err) {
    next(err);
  }
};

const catPut = async (
  req: Request<{id: string}, {}, Omit<Cat, '_id'>>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user && (req.user as User)._id !== (req.body as Cat).owner) {
      throw new CustomError('Access restricted or not your cat!', 403);
    }
    req.body.location = res.locals.coords;
    const cat = await CatModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select('-__v');
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json({message: 'Cat updated', data: cat});
  } catch (err) {
    next(err);
  }
};

const catDelete = async (
  req: Request<{id: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const cat = (await CatModel.findOneAndDelete({
      _id: req.params.id,
      owner: res.locals.user._id,
    })) as unknown as Cat;

    if (!cat) {
      throw new CustomError('Cat not found or not your cat', 404);
    }
    res.json({message: 'Cat deleted', data: cat});
  } catch (err) {
    next(err);
  }
};

const catDeleteAdmin = async (
  req: Request<{id: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (res.locals.user.role !== 'admin') {
      throw new CustomError('Access denied, not admin.', 404);
    }
    const cat = (await CatModel.findByIdAndDelete(
      req.params.id
    )) as unknown as Cat;
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json({message: 'Cat deleted', data: cat});
  } catch (err) {
    next(err);
  }
};

// prettier-ignore
const catPutAdmin = async (
  req: Request<{id: string}, {}, Omit<Cat, '_id'>>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user && (req.user as User).role !== 'admin') {
      throw new CustomError('Access restricted', 403);
    }
    req.body.location = res.locals.coords;
    const cat = await CatModel
      .findByIdAndUpdate(req.params.id, req.body, {new: true})
      .select('-__v');
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json({message: 'Cat updated', data: cat});
  } catch (err) {
    next(err);
  }
};

const catGetByUser = async (
  req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const cats = await CatModel.find({owner: res.locals.user._id}).populate({
      path: 'owner',
      select: '-__v -password -role',
    });
    res.json(cats);
  } catch (err) {
    next(err);
  }
};

const catGetByBoundingBox = async (
  req: Request<{}, {}, {}, {topRight: string; bottomLeft: string}>,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const topRight = req.query.topRight;
    const bottomLeft = req.query.bottomLeft;
    const [rightCorner1, rightCorner2] = topRight.split(',');
    const [leftCorner1, leftCorner2] = bottomLeft.split(',');

    const bounds = rectangleBounds(
      {
        lat: Number(rightCorner1),
        lng: Number(rightCorner2),
      },
      {
        lat: Number(leftCorner1),
        lng: Number(leftCorner2),
      }
    );
    const cats = await CatModel.find({
      location: {
        $geoWithin: {
          $geometry: bounds,
        },
      },
    }).select('-__v');
    // Send the array of cats as a JSON response
    res.json(cats);
  } catch (err) {
    next(err);
  }
};

export {
  catListGet,
  catGet,
  catPost,
  catPut,
  catDelete,
  catDeleteAdmin,
  catPutAdmin,
  catGetByUser,
  catGetByBoundingBox,
};
