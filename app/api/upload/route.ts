// app/api/upload/route.ts - versão atualizada para tratar datas inválidas
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

// Função auxiliar para converter datas do Excel para formato ISO
function convertExcelDate(excelDate: any): string | null {
  if (!excelDate) return null;
  
  // Verifica se é uma data inválida no formato "0000-00-00"
  if (excelDate === "0000-00-00" || excelDate === 0 || excelDate === "00/00/0000") {
    return null; // Retorna null para datas inválidas
  }
  
  // Verifica se já é uma string de data válida
  if (typeof excelDate === 'string') {
    // Tentativa de verificar se é um formato de data válido
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$|^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(excelDate)) {
      // Verifica se é uma data válida
      const parts = excelDate.includes('/') 
        ? excelDate.split('/').map(Number) 
        : excelDate.split('-').map(Number);
      
      // Se qualquer parte da data for 0, é inválida
      if (parts.some(part => part === 0)) {
        return null;
      }
      
      return excelDate;
    }
  }
  
  // Se for um número, assume que é uma data do Excel
  if (typeof excelDate === 'number' || !isNaN(Number(excelDate))) {
    try {
      // Ignora valores muito pequenos que provavelmente são erros
      if (Number(excelDate) < 1) {
        return null;
      }
      
      // O Excel conta dias a partir de 1/1/1900
      const date = new Date(Math.round((Number(excelDate) - 25569) * 86400 * 1000));
      
      // Verificar se é uma data válida
      if (isNaN(date.getTime())) {
        return null;
      }
      
      return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    } catch (error) {
      console.error("Erro ao converter data do Excel:", error);
      return null;
    }
  }
  
  return null;
}

