import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, 'File name is required'],
    trim: true,
  },
  s3Key: {
    type: String,
    required: [true, 'S3 key is required'],
    unique: true,
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'File owner is required'],
  },
  folder: {
    type: String,
    default: 'Root',
    trim: true,
  },
  isShared: {
    type: Boolean,
    default: false,
  },
  sharedLinkExpiresAt: {
    type: Date,
    default: null,
  },
  isStarred: {
    type: Boolean,
    default: false,
  },
  isTrashed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const File = mongoose.model('File', fileSchema);
export default File;
