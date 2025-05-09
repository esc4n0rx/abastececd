// app/api/recalculate-positions/route.ts - versão atualizada
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    // Get configuration
    const { data: configData, error: configError } = await supabase
      .from("configuracoes")
      .select("*")
      .limit(1)
      .single();
    
    if (configError) throw configError;
    
    const modoCalculo = configData.modo_calculo;
    const limiteDestaque = configData.limite_destaque;
    
    // Clear previous positions
    await supabase.from("posicoes_abastecimento").delete().neq("id", 0);
    
    // Get estoque and demanda data - filtrando apenas posições de picking
    const { data: estoqueData, error: estoqueError } = await supabase
      .from("estoque")
      .select("*")
      .eq("area_armazenamento", "1"); // Apenas posições de picking
    
    if (estoqueError) throw estoqueError;
    
    const { data: demandaData, error: demandaError } = await supabase
      .from("demanda")
      .select("*");
    
    if (demandaError) throw demandaError;
    
    // Create a map of material to total demand
    const demandaPorMaterial: Record<string, {total: number, unidade: string, descricao: string}> = {};
    
    demandaData.forEach((item: { material: string | number; unidade: any; desc_material: any; quant_nt: number; }) => {
      if (!demandaPorMaterial[item.material]) {
        demandaPorMaterial[item.material] = {
          total: 0,
          unidade: item.unidade,
          descricao: item.desc_material
        };
      }
      demandaPorMaterial[item.material].total += item.quant_nt;
    });
    
    // Calculate positions for replenishment
    const posicoes: any[] = [];
    
    estoqueData.forEach((item: { 
      material: string | number;
      estoque_disponivel: number;
      posicao_deposito: string;
      texto_breve_material: string;
      um_basica: string;
    }) => {
      if (demandaPorMaterial[item.material]) {
        const saldoAtual = item.estoque_disponivel;
        const demanda = demandaPorMaterial[item.material].total;
        
        // Pular se não houver demanda ou se o saldo for muito maior que a demanda
        if (demanda <= 0) return;
        
        let percentual, quantidadeNecessaria, status;
        
        // Calculate based on mode
        if (modoCalculo === 'padrao') {
          percentual = Math.min(100, Math.round((saldoAtual / demanda) * 100));
          quantidadeNecessaria = Math.max(0, demanda - saldoAtual);
        } else if (modoCalculo === 'percentual') {
          percentual = Math.min(100, Math.round((saldoAtual / demanda) * 100));
          quantidadeNecessaria = Math.max(0, demanda - saldoAtual);
        } else { // ponderado - assumes some historical weighting
          // Simplified for example, in real case would use historical data
          percentual = Math.min(100, Math.round((saldoAtual / demanda) * 100));
          quantidadeNecessaria = Math.max(0, demanda - saldoAtual);
        }
        
        // Determine status
        if (percentual < limiteDestaque) {
          status = 'critico';
        } else if (percentual < 50) {
          status = 'medio';
        } else {
          status = 'normal';
        }
        
        // Extract rua correctly from posicao_deposito
        // Format example: H3S0601601 -> RUA 06
        const posicao = item.posicao_deposito;
        let rua = "Rua N/A";
        
        // Extrair os dígitos de rua (posições 3-4 para posições com 10 caracteres)
        if (posicao) {
        const match = posicao.match(/H3[SPBC](\d{2})/i);
        if (match && match[1]) {
            rua = `Rua ${match[1]}`;
        }
        }
        
        // Determine deposito based on prefix
        let deposito = "DP01"; // Valor padrão
        if (posicao && posicao.startsWith("H3C")) {
          deposito = "DP40";
        }
        
        posicoes.push({
          rua,
          posicao: item.posicao_deposito,
          material: item.material,
          descricao: demandaPorMaterial[item.material].descricao || item.texto_breve_material,
          saldo_atual: saldoAtual,
          demanda,
          percentual_atendido: percentual,
          quantidade_necessaria: quantidadeNecessaria,
          status,
          unidade: item.um_basica,
          deposito
        });
      }
    });
    
    // Insert calculated positions
    if (posicoes.length > 0) {
      // Inserir em lotes caso haja muitas posições
      const batchSize = 100;
      for (let i = 0; i < posicoes.length; i += batchSize) {
        const batch = posicoes.slice(i, i + batchSize);
        const { error } = await supabase.from("posicoes_abastecimento").insert(batch);
        
        if (error) {
          console.error("Erro ao inserir lote de posições:", error);
          throw error;
        }
      }
    }
    
    return NextResponse.json({ success: true, count: posicoes.length });
  } catch (error: any) {
    console.error("Erro ao recalcular posições:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}