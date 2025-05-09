"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Printer, Search } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

// Mock data
const mockData = [
  {
    rua: "Rua 01",
    posicoes: [
      { codigo: "01A01", material: "123456", descricao: "Produto A", saldoAtual: 15, demanda: 50, ud: "UN" },
      { codigo: "01A02", material: "123457", descricao: "Produto B", saldoAtual: 5, demanda: 100, ud: "CX" },
      { codigo: "01A03", material: "123458", descricao: "Produto C", saldoAtual: 0, demanda: 30, ud: "UN" },
    ],
  },
  {
    rua: "Rua 02",
    posicoes: [
      { codigo: "02A01", material: "234567", descricao: "Produto D", saldoAtual: 25, demanda: 40, ud: "UN" },
      { codigo: "02A02", material: "234568", descricao: "Produto E", saldoAtual: 10, demanda: 20, ud: "CX" },
    ],
  },
  {
    rua: "Rua 03",
    posicoes: [
      { codigo: "03A01", material: "345678", descricao: "Produto F", saldoAtual: 5, demanda: 50, ud: "UN" },
      { codigo: "03A02", material: "345679", descricao: "Produto G", saldoAtual: 2, demanda: 40, ud: "CX" },
      { codigo: "03A03", material: "345680", descricao: "Produto H", saldoAtual: 30, demanda: 35, ud: "UN" },
    ],
  },
]

export default function Posicoes() {
  const [isLoading, setIsLoading] = useState(false)
  const [expandedRuas, setExpandedRuas] = useState<Record<string, boolean>>({
    "Rua 01": true,
    "Rua 02": true,
    "Rua 03": true
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredData, setFilteredData] = useState(mockData)
  const [ruaFilter, setRuaFilter] = useState("todas")
  const [prioridadeFilter, setPrioridadeFilter] = useState("todas")

  const toggleRua = (rua: string) => {
    setExpandedRuas(prev => ({
      ...prev,
      [rua]: !prev[rua]
    }))
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    applyFilters(e.target.value, ruaFilter, prioridadeFilter)
  }

  const handleRuaFilter = (value: string) => {
    setRuaFilter(value)
    applyFilters(searchTerm, value, prioridadeFilter)
  }

  const handlePrioridadeFilter = (value: string) => {
    setPrioridadeFilter(value)
    applyFilters(searchTerm, ruaFilter, value)
  }

  const applyFilters = (search: string, rua: string, prioridade: string) => {
    setIsLoading(true)
    
    // Simulate loading
    setTimeout(() => {
      let filtered = [...mockData]
      
      // Apply rua filter
      if (rua !== "todas") {
        filtered = filtered.filter(item => item.rua === rua)
      }
      
      // Apply search filter
      if (search) {
        filtered = filtered.map(ruaItem => {
          const filteredPosicoes = ruaItem.posicoes.filter(
            pos => 
              pos.codigo.toLowerCase().includes(search.toLowerCase()) ||
              pos.material.toLowerCase().includes(search.toLowerCase()) ||
              pos.descricao.toLowerCase().includes(search.toLowerCase())
          )
          
          if (filteredPosicoes.length > 0) {
            return { ...ruaItem, posicoes: filteredPosicoes }
          }
          return null
        }).filter(Boolean) as typeof mockData
      }
      
      // Apply prioridade filter
      if (prioridade !== "todas") {
        filtered = filtered.map(ruaItem => {
          let filteredPosicoes
          
          if (prioridade === "critico") {
            filteredPosicoes = ruaItem.posicoes.filter(pos => (pos.saldoAtual / pos.demanda) < 0.2)
          } else if (prioridade === "medio") {
            filteredPosicoes = ruaItem.posicoes.filter(pos => 
              (pos.saldoAtual / pos.demanda) >= 0.2 && (pos.saldoAtual / pos.demanda) < 0.5
            )
          } else if (prioridade === "normal") {
            filteredPosicoes = ruaItem.posicoes.filter(pos => (pos.saldoAtual / pos.demanda) >= 0.5)
          } else {
            filteredPosicoes = ruaItem.posicoes
          }
          
          if (filteredPosicoes.length > 0) {
            return { ...ruaItem, posicoes: filteredPosicoes }
          }
          return null
        }).filter(Boolean) as typeof mockData
      }
      
      setFilteredData(filtered)
      setIsLoading(false)
    }, 500)
  }

  const handleGerarRelatorio = () => {
    toast.success("Relatório gerado com sucesso!", {
      description: "O relatório foi preparado para impressão.",
      action: {
        label: "Imprimir",
        onClick: () => window.print()
      }
    })
  }

  const getPercentual = (saldoAtual: number, demanda: number) => {
    return Math.min(100, Math.round((saldoAtual / demanda) * 100))
  }

  const getQuantidadeNecessaria = (saldoAtual: number, demanda: number) => {
    return Math.max(0, demanda - saldoAtual)
  }

  const getStatusColor = (percentual: number) => {
    if (percentual < 20) return "bg-red-500"
    if (percentual < 50) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStatusBadge = (percentual: number) => {
    if (percentual < 20) return <Badge variant="destructive">Crítico</Badge>
    if (percentual < 50) return <Badge variant="warning" className="bg-yellow-500">Médio</Badge>
    return <Badge variant="success" className="bg-green-500">Normal</Badge>
  }

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
                <span>Filtros</span>
                <Button variant="outline" onClick={handleGerarRelatorio}>
                  <Printer className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <SelectItem value="Rua 01">Rua 01</SelectItem>
                      <SelectItem value="Rua 02">Rua 02</SelectItem>
                      <SelectItem value="Rua 03">Rua 03</SelectItem>
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
            {filteredData.length > 0 ? (
              filteredData.map((rua) => (
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
                                const percentual = getPercentual(posicao.saldoAtual, posicao.demanda)
                                const quantidadeNecessaria = getQuantidadeNecessaria(posicao.saldoAtual, posicao.demanda)
                                
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
                                          <h3 className="text-lg font-semibold">{posicao.codigo}</h3>
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
                                        <Progress value={percentual} className="h-2" indicatorClassName={getStatusColor(percentual)} />
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
                    setFilteredData(mockData)
                  }}>
                    Limpar Filtros
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
