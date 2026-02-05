import React, { useState, useRef } from 'react';
import { Camera, Folder, X, RefreshCw, Volume2, Trash2, History, Eye, Edit, FileText, FileType, Check, File as FileIcon, MoreVertical, Download, ChevronRight, Plus, Minus, ArrowLeft, PenLine, Sparkles } from 'lucide-react';
import { solveProblem, Solution } from '../../../services/ai';
import { marked } from 'marked';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { jsPDF } from 'jspdf';

interface GuidedHistoryItem {
    id: string;
    date: string;
    problem: string; 
    solution: Solution;
}

export function Guided() {
    const [problemText, setProblemText] = useState('');
    const [attachedFile, setAttachedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [solution, setSolution] = useState<Solution | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);

    const [history, setHistory] = useLocalStorage<GuidedHistoryItem[]>('guidedHistory', []);

    // View state
    const [currentView, setCurrentView] = useState<'main' | 'manual' | 'ai'>('main');

    // Manual creation states
    const [manualTitle, setManualTitle] = useState('');
    const [manualProblem, setManualProblem] = useState('');
    const [manualSteps, setManualSteps] = useState<{ stepTitle: string; explanation: string; calculation: string }[]>([
        { stepTitle: '', explanation: '', calculation: '' }
    ]);
    const [manualFinalAnswer, setManualFinalAnswer] = useState('');

    // Modal States
    const [showActionsModal, setShowActionsModal] = useState<string | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [viewingItem, setViewingItem] = useState<GuidedHistoryItem | null>(null);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    
    // Editing State
    const [editingItem, setEditingItem] = useState<GuidedHistoryItem | null>(null);
    const [editMarkdown, setEditMarkdown] = useState('');
    const [editPreviewMode, setEditPreviewMode] = useState<'edit' | 'preview'>('edit');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // --- Helper Functions ---

    const solutionToMarkdown = (item: GuidedHistoryItem): string => {
        const sol = item.solution;
        let content = `# ${sol.title}\n\n`;
        content += `**Data:** ${new Date(item.date).toLocaleDateString()}\n\n`;
        content += `**Problema:** ${item.problem}\n\n---\n\n`;
        
        sol.steps.forEach((step, i) => {
            content += `### Passo ${i + 1}: ${step.stepTitle}\n\n`;
            content += `${step.explanation}\n\n`;
            if (step.calculation) content += `\`\`\`\n${step.calculation}\n\`\`\`\n\n`;
        });
        content += `## Resposta Final\n\n${sol.finalAnswer}`;
        return content;
    };

    const markdownToSolution = (markdown: string, originalItem: GuidedHistoryItem): Solution => {
        // Parse the markdown back to Solution structure
        const lines = markdown.split('\n');
        let title = originalItem.solution.title;
        let finalAnswer = originalItem.solution.finalAnswer;
        const steps = [...originalItem.solution.steps];
        
        // Extract title
        const titleMatch = markdown.match(/^# (.+)$/m);
        if (titleMatch) title = titleMatch[1];
        
        // Extract final answer
        const finalAnswerMatch = markdown.match(/## Resposta Final\s*\n+(.+)/s);
        if (finalAnswerMatch) finalAnswer = finalAnswerMatch[1].trim();
        
        // Extract steps
        const stepRegex = /### Passo (\d+): (.+)\n\n([\s\S]*?)(?=### Passo|## Resposta Final|$)/g;
        let match;
        const newSteps: { stepTitle: string; explanation: string; calculation?: string }[] = [];
        
        while ((match = stepRegex.exec(markdown)) !== null) {
            const stepTitle = match[2];
            let content = match[3].trim();
            let calculation: string | undefined;
            
            const calcMatch = content.match(/```\n?([\s\S]*?)```/);
            if (calcMatch) {
                calculation = calcMatch[1].trim();
                content = content.replace(/```\n?[\s\S]*?```/, '').trim();
            }
            
            newSteps.push({ stepTitle, explanation: content, calculation });
        }
        
        return {
            title,
            steps: newSteps.length > 0 ? newSteps : steps,
            finalAnswer
        };
    };

    // --- Actions ---

    const handleStrictSaveHistory = (sol: Solution, text: string) => {
         const newItem: GuidedHistoryItem = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            problem: text || 'Problema',
            solution: sol
        };
        setHistory([newItem, ...history]);
    }

    // --- Manual Creation Functions ---
    const handleAddStep = () => {
        setManualSteps([...manualSteps, { stepTitle: '', explanation: '', calculation: '' }]);
    };

    const handleRemoveStep = (index: number) => {
        if (manualSteps.length > 1) {
            setManualSteps(manualSteps.filter((_, i) => i !== index));
        }
    };

    const handleStepChange = (index: number, field: 'stepTitle' | 'explanation' | 'calculation', value: string) => {
        const updated = [...manualSteps];
        updated[index][field] = value;
        setManualSteps(updated);
    };

    const handleSaveManualSolution = () => {
        if (!manualTitle.trim() || !manualFinalAnswer.trim() || manualSteps.some(s => !s.stepTitle.trim() || !s.explanation.trim())) {
            alert('Preencha o título, todos os passos (título e explicação) e a resposta final.');
            return;
        }

        const newSolution: Solution = {
            title: manualTitle.trim(),
            steps: manualSteps.map(s => ({
                stepTitle: s.stepTitle.trim(),
                explanation: s.explanation.trim(),
                calculation: s.calculation.trim() || undefined
            })),
            finalAnswer: manualFinalAnswer.trim()
        };

        const newItem: GuidedHistoryItem = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            problem: manualProblem.trim() || 'Problema inserido manualmente',
            solution: newSolution
        };

        setHistory([newItem, ...history]);
        
        // Reset form
        setManualTitle('');
        setManualProblem('');
        setManualSteps([{ stepTitle: '', explanation: '', calculation: '' }]);
        setManualFinalAnswer('');
        setCurrentView('main');
    };

    const deleteHistoryItem = (id: string) => {
        if(window.confirm('Tem certeza que deseja excluir esta solução?')) {
            setHistory(history.filter(item => item.id !== id));
            setShowActionsModal(null);
        }
    };

    const handleViewItem = (item: GuidedHistoryItem) => {
        setViewingItem(item);
        setShowViewModal(true);
        setShowActionsModal(null);
    };

    const handleEditStart = (item: GuidedHistoryItem) => {
        setEditingItem(item);
        setEditMarkdown(solutionToMarkdown(item));
        setEditPreviewMode('edit');
        setShowEditModal(true);
        setShowActionsModal(null);
    };

    const handleEditSave = () => {
        if (!editingItem) return;
        
        const updatedSolution = markdownToSolution(editMarkdown, editingItem);
        const updatedItem = { ...editingItem, solution: updatedSolution };

        setHistory(history.map(item => item.id === editingItem.id ? updatedItem : item));
        setEditingItem(null);
        setShowEditModal(false);
    };

    const handleDownload = (item: GuidedHistoryItem, format: 'pdf' | 'doc' | 'md') => {
        const solution = item.solution;
        const date = new Date(item.date).toISOString().split('T')[0];
        const safeTitle = solution.title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
        const filename = `solucao_${safeTitle}_${date}`;

        if (format === 'md') {
            let content = `# ${solution.title}\n\n`;
            content += `**Data:** ${new Date(item.date).toLocaleDateString()}\n\n`;
            content += `**Problema:** ${item.problem}\n\n---\n\n`;
            
            solution.steps.forEach((step, i) => {
                content += `### Passo ${i + 1}: ${step.stepTitle}\n\n`;
                content += `${step.explanation}\n\n`;
                if (step.calculation) content += `\`\`\`\n${step.calculation}\n\`\`\`\n\n`;
            });
            content += `## Resposta Final\n${solution.finalAnswer}`;
            
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.md`;
            a.click();
        } else if (format === 'doc') {
             let content = `
                <html>
                <head><meta charset="UTF-8"></head>
                <body>
                    <h1>${solution.title}</h1>
                    <p><strong>Data:</strong> ${new Date(item.date).toLocaleDateString()}</p>
                    <p><strong>Problema:</strong> ${item.problem}</p>
                    <hr/>
             `;
             solution.steps.forEach((step, i) => {
                content += `<h3>Passo ${i + 1}: ${step.stepTitle}</h3>`;
                // Use a simple parser or just raw if marked is synchronous
                try {
                     content += `<div>${marked.parse(step.explanation)}</div>`;
                } catch (e) {
                     content += `<p>${step.explanation}</p>`;
                }
                if (step.calculation) content += `<pre style="background:#f0f0f0;padding:10px;">${step.calculation}</pre>`;
            });
            content += `<h2>Resposta Final</h2><p>${solution.finalAnswer}</p></body></html>`;

            const blob = new Blob([content], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.doc`;
            a.click();
        } else if (format === 'pdf') {
             const doc = new jsPDF();
             const pageWidth = doc.internal.pageSize.getWidth();
             const margin = 15;
             const maxLineWidth = pageWidth - (margin * 2);
             
             let y = 20;
             
             // Title
             doc.setFontSize(16);
             doc.setFont("helvetica", "bold");
             const titleLines = doc.splitTextToSize(solution.title, maxLineWidth);
             doc.text(titleLines, margin, y);
             y += (titleLines.length * 7) + 10;

             // Problem
             doc.setFontSize(10);
             doc.setFont("helvetica", "italic");
             doc.text(`Problema: ${item.problem.substring(0, 100)}${item.problem.length > 100 ? '...' : ''}`, margin, y);
             y += 10;
             
             doc.setFont("helvetica", "normal");
             doc.setFontSize(12);

             solution.steps.forEach((step, i) => {
                  if (y > 270) { doc.addPage(); y = 20; }
                  
                  doc.setFont("helvetica", "bold");
                  doc.text(`Passo ${i+1}: ${step.stepTitle}`, margin, y);
                  y += 7;
                  
                  doc.setFont("helvetica", "normal");
                  // Basic cleanup of markdown symbols for PDF text
                  const cleanExpl = step.explanation.replace(/[*_#`]/g, '');
                  const explLines = doc.splitTextToSize(cleanExpl, maxLineWidth);
                  doc.text(explLines, margin, y);
                  y += (explLines.length * 5) + 5;
                  
                  if (step.calculation) {
                      if (y > 270) { doc.addPage(); y = 20; }
                      doc.setFont("courier", "normal");
                      const calcLines = doc.splitTextToSize(step.calculation, maxLineWidth - 10);
                      doc.text(calcLines, margin + 5, y);
                      doc.setFont("helvetica", "normal");
                      y += (calcLines.length * 5) + 10;
                  }
                  y += 5;
             });
             
             if (y > 270) { doc.addPage(); y = 20; }
             doc.setFont("helvetica", "bold");
             doc.text("Resposta Final:", margin, y);
             y += 7;
             doc.setFont("helvetica", "normal");
             const finalLines = doc.splitTextToSize(solution.finalAnswer, maxLineWidth);
             doc.text(finalLines, margin, y);

             doc.save(`${filename}.pdf`);
        }
        setShowActionsModal(null);
    };



    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => {
                        const result = reader.result as string;
                        resolve(result.split(',')[1]);
                    };
                    reader.onerror = reject;
                });
                
                setAttachedFile({
                    data: base64,
                    mimeType: file.type,
                    name: file.name
                });
                setError(null);
            } catch (err) {
                console.error("Error reading file:", err);
                setError("Erro ao ler o arquivo.");
            }
        }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
            setShowCamera(true);
            setError(null);
        } catch (err) {
            console.error("Camera error:", err);
            setError("Não foi possível acessar a câmera. Verifique as permissões.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                
                setAttachedFile({
                    data: dataUrl.split(',')[1],
                    mimeType: 'image/jpeg',
                    name: 'Foto_Capturada.jpg'
                });
                stopCamera();
            }
        }
    };

    const handleSolve = async () => {
        if (!problemText && !attachedFile) {
            setError("Por favor, descreva o problema ou envie uma imagem.");
            return;
        }

        setLoading(true);
        setError(null);
        setSolution(null);

        try {
            const result = await solveProblem(
                problemText, 
                attachedFile?.data, 
                attachedFile?.mimeType
            );
            setSolution(result);
            handleStrictSaveHistory(result, problemText);
        } catch (err) {
            console.error(err);
            setError("Ocorreu um erro ao gerar a solução. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const removeFile = () => {
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Helper to synthesize speech
    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop persistent speaking
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-10">
            {/* Manual Creation View */}
            {currentView === 'manual' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <button
                        onClick={() => setCurrentView('main')}
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-4"
                    >
                        <ArrowLeft size={18} /> Voltar
                    </button>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Criar Solução Manualmente</h2>

                        {/* Title */}
                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Título da Solução *</label>
                            <input
                                type="text"
                                value={manualTitle}
                                onChange={(e) => setManualTitle(e.target.value)}
                                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ex: Resolvendo Equação Quadrática"
                            />
                        </div>

                        {/* Problem Description */}
                        <div className="mb-6">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Descrição do Problema</label>
                            <textarea
                                value={manualProblem}
                                onChange={(e) => setManualProblem(e.target.value)}
                                className="w-full h-24 p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="Descreva o problema original (opcional)"
                            />
                        </div>

                        {/* Steps */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <label className="block text-gray-700 dark:text-gray-300 font-medium">Passos da Solução *</label>
                                <button
                                    onClick={handleAddStep}
                                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                >
                                    <Plus size={16} /> Adicionar Passo
                                </button>
                            </div>

                            <div className="space-y-4">
                                {manualSteps.map((step, index) => (
                                    <div key={index} className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700 relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Passo {index + 1}</span>
                                            {manualSteps.length > 1 && (
                                                <button
                                                    onClick={() => handleRemoveStep(index)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="Remover passo"
                                                >
                                                    <Minus size={18} />
                                                </button>
                                            )}
                                        </div>

                                        <input
                                            type="text"
                                            value={step.stepTitle}
                                            onChange={(e) => handleStepChange(index, 'stepTitle', e.target.value)}
                                            className="w-full p-2 mb-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Título do passo (ex: Identificar coeficientes)"
                                        />

                                        <textarea
                                            value={step.explanation}
                                            onChange={(e) => handleStepChange(index, 'explanation', e.target.value)}
                                            className="w-full h-20 p-2 mb-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                            placeholder="Explicação do passo..."
                                        />

                                        <input
                                            type="text"
                                            value={step.calculation}
                                            onChange={(e) => handleStepChange(index, 'calculation', e.target.value)}
                                            className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                            placeholder="Cálculo (opcional, ex: x = (-b ± √Δ) / 2a)"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Final Answer */}
                        <div className="mb-6">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Resposta Final *</label>
                            <textarea
                                value={manualFinalAnswer}
                                onChange={(e) => setManualFinalAnswer(e.target.value)}
                                className="w-full h-20 p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="Digite a resposta final..."
                            />
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveManualSolution}
                            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Check size={20} /> Salvar Solução
                        </button>
                    </div>
                </div>
            )}

            {/* AI Generation View */}
            {currentView === 'ai' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <button
                        onClick={() => setCurrentView('main')}
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-4"
                    >
                        <ArrowLeft size={18} /> Voltar
                    </button>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Sparkles size={24} className="text-blue-600 dark:text-blue-400" />
                            Resolver com IA
                        </h2>
                        
                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Qual seu problema de estudo?</label>
                            <textarea 
                                className="w-full h-32 p-4 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="Cole uma questão, descreva um tópico ou envie uma imagem..."
                                value={problemText}
                                onChange={(e) => setProblemText(e.target.value)}
                                disabled={loading}
                            ></textarea>
                        </div>

                        {/* File Attachment Preview */}
                        {attachedFile && (
                            <div className="mb-4 flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                <span className="text-sm text-blue-800 dark:text-blue-200 font-medium truncate flex-1">
                                    📎 {attachedFile.name}
                                </span>
                                <button onClick={removeFile} className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 p-1">
                                    <X size={18} />
                                </button>
                            </div>
                        )}

                        {/* Camera View */}
                        {showCamera && (
                            <div className="mb-4 relative rounded-lg overflow-hidden bg-black aspect-video">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain"></video>
                                <canvas ref={canvasRef} className="hidden"></canvas>
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                    <button onClick={captureImage} className="bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-gray-200">
                                        Capturar
                                    </button>
                                    <button onClick={stopCamera} className="bg-red-500 text-white px-4 py-2 rounded-full font-bold hover:bg-red-600">
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-100 dark:border-red-800">
                                {error}
                            </div>
                        )}

                        <div className="flex justify-between items-center mt-6">
                            <div className="flex gap-2">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*,.pdf,.txt" 
                                    onChange={handleFileSelect}
                                />
                                <button 
                                    onClick={() => startCamera()}
                                    disabled={loading || showCamera}
                                    className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                                >
                                    <Camera size={20} /> <span className="hidden sm:inline">Câmera</span>
                                </button>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={loading}
                                    className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
                                >
                                    <Folder size={20} /> <span className="hidden sm:inline">Arquivo</span>
                                </button>
                            </div>
                            
                            <button 
                                onClick={handleSolve}
                                disabled={loading}
                                className={`
                                    px-6 py-2 rounded-lg font-medium text-white transition-all flex items-center gap-2
                                    ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'}
                                `}
                            >
                                {loading ? <><RefreshCw className="animate-spin" size={20} /> Processando...</> : 'Resolver'}
                            </button>
                        </div>
                    </div>

                    {/* Solution Display in AI View */}
                    {solution && (
                        <div className="mt-6 bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    {solution.title}
                                    <button onClick={() => speak(solution.title)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                        <Volume2 size={18} />
                                    </button>
                                </h2>
                            </div>

                            <div className="space-y-8">
                                {solution.steps.map((step, idx) => (
                                    <div key={idx} className="relative pl-6 border-l-2 border-blue-100 dark:border-blue-900">
                                        <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-white dark:border-slate-800"></span>
                                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                                            Passo {idx + 1}: {step.stepTitle}
                                            <button onClick={() => speak(step.stepTitle + '. ' + step.explanation)} className="text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                                                <Volume2 size={16} />
                                            </button>
                                        </h3>
                                        <div 
                                            className="prose prose-sm text-gray-600 dark:text-gray-300 max-w-none mb-3"
                                            dangerouslySetInnerHTML={{ __html: marked.parse(step.explanation) as string }}
                                        ></div>
                                        {step.calculation && (
                                            <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-700 font-mono text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                                                {step.calculation}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="mt-8 bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-900/50">
                                    <h3 className="text-green-800 dark:text-green-400 font-bold text-lg mb-2">Resposta Final</h3>
                                    <div className="text-green-900 dark:text-green-200 font-medium flex items-center gap-2">
                                        {solution.finalAnswer}
                                        <button onClick={() => speak(solution.finalAnswer)} className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors">
                                            <Volume2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Main View */}
            {currentView === 'main' && (
                <>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Solução Guiada</h1>
                    <p className="text-gray-600 dark:text-gray-300">Envie um problema ou dúvida e receba uma explicação passo a passo.</p>
                </div>
            </div>

            {/* Creation Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={() => setCurrentView('ai')}
                    className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all text-left"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Sparkles size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">Resolver com IA</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Envie um problema e receba uma solução passo a passo gerada pela IA.</p>
                </button>

                <button
                    onClick={() => setCurrentView('manual')}
                    className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md hover:border-green-300 dark:hover:border-green-600 transition-all text-left"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <PenLine size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">Criar Manualmente</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Crie sua própria solução passo a passo manualmente.</p>
                </button>
            </div>

            {/* History List */}
            <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="py-4 px-6 border-b border-gray-200 dark:border-slate-700 bg-blue-50 dark:bg-slate-700/50">
                    <h3 className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <History size={18} />
                        Histórico
                    </h3>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                     {history.length === 0 ? (
                         <p className="p-4 text-center text-gray-500">Histórico vazio.</p>
                     ) : (
                         history.map(item => (
                             <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700">
                                 <div className="flex-1 cursor-pointer" onClick={() => handleViewItem(item)}>
                                     <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.solution.title}</div>
                                     <div className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</div>
                                 </div>
                                 <button 
                                     onClick={() => setShowActionsModal(item.id)} 
                                     className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition"
                                 >
                                     <MoreVertical size={18} />
                                 </button>
                             </div>
                         ))
                     )}
                </div>
            </div>

            {/* Actions Modal */}
            {showActionsModal && (() => {
                const item = history.find(h => h.id === showActionsModal);
                if (!item) return null;
                return (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]" 
                        onClick={() => { setShowActionsModal(null); setShowDownloadMenu(false); }}
                    >
                        <div 
                            className="bg-white dark:bg-slate-800 w-80 rounded-2xl shadow-xl overflow-hidden animate-fade-in" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                <h4 className="font-bold text-gray-800 dark:text-white">Ações da Solução</h4>
                                <button onClick={() => { setShowActionsModal(null); setShowDownloadMenu(false); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-2">
                                <button 
                                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition"
                                    onClick={() => handleViewItem(item)}
                                >
                                    <Eye size={20} className="text-blue-500" /> 
                                    <span className="font-medium">Exibir</span>
                                </button>
                                <button 
                                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition"
                                    onClick={() => handleEditStart(item)}
                                >
                                    <Edit size={20} className="text-orange-500" />
                                    <span className="font-medium">Editar</span>
                                </button>
                                
                                {/* Save Options Dropdown */}
                                <div className="relative">
                                    <button 
                                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center justify-between text-gray-700 dark:text-gray-200 transition"
                                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Download size={20} className="text-green-500" />
                                            <span className="font-medium">Salvar como</span>
                                        </div>
                                        <ChevronRight size={18} className={`text-gray-400 transition-transform ${showDownloadMenu ? 'rotate-90' : ''}`} />
                                    </button>
                                    
                                    {showDownloadMenu && (
                                        <div className="ml-8 mt-1 space-y-1">
                                            <button 
                                                onClick={() => handleDownload(item, 'pdf')} 
                                                className="w-full text-left px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition"
                                            >
                                                <FileText size={18} className="text-red-500"/> 
                                                <span className="text-sm">PDF</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDownload(item, 'doc')} 
                                                className="w-full text-left px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition"
                                            >
                                                <FileIcon size={18} className="text-blue-500"/> 
                                                <span className="text-sm">DOC</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDownload(item, 'md')} 
                                                className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 flex items-center gap-3 text-gray-700 dark:text-gray-200 transition"
                                            >
                                                <FileType size={18} className="text-gray-500"/> 
                                                <span className="text-sm">Markdown</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3 text-red-600 transition"
                                    onClick={() => deleteHistoryItem(item.id)}
                                >
                                    <Trash2 size={20} />
                                    <span className="font-medium">Excluir</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* View Solution Modal */}
            {showViewModal && viewingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate pr-4">{viewingItem.solution.title}</h2>
                            <button onClick={() => { setShowViewModal(false); setViewingItem(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="space-y-8">
                                {viewingItem.solution.steps.map((step, idx) => (
                                    <div key={idx} className="relative pl-6 border-l-2 border-blue-100 dark:border-blue-900">
                                        <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-white dark:border-slate-800"></span>
                                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                                            Passo {idx + 1}: {step.stepTitle}
                                            <button onClick={() => speak(step.stepTitle + '. ' + step.explanation)} className="text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                                                <Volume2 size={16} />
                                            </button>
                                        </h3>
                                        <div 
                                            className="prose prose-sm text-gray-600 dark:text-gray-300 max-w-none mb-3"
                                            dangerouslySetInnerHTML={{ __html: marked.parse(step.explanation) as string }}
                                        ></div>
                                        {step.calculation && (
                                            <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-100 dark:border-slate-700 font-mono text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                                                {step.calculation}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="mt-8 bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-100 dark:border-green-900/50">
                                    <h3 className="text-green-800 dark:text-green-400 font-bold text-lg mb-2">Resposta Final</h3>
                                    <div className="text-green-900 dark:text-green-200 font-medium flex items-center gap-2">
                                        {viewingItem.solution.finalAnswer}
                                        <button onClick={() => speak(viewingItem.solution.finalAnswer)} className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors">
                                            <Volume2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Solution Modal with Markdown Editor */}
            {showEditModal && editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-5xl h-[85vh] rounded-2xl shadow-xl overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-700 shrink-0">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Editar Solução</h2>
                            <button onClick={() => { setShowEditModal(false); setEditingItem(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={24} />
                            </button>
                        </div>
                        
                        {/* Tab switcher for Edit/Preview */}
                        <div className="flex border-b border-gray-200 dark:border-slate-700 px-6 shrink-0">
                            <button
                                onClick={() => setEditPreviewMode('edit')}
                                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                                    editPreviewMode === 'edit' 
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                <Edit size={16} className="inline mr-2" />
                                Editar
                            </button>
                            <button
                                onClick={() => setEditPreviewMode('preview')}
                                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                                    editPreviewMode === 'preview' 
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                            >
                                <Eye size={16} className="inline mr-2" />
                                Pré-visualizar
                            </button>
                        </div>
                        
                        <div className="flex-1 min-h-0 overflow-hidden">
                            {editPreviewMode === 'edit' ? (
                                <textarea 
                                    value={editMarkdown}
                                    onChange={e => setEditMarkdown(e.target.value)}
                                    className="w-full h-full p-6 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 font-mono text-sm leading-relaxed outline-none resize-none overflow-y-auto"
                                    placeholder="Edite a solução em Markdown..."
                                    spellCheck={false}
                                />
                            ) : (
                                <div className="h-full overflow-y-auto p-6 bg-white dark:bg-slate-900 custom-scrollbar">
                                    <div 
                                        className="markdown-preview"
                                        dangerouslySetInnerHTML={{ __html: marked.parse(editMarkdown) as string }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t border-gray-100 dark:border-slate-700 shrink-0">
                            <button 
                                onClick={() => { setShowEditModal(false); setEditingItem(null); }} 
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleEditSave} 
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium"
                            >
                                <Check size={16}/> Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}


                </>
            )}
        </div>
    );
}
