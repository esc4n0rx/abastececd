// utils/pdfGenerator.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Posicao, RuaData } from '../types/types';

interface GeneratePdfOptions {
  ruaFilter: string;
  prioridadeFilter: string;
  depositoFilter: string;
  includeAssinaturas: boolean;
  includeStatus: boolean;
  compacto: boolean;
}

// Função para gerar o PDF do relatório usando autoTable(doc, …)
export const generateAbastecimentoPdf = (
  data: RuaData[],
  options: GeneratePdfOptions
): jsPDF => {
  try {
    const doc = new jsPDF('portrait', 'mm', 'a4');

    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Cabeçalho
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Abastecimento', pageWidth / 2, margin, { align: 'center' });

    const currentDate = new Date();
    const formattedDate = `${currentDate.toLocaleDateString('pt-BR')} ${currentDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${formattedDate}`, pageWidth / 2, margin + 7, { align: 'center' });

    // Filtros
    let filtrosText = `Filtros: `;
    filtrosText += options.ruaFilter !== "todas" ? `Rua: ${options.ruaFilter}` : "Todas as ruas";
    filtrosText += " | ";
    filtrosText += options.prioridadeFilter !== "todas"
      ? `Prioridade: ${options.prioridadeFilter === "critico" ? "Crítico" : options.prioridadeFilter === "medio" ? "Médio" : "Normal"}`
      : "Todas as prioridades";
    filtrosText += " | ";
    filtrosText += options.depositoFilter !== "todos" ? `Depósito: ${options.depositoFilter}` : "Todos os depósitos";

    doc.text(filtrosText, pageWidth / 2, margin + 12, { align: 'center' });

    // Linha separadora
    doc.setDrawColor(0);
    doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

    let currentY = margin + 20;

    // Helpers de cálculo
    const getPercentual = (saldoAtual: number, demanda: number) =>
      Math.min(100, Math.round((saldoAtual / demanda) * 100));
    const getQuantidadeNecessaria = (saldoAtual: number, demanda: number) =>
      Math.max(0, demanda - saldoAtual);

    const fontSize = options.compacto ? 8 : 10;

    data.forEach((ruaData, ruaIndex) => {
      if (ruaIndex > 0 && !options.compacto) {
        doc.addPage();
        currentY = margin;
      }

      // Título da rua
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(ruaData.rua, margin, currentY);
      currentY += 6;

      // Cabeçalhos e linhas da tabela
      const tableHeaders = ['Posição', 'Material', 'Descrição', 'Saldo', 'Demanda', 'Abastecer'];
      if (options.includeStatus) tableHeaders.push('Status');

      const tableRows = ruaData.posicoes.map((posicao: Posicao) => {
        const percentual = getPercentual(posicao.saldoAtual, posicao.demanda);
        const quantidade = getQuantidadeNecessaria(posicao.saldoAtual, posicao.demanda);

        let statusText = 'Normal';
        if (percentual < 20) statusText = 'CRÍTICO';
        else if (percentual < 50) statusText = 'Médio';

        const row = [
          `${posicao.codigo} ${options.compacto ? '' : `(${posicao.deposito})`}`,
          posicao.material,
          posicao.descricao.substring(0, options.compacto ? 20 : 30),
          `${posicao.saldoAtual} ${posicao.ud}`,
          `${posicao.demanda} ${posicao.ud}`,
          `${quantidade} ${posicao.ud}`
        ];

        if (options.includeStatus) row.push(statusText);
        return row;
      });

      // Gera a tabela via autoTable(doc, { … })
      autoTable(doc, {
        startY: currentY,
        head: [tableHeaders],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'left',
          fontSize
        },
        bodyStyles: {
          fontSize,
          lineWidth: 0.1,
          lineColor: [80, 80, 80]
        },
        columnStyles: {
          0: { fontStyle: 'bold' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right', fontStyle: 'bold' },
          ...(options.includeStatus && { 6: { halign: 'center' } })
        },
        margin: { left: margin, right: margin },
        didDrawPage: (dataTable) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            `AbasteceCD - Sistema de gestão de abastecimento | Página ${dataTable.pageNumber}/${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }
      });

      // Atualiza Y após a tabela
      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Assinaturas
      if (options.includeAssinaturas) {
        const sigW = 70;
        const space = (pageWidth - 2 * margin - 2 * sigW) / 3;
        doc.line(margin + space, currentY, margin + space + sigW, currentY);
        doc.line(pageWidth - margin - space - sigW, currentY, pageWidth - margin - space, currentY);
        doc.setFontSize(10);
        doc.text('Operador', margin + space + sigW / 2, currentY + 5, { align: 'center' });
        doc.text('Supervisor', pageWidth - margin - space - sigW / 2, currentY + 5, { align: 'center' });
        currentY += 15;
      }

      // Observações no modo compacto
      if (options.compacto) {
        doc.setFontSize(10);
        doc.text('Observações:', margin, currentY);
        doc.rect(margin, currentY + 2, pageWidth - 2 * margin, 20);
        currentY += 25;
      }
    });

    return doc;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};

// Função para exportar e salvar o PDF
export const exportAbastecimentoPdf = (
  data: RuaData[],
  options: GeneratePdfOptions
): void => {
  try {
    const doc = generateAbastecimentoPdf(data, options);
    let fileName = 'relatorio-abastecimento';

    if (options.ruaFilter !== 'todas') fileName += `-${options.ruaFilter.replace(/\s/g, '')}`;
    if (options.prioridadeFilter !== 'todas') fileName += `-${options.prioridadeFilter}`;

    const d = new Date();
    fileName += `-${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d
      .getDate()
      .toString()
      .padStart(2, '0')}.pdf`;

    doc.save(fileName);
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    throw error;
  }
};
