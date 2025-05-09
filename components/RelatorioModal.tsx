// components/RelatorioModal.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Printer, FileDown, ClipboardCheck } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { exportAbastecimentoPdf } from "@/utils/pdfGenerator";
import { RuaData } from "@/types/types";

interface RelatorioModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RuaData[];
  ruas: string[];
  depositos: string[];
}

export function RelatorioModal({ isOpen, onClose, data, ruas, depositos }: RelatorioModalProps) {
  const [ruaFilter, setRuaFilter] = useState<string>("todas");
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>("todas");
  const [depositoFilter, setDepositoFilter] = useState<string>("todos");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [includeAssinaturas, setIncludeAssinaturas] = useState<boolean>(true);
  const [includeStatus, setIncludeStatus] = useState<boolean>(true);
  const [compacto, setCompacto] = useState<boolean>(false);

  // Filtrar dados baseado nas seleções
  const filteredData = React.useMemo(() => {
    if (!data) return [];
    
    return data.filter((ruaData) => {
      // Filtro de rua
      if (ruaFilter !== "todas" && ruaData.rua !== ruaFilter) {
        return false;
      }

      // Filtrar posições baseado em prioridade e depósito
      const filteredPosicoes = ruaData.posicoes.filter((posicao) => {
        // Filtro de prioridade
        if (prioridadeFilter !== "todas") {
          const percentual = Math.min(100, Math.round((posicao.saldoAtual / posicao.demanda) * 100));
          
          if (prioridadeFilter === "critico" && percentual >= 20) return false;
          if (prioridadeFilter === "medio" && (percentual < 20 || percentual >= 50)) return false;
          if (prioridadeFilter === "normal" && percentual < 50) return false;
        }

        // Filtro de depósito
        if (depositoFilter !== "todos" && posicao.deposito !== depositoFilter) {
          return false;
        }

        return true;
      });

      // Se não houver posições após filtro, não incluir esta rua
      if (filteredPosicoes.length === 0) {
        return false;
      }

      return {
        ...ruaData,
        posicoes: filteredPosicoes
      };
    });
  }, [data, ruaFilter, prioridadeFilter, depositoFilter]);

  // Função para gerar PDF
  const handleGeneratePdf = () => {
    if (filteredData.length === 0) {
      toast.error("Nenhum dado para gerar relatório", {
        description: "Não foram encontradas posições com os filtros selecionados."
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Passar dados filtrados e opções para o gerador de PDF
      exportAbastecimentoPdf(filteredData, {
        ruaFilter,
        prioridadeFilter,
        depositoFilter,
        includeAssinaturas,
        includeStatus,
        compacto
      });
      
      // Notificar o usuário após o sucesso
      toast.success("Relatório gerado com sucesso", {
        description: "O arquivo PDF foi baixado para o seu dispositivo."
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar relatório", {
        description: "Ocorreu um erro ao gerar o arquivo PDF. Tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gerar Relatório de Abastecimento</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rua-relatorio">Rua</Label>
              <Select value={ruaFilter} onValueChange={setRuaFilter}>
                <SelectTrigger id="rua-relatorio">
                  <SelectValue placeholder="Selecione a rua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Ruas</SelectItem>
                  {ruas.map((rua) => (
                    <SelectItem key={rua} value={rua}>{rua}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prioridade-relatorio">Prioridade</Label>
              <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                <SelectTrigger id="prioridade-relatorio">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Prioridades</SelectItem>
                  <SelectItem value="critico">Crítico (&lt; 20%)</SelectItem>
                  <SelectItem value="medio">Médio (20% – 50%)</SelectItem>
                  <SelectItem value="normal">Normal (&gt; 50%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deposito-relatorio">Depósito</Label>
              <Select value={depositoFilter} onValueChange={setDepositoFilter}>
                <SelectTrigger id="deposito-relatorio">
                  <SelectValue placeholder="Selecione o depósito" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Depósitos</SelectItem>
                  {depositos.map((dep) => (
                    <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-3">Opções do Relatório</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="opcao-assinaturas" 
                  checked={includeAssinaturas}
                  onCheckedChange={(checked) => setIncludeAssinaturas(checked as boolean)}
                />
                <Label htmlFor="opcao-assinaturas">Incluir campos de assinatura</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="opcao-status" 
                  checked={includeStatus}
                  onCheckedChange={(checked) => setIncludeStatus(checked as boolean)}
                />
                <Label htmlFor="opcao-status">Mostrar status (crítico/médio)</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="opcao-compacto" 
                  checked={compacto}
                  onCheckedChange={(checked) => setCompacto(checked as boolean)}
                />
                <Label htmlFor="opcao-compacto">Formato compacto</Label>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Este relatório exibirá todas as posições que precisam ser abastecidas com base nos filtros selecionados.
              Será gerado um arquivo PDF que você poderá salvar e imprimir quando necessário.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="default" onClick={handleGeneratePdf} disabled={isLoading}>
            {isLoading ? (
              <>Gerando PDF...</>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Gerar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}