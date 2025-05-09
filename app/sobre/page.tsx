"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ModeToggle } from "@/components/mode-toggle"
import { Package2, Code2, Github, Linkedin } from "lucide-react"
import Link from "next/link"

export default function Sobre() {
  const technologies = [
    { name: "Next.js", description: "Framework React com App Router" },
    { name: "TypeScript", description: "Linguagem tipada baseada em JavaScript" },
    { name: "Tailwind CSS", description: "Framework CSS utilitário" },
    { name: "shadcn/ui", description: "Componentes de UI reutilizáveis" },
    { name: "Framer Motion", description: "Biblioteca de animações para React" },
    { name: "@headlessui/react", description: "Componentes acessíveis sem estilo" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold">
              AbasteceCD
            </Link>
            <h1 className="text-xl font-semibold">Sobre</h1>
          </div>
          <ModeToggle />
        </div>
      </header>

      <main className="container px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package2 className="h-6 w-6" />
                  Sobre o AbasteceCD
                </CardTitle>
                <CardDescription>Sistema de gestão de abastecimento para centros de distribuição</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  O AbasteceCD é um sistema desenvolvido para otimizar o processo de abastecimento em centros de
                  distribuição. Ele permite visualizar de forma clara e intuitiva as posições que precisam ser
                  abastecidas, com base na análise do estoque atual e da demanda prevista.
                </p>
                <p>Com o AbasteceCD, é possível:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Visualizar posições que precisam ser abastecidas, agrupadas por rua</li>
                  <li>Filtrar posições por rua, prioridade ou saldo crítico</li>
                  <li>Gerar relatórios para impressão</li>
                  <li>Fazer upload de arquivos de estoque e demanda</li>
                  <li>Configurar parâmetros de cálculo e visualização</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-6 w-6" />
                  Stack Tecnológica
                </CardTitle>
                <CardDescription>Tecnologias utilizadas no desenvolvimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {technologies.map((tech, index) => (
                    <motion.div
                      key={tech.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-start gap-2 p-3 border rounded-lg"
                    >
                      <Badge variant="outline" className="h-6">
                        {tech.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{tech.description}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Desenvolvedor</CardTitle>
                <CardDescription>Informações sobre o desenvolvedor do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-6 p-4">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                    DEV
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-xl font-semibold mb-2">Paulo Oliveira </h3>
                    <p className="text-muted-foreground mb-4">
                      Desenvolvedor Full Stack especializado em soluções para logística e gestão de estoque.
                    </p>
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <Link href="#" className="flex items-center gap-1 text-sm">
                        <Github className="h-4 w-4" />
                        GitHub
                      </Link>
                      <Link href="#" className="flex items-center gap-1 text-sm">
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center border-t pt-6">
                <p className="text-sm text-muted-foreground">
                  © {new Date().getFullYear()} AbasteceCD. Todos os direitos reservados.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
