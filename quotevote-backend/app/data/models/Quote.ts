import mongoose, { Schema } from 'mongoose';
import type { QuoteDocument, QuoteModel } from '~/types/mongoose';

const QuoteSchema = new Schema<QuoteDocument, QuoteModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    quote: { type: String, required: true },
    startWordIndex: { type: Number },
    endWordIndex: { type: Number },
    created: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

QuoteSchema.index({ quote: 'text' });

QuoteSchema.statics.findByPostId = function (postId: string) {
  return this.find({ postId }).sort({ created: 1 });
};

QuoteSchema.statics.findLatest = function (limit: number) {
  return this.find({}).sort({ created: -1 }).limit(limit);
};

const Quote =
  (mongoose.models.Quote as QuoteModel) ||
  mongoose.model<QuoteDocument, QuoteModel>('Quote', QuoteSchema);

export default Quote;
