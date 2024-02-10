// TODO: mongoose schema for cat
import mongoose from 'mongoose';
import {Cat} from '../../types/DBTypes';

const catSchema = new mongoose.Schema<Cat>({
  cat_name: {
    type: String,
    required: true,
  },
  weight: {
    type: Number,
  },
  filename: {
    type: String,
  },
  birthdate: {
    type: Date,
    max: Date.now(),
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    },
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const CatModel = mongoose.model<Cat>('Cat', catSchema);

export default CatModel;
