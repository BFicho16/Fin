import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createUserMastra } from '@/mastra'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Verify user authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { path } = await params
    const route = path.join('/')

    // Add user context to the request
    const requestWithUser = {
      ...body,
      user: {
        id: user.id,
        email: user.email,
      },
    }

    // Create user-specific Mastra instance
    const userMastra = createUserMastra(user.id)

    // Route to appropriate Mastra workflow/agent
    switch (route) {
      case 'research':
        const researchRun = await userMastra.getWorkflow('researchWorkflow').createRunAsync()
        const researchResult = await researchRun.start({ inputData: requestWithUser })
        return NextResponse.json({ result: researchResult })

      case 'generate-report':
        const reportRun = await userMastra.getWorkflow('generateReportWorkflow').createRunAsync()
        const reportResult = await reportRun.start({ inputData: requestWithUser })
        return NextResponse.json({ result: reportResult })

      default:
        return NextResponse.json({ error: 'Route not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Mastra API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
