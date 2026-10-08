import mongoose, { Schema } from 'mongoose';
import type { BotReportDocument, BotReportModel } from '~/types/mongoose';

const BotReportSchema = new Schema<BotReportDocument, BotReportModel>(
  {
    _reportedUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, alias: 'userId' },
    _reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, alias: 'reporterId' },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

BotReportSchema.index(
  { _reporterId: 1, _reportedUserId: 1 },
  { unique: true, name: '_reporterId_1__reportedUserId_1' }
);
BotReportSchema.index({ _reportedUserId: 1 }, { name: '_reportedUserId_1' });
BotReportSchema.index({ createdAt: -1 }, { name: 'createdAt_-1' });

const BotReport =
  (mongoose.models.BotReport as BotReportModel) ||
  mongoose.model<BotReportDocument, BotReportModel>('BotReport', BotReportSchema);

export default BotReport;
