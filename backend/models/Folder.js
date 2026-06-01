import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Folder name is required'],
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Folder owner is required'],
  },
}, {
  timestamps: true,
});

// Compound index to ensure unique folder names per user
folderSchema.index({ name: 1, owner: 1 }, { unique: true });

const Folder = mongoose.model('Folder', folderSchema);
export default Folder;
