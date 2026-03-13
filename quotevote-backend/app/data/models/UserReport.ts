import mongoose, { Schema } from 'mongoose';
import type { UserReportDocument, UserReportModel } from '~/types/mongoose';

const UserReportSchema = new Schema<UserReportDocument, UserReportModel>(
  {
    reportedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    status: { type: String, default: 'pending' },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const UserReport =
  (mongoose.models.UserReport as UserReportModel) ||
  mongoose.model<UserReportDocument, UserReportModel>('UserReport', UserReportSchema);

export default UserReport;
