import dbConnect from '@/lib/dbconnect';
import Certificate from '@/models/Certificate';
import DatabaseClient from '@/components/Certificates/DatabaseClient';
import { PAGE_LIMIT } from '@/components/Certificates/utils/constants';

export default async function Page() {
  try { await dbConnect(); } catch (e) { console.error('DB connect failed', e); }

  const page = 1; const limit = PAGE_LIMIT; const skip = (page - 1) * limit;
  const [certificates, totalCount, uniqueHospitals] = await Promise.all([
    Certificate.find({}).lean().limit(limit).skip(skip).exec(),
    Certificate.countDocuments({}),
    Certificate.distinct('hospital')
  ]);

  const sanitized = (certificates || []).map((c: any) => ({
    ...c,
    _id: c._id && c._id.toString ? c._id.toString() : c._id,
    createdAt: c.createdAt ? String(c.createdAt) : c.createdAt,
    updatedAt: c.updatedAt ? String(c.updatedAt) : c.updatedAt,
  }));

  const initialData = { data: sanitized, total: totalCount || 0, totalPages: Math.ceil((totalCount || 0) / limit), filters: { hospitals: (uniqueHospitals || []).filter(Boolean) }, page };

  return <DatabaseClient initialData={initialData} />;
}