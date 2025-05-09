// app/api/reset-data/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    // Clear data from tables but keep configurations
    await supabase.from("estoque").delete().neq("id", 0);
    await supabase.from("demanda").delete().neq("id", 0);
    await supabase.from("posicoes_abastecimento").delete().neq("id", 0);
    
    // Keep history but mark as canceled
    const { error } = await supabase
      .from("historico_uploads")
      .update({ status: "cancelado", mensagem: "Dados resetados pelo usuário" })
      .eq("status", "sucesso");
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao resetar dados:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}