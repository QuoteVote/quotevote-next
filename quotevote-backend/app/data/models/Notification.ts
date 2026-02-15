import mongoose, { Schema } from 'mongoose';
import type { NotificationDocument, NotificationModel } from '../../types/mongoose';

const NotificationSchema = new Schema<NotificationDocument, NotificationModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userIdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notificationType: { type: String },
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    label: { type: String },
    status: { type: String, default: 'new' },
    created: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ userId: 1, status: 1 });

// Static method: findByUserId
NotificationSchema.statics.findByUserId = function (userId: string) {
  return this.find({ userId }).sort({ created: -1 });
};

const Notification = (mongoose.models.Notification as NotificationModel) ||
  mongoose.model<NotificationDocument, NotificationModel>('Notification', NotificationSchema);

export default Notification;
