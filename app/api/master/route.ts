import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/dbconnect';
import Master from '@/models/master';

// GET all records
export async function GET() {
    try {
        await connectToDatabase();
        // Sort by newest first
        const records = await Master.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: records });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE all records (Truncate Table)
export async function DELETE() {
    try {
        await connectToDatabase();
        await Master.deleteMany({});
        return NextResponse.json({ success: true, message: 'Master sheet cleared completely.' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}