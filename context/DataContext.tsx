// contexts/DataContext.tsx
"use client"

import { 
  ReactNode, 
  createContext, 
  useContext, 
  useState, 
  useEffect
} from "react";
import { toast } from "sonner";

interface ConfiguracaoForm {
  id: number
  modo_calculo: string
  limite_destaque: number
  notificacoes: boolean
  atualizacao_automatica: boolean
  modo_compacto: boolean
}

interface DataContextType {
  config: ConfiguracaoForm
  setConfig: (config: ConfiguracaoForm) => void
  saveConfig: () => Promise<void>
  isLoading: boolean
  recalcularPosicoes: () => Promise<void>
}

const defaultConfig: ConfiguracaoForm = {
  id: 1,
  modo_calculo: "padrao",
  limite_destaque: 20,
  notificacoes: true,
  atualizacao_automatica: true,
  modo_compacto: false
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfiguracaoForm>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/configuracoes");
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
  }, []);

  const saveConfig = async () => {
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
  };

  const recalcularPosicoes = async () => {
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
  };

  return (
    <DataContext.Provider value={{ 
      config, 
      setConfig, 
      saveConfig,
      isLoading,
      recalcularPosicoes
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}