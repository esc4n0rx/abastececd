// app/posicoes/page.tsx - Com a nova feature de relatório
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Printer, Search, Filter } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { RelatorioModal } from "../../components/RelatorioModal"

interface Posicao {
  codigo: string
  material: string
  descricao: string
  saldoAtual: number
  demanda: number
  ud: string
  deposito: string
}

interface RuaData {
  rua: string
  posicoes: Posicao[]
}

export default function Posicoes() {
  const [isLoading, setIsLoading] = useState(true)
  const [expandedRuas, setExpandedRuas] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [ruaFilter, setRuaFilter] = useState("todas")
  const [prioridadeFilter, setPrioridadeFilter] = useState("todas")
  const [depositoFilter, setDepositoFilter] = useState("todos")
  const [data, setData] = useState<RuaData[]>([])
  const [ruas, setRuas] = useState<string[]>([])
  const [depositos, setDepositos] = useState<string[]>(["DP01", "DP40"])
  // Novo estado para controlar o modal de relatório
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (ruaFilter !== "todas") {
        params.append("rua", ruaFilter);
      }
      
      if (prioridadeFilter !== "todas") {
        let status;
        if (prioridadeFilter === "critico") status = "critico";
        else if (prioridadeFilter === "medio") status = "medio";
        else status = "normal";
        
        params.append("status", status);
      }
      
      if (depositoFilter !== "todos") {
        params.append("deposito", depositoFilter);
      }
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      
      const response = await fetch(`/api/posicoes?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar posições");
      }
      
      const fetchedData = await response.json();
      
      // Extract unique ruas for the filter
      const uniqueRuas = [...new Set(fetchedData.map((item: RuaData) => item.rua))] as string[];
      setRuas(uniqueRuas);
      
      // Extract unique depositos for the filter
      const uniqueDepositos = [...new Set(fetchedData.flatMap((item: RuaData) => 
        item.posicoes.map(pos => pos.deposito)
      ))].filter(Boolean) as string[];
      if (uniqueDepositos.length > 0) {
        setDepositos(uniqueDepositos);
      }
      
      // Set initial expanded state for all ruas
      const initialExpandedState: Record<string, boolean> = {};
      uniqueRuas.forEach(rua => {
        initialExpandedState[rua] = true;
      });
      setExpandedRuas(initialExpandedState);
      
      setData(fetchedData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar posições", {
        description: "Não foi possível carregar os dados de posições."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRua = (rua: string) => {
    setExpandedRuas(prev => ({
      ...prev,
      [rua]: !prev[rua]
    }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleRuaFilter = (value: string) => {
    setRuaFilter(value);
  };

  const handlePrioridadeFilter = (value: string) => {
    setPrioridadeFilter(value);
  };
  
  const handleDepositoFilter = (value: string) => {
    setDepositoFilter(value);
  };

  const applyFilters = () => {
    setIsLoading(true);
    fetchData();
  };

  // Função atualizada para abrir o modal de relatório em vez de mostrar o toast
  const handleGerarRelatorio = () => {
    setIsReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
  };

  const getPercentual = (saldoAtual: number, demanda: number) => {
    return Math.min(100, Math.round((saldoAtual / demanda) * 100));
  };

  const getQuantidadeNecessaria = (saldoAtual: number, demanda: number) => {
    return Math.max(0, demanda - saldoAtual);
  };

  const getStatusColor = (percentual: number) => {
    if (percentual < 20) return "bg-red-500";
    if (percentual < 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusBadge = (percentual: number) => {
    if (percentual < 20) return <Badge variant="destructive">Crítico</Badge>;
    if (percentual < 50) return <Badge variant="secondary" className="bg-yellow-500">Médio</Badge>;
    return <Badge variant="default" className="bg-green-500">Normal</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold">AbasteceCD</Link>
            <h1 className="text-xl font-semibold">Posições para Abastecer</h1>
          </div>
          <ModeToggle />
        </div>
      </header>
      
      <main className="container px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </span>
                <Button variant="outline" onClick={handleGerarRelatorio}>
                  <Printer className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      type="search"
                      placeholder="Código, material ou descrição..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rua">Filtrar por Rua</Label>
                  <Select value={ruaFilter} onValueChange={handleRuaFilter}>
                    <SelectTrigger id="rua">
                      <SelectValue placeholder="Selecione a rua" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as Ruas</SelectItem>
                      {ruas.map(rua => (
                        <SelectItem key={rua} value={rua}>{rua}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prioridade">Filtrar por Prioridade</Label>
                  <Select value={prioridadeFilter} onValueChange={handlePrioridadeFilter}>
                    <SelectTrigger id="prioridade">
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
                  <Label htmlFor="deposito">Filtrar por Depósito</Label>
                  <Select value={depositoFilter} onValueChange={handleDepositoFilter}>
                    <SelectTrigger id="deposito">
                      <SelectValue placeholder="Selecione o depósito" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Depósitos</SelectItem>
                      {depositos.map(dep => (
                        <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button onClick={applyFilters}>
                  Aplicar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-8 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3].map((j) => (
                      <Skeleton key={j} className="h-24 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data.length > 0 ? (
              data.map((rua) => (
                <motion.div
                  key={rua.rua}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader className="cursor-pointer" onClick={() => toggleRua(rua.rua)}>
                      <CardTitle className="flex items-center justify-between">
                        <span>{rua.rua}</span>
                        {expandedRuas[rua.rua] ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    <AnimatePresence>
                      {expandedRuas[rua.rua] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CardContent>
                            <div className="space-y-4">
                              {rua.posicoes.map((posicao) => {
                                const percentual = getPercentual(posicao.saldoAtual, posicao.demanda);
                                const quantidadeNecessaria = getQuantidadeNecessaria(posicao.saldoAtual, posicao.demanda);
                                
                                return (
                                  <motion.div
                                    key={posicao.codigo}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="border rounded-lg p-4"
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold">{posicao.codigo}</h3>
                                            <Badge variant="outline">{posicao.deposito}</Badge>
                                          </div>
                                          {getStatusBadge(percentual)}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                          <span className="font-medium">Material:</span> {posicao.material} - {posicao.descricao}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          <span className="font-medium">Saldo Atual:</span> {posicao.saldoAtual} {posicao.ud} / 
                                          <span className="font-medium"> Demanda:</span> {posicao.demanda} {posicao.ud}
                                        </p>
                                      </div>
                                      <div>
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="text-sm font-medium">Percentual Atendido: {percentual}%</span>
                                          <span className="text-sm font-medium">
                                            Abastecer: {quantidadeNecessaria} {posicao.ud}
                                          </span>
                                        </div>
                                        <Progress value={percentual} className={`h-2 [&>div]:${getStatusColor(percentual)}`} />
                                      </div>
                                    </div>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <p className="text-muted-foreground mb-4">Nenhuma posição encontrada com os filtros selecionados.</p>
                  <Button variant="outline" onClick={() => {
                    setSearchTerm("")
                    setRuaFilter("todas")
                    setPrioridadeFilter("todas")
                    setDepositoFilter("todos")
                    fetchData()
                  }}>
                    Limpar Filtros
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Modal de Relatório */}
      <RelatorioModal 
        isOpen={isReportModalOpen} 
        onClose={handleCloseReportModal} 
        data={data} 
        ruas={ruas} 
        depositos={depositos} 
      />
    </div>
  )
}