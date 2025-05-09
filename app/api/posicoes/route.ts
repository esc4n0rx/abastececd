// app/api/posicoes/route.ts - adicionando filtro de depósito
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const rua = searchParams.get("rua");
    const status = searchParams.get("status");
    const deposito = searchParams.get("deposito");
    const search = searchParams.get("search");
    
    let query = supabase
      .from("posicoes_abastecimento")
      .select("*");
    
    if (rua && rua !== "todas") {
      query = query.eq("rua", rua);
    }
    
    if (status && status !== "todas") {
      query = query.eq("status", status);
    }
    
    if (deposito && deposito !== "todos") {
      query = query.eq("deposito", deposito);
    }
    
    if (search) {
      query = query.or(`posicao.ilike.%${search}%,material.ilike.%${search}%,descricao.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Group by rua
    const groupedByRua: Record<string, any[]> = {};
    
    data.forEach(item => {
      if (!groupedByRua[item.rua]) {
        groupedByRua[item.rua] = [];
      }
      
      groupedByRua[item.rua].push({
        codigo: item.posicao,
        material: item.material,
        descricao: item.descricao,
        saldoAtual: item.saldo_atual,
        demanda: item.demanda,
        ud: item.unidade,
        deposito: item.deposito
      });
    });
    
    // Convert to array format expected by frontend
    const result = Object.keys(groupedByRua).map(rua => ({
      rua,
      posicoes: groupedByRua[rua]
    }));
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}