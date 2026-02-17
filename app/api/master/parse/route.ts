import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        // Extract ALL files uploaded under the key 'files'
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, message: 'No files uploaded' }, { status: 400 });
        }

        let allParsedData: any[] = [];

        // Loop through every file uploaded
        for (const file of files) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const workbook = xlsx.read(buffer, { type: 'buffer' });
            
            // Read the first sheet of each Excel file
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            
            const rawData = xlsx.utils.sheet_to_json(sheet);
            allParsedData = [...allParsedData, ...rawData]; // Merge into master array
        }

        return NextResponse.json({ success: true, data: allParsedData });
    } catch (error: any) {
        console.error("Parse Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}