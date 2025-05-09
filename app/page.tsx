"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package2, Settings, Info } from "lucide-react"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"

export default function Home() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <h1 className="text-4xl font-bold mb-2">AbasteceCD</h1>
        <p className="text-muted-foreground">Sistema de gestão de abastecimento para centros de distribuição</p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl"
      >
        <NavCard
          href="/posicoes"
          icon={<Package2 className="h-8 w-8" />}
          title="Posições para Abastecer"
          description="Visualize e gerencie as posições que precisam ser abastecidas"
          variants={item}
        />
        <NavCard
          href="/configuracoes"
          icon={<Settings className="h-8 w-8" />}
          title="Configurações"
          description="Configure parâmetros e faça upload de arquivos"
          variants={item}
        />
        <NavCard
          href="/sobre"
          icon={<Info className="h-8 w-8" />}
          title="Sobre"
          description="Informações sobre o sistema e desenvolvedores"
          variants={item}
        />
      </motion.div>
    </main>
  )
}

interface NavCardProps {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  variants: any
}

function NavCard({ href, icon, title, description, variants }: NavCardProps) {
  return (
    <motion.div variants={variants} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
      <Link href={href} className="block h-full">
        <Card className="h-full transition-colors hover:bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}
