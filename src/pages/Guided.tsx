import React, { useState, useRef } from 'react';
import { Camera, Folder, X, RefreshCw, Volume2, Save } from 'lucide-react';
import { solveProblem, Solution } from '../services/ai';
import { marked } from 'marked';

export function Guided() {
    const [problemText, setProblemText] = useState('');
    const [attachedFile, setAttachedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [solution, setSolution] = useState<Solution | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

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
            <h1 className="text-2xl font-bold text-gray-800">Aprendizagem Guiada</h1>
            <p className="text-gray-600">Envie um problema ou dúvida e receba uma explicação passo a passo.</p>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                 <div className="mb-4">
                     <label className="block text-gray-700 font-medium mb-2">Qual seu problema de estudo?</label>
                     <textarea 
                        className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Cole uma questão, descreva um tópico ou envie uma imagem..."
                        value={problemText}
                        onChange={(e) => setProblemText(e.target.value)}
                        disabled={loading}
                     ></textarea>
                 </div>

                 {/* File Attachment Preview */}
                 {attachedFile && (
                     <div className="mb-4 flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                         <span className="text-sm text-blue-800 font-medium truncate flex-1">
                             📎 {attachedFile.name}
                         </span>
                         <button onClick={removeFile} className="text-blue-500 hover:text-blue-700 p-1">
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
                     <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
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
                            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-blue-100"
                        >
                             <Camera size={20} /> <span className="hidden sm:inline">Câmera</span>
                         </button>
                         <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-blue-100"
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

            {/* Solution Display */}
            {solution && (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            {solution.title}
                            <button onClick={() => speak(solution.title)} className="text-gray-400 hover:text-blue-600 transition-colors">
                                <Volume2 size={18} />
                            </button>
                        </h2>
                        {/* Future: Add save button here */}
                    </div>

                    <div className="space-y-8">
                        {solution.steps.map((step, idx) => (
                            <div key={idx} className="relative pl-6 border-l-2 border-blue-100">
                                <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-100 border-2 border-white"></span>
                                <h3 className="font-semibold text-lg text-gray-800 mb-2 flex items-center gap-2">
                                    Passo {idx + 1}: {step.stepTitle}
                                    <button onClick={() => speak(step.stepTitle + '. ' + step.explanation)} className="text-gray-300 hover:text-blue-500 transition-colors">
                                        <Volume2 size={16} />
                                    </button>
                                </h3>
                                <div 
                                    className="prose prose-sm text-gray-600 max-w-none mb-3"
                                    dangerouslySetInnerHTML={{ __html: marked.parse(step.explanation) as string }}
                                ></div>
                                {step.calculation && (
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 font-mono text-sm text-gray-700 overflow-x-auto">
                                        {step.calculation}
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="mt-8 bg-green-50 p-6 rounded-xl border border-green-100">
                            <h3 className="text-green-800 font-bold text-lg mb-2">Resposta Final</h3>
                            <div className="text-green-900 font-medium flex items-center gap-2">
                                {solution.finalAnswer}
                                <button onClick={() => speak(solution.finalAnswer)} className="text-green-600 hover:text-green-800 transition-colors">
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
