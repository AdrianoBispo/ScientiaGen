import React, { useState, useRef } from 'react';
import { Camera, Folder, X, RefreshCw, Volume2, Save, Trash2, History, Eye, Edit, Download, FileText, FileType, Check, File as FileIcon } from 'lucide-react';
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
    // const [showHistory, setShowHistory] = useState(false); // Removed separate history toggle
    
    // Tab state
    const [activeTab, setActiveTab] = useState<'history' | 'saved'>('history');

    const [history, setHistory] = useLocalStorage<GuidedHistoryItem[]>('guidedHistory', []);
    const [savedSolutions, setSavedSolutions] = useLocalStorage<GuidedHistoryItem[]>('guidedSavedSolutions', []);

    // Editing State
    const [editingItem, setEditingItem] = useState<GuidedHistoryItem | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editFinalAnswer, setEditFinalAnswer] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // --- Actions ---

    const handleSaveToSaved = (sol: Solution, text: string) => {
        const newItem: GuidedHistoryItem = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            problem: text || 'Problema',
            solution: sol
        };
        setSavedSolutions([newItem, ...savedSolutions]);
        alert('Solução salva nos itens salvos!');
    };

    const handleStrictSaveHistory = (sol: Solution, text: string) => {
         const newItem: GuidedHistoryItem = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            problem: text || 'Problema',
            solution: sol
        };
        setHistory([newItem, ...history]);
    }

    const deleteSavedItem = (id: string) => {
        if(window.confirm('Tem certeza que deseja excluir esta solução salva?')) {
            setSavedSolutions(savedSolutions.filter(item => item.id !== id));
        }
    };

    const deleteHistoryItem = (id: string) => {
        setHistory(history.filter(item => item.id !== id));
    };

    const loadItem = (item: GuidedHistoryItem) => {
        setProblemText(item.problem);
        setSolution(item.solution);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEditStart = (item: GuidedHistoryItem) => {
        setEditingItem(item);
        setEditTitle(item.solution.title);
        setEditFinalAnswer(item.solution.finalAnswer);
    };

    const handleEditSave = () => {
        if (!editingItem) return;
        
        const updatedSolution = { 
            ...editingItem.solution, 
            title: editTitle,
            finalAnswer: editFinalAnswer
        };

        const updatedItem = { ...editingItem, solution: updatedSolution };

        setSavedSolutions(savedSolutions.map(item => item.id === editingItem.id ? updatedItem : item));
        setEditingItem(null);
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Solução Guiada</h1>
                    <p className="text-gray-600 dark:text-gray-300">Envie um problema ou dúvida e receba uma explicação passo a passo.</p>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
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

            {/* Tabs & Lists */}
            <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2
                            ${activeTab === 'history' 
                                ? 'bg-blue-50 dark:bg-slate-700/50 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/30'
                            }`}
                    >
                        <History size={18} />
                        Histórico
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2
                            ${activeTab === 'saved' 
                                ? 'bg-purple-50 dark:bg-slate-700/50 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400' 
                                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/30'
                            }`}
                    >
                        <Folder size={18} />
                        Soluções Salvas
                    </button>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                     {activeTab === 'history' ? (
                          history.length === 0 ? <p className="p-4 text-center text-gray-500">Histórico vazio.</p> :
                          history.map(item => (
                               <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700">
                                   <div className="flex-1 cursor-pointer" onClick={() => loadItem(item)}>
                                       <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.solution.title}</div>
                                       <div className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</div>
                                   </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => loadItem(item)} title="Exibir" className="p-2 text-blue-600 bg-blue-100 dark:bg-blue-900/30 rounded-full hover:bg-blue-200 transition">
                                            <Eye size={16} />
                                        </button>
                                         <button onClick={() => handleSaveToSaved(item.solution, item.problem)} title="Salvar" className="p-2 text-green-600 bg-green-100 dark:bg-green-900/30 rounded-full hover:bg-green-200 transition">
                                            <Save size={16} />
                                        </button>
                                        <button onClick={() => deleteHistoryItem(item.id)} title="Excluir" className="p-2 text-red-600 bg-red-100 dark:bg-red-900/30 rounded-full hover:bg-red-200 transition">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                               </div>
                          ))
                     ) : (
                          savedSolutions.length === 0 ? <p className="p-4 text-center text-gray-500">Nenhuma solução salva.</p> :
                          savedSolutions.map(item => (
                               <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700 gap-3">
                                   <div className="flex-1">
                                       <div className="font-medium text-gray-800 dark:text-gray-200 truncate">{item.solution.title}</div>
                                       <div className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</div>
                                   </div>
                                   <div className="flex flex-wrap items-center gap-2">
                                        <button onClick={() => loadItem(item)} title="Exibir" className="p-2 text-blue-600 bg-blue-100 dark:bg-blue-900/30 rounded-full hover:bg-blue-200 transition">
                                            <Eye size={16} />
                                        </button>
                                        <button onClick={() => handleEditStart(item)} title="Editar" className="p-2 text-orange-600 bg-orange-100 dark:bg-orange-900/30 rounded-full hover:bg-orange-200 transition">
                                            <Edit size={16} />
                                        </button>
                                        
                                        <div className="flex gap-1 bg-gray-200 dark:bg-slate-800 rounded-full p-1">
                                            <button onClick={() => handleDownload(item, 'pdf')} title="PDF" className="p-1.5 text-red-600 hover:bg-white dark:hover:bg-slate-700 rounded-full transition"><FileText size={14}/></button>
                                            <button onClick={() => handleDownload(item, 'doc')} title="DOC" className="p-1.5 text-blue-600 hover:bg-white dark:hover:bg-slate-700 rounded-full transition"><FileIcon size={14}/></button>
                                            <button onClick={() => handleDownload(item, 'md')} title="MD" className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-700 rounded-full transition"><FileType size={14}/></button>
                                        </div>

                                        <button onClick={() => deleteSavedItem(item.id)} title="Excluir" className="p-2 text-red-600 bg-red-100 dark:bg-red-900/30 rounded-full hover:bg-red-200 transition">
                                            <Trash2 size={16} />
                                        </button>
                                   </div>
                               </div>
                          ))
                     )}
                </div>
            </div>

            {/* Editing Logic/Modal */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-lg font-bold dark:text-white">Editar Solução</h3>
                             <button onClick={() => setEditingItem(null)} className="text-gray-500 hover:text-gray-700"><X size={20}/></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Título</label>
                                <input 
                                    value={editTitle} 
                                    onChange={e => setEditTitle(e.target.value)}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Resposta Final</label>
                                <textarea 
                                    value={editFinalAnswer}
                                    onChange={e => setEditFinalAnswer(e.target.value)}
                                    className="w-full p-2 border rounded-lg h-32 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600">Cancelar</button>
                                <button onClick={handleEditSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                    <Check size={16}/> Salvar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Solution Display */}
            {solution && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            {solution.title}
                            <button onClick={() => speak(solution.title)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                <Volume2 size={18} />
                            </button>
                        </h2>
                        <button 
                            onClick={() => handleSaveToSaved(solution, problemText)}
                            className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors flex items-center gap-1 text-sm font-medium"
                            title="Salvar nos Favoritos"
                        >
                            <Save size={18} /> <span className="hidden sm:inline">Salvar</span>
                        </button>
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
    );
}
