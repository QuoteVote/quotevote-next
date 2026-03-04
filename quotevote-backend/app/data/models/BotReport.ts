import mongoose, { Schema } from 'mongoose';
import type { BotReportDocument, BotReportModel } from '~/types/mongoose';

const BotReportSchema = new Schema<BotReportDocument, BotReportModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    created: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

BotReportSchema.index({ reporterId: 1, userId: 1 }, { unique: true });
BotReportSchema.index({ userId: 1 });
BotReportSchema.index({ createdAt: -1 });

const BotReport =
  (mongoose.models.BotReport as BotReportModel) ||
  mongoose.model<BotReportDocument, BotReportModel>('BotReport', BotReportSchema);

export default BotReport;
