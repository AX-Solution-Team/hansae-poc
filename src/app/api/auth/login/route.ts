import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { getSessionFromCookies } from '@/lib/auth'
import { apiSuccess, apiError } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return apiError('VALIDATION_ERROR', 'Email and password are required', 400)
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { team: true },
    })

    if (!user) {
      return apiError('INVALID_CREDENTIALS', 'Invalid email or password', 401)
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return apiError('INVALID_CREDENTIALS', 'Invalid email or password', 401)
    }

    // Create session
    const cookieStore = await cookies()
    const session = await getSessionFromCookies(cookieStore)
    session.user = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      teamId: user.teamId,
    }
    await session.save()

    // Audit log
    await prisma.auditLog.create({
      data: {
        eventType: 'USER_LOGIN',
        userId: user.id,
        payload: JSON.stringify({ email: user.email }),
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown',
      },
    })

    return apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      team: {
        id: user.team.id,
        name: user.team.name,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return apiError('INTERNAL_ERROR', 'Login failed', 500)
  }
}
