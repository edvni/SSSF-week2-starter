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
import {Cat, LoginUser, User} from '../../types/DBTypes';
import rectangleBounds from '../../utils/rectangleBounds';

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
  res: Response,
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
  res: Response,
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
    res.json({message: 'Cat deleted', _id: cat._id});
  } catch (error) {
    next(error);
  }
};

const catDeleteAdmin = async (
  req: Request<{id: string}>,
  res: Response,
  next: NextFunction
) => {
  try {
    // admin can delete any animal, user can delete only their own animals
    if (res.locals.user.role !== 'admin') {
      throw new CustomError('Request denied. Admins only.', 403);
    }
    const cat = (await CatModel.findOneAndDelete({
      _id: req.params.id,
    })) as unknown as Cat;

    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json({message: 'Cat deleted', _id: cat._id});
  } catch (error) {
    next(error);
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
  } catch (error) {
    next(error);
  }
};

const catGetByUser = async (
  req: Request<{}, {}, User>,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const cats = await CatModel.find({owner: res.locals.user._id}).populate({
      path: 'owner',
      select: '-__v -password -role',
    });
    res.json(cats);
  } catch (error) {
    next(error);
  }
};

const catGetByBoundingBox = async (
  req: Request<{}, {}, {}, {topRight: string; bottomLeft: string}>,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    // extract topRight and bottomLeft coordinates from request query
    const topRight = req.query.topRight;
    const bottomLeft = req.query.bottomLeft;
    // Split coordinates into latitude and longitude components
    const [rightCorner1, rightCorner2] = topRight.split(',');
    const [leftCorner1, leftCorner2] = bottomLeft.split(',');

    // Create bounds object for the bounding box
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
    // Find cats within the specified bounding box
    const cats = await CatModel.find({
      location: {
        $geoWithin: {
          $geometry: bounds,
        },
      },
    }).select('-__v');
    // Send the array of cats as a JSON response
    res.json(cats);
  } catch (error) {
    next(error);
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
