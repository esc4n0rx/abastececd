// app/configuracoes/page.tsx
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, FileSpreadsheet, Upload, RefreshCw } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useUpload } from "@/hooks/use-upload"
import { useData } from "../../context/DataContext"

interface ConfiguracaoForm {
  id: number
  modo_calculo: string
  limite_destaque: number
  notificacoes: boolean
  atualizacao_automatica: boolean
  modo_compacto: boolean
}

interface HistoricoUpload {
  id: number
  tipo: string
  nome_arquivo: string
  tamanho_bytes: number
  registros_processados: number
  status: string
  mensagem: string | null
  data_upload: string
}

export default function Configuracoes() {
  const { uploading, uploadProgress, uploadFile } = useUpload();
  const { config, setConfig, saveConfig, recalcularPosicoes } = useData();
  // const [config, setConfig] = useState<ConfiguracaoForm>({
  //   id: 1,
  //   modo_calculo: "padrao",
  //   limite_destaque: 20,
  //   notificacoes: true,
  //   atualizacao_automatica: true,
  //   modo_compacto: false
  // });
  
  const [historico, setHistorico] = useState<HistoricoUpload[]>([]);
  const [arquivoEstoque, setArquivoEstoque] = useState<File | null>(null);
  const [arquivoDemanda, setArquivoDemanda] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch configuration
        const configResponse = await fetch("/api/configuracoes");
        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (configData) {
            setConfig(configData);
          }
        }
        
        // Fetch upload history
        const historicoResponse = await fetch("/api/historico-uploads");
        if (historicoResponse.ok) {
          const historicoData = await historicoResponse.json();
          setHistorico(historicoData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados", {
          description: "Não foi possível carregar as configurações."
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, tipo: "estoque" | "demanda") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (fileExtension !== "csv" && fileExtension !== "xlsx") {
        toast.error("Formato de arquivo inválido", {
          description: "Por favor, selecione um arquivo CSV ou XLSX.",
        });
        e.target.value = "";
        return;
      }

      if (tipo === "estoque") {
        setArquivoEstoque(file);
      } else {
        setArquivoDemanda(file);
      }

      toast.success(`Arquivo ${file.name} selecionado`, {
        description: "Clique em 'Enviar Arquivos' para processar.",
      });
    }
  }
  
  const handleUpload = async () => {
    if (!arquivoEstoque && !arquivoDemanda) {
      toast.error("Nenhum arquivo selecionado", {
        description: "Por favor, selecione pelo menos um arquivo para enviar.",
      });
      return;
    }
    
    let success = true;
    
    if (arquivoEstoque) {
      const estoqueResult = await uploadFile(arquivoEstoque, "estoque");
      if (!estoqueResult) success = false;
    }
    
    if (arquivoDemanda && success) {
      const demandaResult = await uploadFile(arquivoDemanda, "demanda");
      if (!demandaResult) success = false;
    }
    
    if (success) {
      // Refresh upload history
      try {
        const historicoResponse = await fetch("/api/historico-uploads");
        if (historicoResponse.ok) {
          const historicoData = await historicoResponse.json();
          setHistorico(historicoData);
        }
      } catch (error) {
        console.error("Erro ao atualizar histórico:", error);
      }
    }
  }
  
  const handleSaveConfig = async () => {
    try {
      const response = await fetch("/api/configuracoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        throw new Error("Erro ao salvar configurações");
      }
      
      toast.success("Configurações salvas", {
        description: "As configurações foram atualizadas com sucesso."
      });
    } catch (error: any) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações", {
        description: error.message
      });
    }
  }
  
  const handleRecalculate = async () => {
    try {
      toast.info("Recalculando posições...");
      
      const response = await fetch("/api/recalculate-positions", {
        method: "POST"
      });
      
      if (!response.ok) {
        throw new Error("Erro ao recalcular posições");
      }
      
      const data = await response.json();
      
      toast.success("Posições recalculadas", {
        description: `${data.count} posições foram recalculadas com sucesso.`
      });
    } catch (error: any) {
      console.error("Erro ao recalcular posições:", error);
      toast.error("Erro ao recalcular posições", {
        description: error.message
      });
    }
  }
  
  const handleReset = () => {
    toast.info("Confirmação necessária", {
      description: "Tem certeza que deseja resetar todos os dados?",
      action: {
        label: "Confirmar",
        onClick: async () => {
          try {
            setArquivoEstoque(null);
            setArquivoDemanda(null);
            
            // Reset file inputs
            const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
            fileInputs.forEach((input) => {
              input.value = "";
            });
            
            // Clear database tables
            await fetch("/api/reset-data", {
              method: "POST"
            });
            
            // Refresh upload history
            const historicoResponse = await fetch("/api/historico-uploads");
            if (historicoResponse.ok) {
              const historicoData = await historicoResponse.json();
              setHistorico(historicoData);
            }
            
            toast.success("Dados resetados com sucesso", {
              description: "Todos os dados foram limpos do sistema.",
            });
          } catch (error: any) {
            console.error("Erro ao resetar dados:", error);
            toast.error("Erro ao resetar dados", {
              description: error.message
            });
          }
        },
      },
    });
  }
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold">
              AbasteceCD
            </Link>
            <h1 className="text-xl font-semibold">Configurações</h1>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="container px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 gap-6"
        >
          <Tabs defaultValue="arquivos" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
              <TabsTrigger value="calculos">Cálculos</TabsTrigger>
              <TabsTrigger value="sistema">Sistema</TabsTrigger>
            </TabsList>

            <TabsContent value="arquivos" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload de Arquivos</CardTitle>
                  <CardDescription>Faça upload dos arquivos de estoque e demanda para processamento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="estoque">Arquivo de Estoque (.csv, .xlsx)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="estoque"
                          type="file"
                          accept=".csv,.xlsx"
                          onChange={(e) => handleFileChange(e, "estoque")}
                          disabled={uploading}
                        />
                        <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Formato esperado: Material, Centro, Texto breve de material, Tipo de depósito, Posição no depósito, etc.
                      </p>
                    </div>

                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="demanda">Arquivo de Demanda (.csv, .xlsx)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="demanda"
                          type="file"
                          accept=".csv,.xlsx"
                          onChange={(e) => handleFileChange(e, "demanda")}
                          disabled={uploading}
                        />
                        <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Formato esperado: N_DEPOSITO, NUMERO_NT, STATUS, TP_TRANSPORTE, etc.
                      </p>
                    </div>
                  </div>

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso do upload</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Histórico de Uploads</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Arquivo</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Tamanho</TableHead>
                            <TableHead>Registros</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historico.length > 0 ? (
                            historico.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.nome_arquivo}</TableCell>
                                <TableCell>{item.tipo === 'estoque' ? 'Estoque' : 'Demanda'}</TableCell>
                                <TableCell>{formatBytes(item.tamanho_bytes)}</TableCell>
                                <TableCell>{item.registros_processados}</TableCell>
                                <TableCell>
                                  {item.status === 'sucesso' ? (
                                    <span className="text-green-500 font-medium">Sucesso</span>
                                  ) : item.status === 'erro' ? (
                                    <span className="text-red-500 font-medium">Erro</span>
                                  ) : (
                                    <span className="text-yellow-500 font-medium">Processando</span>
                                  )}
                                </TableCell>
                                <TableCell>{formatDate(item.data_upload)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-4">
                                Nenhum histórico de upload encontrado
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleReset} disabled={uploading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resetar Dados
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleRecalculate} 
                      disabled={uploading}
                    >
                      Recalcular Posições
                    </Button>
                    <Button onClick={handleUpload} disabled={uploading}>
                      <Upload className="mr-2 h-4 w-4" />
                      Enviar Arquivos
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="calculos" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Cálculo</CardTitle>
                  <CardDescription>Defina como os cálculos de abastecimento serão realizados.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="modo-calculo">Modo de Cálculo</Label>
                      <Select 
                        value={config.modo_calculo} 
                        onValueChange={(value) => setConfig({ ...config, modo_calculo: value })}
                      >
                        <SelectTrigger id="modo-calculo">
                          <SelectValue placeholder="Selecione o modo de cálculo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="padrao">Padrão (Demanda - Estoque)</SelectItem>
                          <SelectItem value="percentual">Percentual (Estoque / Demanda)</SelectItem>
                          <SelectItem value="ponderado">Ponderado (Considera histórico)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="limite-destaque">Limite para Destaque Crítico (%)</Label>
                        <span className="text-sm">{config.limite_destaque}%</span>
                      </div>
                      <Slider
                        id="limite-destaque"
                        min={5}
                        max={50}
                        step={5}
                        value={[config.limite_destaque]}
                        onValueChange={(value) => setConfig({ ...config, limite_destaque: value[0] })}
                      />
                      <p className="text-sm text-muted-foreground">
                        Posições com percentual abaixo deste valor serão destacadas como críticas.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveConfig}>
                    Salvar Configurações
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="sistema" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Sistema</CardTitle>
                  <CardDescription>Ajuste as configurações gerais do sistema.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notificacoes">Notificações</Label>
                        <p className="text-sm text-muted-foreground">
                          Receber notificações sobre níveis críticos de estoque.
                        </p>
                      </div>
                      <Switch 
                        id="notificacoes" 
                        checked={config.notificacoes}
                        onCheckedChange={(checked) => setConfig({ ...config, notificacoes: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-refresh">Atualização Automática</Label>
                        <p className="text-sm text-muted-foreground">
                          Atualizar dados automaticamente a cada 30 minutos.
                        </p>
                      </div>
                      <Switch 
                        id="auto-refresh" 
                        checked={config.atualizacao_automatica}
                        onCheckedChange={(checked) => setConfig({ ...config, atualizacao_automatica: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="modo-compacto">Modo Compacto</Label>
                        <p className="text-sm text-muted-foreground">Exibir mais informações em menos espaço.</p>
                      </div>
                      <Switch 
                        id="modo-compacto" 
                        checked={config.modo_compacto}
                        onCheckedChange={(checked) => setConfig({ ...config, modo_compacto: checked })}
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Importante</AlertTitle>
                    <AlertDescription>
                      Algumas configurações podem afetar o desempenho do sistema em dispositivos mais antigos.
                    </AlertDescription>
                  </Alert>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSaveConfig}>
                    Salvar Configurações
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  )
}