import { Star } from 'lucide-react';
import { CustomerReview } from '../types/database';

interface ReviewsSectionProps {
  reviews: CustomerReview[];
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            ユーザーからの評価
          </h2>
          <p className="text-lg text-gray-600">
            実際に利用されたお客様からのご感想
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:border-gray-400 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-grow">
                  <h3 className="font-bold text-gray-900">{review.name}</h3>
                  <p className="text-sm text-gray-600">{review.company}</p>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
              </div>

              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                {review.comment}
              </p>

              <p className="text-xs text-gray-500">
                {new Date(review.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
