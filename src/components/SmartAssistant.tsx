import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  Loader2, 
  Sparkles,
  Scissors,
  Calendar,
  Info as InfoIcon
} from 'lucide-react';
import { ai, SALON_TOOLS } from '../lib/gemini';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { BUSINESS_CONFIG, getAvailableSlots } from '../lib/booking-utils';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export const SmartAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou o assistente inteligente do Chico Cabeleireiros. Como posso ajudar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const executeTool = async (call: any) => {
    console.log(`Executing tool: ${call.name}`, call.args);
    
    switch (call.name) {
      case 'get_salon_info':
        return {
          name: BUSINESS_CONFIG.name,
          professional: BUSINESS_CONFIG.professional,
          phone: BUSINESS_CONFIG.phone,
          address: BUSINESS_CONFIG.address,
          schedule: "Segunda a Sexta: 10h-13h e 15h-19h. Sábado: 10h-13h. Domingo: Fechado."
        };
      
      case 'get_services':
        try {
          const q = query(collection(db, 'services'));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({
            name: doc.data().name,
            price: doc.data().price,
            duration: doc.data().duration
          }));
        } catch (e) {
          return { error: "Não foi possível carregar os serviços." };
        }

      case 'check_availability':
        try {
          const date = parseISO(call.args.date);
          const slots = getAvailableSlots(date);
          const formattedDate = format(date, "d 'de' MMMM", { locale: pt });
          
          if (slots.length === 0) {
            return { message: `Não há horários disponíveis para o dia ${formattedDate}.` };
          }
          
          return {
            date: formattedDate,
            available_slots: slots,
            message: `Encontrei ${slots.length} horários para ${formattedDate}.`
          };
        } catch (e) {
          return { error: "Erro ao verificar disponibilidade. Verifique o formato da data." };
        }

      default:
        return { error: "Ferramenta não encontrada." };
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !ai || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Start thinking/answering
      let history: any[] = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      history.push({ role: 'user', parts: [{ text: userMessage }] });

      const systemInstruction = `És o assistente inteligente oficial do "Chico Cabeleireiros".
O teu tom é profissional, amigável e prestável.
Utiliza as ferramentas disponíveis para fornecer informações precisas sobre serviços, horários e localização.
Se não souberes algo, pede ao utilizador para contactar o Sérgio Ramos pelo telefone ${BUSINESS_CONFIG.phone}.
Tenta ser conciso e focar-te em ajudar o cliente a marcar um serviço.
Data atual: ${new Date().toISOString()}`;

      // Advanced: Automated Loop for Function Calling
      let currentResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: history,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: SALON_TOOLS }, { googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true }
        }
      });

      // Handle function calls
      while (currentResponse.functionCalls) {
        const toolOutputs = [];
        for (const call of currentResponse.functionCalls) {
          const result = await executeTool(call);
          toolOutputs.push({
            callId: call.id,
            output: result
          });
        }

        // Send tool results back to the model
        // Append previous content bits as required by advanced patterns
        const previousContent = currentResponse.candidates?.[0]?.content;
        
        currentResponse = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            ...history,
            previousContent,
            {
              role: 'tool',
              parts: toolOutputs.map(o => ({
                functionResponse: {
                  name: currentResponse.functionCalls?.find(f => f.id === o.callId)?.name || '',
                  response: o.output
                }
              }))
            }
          ],
          config: {
            systemInstruction,
            tools: [{ functionDeclarations: SALON_TOOLS }, { googleSearch: {} }],
            toolConfig: { includeServerSideToolInvocations: true }
          }
        });
      }

      const modelText = currentResponse.text || "Desculpe, não consegui processar o seu pedido.";
      setMessages(prev => [...prev, { role: 'model', text: modelText }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Ocorreu um erro ao processar o seu pedido. Por favor, tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 w-[90vw] max-w-[400px] h-[600px] max-h-[80vh] bg-card border border-border/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Chico Assistant</h3>
                  <p className="text-[10px] opacity-70 flex items-center gap-1">
                    <Sparkles className="w-2 h-2" /> Powered by Gemini
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="hover:bg-white/10 text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20"
            >
              {messages.map((m, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex w-full",
                    m.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div 
                    className={cn(
                      "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm",
                      m.role === 'user' 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-background text-foreground rounded-tl-none border border-border/30"
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-background border border-border/30 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground italic">A pensar...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-sm">
              <div className="flex gap-2">
                <Input 
                  placeholder="Pergunte sobre horários ou serviços..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isLoading}
                  className="rounded-xl border-border/50 focus:ring-primary"
                />
                <Button 
                  size="icon" 
                  onClick={handleSend} 
                  disabled={isLoading || !input.trim()}
                  className="rounded-xl shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-7 rounded-full shrink-0"
                  onClick={() => setInput("Quais são os serviços?")}
                >
                  <Scissors className="w-3 h-3 mr-1" /> Serviços
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-7 rounded-full shrink-0"
                  onClick={() => setInput("Estão abertos amanhã?")}
                >
                  <Calendar className="w-3 h-3 mr-1" /> Horários
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-7 rounded-full shrink-0"
                  onClick={() => setInput("Onde fica o salão?")}
                >
                  <InfoIcon className="w-3 h-3 mr-1" /> Morada
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-2xl transition-all duration-300",
          isOpen ? "bg-muted text-muted-foreground rotate-90" : "bg-primary text-primary-foreground"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-background rounded-full"
          />
        )}
      </Button>
    </div>
  );
};

// Utils copy-pasted or imported to avoid circular deps if needed
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
