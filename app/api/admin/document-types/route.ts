import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

const DOCUMENT_TYPES_FILE = path.join(process.cwd(), 'lib', 'document-types.json');

/**
 * GET /api/admin/document-types - Get all document types
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || !user.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

/**
 * POST /api/admin/document-types - Create a new document type
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, icon } = body;

    // Validation
    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }

    // Read existing data
    const data = await fs.readFile(DOCUMENT_TYPES_FILE, 'utf-8');
    const documentTypes = JSON.parse(data);

    // Check for duplicates
    if (documentTypes.types.some((t: any) => t.id === id)) {
      return NextResponse.json(
        { error: 'Document type with this ID already exists' },
        { status: 400 }
      );
    }

    // Add new type
    documentTypes.types.push({
      id,
      name,
      description: description || '',
      icon: icon || '📄',
    });

    // Write back
    await fs.writeFile(DOCUMENT_TYPES_FILE, JSON.stringify(documentTypes, null, 2));

    return NextResponse.json({ message: 'Document type created successfully' });
  } catch (error) {
    console.error('Create document type error:', error);
    return NextResponse.json(
      { error: 'Failed to create document type' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/document-types - Update a document type
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, icon } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Read existing data
    const data = await fs.readFile(DOCUMENT_TYPES_FILE, 'utf-8');
    const documentTypes = JSON.parse(data);

    // Find and update
    const index = documentTypes.types.findIndex((t: any) => t.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Document type not found' },
        { status: 404 }
      );
    }

    documentTypes.types[index] = {
      ...documentTypes.types[index],
      name: name || documentTypes.types[index].name,
      description: description !== undefined ? description : documentTypes.types[index].description,
      icon: icon || documentTypes.types[index].icon,
    };

    // Write back
    await fs.writeFile(DOCUMENT_TYPES_FILE, JSON.stringify(documentTypes, null, 2));

    return NextResponse.json({ message: 'Document type updated successfully' });
  } catch (error) {
    console.error('Update document type error:', error);
    return NextResponse.json(
      { error: 'Failed to update document type' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/document-types - Delete a document type
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Read existing data
    const data = await fs.readFile(DOCUMENT_TYPES_FILE, 'utf-8');
    const documentTypes = JSON.parse(data);

    // Filter out the deleted type
    const originalLength = documentTypes.types.length;
    documentTypes.types = documentTypes.types.filter((t: any) => t.id !== id);

    if (documentTypes.types.length === originalLength) {
      return NextResponse.json(
        { error: 'Document type not found' },
        { status: 404 }
      );
    }

    // Write back
    await fs.writeFile(DOCUMENT_TYPES_FILE, JSON.stringify(documentTypes, null, 2));

    return NextResponse.json({ message: 'Document type deleted successfully' });
  } catch (error) {
    console.error('Delete document type error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document type' },
      { status: 500 }
    );
  }
}