// Função auxiliar para converter tempo do Excel para formato HH:MM:SS
function convertExcelTime(excelTime: any): string | null {
  if (!excelTime) return null;
  
  // Verifica se já é uma string de tempo válida
  if (typeof excelTime === 'string') {
    // Tentativa de verificar se é um formato de tempo válido
    const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
    if (timeRegex.test(excelTime)) {
      return excelTime;
    }
  }
  
  // Se for um número, assume que é um tempo do Excel (fração de 24 horas)
  if (typeof excelTime === 'number' || !isNaN(Number(excelTime))) {
    try {
      const totalSeconds = Math.round(Number(excelTime) * 24 * 60 * 60);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      // Formato HH:MM:SS
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error("Erro ao converter tempo do Excel:", error);
      return null;
    }
  }
  
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileType = formData.get("type") as string; // 'estoque' or 'demanda'
    
    if (!file || !fileType) {
      return NextResponse.json(
        { error: "Arquivo ou tipo não fornecidos" },
        { status: 400 }
      );
    }

    // Check file extension
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (fileExtension !== "csv" && fileExtension !== "xlsx") {
      return NextResponse.json(
        { error: "Formato de arquivo inválido. Use CSV ou XLSX." },
        { status: 400 }
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Track upload in history
    const { data: uploadData, error: uploadError } = await supabase
      .from("historico_uploads")
      .insert({
        tipo: fileType,
        nome_arquivo: file.name,
        tamanho_bytes: file.size,
        registros_processados: 0,
        status: "processando",
      })
      .select();

    if (uploadError) {
      console.error("Erro ao registrar upload:", uploadError);
      return NextResponse.json(
        { error: "Erro ao iniciar processamento" },
        { status: 500 }
      );
    }

    const uploadId = uploadData[0].id;

    // Process file based on type
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log("Amostra de dados do arquivo:", jsonData.slice(0, 2));

    // Clear previous data from the appropriate table
    await supabase.from(fileType).delete().neq("id", 0);

    // Insert new data
    const batchSize = 100;
    let processed = 0;
    let errors = [];
    
    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);
      
      // Transform data according to target schema
      const transformedBatch = batch.map((row: any) => {
        if (fileType === "estoque") {
          return {
            material: row["Material"] || "",
            centro: row["Centro"] || "",
            texto_breve_material: row["Texto breve de material"] || "",
            tipo_deposito: row["Tipo de depósito"] || "",
            posicao_deposito: row["Posição no depósito"] || "",
            estoque_disponivel: parseFloat(row["Estoque disponível"] || 0),
            um_basica: row["UM básica"] || "",
            data_entrada_mercadorias: convertExcelDate(row["Data da entrada de mercadorias"]),
            area_armazenamento: row["Ár.armazen."] || "",
            tipo_posicao_deposito: row["Tipo posição no dep."] || "",
            unidade_deposito: row["Unidade de depósito"] || "",
            deposito: row["Depósito"] || "",
          };
        } else {
          // demanda table
          return {
            n_deposito: row["N_DEPOSITO"] || "",
            numero_nt: row["NUMERO_NT"] || "",
            status: row["STATUS"] || "",
            tp_transporte: row["TP_TRANSPORTE"] || "",
            prio_transporte: row["PRIO_TRANSPORTE"] || "",
            usuario: row["USUARIO"] || "",
            dt_criacao: convertExcelDate(row["DT_CRIACAO"]),
            hr_criacao: convertExcelTime(row["HR_CRIACAO"]),
            tp_movimento: row["TP_MOVIMENTO"] || "",
            tp_deposito: row["TP_DEPOSITO"] || "",
            posicao: row["POSICAO"] || "",
            dt_planejada: convertExcelDate(row["DT_PLANEJADA"]),
            ref_transporte: row["REF_TRANSPORTE"] || "",
            item_nt: row["ITEM_NT"] || "",
            item_finalizado: row["ITEM_FINALIZADO"] || "",
            material: row["MATERIAL"] || "",
            centro: row["CENTRO"] || "",
            quant_nt: parseFloat(row["QUANT_NT"] || 0),
            unidade: row["UNIDADE"] || "",
            numero_ot: row["NUMERO_OT"] || "",
            quant_ot: parseFloat(row["QUANT_OT"] || 0),
            deposito: row["DEPOSITO"] || "",
            desc_material: row["DESC_MATERIAL"] || "",
            setor: row["SETOR"] || "",
            palete: row["PALETE"] || "",
            palete_origem: row["PALETE_ORIGEM"] || "",
            endereco: row["ENDERECO"] || "",
            ot: row["OT"] || "",
            pedido: row["PEDIDO"] || "",
            remessa: row["REMESSA"] || "",
            nome_usuario: row["NOME_USUARIO"] || "",
            dt_producao: convertExcelDate(row["DT_PRODUCAO"]),
            hr_registro: convertExcelTime(row["HR_REGISTRO"]),
            data: convertExcelDate(row["DATA"]),
          };
        }
      });

      try {
        const { error } = await supabase.from(fileType).insert(transformedBatch);
        
        if (error) {
          console.error(`Erro detalhado ao inserir lote: ${error.message}`, error);
          errors.push(error.message);
          // Continue com os próximos lotes em vez de parar completamente
          continue;
        }
      } catch (error: any) {
        console.error(`Erro ao processar lote: ${error.message}`, error);
        errors.push(error.message);
        // Continue com os próximos lotes
        continue;
      }
      
      processed += batch.length;
      
      // Update processing status
      await supabase
        .from("historico_uploads")
        .update({
          registros_processados: processed
        })
        .eq("id", uploadId);
    }

    if (errors.length > 0) {
      // Se há erros, atualiza o status mas continua tentando processar o que for possível
      await supabase
        .from("historico_uploads")
        .update({
          status: errors.length === jsonData.length / batchSize ? "erro" : "parcial",
          mensagem: `Processado com erros: ${errors.join("; ").substring(0, 255)}`,
          registros_processados: processed
        })
        .eq("id", uploadId);
        
      if (processed === 0) {
        return NextResponse.json(
          { error: `Falha no processamento do arquivo: ${errors[0]}` },
          { status: 500 }
        );
      }
    } else {
      // Se não há erros, atualiza como sucesso
      await supabase
        .from("historico_uploads")
        .update({
          status: "sucesso",
          registros_processados: processed
        })
        .eq("id", uploadId);
    }

    // If both estoque and demanda are uploaded, calculate positions
    if (fileType === "estoque" || fileType === "demanda") {
      await calculatePositions();
    }

    return NextResponse.json({
      success: true,
      message: `Arquivo processado com ${errors.length > 0 ? "alguns erros" : "sucesso"}. ${processed} registros importados.`,
      recordsProcessed: processed,
      warnings: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error("Erro no processamento:", error);
    return NextResponse.json(
      { error: `Erro interno: ${error.message}` },
      { status: 500 }
    );
  }
}

// Function to calculate positions for replenishment
// Function to calculate positions for replenishment
async function calculatePositions() {
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
        if (posicao && posicao.length >= 5) {
          // Procurar um padrão como "0601" no meio da string
          const match = posicao.match(/[A-Z0-9]+(\d{2})\d{2}/);
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
    
    return { success: true, count: posicoes.length };
  } catch (error: any) {
    console.error("Erro ao calcular posições:", error);
    return { success: false, error: error.message };
  }
}