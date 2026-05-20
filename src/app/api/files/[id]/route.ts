import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { apiError } from '@/lib/api-response'
import * as fs from 'fs'
import * as path from 'path'
import * as XLSX from 'xlsx'

const STORAGE_DIR = path.join(process.cwd(), 'storage', 'job-files')

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cookieStore = await cookies()
    await requireAuth(cookieStore)
    const { id } = params

    const file = await prisma.jobOutputFile.findUnique({
      where: { id },
    })

    if (!file) {
      return apiError('NOT_FOUND', 'File not found', 404)
    }

    // Strategy 1: Try disk storage
    const diskPath = path.join(STORAGE_DIR, `${file.jobId}_${file.fileName}.bin`)
    if (fs.existsSync(diskPath)) {
      const buffer = fs.readFileSync(diskPath)
      return new Response(buffer, {
        headers: {
          'Content-Type': file.mimeType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.fileName)}"`,
          'Content-Length': String(buffer.length),
        },
      })
    }

    // Strategy 2: Try blobPathname directly
    if (file.blobPathname && fs.existsSync(file.blobPathname)) {
      const buffer = fs.readFileSync(file.blobPathname)
      return new Response(buffer, {
        headers: {
          'Content-Type': file.mimeType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.fileName)}"`,
          'Content-Length': String(buffer.length),
        },
      })
    }

    // Strategy 3: Regenerate xlsx from previewJson
    if (file.previewJson && file.mimeType.includes('spreadsheet')) {
      try {
        const rows = JSON.parse(file.previewJson)
        if (Array.isArray(rows) && rows.length > 0) {
          const wb = XLSX.utils.book_new()
          const ws = XLSX.utils.json_to_sheet(rows)
          XLSX.utils.book_append_sheet(wb, ws, 'Preview')
          const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
          const buffer = Buffer.from(buf)

          return new Response(buffer, {
            headers: {
              'Content-Type': file.mimeType,
              'Content-Disposition': `attachment; filename="${encodeURIComponent(file.fileName)}"`,
              'Content-Length': String(buffer.length),
            },
          })
        }
      } catch {
        // Fall through to 404
      }
    }

    return apiError('NOT_FOUND', 'File content not available', 404)
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Not authenticated', 401)
    }
    console.error('File download error:', err)
    return apiError('INTERNAL_ERROR', 'Failed to download file', 500)
  }
}
