import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/dbconnect'; // Adjust this path to your DB connection file
import Master from '@/models/master';
import * as xlsx from 'xlsx';

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        // Convert the uploaded file into a buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Parse the Excel file
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const rawData = xlsx.utils.sheet_to_json(sheet);

        if (rawData.length === 0) {
             return NextResponse.json({ success: false, message: 'The uploaded Excel sheet is empty.' }, { status: 400 });
        }

        // Map the exact Excel column headers to our Mongoose Model keys
        const mappedData = rawData.map((row: any) => ({
            surgeonName: row["Surgeon's Name"] || row["Surgeon Name"] || "Unknown Surgeon",
            speciality: row["Speciality"] || "",
            hospitalName: row["Hospital Name"] || "Unknown Hospital",
            // Convert numbers to strings just in case Excel formats them as numbers
            contactNumber: row["Contact Number"] ? String(row["Contact Number"]) : "",
            emailId: row["Email ID"] || row["Email"] || "",
            salesPersonName: row["Sales Person Name"] || row["Sales Person"] || ""
        }));

        // Insert all records into MongoDB
        await Master.insertMany(mappedData);

        return NextResponse.json({ 
            success: true, 
            message: `Successfully imported ${mappedData.length} records.`, 
            count: mappedData.length 
        });

    } catch (error: any) {
        console.error("Excel Upload Error:", error);
        return NextResponse.json({ success: false, message: error.message || "Failed to process Excel file" }, { status: 500 });
    }
}