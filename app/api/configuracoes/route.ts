// app/api/configuracoes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("configuracoes")
      .select("*")
      .limit(1)
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { data, error } = await supabase
      .from("configuracoes")
      .update({
        modo_calculo: body.modo_calculo,
        limite_destaque: body.limite_destaque,
        notificacoes: body.notificacoes,
        atualizacao_automatica: body.atualizacao_automatica,
        modo_compacto: body.modo_compacto,
        ultima_atualizacao: new Date().toISOString()
      })
      .eq("id", body.id || 1)
      .select();
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // If we changed calculation parameters, recalculate positions
    if (body.modo_calculo || body.limite_destaque) {
      await fetch("/api/recalculate-positions", {
        method: "POST"
      });
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}