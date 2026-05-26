import dbConnect from '@/lib/dbconnect';
import VisitingCard from '@/models/VisitingCard';
import VisitingCardsClient from '@/components/VisitingCards/VisitingCardsClient';
import { PAGE_LIMIT } from '@/components/VisitingCards/utils/constants';

export default async function Page() {
  try {
    await dbConnect();
  } catch (error) {
    console.error('DB connect failed', error);
  }

  const page = 1;
  const limit = PAGE_LIMIT;
  const skip = (page - 1) * limit;

  const [cards, totalItems, uniqueDesignations] = await Promise.all([
    VisitingCard.find({}).lean().limit(limit).skip(skip).exec(),
    VisitingCard.countDocuments({}),
    VisitingCard.distinct('designation'),
  ]);

  const initialData = {
    data: cards || [],
    total: totalItems || 0,
    filters: { designations: (uniqueDesignations || []).filter(Boolean) },
    page,
  };

  return <VisitingCardsClient initialData={initialData} />;
}
