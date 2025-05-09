"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, FileSpreadsheet, Upload, RefreshCw } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

export default function Configuracoes() {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [limiteDestaque, setLimiteDestaque] = useState(20)
  const [modoCalculo, setModoCalculo] = useState("padrao")
  const [arquivoEstoque, setArquivoEstoque] = useState<File | null>(null)
  const [arquivoDemanda, setArquivoDemanda] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, tipo: "estoque" | "demanda") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const fileExtension = file.name.split(".").pop()?.toLowerCase()

      if (fileExtension !== "csv" && fileExtension !== "xlsx") {
        toast.error("Formato de arquivo inválido", {
          description: "Por favor, selecione um arquivo CSV ou XLSX.",
        })
        e.target.value = ""
        return
      }

      if (tipo === "estoque") {
        setArquivoEstoque(file)
      } else {
        setArquivoDemanda(file)
      }

      toast.success(`Arquivo ${file.name} selecionado`, {
        description: "Clique em 'Enviar Arquivos' para processar.",
      })
    }
  }

  const handleUpload = () => {
    if (!arquivoEstoque && !arquivoDemanda) {
      toast.error("Nenhum arquivo selecionado", {
        description: "Por favor, selecione pelo menos um arquivo para enviar.",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    // Simulação de upload
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploading(false)

          toast.success("Upload concluído com sucesso!", {
            description: "Os dados foram processados e estão prontos para uso.",
          })

          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const handleReset = () => {
    toast.info("Confirmação necessária", {
      description: "Tem certeza que deseja resetar todos os dados?",
      action: {
        label: "Confirmar",
        onClick: () => {
          setArquivoEstoque(null)
          setArquivoDemanda(null)
          setUploadProgress(0)

          // Reset file inputs
          const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>
          fileInputs.forEach((input) => {
            input.value = ""
          })

          toast.success("Dados resetados com sucesso", {
            description: "Todos os dados foram limpos do sistema.",
          })
        },
      },
    })
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
                        Formato esperado: Material, Descricao, Posicao, Estoque, UD, Deposito
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
                        Formato esperado: Material, Descricao, Saldo Total, Deposito
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
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleReset} disabled={uploading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resetar Dados
                  </Button>
                  <Button onClick={handleUpload} disabled={uploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar Arquivos
                  </Button>
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
                      <Select value={modoCalculo} onValueChange={setModoCalculo}>
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
                        <span className="text-sm">{limiteDestaque}%</span>
                      </div>
                      <Slider
                        id="limite-destaque"
                        min={5}
                        max={50}
                        step={5}
                        value={[limiteDestaque]}
                        onValueChange={(value) => setLimiteDestaque(value[0])}
                      />
                      <p className="text-sm text-muted-foreground">
                        Posições com percentual abaixo deste valor serão destacadas como críticas.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => {
                      toast.success("Configurações salvas", {
                        description: "As configurações de cálculo foram atualizadas com sucesso.",
                      })
                    }}
                  >
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
                      <Switch id="notificacoes" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-refresh">Atualização Automática</Label>
                        <p className="text-sm text-muted-foreground">
                          Atualizar dados automaticamente a cada 30 minutos.
                        </p>
                      </div>
                      <Switch id="auto-refresh" defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="modo-compacto">Modo Compacto</Label>
                        <p className="text-sm text-muted-foreground">Exibir mais informações em menos espaço.</p>
                      </div>
                      <Switch id="modo-compacto" />
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
                  <Button
                    onClick={() => {
                      toast.success("Configurações salvas", {
                        description: "As configurações do sistema foram atualizadas com sucesso.",
                      })
                    }}
                  >
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
