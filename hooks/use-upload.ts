// hooks/use-upload.ts
import { useState } from "react";
import { toast } from "sonner";

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  async function uploadFile(file: File, type: "estoque" | "demanda") {
    if (!file) {
      toast.error("Nenhum arquivo selecionado");
      return false;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Start fake progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao fazer upload do arquivo");
      }
      
      setUploadProgress(100);
      
      const data = await response.json();
      toast.success("Upload concluído com sucesso!", {
        description: `${data.recordsProcessed} registros foram processados.`
      });
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
      
      return true;
    } catch (error: any) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao enviar arquivo", {
        description: error.message
      });
      
      setUploading(false);
      setUploadProgress(0);
      return false;
    }
  }
  
  return {
    uploading,
    uploadProgress,
    uploadFile
  };
}