import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/dbconnect';
import Master from '@/models/master';

// DELETE single record
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        await connectToDatabase();
        const deleted = await Master.findByIdAndDelete(params.id);
        if (!deleted) return NextResponse.json({ success: false, message: "Record not found" }, { status: 404 });
        return NextResponse.json({ success: true, message: "Record deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}