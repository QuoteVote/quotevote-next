import mongoose, { Schema } from 'mongoose';
import type { GroupDocument, GroupModel } from '../../types/mongoose';

const GroupSchema = new Schema<GroupDocument, GroupModel>(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adminIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    allowedUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    privacy: { type: String, required: true, enum: ['public', 'private', 'restricted'] },
    title: { type: String, required: true },
    url: { type: String },
    description: { type: String },
    created: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

GroupSchema.index({ creatorId: 1 });

// Static method: findByCreatorId
GroupSchema.statics.findByCreatorId = function (creatorId: string) {
  return this.find({ creatorId });
};

const Group = (mongoose.models.Group as GroupModel) ||
  mongoose.model<GroupDocument, GroupModel>('Group', GroupSchema);

export default Group;
