import type { Religion } from '@/shared/types';
import { queryFamilyKnowledge, getAllFamilyReligions } from '@/lib/knowledge';
import { runILRMF } from '@/lib/ilrmf/engine';

// Standard mock types to satisfy Next.js signatures without heavy "next" dependency
export class NextRequest {
  public url: string;
  constructor(url: string) {
    this.url = url;
  }
}

export class NextResponse {
  static json(body: any, init?: { status?: number }) {
    return {
      body,
      status: init?.status || 200,
      headers: { 'Content-Type': 'application/json' }
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const religionParam = searchParams.get('religion') as Religion | null;

  if (!religionParam) {
    return NextResponse.json({
      message: "Specify ?religion=muslim|hindu|christian|adibashi",
      available: getAllFamilyReligions(),
    });
  }

  try {
    const knowledgeResult = queryFamilyKnowledge(religionParam);
    const ilrmfResult = await runILRMF({ knowledgeResult, lawArea: 'family' });
    return NextResponse.json(ilrmfResult);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Engine failed" }, { status: 500 });
  }
}
