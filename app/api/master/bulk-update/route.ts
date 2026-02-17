import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/dbconnect';
import Master from '@/models/master';

export async function PUT(req: Request) {
    try {
        await connectToDatabase();
        const { updates } = await req.json();

        if (!updates || !Array.isArray(updates)) {
            return NextResponse.json({ success: false, message: 'Invalid data format' }, { status: 400 });
        }

        // Prepare bulk operations to only update provided fields
        const bulkOps = updates.map((update: any) => {
            const setFields: any = {};
            if (update.speciality) setFields.speciality = update.speciality;
            if (update.contactNumber) setFields.contactNumber = update.contactNumber;
            if (update.emailId) setFields.emailId = update.emailId;

            return {
                updateOne: {
                    filter: { _id: update._id },
                    update: { $set: setFields }
                }
            };
        });

        if (bulkOps.length > 0) {
            await Master.bulkWrite(bulkOps);
        }

        return NextResponse.json({ success: true, message: 'Records updated successfully.' });
    } catch (error: any) {
        console.error("Bulk Update Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}