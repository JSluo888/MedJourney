import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ShareableReport } from '../types';

export class PDFService {
  static async generateReportPDF(report: ShareableReport, containerElement?: HTMLElement): Promise<void> {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 设置中文字体（使用内置字体）
      pdf.setFont('helvetica', 'normal');
      
      // 页面边距
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pageWidth - 2 * margin;
      
      let yPosition = margin;
      
      // 标题
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(report.title, margin, yPosition);
      yPosition += 15;
      
      // 生成日期
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${report.generatedAt.toLocaleDateString('zh-CN')}`, margin, yPosition);
      yPosition += 10;
      
      pdf.text(`Patient: ${report.patientName}`, margin, yPosition);
      yPosition += 15;
      
      // 概览分数
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary Scores', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Overall Score: ${report.summary.overallScore}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Cognitive Score: ${report.summary.cognitiveScore}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Emotional Score: ${report.summary.emotionalScore}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Social Score: ${report.summary.socialScore}`, margin, yPosition);
      yPosition += 15;
      
      // 洞察
      if (report.insights && report.insights.length > 0) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Key Insights', margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        report.insights.forEach((insight, index) => {
          const lines = pdf.splitTextToSize(`${index + 1}. ${insight}`, contentWidth);
          lines.forEach((line: string) => {
            if (yPosition > pageHeight - margin) {
              pdf.addPage();
              yPosition = margin;
            }
            pdf.text(line, margin, yPosition);
            yPosition += 6;
          });
          yPosition += 3;
        });
      }
      
      // 如果提供了容器元素，尝试捕获图表
      if (containerElement) {
        try {
          const canvas = await html2canvas(containerElement, {
            backgroundColor: '#ffffff',
            scale: 1,
            useCORS: true,
            allowTaint: true
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // 检查是否需要新页面
          if (yPosition + imgHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          
          pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        } catch (error) {
        }
      }
      
      // 保存PDF
      pdf.save(`${report.patientName}_health_report_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error('PDF生成失败，请重试');
    }
  }
  
  static async generateDoctorReportPDF(sessionData: any): Promise<void> {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const margin = 20;
      let yPosition = margin;
      
      // 标题
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Medical Assessment Report', margin, yPosition);
      yPosition += 15;
      
      // 患者信息
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Session ID: ${sessionData.id}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Date: ${new Date().toLocaleDateString('zh-CN')}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Duration: ${sessionData.duration || 'N/A'}`, margin, yPosition);
      yPosition += 15;
      
      // 症状分析
      if (sessionData.symptoms) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Symptoms Analysis', margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        Object.entries(sessionData.symptoms).forEach(([symptom, frequency]: [string, any]) => {
          pdf.text(`${symptom}: ${frequency}`, margin, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
      }
      
      // 建议
      if (sessionData.recommendations) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Recommendations', margin, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        sessionData.recommendations.forEach((rec: string, index: number) => {
          const lines = pdf.splitTextToSize(`${index + 1}. ${rec}`, pdf.internal.pageSize.getWidth() - 2 * margin);
          lines.forEach((line: string) => {
            pdf.text(line, margin, yPosition);
            yPosition += 6;
          });
          yPosition += 3;
        });
      }
      
      pdf.save(`medical_report_${sessionData.id}_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Doctor PDF generation failed:', error);
      throw new Error('医生报告PDF生成失败，请重试');
    }
  }
}

export default PDFService;