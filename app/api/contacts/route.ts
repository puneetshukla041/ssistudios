import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbconnect'; 
import Contact from '@/models/Contact';

export const dynamic = 'force-dynamic'; 

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { contacts, batchId } = await req.json();

    const formattedContacts = contacts.map((c: any) => ({
      name: c.name,
      contactno: String(c.contactno).trim(), // STRICT: Forces Excel numbers into Mongo Strings
      status: c.status || 'pending',
      batchId: String(batchId)
    }));

    // Clear previous uploads with the same batchId just in case
    await Contact.deleteMany({ batchId: String(batchId) });
    const inserted = await Contact.insertMany(formattedContacts);

    return NextResponse.json({ success: true, data: inserted }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// FIXED: Strict string matching so MongoDB successfully finds and updates the exact row
export async function PATCH(req: Request) {
  try {
    await dbConnect();
    const { contactno, batchId, status } = await req.json();

    const updated = await Contact.findOneAndUpdate(
      { contactno: String(contactno).trim(), batchId: String(batchId) },
      { $set: { status: status } },
      { new: true }
    );

    if (!updated) {
        return NextResponse.json({ success: false, error: "Contact not found in DB" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    if (batchId) {
      const contacts = await Contact.find({ batchId: String(batchId) }).sort({ _id: 1 });
      return NextResponse.json({ success: true, data: contacts });
    } else {
      const batches = await Contact.distinct('batchId');
      return NextResponse.json({ success: true, data: batches });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- NEW: DELETE Function ---
export async function DELETE(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json({ success: false, error: "batchId is required" }, { status: 400 });
    }

    // Deletes all contacts associated with this specific batch
    const deleted = await Contact.deleteMany({ batchId: String(batchId) });

    return NextResponse.json({ success: true, message: `Deleted ${deleted.deletedCount} records.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
