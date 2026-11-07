import { NextResponse } from "next/server";
import { getTemplateAdminAccess } from "@/lib/auth/template-admin";
import { DEFAULT_THEME_ID, themeIdSchema } from "@/lib/pptx/themes";
import { MAX_TEMPLATE_BYTES, presentationTemplatePath, uploadPresentationTemplate } from "@/lib/storage/presentation-template";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const access = await getTemplateAdminAccess(supabase);
  if (!access.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!access.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const formData = await request.formData();
    const version = formData.get("version");
    const file = formData.get("file");
    const rawTheme = formData.get("theme") ?? DEFAULT_THEME_ID;
    const parsedTheme = themeIdSchema.safeParse(rawTheme);

    if (typeof version !== "string" || !(file instanceof File)) {
      return NextResponse.json({ error: "Informe a versão e o arquivo PPTX." }, { status: 400 });
    }
    if (!parsedTheme.success) {
      return NextResponse.json({ error: "Tema desconhecido." }, { status: 400 });
    }
    if (file.size > MAX_TEMPLATE_BYTES) {
      return NextResponse.json({ error: "Template file size is invalid." }, { status: 400 });
    }

    await uploadPresentationTemplate(supabase, {
      version,
      theme: parsedTheme.data,
      fileName: file.name,
      contentType: file.type,
      body: Buffer.from(await file.arrayBuffer()),
    });

    return NextResponse.json({ path: presentationTemplatePath(version, parsedTheme.data) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload presentation template.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
