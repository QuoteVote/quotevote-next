import mongoose, { Schema } from 'mongoose';
import type { NotificationDocument, NotificationModel } from '~/types/mongoose';

// Stub schema — will be expanded in issue 7.20
const NotificationSchema = new Schema<NotificationDocument, NotificationModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userIdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    notificationType: { type: String, required: true },
    label: { type: String },
    status: { type: String, default: 'new' },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Notification =
  (mongoose.models.Notification as NotificationModel) ||
  mongoose.model<NotificationDocument, NotificationModel>('Notification', NotificationSchema);

export default Notification;
