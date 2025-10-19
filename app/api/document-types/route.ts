import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DOCUMENT_TYPES_FILE = path.join(process.cwd(), 'lib', 'document-types.json');

/**
 * GET /api/document-types - Get all document types (public endpoint)
 */
export async function GET() {
  try {
    const data = await fs.readFile(DOCUMENT_TYPES_FILE, 'utf-8');
    const documentTypes = JSON.parse(data);

    return NextResponse.json(documentTypes);
  } catch (error) {
    console.error('Get document types error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document types' },
      { status: 500 }
    );
  }
}
