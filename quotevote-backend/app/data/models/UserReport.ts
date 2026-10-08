import mongoose, { Schema } from 'mongoose';
import type { UserReportDocument, UserReportModel } from '~/types/mongoose';

const UserReportSchema = new Schema<UserReportDocument, UserReportModel>(
  {
    _reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, alias: 'reporterId' },
    _reportedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, alias: 'reportedUserId' },
    reason: {
      type: String,
      enum: ['spam', 'harassment', 'inappropriate_content', 'fake_account', 'other'],
      required: true,
    },
    description: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending',
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    adminNotes: { type: String, maxlength: 1000 },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes matching legacy naming
UserReportSchema.index({ _reportedUserId: 1, status: 1 }, { name: '_reportedUserId_1_status_1' });
UserReportSchema.index({ _reporterId: 1 }, { name: '_reporterId_1' });
UserReportSchema.index({ createdAt: -1 }, { name: 'createdAt_-1' });

const UserReport =
  (mongoose.models.UserReport as UserReportModel) ||
  mongoose.model<UserReportDocument, UserReportModel>('UserReport', UserReportSchema);

export default UserReport;
